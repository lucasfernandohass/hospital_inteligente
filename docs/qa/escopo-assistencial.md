# QA-SEC-001 — Autorização por vínculo assistencial

**Estado** — Limitação de segurança conhecida, confirmada e pendente. A política completa foi adiada e a demonstração acadêmica usa exclusivamente dados sintéticos. Análise na branch `testes/qualidade-hospital-inteligente`.

## Requisitos e vínculos disponíveis

| Fonte | Regra documentada | Limite da regra |
|---|---|---|
| Sprint 4, US05 CA05 e US06 CA01/CA04 | O médico consulta histórico de pacientes autorizados e vê a lista de pacientes atualmente vinculados. | O documento deixa em aberto quem concede, transfere ou encerra acesso e quando o histórico deve continuar disponível. |
| US08 CA01/CA05, US14 e US28 | A recepção pesquisa por nome ou CPF, consulta cadastro e histórico de atendimento e gerencia internação e alta. | O histórico operacional precisa de projeção aprovada. A história não especifica acesso a anamnese, diagnósticos, laudos ou sinais. |
| US09 CA05, US11 CA01, US22 CA04, US30 CA01 e US34 CA01 | Sinais ficam restritos a profissionais autorizados. Enfermagem acompanha, recebe alertas e consulta prescrições dos pacientes sob sua responsabilidade. | A equipe, o plantão e a vigência dessa responsabilidade não foram definidos na implementação. |
| US21 CA03/CA05, US24, US31 CA04 e US32 | Atendimentos e evolução registram o profissional, a consulta posterior é restrita a autorizados e a administração gerencia usuários. | O README atribui todos os recursos ao administrador. A história de gestão de contas não define acesso clínico irrestrito ou uso emergencial. |

Fontes locais [Visão do projeto](../Sprint%200%20-%20Entrega%202%20-%20Documento%20de%20Vis%C3%A3o%20-%20Hospital%20Inteligente.docx.pdf), [histórias e critérios da Sprint 4](../SPRINT%204%20-%20RETROSPECTIVA%20E%20REPLANEJAMENTO.docx.pdf) e [contrato da API](../../backend/README.md).

- **Atendimento** associa paciente, funcionário e médico responsável. **Internação** associa paciente e leito, aceita médico opcional e é ativa enquanto `dataAlta` estiver ausente. **Agendamento** associa paciente e médico. São candidatos a vínculo com duração e finalidade próprias. Autoria anterior de um registro não estabelece por si só vínculo atual.
- **Prontuário** é representado pelo conjunto de registros clínicos ligados ao atendimento e ao médico. O paciente é resolvido pelo atendimento. Prescrição liga paciente, médico e atendimento. Itens e administrações dependem da prescrição. Solicitações de exame e ECG ligam paciente e atendimento. Resultados têm recurso próprio e não referenciam a solicitação, portanto falta origem confiável de escopo para eles.
- **Enfermagem** tem um setor no cadastro e os leitos podem ter setor. Não há, no modelo inspecionado, vínculo assistencial individual, escala ou regra que converta coincidência textual de setor em permissão. O funcionário responsável por um atendimento identifica sua participação naquele registro. Esse campo sozinho não define acesso ao prontuário inteiro.

## Evidência e alcance

O ensaio `EscopoAssistencialProbe` usa dois médicos autenticados e um prontuário sintético com vínculo somente ao responsável. O responsável recebe HTTP 200. O segundo médico também recebeu 200 na Etapa 3 e no reteste de 18/11/2026, enquanto o teste esperava recusa. O reteste executou um caso, com uma reprovação e zero erros de execução. US05 CA05 e US06 sustentam a recusa por falta de vínculo com o paciente. A autoria do prontuário, por si só, não é o critério de acesso proposto. A escolha entre 403 e 404 pertence ao contrato da API e o ensaio aceita ambos.

A chamada a `RegistroClinicoController` exige papel elegível. `AbstractDomainController` chama `ApiAuthorization` com autenticação e nome do recurso. A regra não recebe paciente, atendimento ou registro. `AbstractDomainService` lê por `findById` ou lista com `findAll`. `RegistroClinicoRepository` já resolve registros por paciente via atendimento, mas a consulta genérica não usa essa relação para autorização. O painel médico aplica filtros depois de receber as coleções.

