# Hospital Inteligente

![Status](https://img.shields.io/badge/status-Em_desenvolvimento-yellow)
![Plataforma](https://img.shields.io/badge/plataforma-Web-lightgrey)
![Backend](https://img.shields.io/badge/backend-Spring%20Boot-green)
![Frontend](https://img.shields.io/badge/frontend-React%20%7C%20TypeScript-blue)


## Sobre o projeto

O **Hospital Inteligente** é um sistema de apoio à rotina hospitalar. Em um só lugar, reúne informações de pacientes, equipe, leitos, internações e atendimentos para facilitar o acompanhamento e a organização do cuidado.

Cada profissional acessa um painel adequado ao seu trabalho. A recepção organiza cadastros e agendamentos; médicos acompanham atendimentos, registros clínicos, prescrições e exames; a enfermagem consulta pacientes internados, acompanha informações clínicas e registra atividades de cuidado; a administração gerencia a equipe.

## Objetivo

Centralizar informações clínicas e operacionais em uma aplicação com acesso autenticado por perfil, oferecendo uma base para acompanhar pacientes internados e apoiar as rotinas de recepção, medicina, enfermagem e administração.


## O que o sistema oferece

- Cadastro e consulta de pacientes e profissionais;
- Organização de leitos, internações e atendimentos;
- Agendamento e consulta de compromissos médicos;
- Acompanhamento de prescrições e administrações de medicamentos;
- Registro e consulta de exames laboratoriais e de imagem;
- Acompanhamento de sinais vitais e alertas dos pacientes;
- Painéis organizados para as rotinas de recepção, medicina, enfermagem e administração.

## Acompanhamento dos pacientes

As informações do paciente ajudam a equipe a consultar seu atendimento e situação hospitalar, incluindo leito e internação quando aplicável. Para pacientes internados, o painel pode apresentar medições de sinais vitais recebidas de dispositivos conectados ou simulados, como frequência cardíaca, saturação de oxigênio e temperatura, além de alertas associados.

## Sistema de Alertas

A plataforma identifica automaticamente alterações clínicas nos sinais vitais.

Entre os eventos monitorados estão:

* Frequência cardíaca elevada;
* Frequência cardíaca reduzida;
* Baixa saturação de oxigênio;
* Temperatura elevada;
* Alteração da frequência respiratória;
* Falha na comunicação dos dispositivos;
* Alterações detectadas no ECG.

Cada alerta registra:

* Paciente;
* Parâmetro alterado;
* Valor observado;
* Limite configurado;
* Data e horário;
* Nível de criticidade;
* Situação do atendimento.

Os níveis de criticidade são classificados em:

* Informativo;
* Moderado;
* Crítico.

## Acesso por função

O acesso é destinado aos funcionários do hospital e organizado conforme suas responsabilidades. Recepcionistas, médicos, profissionais de enfermagem e administradores têm acesso às funções necessárias ao seu trabalho. Por exemplo, a gestão da equipe é restrita à administração, enquanto prescrições são realizadas por profissionais médicos autorizados. Assim, cada perfil vê e utiliza as áreas correspondentes às suas atribuições.

## Privacidade e uso dos dados

Considerando a natureza sensível dos dados clínicos, o sistema prevê mecanismos de segurança como:

* Autenticação de usuários;
* Controle de acesso por perfis;
* Registro de atividades;
* Proteção das comunicações;
* Restrição de acesso conforme a função do profissional.

O sistema conta com autenticação de usuários e controle de acesso por perfil para proteger as informações e limitar as ações disponíveis às responsabilidades de cada profissional. Durante o desenvolvimento e as demonstrações, devem ser utilizados dados fictícios ou simulados.

## Sinais Vitais Monitorados

A plataforma realiza o acompanhamento dos seguintes parâmetros clínicos:

* Frequência cardíaca (BPM);
* Saturação periférica de oxigênio (SpO₂);
* Frequência respiratória;
* Temperatura corporal;
* Eletrocardiograma (ECG).

## Estrutura do projeto

```text
Hospital-Inteligente/
├── backend/
│   ├── hospital-api/   # API Spring Boot
│   └── README.md       # Configuração e endpoints da API
├── docs/               # Documentos, diagramas e materiais do projeto
├── frontend/           # Aplicação React
│   └── README.md       # Execução e detalhes da interface
├── simulador-laravel/  # Simulador de sinais vitais
│   └── README.md       # Configuração e API do simulador
├── docker-compose.yml  # PostgreSQL para desenvolvimento local
├── dev.sh              # Sobe o ambiente local completo
└── README.md
```

## Executar localmente

O script `dev.sh` sobe todo o ambiente com um único comando:

```bash
./dev.sh
```

Ele executa, em ordem:

1. **PostgreSQL** via `docker compose`, aguardando o banco ficar pronto;
2. **Backend** Spring Boot na porta `8080`, aguardando o `/actuator/health` responder;
3. **Simulador** Laravel: a API (`php artisan serve`, porta `8000`) e o scheduler (`php artisan schedule:work`), que é quem envia os sinais vitais;
4. **Frontend** Vite na porta `8443`, usando Node 22 via `nvm` e executando `npm install` se necessário.

Os logs de todos os serviços aparecem no mesmo terminal, identificados por `[back]`, `[sim]`, `[sched]` e `[front]`. **Ctrl+C encerra todos os serviços**; o PostgreSQL continua em execução no Docker.

Requisitos: Docker, Java 21, PHP 8.2+ com as dependências do Composer instaladas em `simulador-laravel/` e Node 20.19+ ou 22.12+ (o `nvm` é usado automaticamente se estiver instalado). O arquivo `simulador-laravel/.env` deve estar configurado conforme o README do simulador.

Observações:

- A `MONITOR_API_KEY` do backend é lida do `.env` do simulador, garantindo que as chaves sejam iguais. Para usar outra, exporte a variável antes: `MONITOR_API_KEY=minha-chave ./dev.sh`;
- Se alguma das portas `8080`, `8000` ou `8443` já estiver em uso, o script avisa e não inicia nada;
- Se a simulação estiver pausada, o script exibe o comando para retomá-la (`POST /api/simulacao/iniciar`);
- Para usar outra versão do Node: `NODE_VERSION=20 ./dev.sh`.

Para executar cada serviço separadamente, consulte os READMEs de `backend/`, `frontend/` e `simulador-laravel/`.

## Tecnologias

- **Frontend:** React, TypeScript, Vite e Tailwind CSS v4;
- **Backend:** Java 21, Spring Boot e Maven;
- **Banco de dados:** PostgreSQL com migrations Flyway;
- **Ambiente local:** Docker.

## Time de Desenvolvimento

| Nomes           | Funções |
|-----------------|----------|
| Lucas Fernando Hass   | BACKEND |
| Edi Carlos Francisco Júnior   | BACKEND  |
| Danilo Bolzan de Moraes  | FRONTEND |
| Otavio Alves Brisky   | FRONTEND |
| Pedro Oleniki Terra   | DOCUMENTAÇÃO |
| Felipe de Oliveira Guimarães   | QA/TESTER  |
