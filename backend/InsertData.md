{
  "confirmarInsercao": true,
  "usuarios": [
    {
      "nome": "Administradora do Hospital",
      "cpf": "67745777097",
      "dataNascimento": "1985-04-20",
      "telefone": "44999990000",
      "endereco": "Rua Central, 100",
      "matricula": "ADM-001",
      "dataAdmissao": "2026-10-15",
      "email": "admin@hospital.local",
      "senha": "SenhaLocalForte123",
      "role": "ADMINISTRADOR"
    },
    {
      "nome": "Otavio Alves Brisky",
      "cpf": "12345678909",
      "dataNascimento": "1989-03-15",
      "telefone": "44998887766",
      "endereco": "Rua das Flores, 120",
      "matricula": "REC-DEMO-001",
      "dataAdmissao": "2024-01-10",
      "email": "otavio@gmail.com",
      "senha": "SenhaLocalForte123",
      "role": "RECEPCIONISTA",
      "setor": "Recepção"
    },
    {
      "nome": "Danilo Bonzan",
      "cpf": "23456789092",
      "dataNascimento": "1982-06-21",
      "telefone": "44997776655",
      "endereco": "Av. Brasil, 450",
      "matricula": "MED-DEMO-001",
      "dataAdmissao": "2023-05-08",
      "email": "danilo@gmail.com",
      "senha": "SenhaLocalForte123",
      "role": "MEDICO",
      "crm": "CRM-DEMO-001",
      "especialidade": "Clínica Médica"
    },
    {
      "nome": "Ana Carolina",
      "cpf": "34567890175",
      "dataNascimento": "1990-11-02",
      "telefone": "44996665544",
      "endereco": "Rua Paraná, 80",
      "matricula": "ENF-DEMO-001",
      "dataAdmissao": "2023-08-14",
      "email": "ana@gmail.com",
      "senha": "SenhaLocalForte123",
      "role": "ENFERMEIRA",
      "coren": "COREN-DEMO-001",
      "setor": "Enfermagem"
    }
  ],
  "pacientes": [
    {
      "nome": "João da Silva",
      "cpf": "45678901249",
      "dataNascimento": "1980-03-15",
      "telefone": "44995554433",
      "endereco": "Rua A, 10",
      "numeroProntuario": "DEMO-PR-001",
      "convenio": "Particular",
      "sexo": "M"
    },
    {
      "nome": "Maria Oliveira",
      "cpf": "56789012303",
      "dataNascimento": "1972-08-10",
      "telefone": "44994443322",
      "endereco": "Rua B, 20",
      "numeroProntuario": "DEMO-PR-002",
      "convenio": "Unimed",
      "sexo": "F"
    },
    {
      "nome": "Carlos Santos",
      "cpf": "67890123469",
      "dataNascimento": "1995-01-22",
      "telefone": "44993332211",
      "endereco": "Rua C, 30",
      "numeroProntuario": "DEMO-PR-003",
      "convenio": "Particular",
      "sexo": "M"
    }
  ],
  "leitos": [
    {
      "numero": "DEMO-UTI-01",
      "andar": 1,
      "quarto": "DEMO-01",
      "tipo": "UTI",
      "status": "Ocupado",
      "observacao": "Leito de demonstração",
      "setor": "UTI"
    },
    {
      "numero": "DEMO-ENF-01",
      "andar": 2,
      "quarto": "DEMO-02",
      "tipo": "Enfermaria",
      "status": "Ocupado",
      "observacao": "Leito de demonstração",
      "setor": "Clínica Médica"
    },
    {
      "numero": "DEMO-ENF-02",
      "andar": 2,
      "quarto": "DEMO-03",
      "tipo": "Enfermaria",
      "status": "Disponível",
      "observacao": "Leito livre para demonstração",
      "setor": "Clínica Médica"
    }
  ],
  "internacoes": [
    {
      "numeroProntuario": "DEMO-PR-001",
      "numeroLeito": "DEMO-UTI-01",
      "emailMedico": "danilo@gmail.com",
      "diasDesdeInternacao": 6,
      "diasAteAltaPrevista": 5,
      "motivo": "Observação clínica de demonstração",
      "observacoes": "Registro criado pelo dataset de teste."
    },
    {
      "numeroProntuario": "DEMO-PR-002",
      "numeroLeito": "DEMO-ENF-01",
      "emailMedico": "danilo@gmail.com",
      "diasDesdeInternacao": 3,
      "diasAteAltaPrevista": 4,
      "motivo": "Recuperação clínica de demonstração",
      "observacoes": "Registro criado pelo dataset de teste."
    }
  ],
  "agendamentos": [
    {
      "chave": "consulta-demo-pr-003",
      "numeroProntuario": "DEMO-PR-003",
      "emailMedico": "danilo@gmail.com",
      "diasAteAgendamento": 1,
      "horario": "09:30:00",
      "duracao": 30,
      "status": "AGENDADA",
      "tipo": "Consulta",
      "observacoes": "Consulta de demonstração."
    }
  ]
}
