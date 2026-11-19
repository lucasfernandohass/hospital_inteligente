# Monitoramento e simulador

[← Índice](README.md) · [Próximo: operação →](07-operacao.md)

## Caminho de uma medição

1. O scheduler Laravel chama `SimulationRunner` a cada segundo.
2. O runner verifica se a simulação está ligada e se o intervalo configurado venceu.
3. `JavaApiClient` autentica na API e consulta pacientes e internações.
4. O simulador seleciona os pacientes com internação sem data de alta.
5. `VitalSignsGenerator` produz as medidas conforme o cenário e o passo do ciclo.
6. `VitalSignsSender` envia o lote por paciente à ingestão Java.
7. A API valida a chave, o corpo e a internação ativa, acrescenta leito e unidade e atualiza o snapshot em memória.
8. Cada medida é publicada no tópico STOMP do paciente.
9. O navegador atualiza os valores, o gráfico e a avaliação de alertas.

A API preserva no snapshot o valor mais recente por horário de captura para cada tipo. Uma medida anterior não substitui o snapshot mais novo, mas ainda é publicada no tópico pelo serviço atual. O consumidor deve considerar essa diferença se enviar dados fora de ordem.

## Tipos aceitos

| Identificador JSON | Medida | Unidade atribuída pela API |
| --- | --- | --- |
| `TEMPERATURA` | Temperatura | °C |
| `PRESSAO_SISTOLICA` | Pressão sistólica | mmHg |
| `PRESSAO_DIASTOLICA` | Pressão diastólica | mmHg |
| `FREQUENCIA_CARDIACA` | Frequência cardíaca | bpm |
| `FREQUENCIA_RESPIRATORIA` | Frequência respiratória | irpm |
| `SATURACAO_OXIGENIO` | Saturação de oxigênio | % |

A requisição exige paciente, captura e uma lista não vazia de medidas. Cada medida exige tipo e valor. Valores negativos são recusados. A unidade é definida pelo enum `TipoSinal`, sem depender de uma unidade enviada pelo cliente.

## Contrato de envio

```json
{
  "pacienteId": 1,
  "capturadoEm": "2026-11-18T10:30:00",
  "medidas": [
    { "tipo": "TEMPERATURA", "valor": 36.7 },
    { "tipo": "FREQUENCIA_CARDIACA", "valor": 80 },
    { "tipo": "SATURACAO_OXIGENIO", "valor": 97 }
  ]
}
```

Envie para `POST /api/ingestao/sinais-vitais` com `X-Monitor-Api-Key`. O exemplo usa um identificador ilustrativo; substitua-o por um paciente internado existente.

## WebSocket e STOMP

| Item | Valor |
| --- | --- |
| Endpoint | `ws://localhost:8080/ws` |
| Protocolo do cliente | STOMP 1.2 sobre WebSocket nativo |
| Autenticação | Cabeçalho nativo `Authorization: Bearer <token>` no frame CONNECT |
| Tópico | `/topic/pacientes/{id}/sinais-vitais` |
| Publicação pelo cliente | Frames SEND são recusados |
| Reconexão da interface | Nova tentativa após 4 segundos quando a conexão fecha |
| Snapshot inicial | GET `/api/pacientes/{id}/sinais-vitais/atuais` |

Exemplo conceitual de frame CONNECT; o frame deve terminar com o byte nulo exigido pelo protocolo:

```text
CONNECT
accept-version:1.2
host:localhost
Authorization:Bearer <token>

```

O interceptor permite inscrições apenas em tópicos de sinais com identificador numérico e exige permissão de leitura de pacientes. Não há nessa verificação um filtro adicional por vínculo individual entre profissional e paciente.

Mensagem de exemplo:

```json
{
  "pacienteId": 1,
  "leitoId": 2,
  "tipo": "FREQUENCIA_CARDIACA",
  "valor": 80,
  "unidade": "bpm",
  "capturadoEm": "2026-11-18T10:30:00"
}
```

## Limites iniciais e alertas

Os valores abaixo são os padrões carregados pela migração V5 e também presentes no fallback da interface. A tabela preserva os operadores usados em `VitalMonitoring.tsx`.

| Medida | Alerta | Crítico |
| --- | --- | --- |
| Frequência cardíaca | < 50 ou > 110 bpm | < 40 ou > 130 bpm |
| Saturação | < 92% | < 88% |
| Frequência respiratória | > 24 irpm | > 30 irpm |
| Temperatura | ≥ 38 °C | ≥ 39 °C |
| Pressão sistólica | > 140 mmHg | > 180 mmHg |

A pressão diastólica é recebida e exibida, mas não possui um limite próprio nessa configuração. Há também eventos de tendência calculados pela interface: variação de frequência cardíaca de pelo menos 15 bpm, queda de saturação de pelo menos 3 pontos percentuais, aumento respiratório de pelo menos 5 e aumento de temperatura de pelo menos 0,5 °C entre as médias avaliadas pelo componente.

O administrador pode alterar o padrão geral. Administrador, médico e enfermagem podem personalizar os limites de um paciente e restaurar o padrão. Sem configuração individual, a API devolve o padrão com `personalizado=false`.

A validação exige a ordem `fcCriticoMin < fcAlertaMin < fcAlertaMax < fcCriticoMax`; limites de saturação críticos são menores que os de alerta, e limites superiores críticos devem superar os de alerta. O banco também reforça essas relações.

Os alertas visuais são calculados no navegador. Reconhecer uma ocorrência altera seu estado visual e pode registrar uma atividade; isso não equivale a uma confirmação compartilhada com todas as sessões. A classificação não representa decisão clínica automatizada validada.

## Cenários do simulador

| Cenário | Finalidade de demonstração |
| --- | --- |
| `estavel` | Valores de uma situação estável |
| `febre` | Elevação de temperatura |
| `dessaturacao` | Redução da saturação |
| `hipertensao` | Elevação de pressão |
| `deterioracao_recuperacao` | Variação ao longo de uma sequência de deterioração e recuperação |

```bash
curl --fail-with-body -X POST http://127.0.0.1:8000/api/simulacao/iniciar \
  -H 'Content-Type: application/json' \
  -d '{"scenario":"febre"}'
curl http://127.0.0.1:8000/api/simulacao/status
curl -X POST http://127.0.0.1:8000/api/simulacao/parar
```

`GET /api/simulacao/pacientes` lista os pacientes elegíveis. O início retorna 202; sem internados, a simulação fica armada para incluir pacientes que sejam internados depois. As rotas de controle Laravel não declaram middleware de autenticação no arquivo de rotas analisado; execute esse servidor em ambiente local controlado.

## Estado e frequência

O intervalo padrão é de 5 segundos. `everySecond()` apenas verifica se chegou a hora de executar um ciclo. O arquivo `simulation-state.json` registra campos como `running`, `scenario`, `step`, `lastCycleAt`, `lastError`, `lastSentCount` e `activePatients`.

Quando o arquivo já existe, seu conteúdo prevalece sobre a configuração inicial de auto start. Um arquivo inválido produz estado parado e mensagem de erro. Consulte o endpoint de status para verificar a situação efetiva.

O hook de sinais mantém até 720 amostras por paciente e agrupa atualizações com o mesmo horário formatado. Esse limite é uma quantidade de amostras, não uma garantia de duração exata de histórico.