Código inspecionado [Controller de prontuário](../../backend/hospital-api/src/main/java/br/com/unicesumar/hospital_api/controllers/RegistroClinicoController.java) · [Controller genérico](../../backend/hospital-api/src/main/java/br/com/unicesumar/hospital_api/controllers/AbstractDomainController.java) · [Política de papéis](../../backend/hospital-api/src/main/java/br/com/unicesumar/hospital_api/security/ApiAuthorization.java) · [Serviço genérico](../../backend/hospital-api/src/main/java/br/com/unicesumar/hospital_api/services/AbstractDomainService.java) · [Repositório de prontuário](../../backend/hospital-api/src/main/java/br/com/unicesumar/hospital_api/repositories/RegistroClinicoRepository.java).

| Alcance | Recursos | Estado da evidência |
|---|---|---|
| Prontuário | `/api/registros-clinicos` | Consulta individual por médico sem vínculo comprovada. Listagem e mutações compartilham a ausência de filtro por vínculo, respeitadas as permissões de papel. Leitura por enfermagem também é permitida pelo código e usada pelo painel, embora a tabela do README indique médico. |
| Identidade e fluxo hospitalar | `/api/pacientes`, `/api/atendimentos`, `/api/internacoes`, `/api/fichas-atendimento`, `/api/agendamentos` | Inspeção estática encontrou decisão por papel em consultas e mutações. A recepção tem acessos operacionais documentados. A classificação de acesso indevido depende do conteúdo retornado e da política aprovada para cada operação. |
| Medicação, alertas e diagnóstico | `/api/prescricoes`, `/api/itens-prescricao`, `/api/administracoes-medicamento`, `/api/alertas`, `/api/exames-imagem`, `/api/exames-laboratoriais`, `/api/ecgs`, `/api/resultados-exame` | Ausência de filtro assistencial identificada estaticamente; permissões efetivas dependem também das anotações dos controllers. A recepção consulta exames no painel. Resultados carecem de relacionamento próprio para aplicar filtro por paciente. |
| Monitoramento | Snapshot e limites em `/api/pacientes/{pacienteId}/...` e inscrição STOMP no tópico de sinais do paciente | Caminhos independentes inspecionados estaticamente. O snapshot e o interceptor verificam permissão de leitura do recurso paciente. Limites personalizados usam papel clínico ou administrativo. Os pontos inspecionados não resolvem vínculo. A chave de ingestão pertence ao fluxo de dispositivo e precisa de regra própria. |
| Administração e auditoria | `/api/funcionarios`, `/api/atividades`, carga de demonstração | Funcionários e carga ficam com administração. Atividades usam o principal, filtram registros próprios e permitem consulta global ao administrador. São políticas distintas do acesso ao prontuário. Rever se o conteúdo livre dos registros pode devolver informação clínica fora de escopo. |

As conclusões sobre outros perfis, listas, mutações e canais são de inspeção estática. Devem ser verificadas por testes específicos antes de declarar a correção efetiva. Priorizar listas sem filtro, recursos derivados, mudanças de associação em PUT, autoatribuição em operações de cadastro e continuidade de inscrições WebSocket após perda do vínculo.

## Matriz proposta para aprovação

As permissões abaixo combinam **função** e **vínculo válido**. Uma associação autorizada de origem prevalece sobre campos de identidade enviados no corpo da requisição.

