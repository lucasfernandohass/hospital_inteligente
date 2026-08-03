# Hospital Inteligente

![Status](https://img.shields.io/badge/status-Em_desenvolvimento-yellow)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Mobile-lightgrey)

---

## Sobre o Projeto

O **Hospital Inteligente** é uma plataforma web desenvolvida para o monitoramento remoto e em tempo real de pacientes hospitalizados por meio da integração de dispositivos da Internet das Coisas Médicas (IoMT -Internet of Medical Things).

A aplicação tem como objetivo centralizar informações clínicas provenientes de dispositivos médicos conectados, permitindo que profissionais de saúde acompanhem continuamente os sinais vitais dos pacientes, visualizem alertas clínicos e tenham acesso ao histórico das medições em uma única interface.

O projeto foi desenvolvido com foco em simular um ambiente hospitalar moderno, onde sensores e equipamentos médicos transmitem dados continuamente para uma plataforma capaz de auxiliar na tomada de decisões durante o atendimento.

---

## Objetivo

Desenvolver uma plataforma web capaz de integrar dispositivos médicos conectados, coletar e armazenar sinais vitais em tempo real, apresentar informações clínicas de forma centralizada e emitir alertas automáticos sempre que forem identificadas alterações nos parâmetros monitorados.

---

## Funcionalidades

* Cadastro e gerenciamento de pacientes;
* Cadastro de profissionais de saúde;
* Gerenciamento de leitos e setores hospitalares;
* Cadastro e monitoramento de dispositivos médicos;
* Controle de internações;
* Monitoramento em tempo real dos sinais vitais;
* Visualização do histórico de medições;
* Dashboard clínico para acompanhamento dos pacientes;
* Sistema de alertas baseado em limites clínicos;
* Associação entre pacientes, leitos e dispositivos;
* Visualização detalhada das informações de cada paciente;
* Registro do estado operacional dos dispositivos.

---

## Sinais Vitais Monitorados

A plataforma realiza o acompanhamento dos seguintes parâmetros clínicos:

* Frequência cardíaca (BPM);
* Saturação periférica de oxigênio (SpO₂);
* Frequência respiratória;
* Temperatura corporal;
* Eletrocardiograma (ECG).

Cada monitoramento apresenta:

* Valor atual;
* Limites clínicos configurados;
* Tendência de evolução;
* Horário da última atualização;
* Histórico completo das medições.

---

## Dashboard Médico

O sistema disponibiliza um painel centralizado para acompanhamento dos pacientes internados, contendo:

* Identificação do paciente;
* Número do leito;
* Setor hospitalar;
* Estado clínico estimado;
* Principais sinais vitais;
* Alertas ativos.

Também é possível realizar filtros por:

* Setor;
* Leito;
* Criticidade;
* Situação clínica do paciente.

---

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

---

## Segurança

Considerando a natureza sensível dos dados clínicos, o sistema prevê mecanismos de segurança como:

* Autenticação de usuários;
* Controle de acesso por perfis;
* Registro de atividades;
* Proteção das comunicações;
* Restrição de acesso conforme a função do profissional.

Todos os dados utilizados durante o desenvolvimento são fictícios ou simulados.

---

## Tecnologias

As tecnologias utilizadas no projeto incluem:

* HTML5
* CSS3
* JavaScript
* Banco de Dados SQL
* Arquitetura multicamadas

> *A lista será atualizada conforme novas tecnologias forem incorporadas ao projeto.*

---

## Estrutura do Projeto

```
Hospital-Inteligente/
│
├── frontend/
├── backend/
├── database/
├── docs/
├── assets/
└── README.md
```

---

## Funcionalidades Futuras

Entre as funcionalidades previstas para versões futuras estão:

* Simulador de dispositivos médicos em tempo real;
* Animação do traçado de ECG;
* Mapa interativo dos leitos hospitalares;
* Notificações para profissionais responsáveis;
* Geração de relatórios em PDF;
* Histórico avançado de ocorrências;
* Indicadores de estabilidade clínica;
* Detecção automática de anomalias nos sinais vitais.

---

## Status do Projeto

O projeto encontra-se em desenvolvimento e novas funcionalidades serão implementadas ao longo das próximas etapas.

---

## Time de Desenvolvimento

| Nomes           | Funções |
|-----------------|----------|
|    |  |
|    |  |
|    |  |
|    |  |
|    |  |
|    |  |
