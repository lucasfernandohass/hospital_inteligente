# API e controle de acesso

[← Índice](README.md) · [Próximo: modelo de dados →](05-modelo-de-dados.md)

## Convenções

URL local: `http://localhost:8080`. Os corpos de requisição usam JSON e os endpoints de domínio têm prefixo `/api`. Consulte o contrato gerado em `/v3/api-docs` e a interface em `/swagger-ui/index.html` para os campos completos de cada DTO.

Requisições autenticadas enviam `Authorization: Bearer <token>`. O JWT devolve o perfil de acesso, mas o backend também consulta o usuário e aplica as regras do recurso. As rotas públicas de login, setup, documentação, saúde e handshake WebSocket são declaradas em `SecurityConfig`.

## Autenticação

| Método e rota | Comportamento |
| --- | --- |
| `POST /api/auth/setup` | Cria o primeiro administrador; responde 201 e recusa se já houver administrador |
| `POST /api/auth/login` | Autentica por e-mail e senha; responde 200 com sessão |

```bash
curl --fail-with-body -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@hospital.local","senha":"SUBSTITUA_PELA_SENHA"}'
```

A resposta contém `token`, `tipo`, `expiraEmSegundos`, `id`, `nome`, `email` e `role`. O prazo padrão é de uma hora, configurável por `JWT_EXPIRATION_MS`. Não há endpoint de renovação de token nos controllers analisados; autentique novamente ao expirar.

## CRUD de domínio

Os recursos baseados em `AbstractDomainController` seguem o contrato abaixo:

| Método | Rota | Resposta de sucesso |
| --- | --- | --- |
| GET | `/api/{recurso}` | 200, lista JSON |
| GET | `/api/{recurso}/{id}` | 200, objeto JSON |
| POST | `/api/{recurso}` | 201, objeto criado |
| PUT | `/api/{recurso}/{id}` | 200, objeto atualizado |
| DELETE | `/api/{recurso}/{id}` | 204, sem corpo |

A listagem genérica usa `findAll()`, sem paginação. `PUT` substitui os dados mapeados a partir do DTO; envie todos os campos necessários. Exclusões podem falhar por vínculos protegidos no banco.

## Permissões efetivas por recurso

Legenda: **A** administrador; **M** médico; **E** enfermagem; **R** recepção. “Escrita” inclui POST, PUT e DELETE. A tabela combina `@PreAuthorize` e `ApiAuthorization`, e descreve o comportamento permitido no backend, que pode ser mais amplo que as telas disponíveis.

| Recurso em `/api` | Leitura | Escrita |
| --- | --- | --- |
| `pacientes` | A, M, E, R | A, M, E, R |
| `atendimentos` | A, M, E, R | A, M, E, R |
| `leitos` | A, M, E, R | A, M, E, R |
| `internacoes` | A, M, E, R | A, M, E, R |
| `fichas-atendimento` | A, M, E, R | A, M, E, R |
| `agendamentos` | A, M, R | A, M, R |
| `agendas-medicas` | A, M, R | A, M, R |
| `medicamentos` | A, M, E | A, M |
| `prescricoes` | A, M, E | A, M |
| `itens-prescricao` | A, M, E | A, M |
| `administracoes-medicamento` | A, M, E | A, M, E |
| `exames-imagem` | A, M, E, R | A, M |
| `exames-laboratoriais` | A, M, E, R | A, M |
| `ecgs` | A, M | A, M |
| `resultados-exame` | A, M | A, M |
| `alertas` | A, M, E | A, M, E |
| `registros-clinicos` | A, M, E | A, M |
| `funcionarios` | A | A |

**Detalhes relevantes:** ECG e resultados de exame possuem restrição de controller a A/M, embora a tabela interna de leitura em `ApiAuthorization` também mencione enfermagem. Agendas e agendamentos restringem enfermagem tanto no controller quanto na regra de escrita de `ApiAuthorization`. Considere sempre as duas camadas.

`GET /api/medicos` retorna uma lista resumida de médicos para A/M/E/R; não oferece o CRUD genérico. Funcionários possuem controller específico e CRUD administrativo.

## Endpoints específicos

| Método | Rota | Acesso / finalidade |
| --- | --- | --- |
| GET | `/api/atividades` | Autenticado; administrador vê todos os registros, demais perfis veem os próprios |
| POST | `/api/atividades` | Autenticado; registra ação atribuída ao usuário da sessão |
| POST | `/api/admin/dados-teste` | Administrador; carga de dados de demonstração |
| POST | `/api/ingestao/sinais-vitais` | Chave `X-Monitor-Api-Key`; retorna 202 |
| GET | `/api/pacientes/{pacienteId}/sinais-vitais/atuais` | Perfis com leitura de pacientes |
| GET | `/api/configuracoes/limites-sinais-vitais` | A/M/E |
| PUT | `/api/configuracoes/limites-sinais-vitais` | A |
| GET | `/api/pacientes/{pacienteId}/limites-sinais-vitais` | A/M/E |
| PUT | `/api/pacientes/{pacienteId}/limites-sinais-vitais` | A/M/E |
| DELETE | `/api/pacientes/{pacienteId}/limites-sinais-vitais` | A/M/E; restaura o padrão e devolve a configuração efetiva |

O endpoint de ingestão é liberado na cadeia de segurança HTTP, mas exige a chave no próprio controller. Isso não equivale a ingestão anônima. O WebSocket exige JWT no `CONNECT` STOMP, após o handshake.

## Exemplos de consulta e ingestão

Defina `API_TOKEN` no terminal com um token válido:

```bash
curl --fail-with-body http://localhost:8080/api/pacientes \
  -H "Authorization: Bearer $API_TOKEN"
```

Para a ingestão, utilize um `pacienteId` real com internação ativa e um horário de captura adequado ao teste:

```bash
curl --fail-with-body -X POST http://localhost:8080/api/ingestao/sinais-vitais \
  -H 'Content-Type: application/json' \
  -H "X-Monitor-Api-Key: $MONITOR_API_KEY" \
  -d '{"pacienteId":1,"capturadoEm":"2026-11-18T10:30:00","medidas":[{"tipo":"FREQUENCIA_CARDIACA","valor":80},{"tipo":"SATURACAO_OXIGENIO","valor":97}]}'
```

O retorno é uma lista de medições normalizadas, com paciente, leito, tipo, valor, unidade e captura. A consulta de valores atuais pode retornar uma lista vazia se a API ainda não recebeu medições desde sua inicialização.

## Erros HTTP

O `GlobalExceptionHandler` utiliza `ProblemDetail`, com campos como `type`, `title`, `status` e `detail`. O cliente web prioriza `detail` para exibir a mensagem.

| Status | Situação tratada |
| --- | --- |
| 400 | JSON inválido, tipo incompatível, erro de validação ou argumento inválido |
| 401 | Falha de autenticação tratada pelo handler |
| 403 | Acesso negado, incluindo chave do monitor inválida |
| 405 | Método HTTP não suportado pela rota |
| 404 | Recurso não encontrado tratado por `ResourceNotFoundException` |
| 409 | Duplicidade, estado incompatível ou violação de integridade |
| 422 | Violação de regra de negócio |
| 500 | Erro inesperado, com detalhes registrados no servidor |

Respostas geradas pelos filtros de segurança ou por exceções com outro tratamento podem ter formato ou status diferente. O serviço de limites usa `ResponseStatusException` para paciente ausente, enquanto o handler também captura `Exception`; esse caminho merece validação em execução antes de depender de um retorno 404 específico.
