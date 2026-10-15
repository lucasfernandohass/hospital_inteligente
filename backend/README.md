# Backend

## Para preparar o BD:

- Necessário Docker
- Run na raiz do repositório:
```bash
docker compose up -d
```

O PostgreSQL fica disponível em `localhost:5432`. O volume `hospital-postgres-data` preserva os dados após parar os containers. Para parar sem apagar os dados, use `docker compose down`; para apagar também o volume, use `docker compose down -v`.

O Compose carrega as configurações de `.env` na raiz do repositório. Para começar, copie `.env.example` para `.env`. Sem personalizar o arquivo, o banco usa os mesmos valores padrão da API.

## Iniciar API:

- Necessário Maven e Java 21
- Run na raiz da API (`backend/hospital-api`):
```bash
mvn spring-boot:run
```

O objetivo `spring-boot:run` ativa o perfil `local` automaticamente. Nesse perfil, a API gera uma chave JWT aleatória na primeira execução e a guarda no arquivo `.hospital-inteligente/jwt-secret` dentro da pasta pessoal do usuário. O arquivo é reutilizado nas próximas inicializações, portanto os tokens continuam válidos após reiniciar a API. Para usar outro local, configure `JWT_LOCAL_SECRET_FILE`.

Fora do perfil `local`, configure `JWT_SECRET` como uma chave Base64 que represente pelo menos 32 bytes.

O `.env` da raiz é lido pelo Docker Compose, mas não pelo processo Maven. Se os valores de banco forem alterados, exporte também `DB_NAME`, `DB_USER`, `DB_PASSWORD` e `DB_PORT` no ambiente do processo Maven. A migration Flyway do schema inicial é executada na inicialização da API.

## API REST

Base URL local: `http://localhost:8080`

Os endpoints abaixo usam JSON. Datas seguem ISO 8601: `LocalDate` como `YYYY-MM-DD`, `LocalTime` como `HH:mm:ss` e `LocalDateTime` como `YYYY-MM-DDTHH:mm:ss`.

### Autenticação e primeiro administrador

#### Criar o primeiro administrador

`POST /api/auth/setup`

Não requer token. Só cria a conta quando ainda não existe funcionário com a role `ADMINISTRADOR`. Use esse endpoint na primeira configuração do banco; depois da criação inicial, cadastre os demais funcionários autenticado como administrador em `/api/funcionarios`.

Request:

```json
{
  "nome": "Administradora do Hospital",
  "cpf": "12345678901",
  "dataNascimento": "1985-04-20",
  "telefone": "44999990000",
  "endereco": "Rua Central, 100",
  "matricula": "ADM-001",
  "dataAdmissao": "2026-10-15",
  "email": "admin@hospital.local",
  "senha": "SenhaLocalForte123"
}
```

| Campo | Tipo | Regras |
|---|---|---|
| `nome` | string | Obrigatório, até 150 caracteres |
| `cpf` | string | Obrigatório, 11 dígitos |
| `dataNascimento` | date | Obrigatório, no passado |
| `telefone` | string | Opcional, até 20 caracteres |
| `endereco` | string | Opcional, até 255 caracteres |
| `matricula` | string | Obrigatório, até 30 caracteres |
| `dataAdmissao` | date | Obrigatório, hoje ou no passado |
| `email` | string | Obrigatório, formato de e-mail, até 150 caracteres |
| `senha` | string | Obrigatória, entre 12 e 72 caracteres |

Resposta `201 Created`: token Bearer e dados públicos do administrador. Guarde o token para chamar os endpoints protegidos.

```json
{
  "token": "eyJ...",
  "tipo": "Bearer",
  "expiraEmSegundos": 3600,
  "id": 1,
  "nome": "Administradora do Hospital",
  "email": "admin@hospital.local",
  "role": "ADMINISTRADOR"
}
```

Se o administrador inicial já existir, a resposta é `409 Conflict`. E-mail e CPF duplicados também retornam `409`.

#### Login

`POST /api/auth/login` — não requer token.

Request: `{"email":"admin@hospital.local","senha":"SenhaLocalForte123"}`

Resposta `200 OK`: mesmo formato `AuthResponse` do bootstrap. Credenciais incorretas retornam `401 Unauthorized`.

#### Enviar o token

Para endpoints protegidos, inclua o cabeçalho:

```http
Authorization: Bearer <token>
```

As roles disponíveis são `RECEPCIONISTA`, `MEDICO`, `ENFERMEIRA` e `ADMINISTRADOR`. O administrador tem acesso a todos os recursos. As demais permissões variam por recurso e por operação; um acesso autenticado sem a role necessária retorna `403 Forbidden`.

### Funcionários

