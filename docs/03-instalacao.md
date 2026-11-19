# Instalação e execução local

[← Índice](README.md) · [Próximo: API e permissões →](04-api-e-permissoes.md)

## 1. Pré-requisitos

| Ferramenta | Requisito |
| --- | --- |
| Git | Para obter o repositório |
| Java | JDK 21 |
| Node.js | Recomenda-se Node 22.12 ou superior na linha 22, compatível com Vite 8 |
| npm | Compatível com a versão de Node utilizada |
| Docker + Compose | Para o PostgreSQL local |
| PHP | 8.2 ou superior, com extensões exigidas pelo Laravel |
| Composer | Para instalar as dependências PHP |
| Bash, curl e lsof | Necessários para usar `dev.sh` |

O Maven Wrapper acompanha o repositório; a primeira execução pode baixar o Maven e dependências. É necessário acesso à internet para resolver pacotes não disponíveis localmente.

```bash
git clone https://github.com/lucasfernandohass/hospital_inteligente.git
cd hospital_inteligente
cp .env.example .env
```

## 2. Banco e variáveis da API

Ajuste o `.env` da raiz para o banco local. O Docker Compose lê esse arquivo automaticamente. A API Java **não carrega automaticamente o `.env` da raiz**: exporte as variáveis no terminal que iniciará a API, caso altere os valores padrão.

```bash
export DB_NAME=hospital
export DB_USER=hospitalapi
export DB_PORT=5432
# Defina DB_PASSWORD no ambiente conforme seu .env.
docker compose up -d postgres
docker compose ps
```

| Variável | Uso / padrão da implementação |
| --- | --- |
| `DB_URL` | URL JDBC completa; se ausente, usa localhost, `DB_PORT` e `DB_NAME` |
| `DB_NAME` / `DB_PORT` | `hospital` / `5432` |
| `DB_USER` / `DB_PASSWORD` | Credenciais locais; mantenha Compose e API alinhados |
| `JWT_SECRET` | Segredo Base64 de pelo menos 32 bytes; obrigatório fora do perfil `local` |
| `JWT_LOCAL_SECRET_FILE` | Arquivo de chave automática no perfil local |
| `JWT_EXPIRATION_MS` | `3600000` — uma hora |
| `MONITOR_API_KEY` | Chave compartilhada entre API e simulador; vazia bloqueia a ingestão |
| `CORS_ALLOWED_ORIGINS` | Padrão: `http://localhost:5173,http://localhost:8443` |
| `WEBSOCKET_ALLOWED_ORIGINS` | Mesmo padrão de origens acima |

Para gerar valores próprios, execute `openssl rand -base64 32` para o JWT e `openssl rand -hex 32` para a chave do monitor. Guarde os resultados nas configurações locais. A chave de ingestão e o segredo de assinatura JWT têm funções diferentes.

## 3. Preparar o simulador

```bash
cd simulador-laravel
cp .env.example .env
composer install
php artisan key:generate
cd ..
```

No `.env` do simulador, configure:

```dotenv
JAVA_API_URL=http://localhost:8080
MONITOR_API_KEY=SUBSTITUA_PELA_MESMA_CHAVE_DA_API
JAVA_API_EMAIL=admin@hospital.local
JAVA_API_PASSWORD=SUBSTITUA_PELA_SENHA_DO_USUARIO
SIMULATOR_INTERVAL_SECONDS=5
SIMULATOR_SCENARIO=estavel
SIMULATOR_AUTO_START=true
FRONTEND_URL=http://localhost:8443
```

As credenciais Java serão usadas para consultar pacientes e internações. O usuário precisa ter acesso de leitura a ambos. Depois de alterar configurações previamente armazenadas em cache, execute `php artisan config:clear`.

## 4. Iniciar a API

Na raiz, exporte `MONITOR_API_KEY` com o mesmo valor definido no simulador e execute:

```bash
cd backend/hospital-api
sh ./mvnw spring-boot:run
```

O plugin Maven declara o perfil `local`. Nesse perfil, quando `JWT_SECRET` não está definido, a aplicação cria ou reutiliza uma chave em `~/.hospital-inteligente/jwt-secret`. Executar um JAR fora desse perfil exige configurar `JWT_SECRET`.

As migrações Flyway rodam na inicialização. O Hibernate valida o esquema com `ddl-auto=validate`.

```bash
curl --fail http://localhost:8080/actuator/health
```

## 5. Criar o primeiro administrador

A configuração inicial é feita pela API. Salve o JSON abaixo em `admin-inicial.json`, ajuste os dados e envie-o. Os dados são fictícios; a senha deve ter entre 12 e 72 caracteres e o CPF deve conter 11 dígitos.

```json
{
  "nome": "Administrador de Demonstracao",
  "cpf": "12345678901",
  "dataNascimento": "1990-01-01",
  "telefone": "",
  "endereco": "",
  "matricula": "ADM-001",
  "dataAdmissao": "2026-11-18",
  "email": "admin@hospital.local",
  "senha": "SUBSTITUA_POR_UMA_SENHA_FORTE"
}
```

```bash
curl --fail-with-body -X POST http://localhost:8080/api/auth/setup \
  -H 'Content-Type: application/json' \
  --data-binary @admin-inicial.json
```

A resposta contém token e perfil. A API retorna conflito se um administrador já existir. Nesse caso, utilize o login existente. Remova o arquivo local com a senha após o uso e não o inclua no Git.

## 6. Iniciar a interface

Em outro terminal:

```bash
cd frontend
npm ci
npm run dev
```

Abra **http://localhost:8443**. Para apontar a outra API, crie `frontend/.env.local` antes de iniciar o Vite:

```dotenv
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws
```

As duas URLs são independentes: alterar somente a URL HTTP não altera a conexão WebSocket.

## 7. Iniciar o fluxo de sinais

Depois de cadastrar um paciente e uma internação ativa, mantenha dois terminais no diretório `simulador-laravel`:

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

```bash
php artisan schedule:work
```

```bash
curl http://127.0.0.1:8000/api/simulacao/status
curl --fail-with-body -X POST http://127.0.0.1:8000/api/simulacao/iniciar \
  -H 'Content-Type: application/json' \
  -d '{"scenario":"estavel"}'
```

O servidor HTTP permite controlar o simulador. O scheduler é responsável pelo envio periódico; apenas iniciar `artisan serve` não executa os ciclos.

## Alternativa: script integrado

Com os arquivos `.env` e as dependências preparados, execute na raiz:

```bash
bash dev.sh
```

O script inicia o banco, espera a saúde da API e inicia servidor Laravel, scheduler e Vite. Usa as portas 8080, 8000 e 8443; tenta selecionar Node 22 pelo NVM quando disponível. Lê a chave de monitor do ambiente ou do `.env` do simulador. Outras variáveis Java personalizadas precisam estar exportadas.

O encerramento usa `kill 0` para atingir o grupo de processos: execute o script em terminal dedicado. O PostgreSQL iniciado pelo Compose continua em segundo plano; para pará-lo, use `docker compose stop postgres`.

## Endereços locais

| Serviço | Endereço |
| --- | --- |
| Interface | http://localhost:8443 |
| API | http://localhost:8080 |
| Saúde | http://localhost:8080/actuator/health |
| Swagger UI | http://localhost:8080/swagger-ui/index.html |
| OpenAPI | http://localhost:8080/v3/api-docs |
| WebSocket | ws://localhost:8080/ws |
| Simulador | http://127.0.0.1:8000/api/simulacao/status |
