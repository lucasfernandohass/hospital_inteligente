# Relatório técnico e acadêmico de testes — Hospital Inteligente

- **Data** — 18/11/2026
- **Branch** — `testes/qualidade-hospital-inteligente`
- **Escopo** — Etapas 1 a 3 de QA e validação final dos fluxos essenciais da demonstração acadêmica.

## Etapa 1 — Objetivo e metodologia

A suíte avalia se a API recebe e distribui medições sintéticas para o paciente correto, rejeita dados inválidos, aplica os limites configurados e distingue falta de autenticação de falta de permissão. Os cenários foram derivados da documentação da API e das histórias US09, US31 e US32. A matriz relaciona requisito, cenário e implementação do teste. [Contrato da API](../backend/README.md) · [Matriz P0](qa/cenarios.md)

| Nível | Método e ferramentas | Cenários |
|---|---|---|
| Unitário | JUnit Jupiter, Jakarta Validation e Mockito, executados pelo Surefire | Limites válidos e relações de fronteira. Seis sinais com unidades, leito e tópico corretos. Rejeição sem efeitos colaterais. Ordem temporal e isolamento por paciente. |
| Integração | Spring Boot Test, MockMvc, Spring Security e PostgreSQL, executados pelo Failsafe | Bootstrap e login, autenticação Bearer, permissões dos quatro perfis, ingestão HTTP, snapshot, configuração e restauração de limites com registro de autoria. |
| Inicialização | Teste de contexto Spring com Flyway | Inicialização sobre schema vazio e aplicação das cinco migrations. |
| Cobertura | JaCoCo com execução combinada do Surefire e Failsafe | Linhas, ramos e instruções do código instrumentado. |

As execuções usaram Windows, Temurin 21.0.7, Maven 3.9.16 e PostgreSQL 17.11. O script cria um cluster por execução, com autenticação, em loopback e porta efêmera. O teste valida o identificador do cluster antes de o Flyway aplicar as migrations. O script usa credenciais geradas para a execução e encerra o servidor ao final. [Guia de execução](qa/README.md)

## Diagnóstico e correção

