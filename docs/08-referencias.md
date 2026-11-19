# Referências e critérios da análise

[← Índice](README.md)

## Base documental

- Repositório: [lucasfernandohass/hospital_inteligente](https://github.com/lucasfernandohass/hospital_inteligente).
- Branch consultada: `main`.
- Commit usado para obter os fontes: [`89d8375aca013926e896e97ad51e675ee14ce84b`](https://github.com/lucasfernandohass/hospital_inteligente/tree/89d8375aca013926e896e97ad51e675ee14ce84b).
- Data da revisão: 19 de novembro de 2026.

A documentação descreve essa versão. Alterações posteriores precisam ser confrontadas com o código antes de atualizar os capítulos.

## Fontes principais por assunto

Os caminhos abaixo são relativos à raiz do repositório.

| Assunto | Fontes |
| --- | --- |
| Dependências | `backend/hospital-api/pom.xml`, `frontend/package.json`, `simulador-laravel/composer.json` |
| Execução | `dev.sh`, `docker-compose.yml`, `.env.example`, `frontend/vite.config.ts` |
| Configuração Java | `backend/hospital-api/src/main/resources/application.properties` |
| Rotas HTTP | `backend/hospital-api/src/main/java/br/com/unicesumar/hospital_api/controllers/` |
| DTOs | `backend/hospital-api/src/main/java/br/com/unicesumar/hospital_api/dtos/` |
| Autorização | `config/SecurityConfig.java`, `security/ApiAuthorization.java`, anotações dos controllers, dentro do pacote Java |
| JWT e STOMP | `security/JwtUtil.java`, `security/JwtStompChannelInterceptor.java`, `config/WebSocketConfig.java`, dentro do pacote Java |
| Ingestão | `services/SinalVitalService.java` e `controllers/SinalVitalController.java`, dentro do pacote Java |
| Persistência | `backend/hospital-api/src/main/resources/db/V1__schema_inicial.sql` até V5 e entidades Java |
| Interface | `frontend/App.tsx`, `frontend/services/api.ts`, painéis e stores em `frontend/components/` |
| Histórico e alertas | `frontend/hooks/useVitalFeed.ts`, `frontend/components/VitalMonitoring.tsx`, `frontend/components/MonitoringAlertsPanel.tsx` |
| Simulação | `simulador-laravel/routes/`, `config/simulator.php`, `app/Services/` e controller de simulação |

Os README anteriores foram usados como contexto. Nos pontos em que comandos, portas ou permissões precisavam ser confirmados, a referência foi a implementação e sua configuração.

## Materiais já existentes em docs

| Caminho | Material |
| --- | --- |
| `docs/Diagramas/Diagrama DER/` | Imagem de diagrama entidade-relacionamento |
| `docs/Diagramas/Diagrama de Caso de Uso/` | Imagem de caso de uso geral |
| `docs/Diagramas/Diagramas de Classe/` | Diagramas de classes do domínio |
| `docs/Identidade_visual/` | Imagens de logo, paleta e tipografia |
| `docs/qa/` | Guias, cenários, resultados e script de execução isolada |
| `docs/RELATORIO_TESTES.md` | Relatório geral de testes |
| `docs/Link Prototipo.txt` | Referência textual ao protótipo |
| `docs/Sprint 0 - Entrega 2 - Documento de Visão - Hospital Inteligente.docx.pdf` | Documento de visão |
| `docs/Sprint 1 - Entrega 1 - Personas e Histórias de Usuário - Hospital Inteligente.docx.pdf` | Personas e histórias |
| `docs/SPRINT 4 - RETROSPECTIVA E REPLANEJAMENTO.docx.pdf` | Retrospectiva e replanejamento |

Esses materiais foram identificados na árvore do repositório e devem ser preservados. Os PDFs e as imagens não foram usados para afirmar requisitos ou comportamentos nesta revisão; seu conteúdo não foi inspecionado integralmente. Os diagramas Mermaid desta documentação representam os relacionamentos e fluxos identificados no código.

## Cobertura e limitações da revisão

A análise cobriu as camadas próprias da API, da interface e do simulador, além das migrações e configurações relevantes. Dependências vendorizadas, artefatos de build e caches não foram tratados como funcionalidades do projeto.

Os procedimentos de instalação pressupõem um clone completo do repositório, com os arquivos de lock, Maven Wrapper e recursos estáticos. As dependências precisam estar instaladas no ambiente em que os comandos serão executados.

Esta atualização é documental e não modifica o código funcional. A revisão confere coerência com o código, navegação entre capítulos e exemplos estáticos. Os resultados de execução previamente registrados pela equipe estão no [relatório de testes](RELATORIO_TESTES.md) e no [registro de QA](qa/resultados.md); não devem ser confundidos com novas execuções realizadas nesta revisão.

## Como manter esta documentação

1. Registre o commit da nova revisão.
2. Confira versões, portas e variáveis nos arquivos de configuração.
3. Atualize rotas e permissões ao modificar controllers ou `ApiAuthorization`.
4. Revise relacionamentos ao adicionar migrações.
5. Atualize contratos, limites e exemplos quando mudar o monitoramento.
6. Registre quais verificações foram realmente executadas e seus resultados.

## Glossário

| Termo | Significado no projeto |
| --- | --- |
| DTO | Objeto que define os dados de entrada ou saída de uma operação |
| JWT | Token assinado utilizado na autenticação |
| STOMP | Protocolo de mensagens usado sobre WebSocket |
| Snapshot | Últimos valores disponíveis por tipo de sinal |
| Ingestão | Recebimento de medições enviadas pelo monitor ou simulador |
| Migração | Alteração versionada do esquema do banco |
| Internação ativa | Internação cuja data de alta está nula |
| Limite personalizado | Configuração própria de um paciente, que substitui o padrão efetivo |
