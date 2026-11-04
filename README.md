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
├── docker-compose.yml  # PostgreSQL para desenvolvimento local
└── README.md
```

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
