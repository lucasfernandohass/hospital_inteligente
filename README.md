# Hospital Inteligente

![Status](https://img.shields.io/badge/status-Em_desenvolvimento-yellow)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Mobile-lightgrey)

## Frontend hospitalar em React, TypeScript, Vite e Tailwind CSS v4.

## Requisitos

- Node.js 20.19+ ou 22.12+ ( Versões minimas exigidas ) 
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

## Estrutura

- `main.tsx`, `App.tsx` e `index.css`: inicialização, navegação entre perfis e estilos globais.
- `components/LoginPage.tsx`: seleção de perfil e entrada na interface.
- `components/RecepcionistaDashboard.tsx`: operações de recepção.
- `components/DoutorDashboard.tsx`: operações médicas.
- `components/EnfermeiraDashboard.tsx`: operações de enfermagem.
- `components/logo.png`: marca compartilhada pelas telas.

O login atual é demonstrativo e faz a navegação no frontend; ainda não autentica usuários em um servidor.

