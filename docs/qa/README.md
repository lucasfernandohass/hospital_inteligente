# QA do backend

A Etapa 1 usa JDK 21, Maven 3.9 e os binários do PostgreSQL 17 no Windows. Execute na branch `testes/qualidade-hospital-inteligente`. O script inicializa um cluster novo em diretório temporário, usa uma porta efêmera no loopback e verifica a identidade da instância antes de o Spring executar o Flyway. O script encerra o processo que iniciou e preserva o diretório temporário para diagnóstico.

```powershell
$qa = @{
    Jdk21 = 'C:/caminho/para/jdk-21'
    PostgresBin = 'C:/Program Files/PostgreSQL/17/bin'
    MavenRepository = (Join-Path $env:LOCALAPPDATA 'hospital-qa-maven')
}
./docs/qa/run-backend.ps1 @qa -Suite baseline
./docs/qa/run-backend.ps1 @qa -Suite auth
./docs/qa/run-backend.ps1 @qa -Suite stage2
./docs/qa/run-backend.ps1 @qa -Suite stage3
./docs/qa/run-backend.ps1 @qa -Suite stage3-scope
./docs/qa/run-backend.ps1 @qa -Suite verify
```

`baseline` seleciona os três casos originais. `auth` seleciona os três casos de HTTP 401. `verify` roda Surefire e Failsafe e gera cobertura acumulada. Cada execução limpa apenas os artefatos Maven em `backend/hospital-api/target`. Use `-Offline` com cache completo. As suítes Spring recusam a inicialização sem a configuração de QA e o identificador do cluster descartável.

`stage2` seleciona as integrações WebSocket/STOMP e internação/leito. Essas classes iniciam a API em porta aleatória no loopback e usam o schema `transport` do mesmo cluster descartável, separado do schema da Etapa 1. Isso permite que requisições simultâneas façam commits reais sem interferir em testes de bootstrap da Etapa 1.

`stage3` executa a matriz unitária de permissões e as integrações clínicas e de auditoria no schema `transport`. `stage3-scope` executa isoladamente o requisito de escopo assistencial entre dois médicos. O cenário tem uma expectativa de recusa e permanece fora da regressão padrão enquanto o projeto não tiver uma política de autorização por vínculo.

O diagnóstico, a matriz proposta e as decisões pendentes do caso estão em [QA-SEC-001](escopo-assistencial.md).

## Validação da demonstração

Da pasta `frontend`, execute `npm ci`, `npm run typecheck`, `npm run build` e `npm run test:smoke`. O teste usa Edge por padrão. Com Google Chrome disponível, defina `HOSPITAL_QA_BROWSER=chrome`. O Playwright inicia o Vite em `127.0.0.1:18543` e encerra o processo ao final. A porta deve estar livre.

Na raiz, execute `php simulador-laravel/tests/smoke.php` com PHP e dependências Laravel disponíveis. Para a integração real, defina `HOSPITAL_QA_DEMO_PHP` com o caminho absoluto do executável PHP e rode `./docs/qa/run-backend.ps1 @qa -Suite demo -Offline`. O runner cria o banco, a conta, o leito e a internação sintéticos e aciona o navegador. O envio aciona o gerador e o cliente HTTP do Laravel uma vez. A regressão Maven padrão continua independente de PHP, Node e navegador.

Os relatórios Playwright ficam em `frontend/test-results/smoke.json` e `frontend/test-results/demonstracao.json`. Os artefatos são locais e ficam fora do versionamento.

### Conferência antes da apresentação

1. Inicie o banco isolado, o backend, o frontend e o scheduler do simulador na máquina da apresentação. Confira as origens HTTP e WebSocket e use a mesma chave sintética de monitor nos dois serviços.
2. Confirme uma internação ativa de paciente sintético. Entre com a conta de enfermagem e abra Monitoramento.
3. Aguarde dois ciclos de envio e confirme a atualização no mesmo paciente. Se o scheduler estiver indisponível, use o cenário integrado pontual de QA para demonstrar a comunicação já validada.
4. Evite exposição pública ou uso de dados reais enquanto a [QA-SEC-001](escopo-assistencial.md) estiver aberta.

Consulte a [matriz de cenários](cenarios.md) e o [registro de execução](resultados.md). Os relatórios locais ficam em `backend/hospital-api/target/surefire-reports`, `failsafe-reports` e `site/jacoco`, relativos ao mesmo `target`. Compartilhe resumos sanitizados. Os relatórios brutos podem conter propriedades do ambiente.