| Recurso | ADMINISTRADOR | MÉDICO | ENFERMEIRA | RECEPCIONISTA |
|---|---|---|---|---|
| Cadastro e informações operacionais, agenda, leito, internação, ficha | Gestão operacional autorizada | Consulta e operações clínicas para pacientes vinculados. Agenda própria e leitos operacionais conforme função. | Consulta da equipe responsável e registro de atividades de cuidado. | Cadastro e busca, agenda, internação, alta operacional e ficha. Histórico em projeção operacional aprovada. |
| Atendimento clínico e registro de prontuário | Acesso clínico excepcional, justificado e auditado, sujeito a aprovação da mudança do contrato atual | Ler histórico de pacientes vinculados e registrar ou corrigir conforme responsabilidade e autoria autorizadas | Ler informações necessárias ao cuidado da equipe responsável e registrar evolução de enfermagem | Histórico operacional. Acesso à evolução, anamnese e diagnóstico vedado pela proposta. |
| Prescrição, item e administração | Acesso excepcional conforme política clínica | Ler e prescrever para paciente vinculado. Ações de administração conforme função autorizada. | Ler prescrição vigente e registrar administração para paciente sob responsabilidade, com autoria do principal | Sem acesso clínico. |
| Alertas, sinais vitais, limites por paciente, exames, laudos e ECG | Política global de limites e acesso clínico excepcional, conforme aprovação | Ler pacientes vinculados e executar ações clínicas permitidas pelo recurso | Ler pacientes sob responsabilidade e reconhecer alertas ou operar limites conforme função aprovada | Somente metadados operacionais de exames, se aprovados para a agenda. Sem laudo ou sinais pela proposta. |
| Funcionários e auditoria | Gerenciar usuários e consultar auditoria conforme finalidade | Atividades próprias | Atividades próprias | Atividades próprias |

### Decisões pendentes

1. **Medicina:** aprovar médico da internação ativa e agendamento aceito como fontes de acesso, condições de início e fim, cobertura de plantão e duração da consulta histórica após alta, cancelamento ou transferência. Definir como o primeiro atendimento recebe responsável de forma confiável e quem pode mudar essa atribuição.
2. **Enfermagem:** aprovar atribuição explícita por equipe, setor ou plantão, autoridade que a concede e regras de revogação. A equivalência de textos de setor requer validação formal antes de ser usada como permissão.
3. **Recepção e administração:** confirmar campos do histórico e de exames que a recepção precisa, destino do acesso atual da enfermagem a registros clínicos e se o administrador mantém o amplo acesso atual. Decidir a existência e auditoria do acesso emergencial.
4. **Recursos especiais:** decidir o vínculo dos resultados, o acesso da conta do simulador às internações elegíveis e se a revogação no STOMP é imediata. Escolher HTTP 404 uniforme para objetos fora de escopo ou 403 explícito. A proposta recomenda 404 para recursos individuais fora do escopo.

## Menor correção segura proposta

1. Após aprovação, implementar a primeira entrega em registros clínicos e atendimentos. Manter a verificação de papel e resolver o vínculo usando o ID do principal e o paciente do atendimento no servidor. Usar predicados no repositório para lista e busca por ID. Para escrita, verificar origem e destino e impedir que atribuições não autorizadas criem acesso. Resolver a projeção operacional da recepção antes de restringir o payload de atendimento.
2. Alterar `RegistroClinicoController`, `RegistroClinicoService` e `RegistroClinicoRepository`, bem como os três arquivos equivalentes de atendimento. Reutilizar `AtendimentoRepository`, `InternacaoRepository` e `AgendamentoRepository` como fontes das atribuições aprovadas. Introduzir uma política de vínculo compartilhada ao lado de `ApiAuthorization` para consumo desses serviços. Evitar mudar o CRUD genérico antes de mapear todos os recursos consumidores. A primeira entrega contém a exposição confirmada no prontuário, mas o fechamento transversal depende da aplicação da política aos demais caminhos.
3. Expandir em entregas explícitas para prescrições, itens, administrações, fichas, exames, alertas e outros recursos derivados. Aplicar a mesma política no `SinalVitalController`, `LimitesSinaisVitaisController` e `JwtStompChannelInterceptor`. Verificar o que acontece com inscrições já abertas após revogação. Autorizar apenas no SUBSCRIBE deixa a sessão antiga ativa até o encerramento. Especificar mudanças de schema apenas para vínculos ausentes que a equipe aprovar.
4. Preservar o ensaio existente e toda a regressão. Adicionar pares positivo/negativo com dois pacientes e vínculos distintos, autorização por equipe, recepção operacional e administração conforme a decisão. Conferir exclusão de objetos da lista, acesso direto, filhos ligados ao paciente, zero alterações em mutação recusada, tentativa de trocar vínculo, alta e transferência. No monitoramento, comparar snapshot e STOMP antes e depois da revogação, além de testar reconexão e fluxo legítimo da ingestão isolada.

Até a aprovação, nenhuma alteração de produção ou de testes integra este diagnóstico.
