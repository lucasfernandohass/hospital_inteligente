# Simulador Laravel de sinais vitais

O simulador envia dados **sintéticos** para a API Java. Por padrão (`SIMULATOR_AUTO_START=true`), ao iniciar o scheduler ele busca periodicamente pacientes com internação ativa e envia sinais para todos eles. Pacientes recém cadastrados e internados entram automaticamente no ciclo seguinte; pacientes sem internação ativa não recebem sinais. A interface também pode parar e retomar a simulação pelos endpoints abaixo.

## Configuração

Requer PHP 8.2+ e Composer. Na pasta `simulador-laravel`, configure o `.env`:

```dotenv
JAVA_API_URL=http://localhost:8080
MONITOR_API_KEY=mesma-chave-MONITOR_API_KEY-do-Java
JAVA_API_EMAIL=usuario-com-leitura-de-pacientes-e-internacoes
JAVA_API_PASSWORD=senha-desse-usuario
SIMULATOR_INTERVAL_SECONDS=5
SIMULATOR_SCENARIO=deterioracao_recuperacao
SIMULATOR_AUTO_START=true
FRONTEND_URL=http://localhost:5173
```

As credenciais Java são usadas pelo Laravel para consultar os pacientes e as internações. Use uma conta com permissão de leitura nesses dois recursos. A chave do monitor é usada no envio de cada lote e precisa ser igual à variável `MONITOR_API_KEY` com que o Java foi iniciado.

## Executar

Mantenha o backend Java e o banco ativos. Em um terminal, inicie a API do simulador:

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

Em outro terminal, inicie o scheduler que executa os ciclos:

```bash
php artisan schedule:work
```

O scheduler é necessário para detectar novas internações e enviar sinais no intervalo configurado. Com `SIMULATOR_AUTO_START=true`, a simulação fica ativa automaticamente enquanto o scheduler estiver rodando; use o endpoint de parada para desligá-la.

## API para o frontend

Base URL local: `http://127.0.0.1:8000`.

| Método | Endpoint | Uso |
|---|---|---|
| `GET` | `/api/simulacao/pacientes` | Lista pacientes que têm internação ativa |
| `POST` | `/api/simulacao/iniciar` | Liga ou retoma a simulação global; novos internados são incluídos automaticamente |
| `GET` | `/api/simulacao/status` | Consulta estado, quantidade de pacientes, último envio e erro |
| `POST` | `/api/simulacao/parar` | Desliga a simulação |

Exemplo para iniciar com cenário escolhido:

```json
{"scenario":"deterioracao_recuperacao"}
```

Cenários aceitos: `estavel`, `febre`, `dessaturacao`, `hipertensao` e `deterioracao_recuperacao`. O POST de início retorna `202 Accepted`. Se ainda não houver pacientes internados, a simulação fica armada e começa a enviar quando o primeiro paciente elegível aparecer. Com início automático ativado, o frontend não precisa chamar `/iniciar` para cada paciente novo.

O endpoint `GET /api/simulacao/pacientes` retorna um objeto com `data`, por exemplo:

```json
{
  "data": [
    {"id": 4, "nome": "Paciente de Teste", "numeroProntuario": "PR-0004"}
  ]
}
```

## Envio único pelo Artisan

Para uma chamada manual ainda é possível executar:

```bash
php artisan simulator:vitals --patient=4 --scenario=febre --once
```

Os valores gerados são sintéticos para demonstração e não representam medições clínicas reais.
