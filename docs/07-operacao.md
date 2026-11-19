# Operação e manutenção

[← Índice](README.md) · [Próximo: referências →](08-referencias.md)

## Verificação de ambiente

```bash
docker compose ps
curl --fail http://localhost:8080/actuator/health
curl http://127.0.0.1:8000/api/simulacao/status
```

Depois, autentique na interface, confirme o perfil e abra uma lista de pacientes. Para verificar o fluxo completo, mantenha uma internação ativa, ligue o scheduler e confira se `lastCycleAt` avança e `lastSentCount` é maior que zero. No navegador, confira a conexão WebSocket e as mensagens recebidas.

## Diagnóstico de problemas

| Sintoma | O que conferir |
| --- | --- |
| A API não inicia | Java 21, acesso ao banco, credenciais exportadas e logs Flyway |
| Falha na chave JWT | Base64 com pelo menos 32 bytes; fora do perfil local a variável é obrigatória |
| Interface não alcança a API | `VITE_API_BASE_URL`, backend na porta 8080 e origens CORS |
| HTTP funciona e tempo real falha | `VITE_WS_URL`, origem permitida no WebSocket, token do CONNECT e tópico |
| Porta 8443 ocupada | Vite usa `strictPort`; libere a porta ou ajuste `PORT` e as origens |
| Login recusado | Usuário criado, e-mail, senha e perfil correspondente |
| Setup retorna conflito | Já existe um administrador; utilize o acesso existente |
| Uma ação retorna 403 | Permissões efetivas do controller e de `ApiAuthorization` |
| Ingestão retorna 403 | `MONITOR_API_KEY` idêntica e não vazia nos dois serviços |
| Ingestão não encontra internação | `pacienteId` válido e internação com `dataAlta` nula |
| Simulação ligada sem medições | Scheduler em execução, `activePatients`, `lastError` e credenciais Java |
| Auto start não produz efeito | Estado anterior em `simulation-state.json` pode estar prevalecendo |
| Snapshot vazio após reinício | Os sinais atuais são mantidos somente na memória da API |
| Migração com checksum divergente | Confira se uma migração já aplicada foi editada |
| Novo cadastro viola integridade | Verifique identificadores, duplicidades e chaves estrangeiras |

## Comandos de verificação disponíveis

Na interface:

```bash
cd frontend
npm ci
npm run typecheck
npm run build
```

Na API:

```bash
cd backend/hospital-api
sh ./mvnw clean verify
```

A verificação padrão utiliza H2 em memória para o contexto Spring e não exige o PostgreSQL local. O perfil Maven `skip-integration-tests-without-qa` ignora os testes `*IT` quando `HOSPITAL_QA_RUN` não está configurado. Surefire, Failsafe e JaCoCo organizam os resultados e a cobertura. Para executar as integrações completas com PostgreSQL 17 descartável, siga o [guia de QA](qa/README.md) e o script PowerShell existente; não aponte as variáveis isoladas de QA para um banco de uso cotidiano.

As suítes cobrem autorização, vínculos clínicos, internação/leito, WebSocket e auditoria. O ensaio de escopo assistencial possui uma limitação conhecida e fica separado da regressão padrão. Consulte [QA-SEC-001](qa/escopo-assistencial.md) para o diagnóstico e as decisões pendentes.

Na interface, os testes Playwright usam Edge por padrão e iniciam o Vite em `127.0.0.1:18543`. Para Chrome instalado, ajuste `HOSPITAL_QA_BROWSER=chrome`.

```bash
npm run test:smoke
```

No simulador:

```bash
cd simulador-laravel
php artisan route:list
```

Também é possível validar sintaxe de arquivos PHP com `php -l caminho/do/arquivo.php`. O simulador possui um smoke test próprio. Da raiz, execute `php simulador-laravel/tests/smoke.php` com as dependências Laravel disponíveis. O teste verifica geração de cenários, contrato de envio e propagação de rejeição HTTP com requisições simuladas. A demonstração integrada pontual é descrita no guia de QA.

**Validação desta documentação:** foram conferidos manifestos, configurações, rotas, DTOs, migrações e os fluxos descritos no código. A aplicação não foi iniciada nesta revisão; build, testes e integração não foram executados. Os exemplos são orientações de execução e precisam ser usados com dados locais válidos.

## Dados e continuidade

O Compose mantém o banco no volume `hospital-postgres-data`. Parar o serviço não apaga o volume. `docker compose down -v` remove os volumes e elimina os dados locais: não utilize esse comando como solução genérica para problemas de inicialização.

Faça backup do PostgreSQL antes de mudanças com impacto em dados e teste a restauração em ambiente separado. Preserve também a configuração do ambiente e o segredo JWT quando a continuidade de tokens for necessária. O snapshot de sinais em memória não faz parte de um backup do banco.

## Limites técnicos atuais

| Aspecto | Consequência |
| --- | --- |
| Sinais em memória e broker no processo | Reinícios perdem valores; múltiplas instâncias não compartilham esse estado automaticamente |
| Listagens genéricas sem paginação | Crescimento do banco aumenta o volume transferido e processado |
| Histórico mantido no React | O gráfico não oferece consulta retrospectiva durável |
| Autorização por papel, sem escopo assistencial completo | A ausência de vínculo individual também afeta recursos clínicos; consulte [QA-SEC-001](qa/escopo-assistencial.md) |
| Atividades registradas por chamada específica | O registro não garante auditoria automática de toda alteração no banco |
| Configuração de logs detalhada | Avalie níveis de log antes de operar fora do ambiente local |
| Servidor de controle do simulador sem autenticação nas rotas | Mantenha-o restrito ao ambiente de desenvolvimento |

## Evolução e publicação

Para mudanças na API, revise DTOs, cliente TypeScript e permissões em conjunto. Para novas medidas, atualize enum, gerador, sender, renderização e contrato. Para novas tabelas ou colunas, adicione migração Flyway.

Para hospedar a interface, gere `frontend/dist` com `npm run build` e configure o servidor para devolver `index.html` nas rotas da aplicação. As variáveis `VITE_*` entram no build; ajuste-as antes de compilar. HTTPS na interface exige uma configuração de transporte compatível, inclusive `wss://` no WebSocket.

Esta seção descreve pontos de preparação. O repositório analisado contém Compose para o banco e um script de desenvolvimento; eles não constituem, por si só, um procedimento completo de implantação em produção.