Todas as operações abaixo exigem role `ADMINISTRADOR`. O response não contém a senha.

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/funcionarios` | Lista funcionários |
| `GET` | `/api/funcionarios/{id}` | Busca funcionário |
| `POST` | `/api/funcionarios` | Cadastra funcionário |
| `PUT` | `/api/funcionarios/{id}` | Atualiza funcionário; a role não pode ser alterada |
| `DELETE` | `/api/funcionarios/{id}` | Exclui funcionário, se não houver referências no banco |

O request usa os dados comuns de pessoa e funcionário (`nome`, `cpf`, `dataNascimento`, `telefone`, `endereco`, `matricula`, `dataAdmissao`, `email`, `senha`) e `role`. Campos específicos:

- `RECEPCIONISTA`: `setor` obrigatório.
- `MEDICO`: `crm` e `especialidade` obrigatórios.
- `ENFERMEIRA`: `coren` e `setor` obrigatórios.
- `ADMINISTRADOR`: não exige campos adicionais.

### Recursos clínicos e operacionais

Para cada recurso da tabela, a API oferece `GET /api/{recurso}`, `GET /api/{recurso}/{id}`, `POST /api/{recurso}`, `PUT /api/{recurso}/{id}` e `DELETE /api/{recurso}/{id}`. `POST` retorna `201 Created`, `GET` e `PUT` retornam `200 OK`, e `DELETE` retorna `204 No Content`. O identificador é gerado pelo servidor e não deve ser enviado no request.

As permissões indicadas mostram quem pode ler e quem pode escrever. `ADMINISTRADOR` pode executar todas as operações em todos os recursos.

| Recurso | Roles de leitura | Roles de escrita | Campos do request |
|---|---|---|---|
| `/api/pacientes` | Recepcionista, Médico, Enfermeira | Recepcionista, Médico, Enfermeira | `nome`, `cpf`, `dataNascimento`, `telefone`, `endereco`, `numeroProntuario`, `convenio` |
| `/api/medicamentos` | Médico, Enfermeira | Médico | `nome`, `dosagem`, `ativo` |
| `/api/leitos` | Recepcionista, Médico, Enfermeira | Recepcionista, Médico, Enfermeira | `numero`, `andar`, `quarto`, `tipo`, `status`, `observacao` |
| `/api/atendimentos` | Recepcionista, Médico, Enfermeira | Recepcionista, Médico, Enfermeira | `data`, `tipo`, `descricao`, `status`, `leitoId`, `pacienteId`, `funcionarioResponsavelId`, `medicoResponsavelId` |
| `/api/internacoes` | Recepcionista, Médico, Enfermeira | Recepcionista, Médico, Enfermeira | `pacienteId`, `leitoId`, `dataInternacao`, `dataPrevistaAlta`, `dataAlta`, `motivo`, `status`, `observacoes` |
| `/api/agendas-medicas` | Recepcionista, Médico | Recepcionista, Médico | `medicoId`, `horaInicio`, `horaFim`, `status`, `tipoConsulta`, `observacoes` |
| `/api/agendamentos` | Recepcionista, Médico | Recepcionista, Médico | `pacienteId`, `medicoId`, `data`, `horario`, `duracao`, `status`, `tipo`, `observacoes` |
| `/api/prescricoes` | Médico, Enfermeira | Médico | `data`, `observacao`, `status`, `pacienteId`, `medicoId`, `atendimentoId` |
| `/api/itens-prescricao` | Médico, Enfermeira | Médico | `prescricaoId`, `medicamentoId`, `dose`, `viaAdministracao`, `frequencia`, `duracao`, `observacoes` |
| `/api/administracoes-medicamento` | Médico, Enfermeira | Médico, Enfermeira | `dataHora`, `dose`, `via`, `observacao`, `itemPrescricaoId`, `pacienteId`, `administradoPor` |
| `/api/exames-imagem` | Médico, Enfermeira | Médico | `dataSolicitacao`, `status`, `observacoes`, `modalidade`, `regiaoCorpo`, `arquivoDigital` |
| `/api/exames-laboratoriais` | Médico, Enfermeira | Médico | `dataSolicitacao`, `status`, `observacoes`, `tipoAnalise`, `amostra`, `metodo` |
| `/api/ecgs` | Médico, Enfermeira | Médico | `dataHora`, `frequenciaCardiaca`, `ritmo`, `intervaloPR`, `duracaoQRS`, `eixo`, `observacao`, `pacienteId`, `atendimentoId` |
| `/api/resultados-exame` | Médico, Enfermeira | Médico | `dataLiberacao`, `laudo`, `arquivoAnexo`, `liberado` |
| `/api/alertas` | Médico, Enfermeira | Médico, Enfermeira | `tipo`, `mensagem`, `dataHora`, `nivel`, `ativo`, `pacienteId` |
| `/api/registros-clinicos` | Médico | Médico | `data`, `descricao`, `anamnese`, `exameFisico`, `diagnostico`, `conduta`, `observacao`, `medicoId`, `atendimentoId` |
| `/api/fichas-atendimento` | Recepcionista, Médico, Enfermeira | Recepcionista, Médico, Enfermeira | `atendimentoId`, `pacienteId`, `versao`, `emitidoEm`, `emitidoPor`, `hashConteudo`, `arquivoPdf` |

Os campos declarados no modelo como obrigatórios também são obrigatórios no request. `duracao` e `versao` devem ser positivos. O `hashConteudo` da ficha deve conter 64 caracteres. Datas e números devem ser enviados como JSON nos tipos indicados.

Exemplo de criação de paciente:

```http
POST /api/pacientes
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "nome": "Maria da Silva",
  "cpf": "12345678901",
  "dataNascimento": "1990-02-10",
  "telefone": "44999990000",
  "endereco": "Rua Central, 100",
  "numeroProntuario": "PR-0001",
  "convenio": "Particular"
}
```

### Erros

Os erros usam o formato `ProblemDetail` com `status` e `detail`.

| Status | Quando ocorre |
|---|---|
| `400 Bad Request` | JSON inválido ou falha de validação dos campos |
| `401 Unauthorized` | Token ausente/inválido ou credenciais incorretas |
| `403 Forbidden` | A role autenticada não pode acessar a operação |
| `404 Not Found` | Recurso ou registro não encontrado |
| `409 Conflict` | Dados duplicados ou violação de integridade |
| `422 Unprocessable Entity` | Regra de negócio não atendida |
| `500 Internal Server Error` | Erro inesperado |

## Swagger UI

Com a API em execução, a documentação interativa fica disponível em `http://localhost:8080/swagger-ui/index.html`.