**QA-P0-001 — HTTP 403 em requisições sem autenticação válida.** Em um recurso protegido, as requisições sem token, com token inválido ou com token expirado receberam 403. O filtro JWT deixava a requisição sem principal autenticado. Na ausência de um `AuthenticationEntryPoint` explícito, o Spring Security recorria a `Http403ForbiddenEntryPoint`. O contrato do projeto e a RFC 9110 preveem 401 com um desafio de autenticação para credenciais ausentes ou inválidas. O contrato da API prevê 403 quando um usuário autenticado não tem a permissão exigida. [Contrato de erros](../backend/README.md#erros) · [RFC 9110, §§ 15.5.2 e 15.5.4](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.2) · [Spring Security, tratamento de exceções](https://docs.spring.io/spring-security/reference/servlet/architecture.html#servlet-exceptiontranslationfilter)

A correção configura o ponto de entrada em `SecurityConfig`, define o status 401 e inclui `WWW-Authenticate: Bearer`. O tratamento existente da API gera o corpo `ProblemDetail` com mensagem genérica. As regras de acesso e a validação JWT foram preservadas. Os três testes mantêm a asserção de 401 e verificam também o cabeçalho, o tipo de conteúdo e o corpo. O teste de autorização mantém a expectativa de 403 quando a recepção tenta consultar os limites.

**Falha de preparação de dados.** Um cenário inicial de permissões recebeu 422 porque CPFs sintéticos da fixture tinham dígitos verificadores inválidos. A correção ficou nos dados de teste.

**Ocorrências de ambiente.** A resolução de dependências e a compilação no sandbox tiveram restrições de rede e de acesso ao cache. A execução autorizada com cache temporário e cluster descartável permitiu completar as suítes. [Histórico de execução](qa/resultados.md)

## Resultados

| Execução | Aprovados | Reprovados | Bloqueados | Resultado Maven |
|---|---:|---:|---:|---|
| Linha de base, casos originais | 3 | 0 | 0 | `BUILD SUCCESS` |
| Regressão anterior à correção HTTP | 19 | 3 | 0 | `BUILD FAILURE` |
| Reteste dos casos HTTP 401 | 3 | 0 | 0 | `BUILD SUCCESS` |
| Regressão após a correção | 22 | 0 | 0 | `BUILD SUCCESS` |

A regressão posterior registrou 14 aprovações no Surefire e 8 no Failsafe. Os três casos do reteste fazem parte dos 22 casos da regressão. O caso de recepção autenticada continuou retornando 403 e os cenários de bootstrap, login, ingestão e limites passaram. [Comandos e evidências](qa/resultados.md)

## Cobertura medida

| Métrica | Antes da correção | Após a correção |
|---|---:|---:|
| Linhas | 391 / 707 (55,30%) | 396 / 712 (55,62%) |
| Ramos | 96 / 318 (30,19%) | 96 / 318 (30,19%) |
| Instruções | 2.604 / 5.629 (46,26%) | 2.629 / 5.654 (46,50%) |

Os valores vêm do JaCoCo para 124 classes, com dados combinados de Surefire e Failsafe. A cobertura anterior inclui o código executado nos casos que reprovaram. Os XMLs JUnit e os relatórios JaCoCo são gerados em `backend/hospital-api/target`. A cobertura mede código executado e deve ser lida junto à matriz de requisitos. [Localização dos relatórios](qa/resultados.md)

## Conclusão

A divergência HTTP 401/403 foi reproduzida, corrigida e retestada. Os 22 casos da regressão passaram em PostgreSQL descartável, incluindo a distinção entre credenciais inválidas e perfil autenticado sem permissão. O teste unitário verifica a chamada ao publicador STOMP. A entrega por uma conexão WebSocket real, o frontend, o simulador e o E2E ficam fora do escopo desta etapa.

## Etapa 2 — WebSocket/STOMP, internação, leitos e alta

### Método e cenários

A API Spring foi iniciada em porta efêmera no loopback. O cliente WebSocket do JDK 21 enviou frames STOMP 1.2 ao broker real. Uma sondagem no registro de inscrições aguardou o processamento pelo broker antes da ingestão, evitando dependência de pausas fixas na entrega positiva. Dois clientes independentes receberam sinais pelos tópicos dos respectivos pacientes. Também foram exercitados CONNECT sem token e com token inválido, inscrição fora do contrato, rejeição de publicação do cliente, remoção de inscrição ao fechar o transporte, reconexão e recuperação do snapshot via REST.

As integrações hospitalares enviaram requisições HTTP reais à API, ligada a um PostgreSQL 17 descartável com schema separado das fixtures da Etapa 1. Os casos concorrentes sincronizaram o início de duas requisições por barreira e verificaram os códigos HTTP e o estado persistido. Os cenários incluíram disputa pelo mesmo leito e pelo mesmo paciente, duas altas concorrentes, associação com leito em manutenção, transferência, alta repetida e preservação do histórico. Os testes de validação verificaram o formato `ProblemDetail` para JSON inválido, recurso inexistente, duplicidade, referências e datas inconsistentes.

### Diagnóstico e correções

| Achado | Causa e correção |
|---|---|
| Leito continuava disponível após internação | O serviço usava o CRUD genérico sem atualizar a ocupação. A mudança de leito passou a fazer parte da mesma transação da internação. Alta, transferência e exclusão de internação ativa atualizam os leitos envolvidos. |
| Leito em manutenção era aceito | A criação não verificava a disponibilidade. O serviço agora valida o estado sob bloqueio do leito e responde 409 quando ele não está disponível. |
| Duas altas concorrentes eram aceitas | O serviço sobrescrevia o registro a cada PUT. O bloqueio da internação serializa as alterações, e a segunda tentativa recebe 409. O PUT de uma internação já encerrada passa a retornar 409. Uma alta preserva o leito registrado no histórico. |
| Dois testes reportavam zero internações ativas após uma criação aceita | O filtro da fixture não contava corretamente as altas nulas. A leitura passou a comparar o campo diretamente no JSON da lista, mantendo a expectativa de uma única internação ativa. |

O estado persistido de liberação é **Disponível**, conforme US28 CA04. Para transferência, os leitos são bloqueados em ordem de ID e os índices PostgreSQL continuam protegendo a unicidade das internações ativas. Os testes confirmam rollback em alta inválida e preservação do leito ocupado na tentativa de repetir uma alta após nova internação. [Matriz da Etapa 2](qa/cenarios.md)

### Resultados e cobertura

| Execução | Aprovados | Reprovados | Bloqueados |
|---|---:|---:|---:|
| Rodada inicial da Etapa 2 | 7 | 5 | 0 |
| Etapa 2 após as correções | 14 | 0 | 0 |
| Regressão completa do backend | 36 | 0 | 0 |

As cinco reprovações iniciais consistiram em três divergências de aplicação e dois erros de contagem nos testes. O reteste incluiu mais dois casos, um para transferência e exclusão e outro para rollback de alta inválida. Na regressão, o Surefire registrou 14 aprovações e o Failsafe registrou 22. O Maven concluiu com `BUILD SUCCESS`. Os clusters descartáveis foram encerrados. [Comandos e evidências](qa/resultados.md)

| Métrica JaCoCo | Regressão da Etapa 1 | Regressão da Etapa 2 |
|---|---:|---:|
| Linhas | 396 / 712 (55,62%) | 462 / 743 (62,18%) |
| Ramos | 96 / 318 (30,19%) | 130 / 338 (38,46%) |
| Instruções | 2.629 / 5.654 (46,50%) | 3.015 / 5.831 (51,71%) |

O serviço de internação atingiu 16 de 20 ramos e o interceptor STOMP, 16 de 22. A ampliação veio de decisões de negócio e de segurança exercitadas por requisições concorrentes, falhas de protocolo e mudanças de estado.

### Módulos ainda prioritários

- **Autorização e auditoria.** A matriz de permissões por recurso e operação ainda tem lacunas. O JaCoCo registrou 3 de 22 ramos em `ApiAuthorization` e 0 de 6 no serviço de atividades. Priorizar autoria pelo principal autenticado, filtros por perfil e preservação de histórico.
- **Alertas persistidos e fluxos clínicos.** Exercitar reconhecimento e persistência de alertas, atendimento e prontuário, prescrição e administração de medicamentos, exames, resultados e ECG numérico. A inicialização das classes no contexto Spring não valida seus fluxos de negócio.
- **Recepção e administração.** Cobrir conflito e cancelamento de agendamentos, edição de funcionários por perfil, idempotência e rollback da carga de demonstração. O serviço de carga teve 0 de 58 ramos cobertos.
- **Cenários adicionais do escopo já testado.** Ampliar perfis e JWT expirado no STOMP, validar concorrência entre transferência e mudança administrativa de status do leito e verificar o estado de registros legados. A correção da Etapa 2 se aplica às transições da API de internações, sem migração retroativa.

## Etapa 3 — Fluxos clínicos, autorização e auditoria

### Método e testes

JUnit Jupiter executou a matriz unitária de leitura e escrita. Os testes de integração iniciaram a API Spring Boot em loopback e usaram requisições HTTP, tokens emitidos pela aplicação e um PostgreSQL 17 descartável. As fixtures sintéticas exercitaram os quatro perfis. O JaCoCo combinou Surefire e Failsafe. [Matriz de cenários](qa/cenarios.md) · [Guia de execução](qa/README.md)

| Módulo | Cenários |
|---|---|
| Atendimento e prontuário | Criação, atualização e leitura com vínculos de paciente e profissionais, validação de campos, referência inválida, acesso por perfil e versão duplicada de ficha. |
| Prescrição e medicação | Criação e leitura de prescrição, item e administrações, permissões, doses em horários distintos, referência inexistente e recusa de vínculos entre pacientes distintos. |
| Alertas | Criação, leitura, alteração de estado, permanência do registro inativo na listagem, exclusão e restrições para a recepção. |
| Exames e ECG | Criação e leitura com vínculos persistidos, validação de frequência do ECG, acesso por perfil e rejeição de associações entre pacientes distintos. |
| Autorização e auditoria | Matriz de papéis, autoria e horário definidos no servidor, consulta por autor ou administrador, preservação de nome e perfil após exclusão da conta e proteção contra alteração HTTP. |

### Achados e correções

- **Permissões de agenda.** A política interna autorizava escrita de enfermagem por um agrupamento de recursos amplo. Os controllers já impediam essa operação. O ajuste restringe a decisão interna às permissões de agenda documentadas.
- **Integridade entre pacientes.** As chaves estrangeiras confirmavam a existência de cada referência isoladamente, permitindo gravar um exame ou uma prescrição de outro paciente para um atendimento válido. A validação passou a comparar o paciente no atendimento ou na prescrição de origem antes de gravar prescrições, administrações, exames de imagem, exames laboratoriais e ECG. Os vínculos incompatíveis retornam HTTP 422. A mudança preserva o tratamento de referências inexistentes pelas restrições do banco. O ajuste protege as escritas cobertas nos serviços. A conciliação de registros legados e a integridade global diante de reatribuições retroativas precisam de análise específica.
- **Método HTTP indisponível em auditoria.** O tratamento genérico capturava `HttpRequestMethodNotSupportedException` e respondia 500. O handler específico preserva o 405, os métodos aceitos no cabeçalho `Allow` e o corpo de erro. O teste também verifica que a tentativa não altera o registro.
- **Falha da fixture de auditoria.** A API omite campos nulos na serialização. O teste passou a verificar que os detalhes em branco ficam ausentes ou nulos, conforme o contrato, aceitando ambos os formatos.

### Lacunas que exigem decisão de produto ou arquitetura

| Requisito | Evidência e pendência |
|---|---|
| Escopo assistencial por paciente e profissional (US05 CA05, US06) | O ensaio isolado obteve HTTP 200 na consulta por outro médico sem vínculo. A regra atual decide por papel e recurso. Definir vínculos, acesso de equipe e exceções antes de aplicar uma política transversal de leitura e escrita. |
| Alertas automáticos e reconhecimento auditável (US11 e US12) | A leitura do código mostrou que o frontend deriva alertas dos sinais e guarda o reconhecimento automático no estado do painel. A ingestão publica medições e atualiza o snapshot. O CRUD persiste alertas manuais, mas a desativação pelo PUT não guarda identidade e horário de reconhecimento no próprio alerta. O registro de atividades é separado. Definir um fluxo persistente com histórico e transições de alerta. |
| Exames duplicados, resultado e traçado de ECG (US10, US17 e US33) | A API persiste solicitações e ECG numérico. O resultado possui CRUD próprio sem referência à solicitação e o contrato de sinais não fornece traçado. Definir equivalência de solicitações ativas, vínculo do resultado e mecanismo de notificação e armazenamento de traçado. |
| Permissões de leitura de exames e registros | O README descreve um conjunto mais restrito. A recepção consulta exames e a enfermagem consulta registros clínicos em chamadas de inicialização dos painéis. Uma restrição imediata pode quebrar esses fluxos. Confirmar a política e a projeção de dados por perfil. |
| Administração e histórico de prescrições | O corpo da administração recebe profissional, dose e horário. A consulta separa doses registradas em horários diferentes. Definir autoria automática no servidor, regras de repetição ou idempotência e versionamento de prescrições antes de introduzir novas restrições no contrato. |

As lacunas foram mantidas separadas das correções pontuais. O ensaio assistencial conserva a expectativa de recusa e é executado com `-Suite stage3-scope`. [Registro de execução](qa/resultados.md)

### Resultados e cobertura

| Execução | Aprovados | Reprovados | Bloqueados |
|---|---:|---:|---:|
| Seleção da Etapa 3 | 26 | 0 | 0 |
| Regressão completa | 62 | 0 | 0 |
| Ensaio assistencial separado | 0 | 1 | 0 |

Na regressão, o Maven concluiu com `BUILD SUCCESS`. Os relatórios XML registraram 29 casos aprovados no Surefire e 33 no Failsafe. A seleção da Etapa 3 está incluída na regressão. O ensaio assistencial separado permanece reprovado, com HTTP 200 observado diante da expectativa de recusa. [Comandos, rodadas intermediárias e evidências](qa/resultados.md)

| Métrica JaCoCo | Regressão da Etapa 2 | Regressão da Etapa 3 |
|---|---:|---:|
| Linhas | 462 / 743 (62,18%) | 558 / 775 (72,00%) |
| Ramos | 130 / 338 (38,46%) | 164 / 346 (47,40%) |
| Instruções | 3.015 / 5.831 (51,71%) | 4.141 / 5.985 (69,19%) |

O JaCoCo analisou 125 classes. A matriz cobriu 26 de 26 ramos de `ApiAuthorization`, os cenários de auditoria cobriram 5 de 6 ramos de `RegistroAtividadeService` e as validações de vínculo cobriram 4 de 4 ramos de `VinculosClinicos`. Essas métricas descrevem decisões de código e não certificam escopo de acesso por objeto.

### Pendências do backend

- **Prioridade de segurança e negócio** — política de escopo assistencial em consultas e escritas, reconhecimento de alertas com persistência e autoria e consistência na reatribuição de vínculos clínicos.
- **Fluxos clínicos incompletos** — resultado associado à solicitação, notificação e equivalência de exames, traçado de ECG, autoria de administrações e histórico de alterações de prescrição.
- **Outros módulos** — conflitos e remarcações da agenda, gestão e ciclo de vida de funcionários, carga de demonstração e matriz HTTP de autorização para operações ainda não exercitadas. A carga de demonstração continuou com 0 de 58 ramos cobertos.

A Etapa 3 consolidou a regressão dos fluxos existentes e confirmou a lacuna de autorização assistencial. A implementação das mudanças de produto e arquitetura depende de aprovação específica. Frontend, simulador e E2E ficaram fora da execução.

## Validação final da demonstração

### Escopo e método

| Camada | Cenários essenciais |
|---|---|
| Frontend React | Login rejeitado, seleção de perfil incompatível, redirecionamento de rota de outro perfil, snapshot inicial, atualização STOMP e alerta crítico após cruzar o limite. A suíte Playwright usa Edge e respostas HTTP/STOMP controladas. |
| Simulador Laravel | Presença dos seis sinais, diferenças entre os cinco cenários, rejeição de cenário inválido, contrato HTTP do lote e propagação de recusa do Java. O cliente HTTP falso bloqueia saídas de rede durante esses casos. |
| Integração da demonstração | Login de enfermagem com token real, paciente e internação sintéticos, Laravel gerando e enviando um lote, API Java aceitando e publicando no broker e painel React exibindo a frequência cardíaca correspondente. A execução usa um banco descartável e serviços em loopback. |
| Compilação e regressão | Checagem TypeScript, build Vite, verificação de sintaxe PHP e regressão Maven do backend. |

As ferramentas adicionais são exclusivas de QA. O navegador usa Playwright 1.65.1 e Edge. O simulador foi verificado com PHP portátil 8.4.27, baixado do catálogo oficial e conferido por SHA-256, e as dependências Laravel já disponíveis no projeto. [Playwright e WebSocket](https://playwright.dev/docs/network) · [Distribuição oficial do PHP para Windows](https://windows.php.net/download/)

### Execuções e ajustes

| Verificação | Resultado |
|---|---|
| TypeScript e Vite | `npm run typecheck` e `npm run build` concluídos com código 0. |
| Playwright com HTTP e STOMP simulados | 3 aprovados, zero falhas ou ignorados. |
| Laravel isolado | 3 aprovados, zero falhas. A verificação de sintaxe aprovou os 11 arquivos PHP de aplicação, rotas e testes inspecionados. |
| Rotas e agendamento Laravel | `route:list` enumerou quatro rotas do simulador. `schedule:list` confirmou a tarefa de sinais vitais registrada a cada segundo. |
| Demonstração integrada | 1 cenário aprovado. O navegador autenticou enfermagem e exibiu a frequência cardíaca do lote real com seis sinais enviado pelo Laravel ao Java e entregue em STOMP. |
| Regressão Java | 62 aprovados, zero falhas, erros ou ignorados. JaCoCo confirmou 72,00% das linhas (558/775) e 47,40% dos ramos (164/346). O cenário opt-in de demonstração tem contagem separada. |

Durante a preparação, um seletor encontrou duas representações da mesma medição e o mock de limites não tinha o formato esperado. Os testes passaram a usar rótulos acessíveis e fixtures de limites completas. O teste isolado Laravel passou a verificar as requisições gravadas pelo cliente falso com asserções próprias, pois o ambiente não inclui PHPUnit. Esses ajustes ficaram nos testes. O código de produção permaneceu igual ao início da validação final.

Os comandos de reprodução e as opções de navegador e PHP estão no [guia de QA](qa/README.md). Os JSONs Playwright `smoke.json` e `demonstracao.json` estão em `frontend/test-results`. O cenário integrado também foi confirmado pelo Failsafe na execução isolada.

### Limitações

- **QA-SEC-001 permanece aberta.** O backend ainda autoriza a leitura do prontuário por um médico sem vínculo no ensaio separado. A demonstração fica restrita a dados sintéticos e ambiente isolado. [Ocorrência de segurança](qa/escopo-assistencial.md)
- O cenário integrado dispara um envio Laravel pontual. A tarefa do scheduler foi listada. A execução contínua e a descoberta automática de novas internações ainda precisam de ensaio de operação no ambiente da apresentação.

**Conclusão da validação final.** O fluxo essencial está pronto para uma demonstração acadêmica local com dados sintéticos. A evidência cobre um lote real ponta a ponta e o comportamento crítico da interface com fixtures controladas. Para demonstrar atualização contínua, repetir a conferência do scheduler na máquina da apresentação. [Conferência de apresentação](qa/README.md#conferência-antes-da-apresentação)

## Última rodada de QA do frontend

### Método

O Microsoft Edge foi executado pelo Playwright em uma aplicação Vite local em loopback. As respostas HTTP e STOMP foram interceptadas com dados sintéticos. O backend e o simulador ficaram fora desta rodada. Cada perfil fez login, navegou pelo menu, abriu todas as abas em desktop e fez logout. O teste verificou a remoção da sessão. Em tablet e celular, foram verificadas as telas amostradas, o menu e a mensagem diante de conexão recusada.

| Perfil | Telas abertas em desktop | Interações verificadas e amostras responsivas |
|---|---|---|
| Recepcionista | Central, Cadastro de Paciente, Consulta, Mapa de Leitos, Internação, Cadastro de Leito, Agendamento, Ficha e Atividades. | Cadastro bloqueado com campos vazios, conflito simulado e nova tentativa bem-sucedida. Busca pelo nome, confirmação da internação e consulta ao mapa. Central no tablet e Cadastro de Paciente no celular. |
| Médico | Visão Geral, Pacientes, Monitoramento, Alertas, Prescrições, Exames, Agenda Médica, Internações e Atividades. | Abertura do paciente, registro de evolução e leitura crítica de 152 bpm com sinal sintético. Visão Geral no tablet e Pacientes no celular. |
| Enfermeira | Pacientes Internados, Monitoramento, Alertas, Prescrições, Administração, Evolução Clínica e Atividades. | Leitura crítica, envio de evolução e reconhecimento de alerta persistido simulado. Internados no tablet e Monitoramento no celular. |
| Administrador | Equipe e acessos e Registro de Atividades. | Listagem e edição de funcionário, confirmação da atualização com senha mantida. Equipe no tablet e Atividades no celular. |

Os testes anteriores de login inválido, perfil incompatível, redirecionamento e atualização do snapshot por STOMP foram mantidos. Abertura de tela valida navegação e renderização. Criação de leito, alta, agendamento, impressão de ficha, emissão de prescrição, solicitação e resultado de exame, confirmação de dose e criação ou exclusão de funcionário ficaram fora do envio automatizado nesta rodada. Os fluxos de alta, prescrição, exames e confirmação de dose foram consultados em código para delimitar esse escopo.

### Revisão visual e correção

As capturas foram revistas nas dimensões 1440 × 900, 820 × 1180 e 390 × 844. A verificação de largura foi aplicada nas amostras capturadas. Em celular, o conteúdo longo continuou disponível por rolagem. O aviso de alerta crítico apareceu sobre a parte inferior da tela, como elemento transitório dispensável. O teste registrou erros JavaScript de página e erros de console nos fluxos de desktop, com tolerância apenas para o conflito HTTP deliberadamente simulado. O teste de rede provoca uma conexão recusada conhecida.

**Defeito confirmado e corrigido.** Uma requisição de login mantida sem resposta deixava o formulário em carregamento e sem mensagem. O cliente HTTP agora aplica um limite de 12 segundos à requisição e à leitura do corpo e reutiliza a mensagem de conexão já exibida pelos painéis. O teste reproduziu a falha antes do ajuste e verifica a mensagem e a reativação do botão no reteste. A aplicação não repete requisições automaticamente. Em caso de timeout durante gravação, confira o estado exibido antes de tentar novamente.

**Aviso de desconexão desatualizado.** Na captura anterior à correção, o monitor exibia uma leitura ativa e, ao mesmo tempo, mantinha a notificação transitória «Dispositivo sem comunicação». A fila ainda continha o aviso disparado antes de a leitura chegar. A renderização agora retira esse aviso quando o evento de desconexão deixa de estar ativo. As notificações clínicas, o reconhecimento de alertas e o cálculo de criticidade mantêm suas regras.

Na primeira rodada de falha de rede, a fixture da página de Atividades do administrador recusava a consulta de funcionários, enquanto a aba em exibição usa a consulta de atividades. O ensaio passou a recusar a consulta da aba em uso e a conferir a mensagem também em Equipe e acessos.

### Resultado final e roteiro recomendado

| Comando no frontend | Resultado |
|---|---|
| `npm run typecheck` | Aprovado. |
| `npm run build` | Aprovado, com geração de `dist`. |
| `npm run test:smoke` | 12 aprovados, 0 reprovados, 0 instáveis e 0 ignorados. |

O JSON final está em `frontend/test-results/smoke.json`. As capturas individuais estão em `frontend/test-results/smoke/` e o mosaico revisto dos quatro perfis em `frontend/test-results/paineis-visual.png`. Nas amostras finais, a navegação compacta, os títulos e os componentes principais estavam visíveis. Não houve overflow horizontal acima da tolerância de dois pixels nem erros JavaScript inesperados nos cenários verificados. A captura crítica final apresenta leitura conectada e somente o aviso de frequência fora do limite.

**Prontos para a demonstração:** login e logout dos quatro perfis, central da recepção, cadastro e consulta de paciente, internação e mapa de leitos, visão geral e pacientes do médico, monitoramento e alertas clínicos, internados e evolução da enfermagem, equipe e edição de funcionário e abertura do registro de atividades.

**Exigem atenção:** use como telas de consulta as abas em que apenas a abertura foi validada. Deixe para fora do roteiro principal a impressão de ficha, a alta, a gravação de agendamento, de prescrição e de resultados de exame, a confirmação de dose e a exclusão de funcionário, até ensaiar essas ações. A responsividade foi amostrada no Edge por viewport e não em aparelhos físicos. Esta rodada simulou o backend e o STOMP. A prova real da rodada anterior continua separada, assim como a limitação de segurança conhecida QA-SEC-001.

## Consolidação da entrega acadêmica

| Suíte ou ensaio | Casos únicos | Aprovados | Reprovados |
|---|---:|---:|---:|
| Backend, regressão padrão | 62 | 62 | 0 |
| Frontend, Playwright com serviços simulados | 12 | 12 | 0 |
| Simulador Laravel, geração e envio | 3 | 3 | 0 |
| Demonstração integrada, Laravel → Java → STOMP → React | 1 | 1 | 0 |
| QA-SEC-001, ensaio assistencial isolado | 1 | 0 | 1 |
| **Total** | **79** | **78** | **1** |

O total usa a regressão mais abrangente de cada componente. A linha de base, os retestes direcionados e as rodadas anteriores estão incluídos nas respectivas suítes. As 14 linhas parametrizadas da matriz de permissões e os demais casos parametrizados contam pelas entradas distintas. O cenário integrado conta uma vez, embora apareça nos relatórios Playwright e Failsafe. Typecheck, build, análise estática, lint PHP e a revisão de capturas são verificações adicionais, fora da contagem.

**QA-SEC-001 continua pendente de segurança.** O ensaio mantém a expectativa de recusa e a reprovação observada na consulta por médico sem vínculo. A entrega acadêmica se limita a dados sintéticos e ambiente isolado. [Ocorrência](qa/escopo-assistencial.md) · [Comandos e evidências](qa/resultados.md)
