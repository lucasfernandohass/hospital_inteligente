# Evidência de execução — backend P0

Executado em 18/11/2026 na branch `testes/qualidade-hospital-inteligente`, sobre o commit base `016abaf`, com as alterações de QA no diretório de trabalho. Ambiente da execução: Windows, Temurin 21.0.7, Maven 3.9.16 e PostgreSQL 17.11.

## Linha de base

| Suíte | Aprovados | Reprovados | Bloqueados |
|---|---:|---:|---:|
| Inicialização Spring com Flyway | 1 | 0 | 0 |
| Validação de limites, casos originais | 2 | 0 | 0 |
| **Total da linha de base** | **3** | **0** | **0** |

A linha de base retornou `BUILD SUCCESS` e o Flyway aplicou as cinco migrations em um cluster novo. O resumo acima preserva as contagens da linha de base antes de `verify` limpar os artefatos Maven.

## Comandos de reprodução

Defina `$qa` conforme o [guia local](README.md). A execução utilizou um cache temporário e estes comandos:

```powershell
mvn.cmd -U -B -ntp "-Dmaven.repo.local=$($qa.MavenRepository)" -f backend/hospital-api/pom.xml org.apache.maven.plugins:maven-dependency-plugin:3.10.0:go-offline
./docs/qa/run-backend.ps1 @qa -Suite baseline -Offline
./docs/qa/run-backend.ps1 @qa -Suite verify -Offline
```

O script define o JDK para os testes. Se o Maven usado na resolução de dependências precisar da seleção explícita de Java, defina `JAVA_HOME` com o mesmo caminho de `$qa.Jdk21` antes do primeiro comando.

## Ocorrências do ambiente

- A tentativa inicial em modo offline encontrou dependências ausentes. A tentativa online no sandbox encontrou restrições de rede e de escrita no cache de usuário. A resolução autorizada no Maven Central, em um cache temporário, concluiu com sucesso.
- A compilação dentro do sandbox tentou acessar JARs do cache temporário e recebeu `AccessDeniedException`. A linha de base com a execução autorizada fora do sandbox compilou e executou os testes usando o mesmo cache.
- O `pg_ctl start` foi bloqueado pelo token restrito do Windows no sandbox. O script iniciou diretamente o `postgres.exe`, verificou o PID e a porta do cluster temporário, validou o marcador pelo JDBC antes do Flyway e encerrou a instância com `pg_ctl stop`.

## Correção da suíte

A primeira execução completa teve uma falha de preparação de dados. A API retornou HTTP 422 ao receber um CPF sintético com dígitos verificadores inválidos no cadastro de funcionário. Os CPFs das contas de teste foram substituídos por valores sintéticos com dígitos verificadores válidos. Os cenários de autenticação passaram a testar ausência, invalidade e expiração do token em métodos independentes, preservando a expectativa de HTTP 401.

## Regressão anterior à correção HTTP

| Suíte | Executados | Aprovados | Reprovados | Bloqueados |
|---|---:|---:|---:|---:|
| Contexto Spring e Flyway | 1 | 1 | 0 | 0 |
| Validação de limites | 9 | 9 | 0 | 0 |
| Serviço de sinais vitais | 4 | 4 | 0 | 0 |
| Integração HTTP, Spring Security e PostgreSQL | 8 | 5 | 3 | 0 |
| **Total da regressão** | **22** | **19** | **3** | **0** |

O total inclui os três casos originais e 19 novos. O Surefire registrou 14 aprovações. O Failsafe registrou 5 aprovações e 3 reprovações, sem erros de execução ou casos ignorados. `verify` retornou código 1 devido às três asserções de autenticação e gerou o relatório JaCoCo.

### QA-P0-001 — Sem autenticação, recurso protegido retorna HTTP 403

**Classificação:** falha de contrato da aplicação, confirmada em três casos independentes. O README da API prevê 401 para token ausente ou inválido, e um JWT expirado deixa de ser válido. Em `GET /api/configuracoes/limites-sinais-vitais`, os três casos retornaram 403. O filtro deixa a requisição seguir sem principal e a configuração atual não declara um ponto de entrada HTTP 401 para essa condição. O 403 por falta de permissão, com usuário autenticado, foi validado no cenário de limites.