## Sinais vitais em tempo real (STOMP)

O simulador envia cada lote para a API REST, e a API publica cada medição no STOMP. O fluxo bruto não é persistido no banco. A lista dos valores mais recentes fica apenas em memória para permitir que o painel faça a carga inicial; ela é perdida quando a aplicação reinicia.

### Ingestão pelo simulador

Configure `MONITOR_API_KEY` no ambiente em que a API é executada e use a mesma chave no simulador. Sem uma chave configurada, a API recusa a ingestão. A chamada não usa JWT de usuário:

`POST /api/ingestao/sinais-vitais`

```http
X-Monitor-Api-Key: <chave-do-monitor>
Content-Type: application/json
```

```json
{
  "pacienteId": 1,
  "capturadoEm": "2026-10-15T14:30:00",
  "medidas": [
    { "tipo": "FREQUENCIA_CARDIACA", "valor": 82 },
    { "tipo": "SATURACAO_OXIGENIO", "valor": 98 },
    { "tipo": "TEMPERATURA", "valor": 36.7 }
  ]
}
```

O paciente precisa ter uma internação ativa. O `leitoId` é obtido da internação no servidor e as unidades são determinadas pelo tipo do sinal. A resposta `202 Accepted` contém as medições aceitas. Valores negativos e tipos desconhecidos são rejeitados.

### Conexão do painel

Conecte via WebSocket em `ws://localhost:8080/ws`. O JWT é enviado no frame STOMP `CONNECT`, pois o navegador não permite incluir um header HTTP arbitrário no handshake nativo:

```javascript
import { Client } from "@stomp/stompjs";

const client = new Client({
  brokerURL: "ws://localhost:8080/ws",
  connectHeaders: { Authorization: `Bearer ${token}` },
  onConnect: () => {
    client.subscribe(`/topic/pacientes/${pacienteId}/sinais-vitais`, (frame) => {
      const sinal = JSON.parse(frame.body);
      // Atualize o painel usando pacienteId, tipo, valor, unidade e capturadoEm.
    });
  }
});
client.activate();
```

Somente usuários autenticados com as roles `ADMINISTRADOR`, `RECEPCIONISTA`, `MEDICO` ou `ENFERMEIRA` podem se inscrever em tópicos de pacientes. Clientes não podem publicar mensagens STOMP. A origem permitida padrão é `http://localhost:5173`; ajuste `WEBSOCKET_ALLOWED_ORIGINS` para origens adicionais, separadas por vírgula.

Antes de abrir o WebSocket, o painel pode carregar os valores atuais por `GET /api/pacientes/{pacienteId}/sinais-vitais/atuais`, usando `Authorization: Bearer <token>`. Essa resposta vem da memória da instância. Para produção com múltiplas instâncias, será necessário trocar o broker simples por um broker relay e compartilhar o estado mais recente em uma infraestrutura comum (por exemplo, Redis). Se também for necessário histórico clínico, persista medições selecionadas ou agregadas separadamente, conforme a política clínica.
