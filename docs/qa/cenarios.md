# Matriz de cenários P0

| ID | Fonte | Cenário e expectativa | Teste |
|---|---|---|---|
| BASE-01 | Configuração Spring e Flyway | Contexto inicia com PostgreSQL descartável. | `HospitalApiApplicationTests.contextLoads` |
| LIM-01 | README da API, limites | Padrão aceito. Faixas inválidas e cada limite crítico igual ou interno à faixa de alerta são rejeitados. | `LimitesSinaisVitaisRequestTest` |
| VIT-01 | US09 CA01–CA03, ingestão STOMP | Os seis sinais têm unidades, horário, paciente e leito corretos e são publicados no tópico. | `SinalVitalServiceTest.publicaOsSeisSinaisComUnidadesELeitoDaInternacao` |
| VIT-02 | README da API, ingestão | Lote com valor negativo preserva o snapshot anterior e não publica medidas. Paciente sem internação ativa também é rejeitado. | `SinalVitalServiceTest`, dois casos de rejeição |
| VIT-03 | US09 CA02, snapshot atual | Lote atrasado não regride a última medida daquele tipo. Leituras de outro tipo e outro paciente permanecem independentes. | `SinalVitalServiceTest.preservaUltimaMedidaPorTipoEPacienteQuandoChegaUmLoteAtrasado` |
| VIT-04 | README da API, ingestão e erros | REST aceita lote autenticado, devolve o leito da internação e fornece o último valor. Chave inválida, lote vazio, tipo ou valor inválido e ausência de internação são rejeitados. | `BackendP0IT`, três casos de ingestão |
| AUT-01 | US31 CA01–CA05, bootstrap, erros da API e RFC 9110 §15.5.2 | Setup cria o primeiro administrador uma vez. Login diferencia credenciais válidas e inválidas. Em recurso protegido, token ausente, inválido ou expirado retorna HTTP 401, desafio Bearer e corpo ProblemDetail. | `BackendP0IT`, quatro casos de autenticação |
| LIM-02 | US09 CA05, US32 CA06 e README da API, limites | Administrador muda padrão. Médico personaliza com autoria. Enfermagem consulta e restaura padrão. Recepção recebe 403. Respostas públicas de autenticação e cadastro não contêm senha. | `BackendP0IT.aplicaPermissoesEPersistePersonalizacaoComAuditoriaERestauracao` |

## Etapa 2

| ID | Fonte | Cenário e expectativa | Teste |
|---|---|---|---|
| WS-01 | README da API, conexão STOMP | Conectar com JWT válido e rejeitar CONNECT sem JWT ou com JWT inválido. | `WebSocketStompIT` |
| WS-02 | README da API, tópicos STOMP | Rejeitar destinos fora do contrato e comandos de publicação de clientes. | `WebSocketStompIT` |
| WS-03 | US09 CA01–CA03, ingestão STOMP | Entregar o payload e o tópico corretos em dois sockets inscritos em pacientes diferentes. | `WebSocketStompIT.entregaApenasSinaisDoPacienteInscrito` |
| WS-04 | README da API, snapshot e STOMP | Remover a inscrição ao desconectar. Recuperar o último valor por REST e receber novas medições após reconectar e reinscrever. | `WebSocketStompIT.desconexaoRemoveInscricaoEReconexaoExigeNovaInscricaoSemReplay` |
| INT-01 | US14 CA03–CA06, US28 CA02–CA06 | Ocupar leito, preservar o histórico após alta, liberar leito e rejeitar alta repetida, inclusive após nova internação no mesmo leito. | `InternacaoLeitoIT` |
| INT-02 | US14 CA04, US28 CA06 e índices de internação ativa | Manter um registro vencedor em disputas por leito ou paciente. Permitir uma única alta concorrente e preservar estado dos leitos. | `InternacaoLeitoIT`, três cenários concorrentes |
| INT-03 | US14 CA03–CA04, contrato de erros da API | Rejeitar leito em manutenção, JSON inválido, referência inexistente, datas inconsistentes, duplicidade de leito e exclusão com referência. Responder com ProblemDetail. | `InternacaoLeitoIT` |
| INT-04 | CRUD de internações e integridade do vínculo | Transferir ocupação e ingestão para o novo leito. Na exclusão, liberar apenas o leito da internação removida. Reverter alta inválida sem liberar leito. | `InternacaoLeitoIT`, dois cenários de transição |

## Etapa 3

| ID | Fonte | Cenário e expectativa | Teste |
|---|---|---|---|
| CLI-01 | US05, US15 e US21, contrato REST | Criar, atualizar e consultar atendimento e prontuário, validar vínculos e entradas, negar acesso sem permissão e rejeitar a versão duplicada de ficha. | `FluxosClinicosIT` |
| CLI-02 | US04, US22 e US30 | Gravar prescrição, item e administração para o mesmo paciente, consultar com perfis autorizados, registrar doses em momentos distintos e rejeitar associações cruzadas. | `FluxosClinicosIT` |
| ALT-01 | US12 e CRUD de alertas | Criar, consultar, desativar, reencontrar alerta inativo no histórico e excluir, considerando permissões e conflitos com os critérios de reconhecimento. | `FluxosClinicosIT` |
| EXA-01 | US10, US17 e US33 | Persistir exames e ECG numérico associados ao atendimento, aplicar validações e permissões, impedir vínculos cruzados e consultar liberação do laudo no CRUD de resultados. | `FluxosClinicosIT` |
| AUT-02 | US31, US32 e matriz do README da API | Verificar a decisão de leitura e escrita para os quatro papéis e a resposta HTTP dos recursos representativos. | `ApiAuthorizationTest` e `AuditoriaPermissoesIT` |
| AUD-01 | README da API, registro de atividades | Determinar autoria pelo token, validar campos, limitar consulta ao autor ou administrador e preservar nome e perfil após remoção da conta. | `AuditoriaPermissoesIT` |
| AUT-03 | US05 CA05 e US06 | Impedir que um médico sem vínculo consulte prontuário de outro profissional. Ensaio isolado até definição da política por paciente. [QA-SEC-001](escopo-assistencial.md) | `EscopoAssistencialProbe` |

## Validação da demonstração

| ID | Fonte | Cenário | Teste |
|---|---|---|---|
| DEM-01 | US31 e contrato de login | Recusar senha inválida e perfil incompatível. Redirecionar uma rota não autorizada ao painel do usuário. | `frontend/tests/smoke.spec.ts` |
| DEM-02 | US09 e US11 | Mostrar snapshot inicial, receber sinal novo no tópico do paciente e classificar a leitura crítica com os limites do contrato. | `frontend/tests/smoke.spec.ts` |
| DEM-03 | README do simulador | Gerar seis sinais, distinguir cenários, rejeitar cenário inválido e conferir o contrato HTTP e a propagação da recusa do Java. | `simulador-laravel/tests/smoke.php` |
| DEM-04 | README da API, ingestão e STOMP | Autenticar enfermagem, enviar um lote do Laravel para internação ativa e mostrar a leitura real em React. | `DemonstracaoProbe` e `frontend/tests/demonstracao.spec.ts` |