O responsável pelo backend autorizou a correção. O relatório técnico registra o diagnóstico e a implementação. [Relatório de testes](../RELATORIO_TESTES.md)

### Cobertura medida

| Métrica JaCoCo | Cobertos / total | Cobertura |
|---|---:|---:|
| Linhas | 391 / 707 | 55,30% |
| Ramos | 96 / 318 | 30,19% |
| Instruções | 2.604 / 5.629 | 46,26% |

O JaCoCo analisou 124 classes do backend e acumulou as execuções do Surefire e do Failsafe, incluindo o código percorrido nos testes reprovados. Trata-se de cobertura do código instrumentado. A cobertura dos critérios de aceitação é registrada na matriz.

Artefatos locais em `backend/hospital-api/target`: `surefire-reports/TEST-*.xml`, `failsafe-reports/TEST-*.xml`, `site/jacoco/jacoco.xml` e `site/jacoco/index.html`. Os clusters de QA das execuções foram encerrados. A entrega cobre chamadas ao publicador STOMP no teste unitário. A conexão WebSocket real fica para a próxima rodada de integração do backend.

## Reteste e regressão após QA-P0-001

```powershell
./docs/qa/run-backend.ps1 @qa -Suite auth -Offline
./docs/qa/run-backend.ps1 @qa -Suite verify -Offline
```

| Execução | Aprovados | Reprovados | Bloqueados |
|---|---:|---:|---:|
| Reteste dos três casos HTTP 401 | 3 | 0 | 0 |
| Surefire na regressão completa | 14 | 0 | 0 |
| Failsafe na regressão completa | 8 | 0 | 0 |
| **Total da regressão completa** | **22** | **0** | **0** |

Os dois comandos retornaram código 0 e `BUILD SUCCESS`. Cada execução aplicou as cinco migrations em seu próprio cluster descartável e confirmou o encerramento do servidor. Os três casos retornaram 401 com desafio Bearer e corpo ProblemDetail. A regressão confirmou o 403 para usuário autenticado sem permissão.

| Métrica JaCoCo | Antes | Depois |
|---|---:|---:|
| Linhas | 391 / 707 (55,30%) | 396 / 712 (55,62%) |
| Ramos | 96 / 318 (30,19%) | 96 / 318 (30,19%) |
| Instruções | 2.604 / 5.629 (46,26%) | 2.629 / 5.654 (46,50%) |

As contagens posteriores foram verificadas nos XMLs do Surefire, Failsafe e JaCoCo. Os arquivos em `target` correspondem à regressão completa mais recente.

## Etapa 2 — Regressão com transporte real

```powershell
./docs/qa/run-backend.ps1 @qa -Suite stage2 -Offline
./docs/qa/run-backend.ps1 @qa -Suite verify -Offline
```

| Execução | Aprovados | Reprovados | Bloqueados | Saída |
|---|---:|---:|---:|---|
| `stage2` inicial | 7 | 5 | 0 | Código 1 |
| `stage2` após correções | 14 | 0 | 0 | Código 0 |
| Surefire na regressão | 14 | 0 | 0 | |
| Failsafe na regressão | 22 | 0 | 0 | |
| **Regressão completa** | **36** | **0** | **0** | **Código 0** |

Na regressão, as cinco migrations foram aplicadas nos schemas `public` e `transport` do PostgreSQL 17.11 descartável. O servidor foi encerrado. Os XMLs das suítes em `target` registram zero erros e zero casos ignorados.

| JaCoCo na regressão completa | Cobertos / total | Cobertura |
|---|---:|---:|
| Linhas | 462 / 743 | 62,18% |
| Ramos | 130 / 338 | 38,46% |
| Instruções | 3.015 / 5.831 | 51,71% |

