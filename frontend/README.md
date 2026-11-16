# inteliHosp

Frontend hospitalar em React, TypeScript, Vite e Tailwind CSS v4.

## Requisitos

- Node.js 20.19+ ou 22.12+
- npm

## Instalar e executar

```bash
npm install
npm run dev
```

O Vite inicia na porta `8443` por padrão. Para gerar e validar a versão de produção:

```bash
npm run typecheck
npm run build
npm run preview
```

## Conexão com a API

O frontend usa `http://localhost:8080` por padrão. Para apontar para outra instância, crie `frontend/.env.local` com:

```env
VITE_API_BASE_URL=http://localhost:8080
```

O backend deve permitir a origem usada pelo navegador em `CORS_ALLOWED_ORIGINS` e `WEBSOCKET_ALLOWED_ORIGINS`.
O login autentica em `POST /api/auth/login`; o painel exibido é escolhido pela role retornada pela API. A seleção de perfil no formulário serve para confirmar que o usuário está entrando no perfil esperado.
O WebSocket STOMP usa `ws://localhost:8080/ws` por padrão. Para outro endereço, configure `VITE_WS_URL` em `frontend/.env.local`, por exemplo `VITE_WS_URL=ws://localhost:8080/ws`.

## Rotas dos painéis

- `/login`
- `/painel/administrador/equipe`
- `/painel/medico/overview` (e abas como `atendimento`, `monitoramento`, `prescricao`, `exames`, `agenda` e `internacao`)
- `/painel/enfermagem/internados` (e abas `monitoramento`, `prescricao`, `administracao`, `evolucao` e `alertas`)
- `/painel/recepcao/recepcao` (e abas do painel de recepção)

As rotas são protegidas conforme a role autenticada; uma URL de outro perfil redireciona para o painel autorizado.

O primeiro administrador deve ser criado uma única vez por `POST /api/auth/setup` (documentado no README do backend). Depois, ele pode entrar selecionando **Administrador** e gerenciar contas de médicos, enfermeiros e recepcionistas no painel administrativo.

## Estrutura

- `main.tsx`, `App.tsx` e `index.css`: inicialização, navegação entre perfis e estilos globais.
- `components/LoginPage.tsx`: seleção de perfil e entrada na interface.
- `components/RecepcionistaDashboard.tsx`: operações de recepção.
- `components/DoutorDashboard.tsx`: operações médicas.
- `components/EnfermeiraDashboard.tsx`: operações de enfermagem.
- `components/logo.png`: marca compartilhada pelas telas.

Pacientes, leitos, internações, agenda, profissionais, prescrições, medicamentos e administrações são carregados da API conforme as permissões do perfil. A recepção grava as operações de cadastro, leitos, internações e agendamentos nos endpoints existentes. Sinais vitais carregam o snapshot atual e recebem atualizações STOMP em `/topic/pacientes/{id}/sinais-vitais`; os valores deixam de ser simulados no navegador.

Algumas áreas clínicas ainda não têm vínculo de paciente ou persistência correspondente no backend (como exames e evolução de enfermagem) e, por isso, não podem ser sincronizadas corretamente até a API/modelo de dados oferecer esses relacionamentos. O ECG em forma de onda também não é fornecido pelo endpoint atual, que disponibiliza apenas os seis parâmetros numéricos de sinais vitais.