O relatório analisou 124 classes. Os resultados e a classificação dos achados estão no [relatório técnico](../RELATORIO_TESTES.md#etapa-2--websocketstomp-internação-leitos-e-alta).

## Etapa 3 — Execuções clínicas, de auditoria e de escopo assistencial

```powershell
./docs/qa/run-backend.ps1 @qa -Suite stage3 -Offline
./docs/qa/run-backend.ps1 @qa -Suite stage3-scope -Offline
./docs/qa/run-backend.ps1 @qa -Suite verify -Offline
```

| Execução | Aprovados | Reprovados | Erros | Resultado |
|---|---:|---:|---:|---|
| Matriz inicial (Surefire interrompeu o build) | 14 | 1 | 0 | Código 1 |
| Primeira rodada de integração clínica, após corrigir a matriz | 7 | 2 | 1 | Código 1 |
| Ensaio de escopo assistencial isolado | 0 | 1 | 0 | Código 1 |
| Reteste da integração, após corrigir vínculos e fixture | 9 | 1 | 0 | Código 1 |
| Etapa 3 após correções | 26 | 0 | 0 | Código 0 |
| Regressão completa | 62 | 0 | 0 | Código 0 |

O ensaio de escopo contém um caso separado da regressão. O médico sem vínculo obteve 200 onde o requisito previa recusa. A execução direcionada confirmou duas gravações inconsistentes e depois confirmou a falha de tratamento 405/500. O erro na primeira rodada de integração foi a leitura de um campo nulo omitido pela serialização. O caso de liberação de resultado de exame foi acrescentado antes do reteste final.

O Surefire registrou 29 aprovações e o Failsafe registrou 33. A regressão teve zero testes ignorados ou bloqueados, aplicou as cinco migrations nos dois schemas isolados e encerrou o cluster descartável. O ensaio assistencial não entra nessas contagens.

| Métrica JaCoCo | Etapa 2 | Etapa 3 |
|---|---:|---:|
| Linhas | 462 / 743 (62,18%) | 558 / 775 (72,00%) |
| Ramos | 130 / 338 (38,46%) | 164 / 346 (47,40%) |
| Instruções | 3.015 / 5.831 (51,71%) | 4.141 / 5.985 (69,19%) |

O relatório da regressão analisou 125 classes. Os XMLs locais em `target/surefire-reports`, `target/failsafe-reports` e `target/site/jacoco` fundamentam as contagens. O diagnóstico da lacuna assistencial está no [relatório técnico](../RELATORIO_TESTES.md#etapa-3--fluxos-clínicos-autorização-e-auditoria).

## QA-SEC-001 — Reteste de autorização assistencial

Em 18/11/2026, `-Suite stage3-scope -Offline` executou um caso em PostgreSQL descartável. O principal sem vínculo recebeu HTTP 200, confirmando a reprovação registrada na Etapa 3. O caso mantém a expectativa de recusa e permanece separado da regressão padrão. [Causa, alcance e proposta](escopo-assistencial.md)

Na sequência, `-Suite verify -Offline` reexecutou a regressão existente com 62 aprovações, zero falhas, zero erros e zero testes ignorados. Os artefatos locais de Surefire, Failsafe e JaCoCo voltaram a representar a regressão completa. A análise alterou apenas a documentação de QA.

## Validação final da demonstração

| Comando | Resultado |
|---|---|
| `npm ci`, `npm run typecheck`, `npm run build` no frontend | Instalação, checagem e compilação concluídas. |
| `npm run test:smoke` no frontend | 3 aprovados. |
| `php -l` nos arquivos de aplicação, rotas e testes do simulador | 11 verificações de sintaxe aprovadas. |
| `php simulador-laravel/tests/smoke.php` | 3 aprovados. |
| `php artisan schedule:list` e `php artisan route:list --path=simulacao` no simulador | Tarefa e quatro rotas registradas. |
| `./docs/qa/run-backend.ps1 @qa -Suite demo -Offline` | 1 demonstração integrada aprovada, Failsafe e Playwright. |
| `./docs/qa/run-backend.ps1 @qa -Suite verify -Offline` | 62 aprovados, zero falhas, erros ou ignorados. JaCoCo 72,00% das linhas e 47,40% dos ramos. |

As execuções de integração usaram clusters separados, encerrados ao final. Os JSONs Playwright permanecem em `frontend/test-results/`; o `target` Maven contém os XMLs e JaCoCo da regressão mais recente. A QA-SEC-001 continua pendente. [Diagnóstico](escopo-assistencial.md) · [Relatório final](../RELATORIO_TESTES.md)
