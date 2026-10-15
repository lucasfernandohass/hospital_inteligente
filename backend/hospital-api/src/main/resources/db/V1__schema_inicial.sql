CREATE TABLE pessoa (
    id              BIGSERIAL PRIMARY KEY,
    nome            VARCHAR(150) NOT NULL,
    cpf             VARCHAR(11)  NOT NULL,
    data_nascimento DATE         NOT NULL,
    telefone        VARCHAR(20),
    endereco        VARCHAR(255),
    CONSTRAINT uk_pessoa_cpf UNIQUE (cpf)
);

CREATE TABLE funcionario (
    id            BIGINT       PRIMARY KEY REFERENCES pessoa(id),
    matricula     VARCHAR(30)  NOT NULL,
    cargo         VARCHAR(80)  NOT NULL,
    data_admissao DATE         NOT NULL,
    email         VARCHAR(150) NOT NULL,
    senha         VARCHAR(100) NOT NULL,
    role          VARCHAR(20)  NOT NULL,
    CONSTRAINT uk_funcionario_matricula UNIQUE (matricula),
    CONSTRAINT uk_funcionario_email     UNIQUE (email),
    CONSTRAINT ck_funcionario_role CHECK (role IN ('RECEPCIONISTA', 'MEDICO', 'ENFERMEIRA', 'ADMINISTRADOR'))
);

CREATE TABLE administrador (
    id BIGINT PRIMARY KEY REFERENCES funcionario(id)
);

CREATE TABLE medico (
    id            BIGINT      PRIMARY KEY REFERENCES funcionario(id),
    crm           VARCHAR(20) NOT NULL,
    especialidade VARCHAR(80) NOT NULL,
    CONSTRAINT uk_medico_crm UNIQUE (crm)
);

CREATE TABLE enfermeira (
    id    BIGINT      PRIMARY KEY REFERENCES funcionario(id),
    coren VARCHAR(20) NOT NULL,
    setor VARCHAR(80) NOT NULL,
    CONSTRAINT uk_enfermeira_coren UNIQUE (coren)
);

CREATE TABLE recepcionista (
    id    BIGINT      PRIMARY KEY REFERENCES funcionario(id),
    setor VARCHAR(80) NOT NULL
);


CREATE TABLE paciente (
    id                BIGINT       PRIMARY KEY REFERENCES pessoa(id),
    numero_prontuario VARCHAR(20)  NOT NULL,
    convenio          VARCHAR(100) NOT NULL,
    CONSTRAINT uk_paciente_numero_prontuario UNIQUE (numero_prontuario)
);


CREATE TABLE medicamento (
    id      BIGSERIAL    PRIMARY KEY,
    nome    VARCHAR(150) NOT NULL,
    dosagem VARCHAR(50)  NOT NULL,
    ativo   BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE leito (
    id         BIGSERIAL    PRIMARY KEY,
    numero     VARCHAR(20)  NOT NULL,
    andar      INTEGER      NOT NULL,
    quarto     VARCHAR(20)  NOT NULL,
    tipo       VARCHAR(50)  NOT NULL,
    status     VARCHAR(30)  NOT NULL,
    observacao VARCHAR(500),
    CONSTRAINT uk_leito_andar_quarto_numero UNIQUE (andar, quarto, numero)
);


CREATE TABLE atendimento (
    id                         BIGSERIAL    PRIMARY KEY,
    data                       TIMESTAMP    NOT NULL,
    tipo                       VARCHAR(50)  NOT NULL,
    descricao                  VARCHAR(500) NOT NULL,
    status                     VARCHAR(30)  NOT NULL,
    leito_id                   BIGINT       REFERENCES leito(id),
    paciente_id                BIGINT       NOT NULL REFERENCES paciente(id),
    funcionario_responsavel_id BIGINT       NOT NULL REFERENCES funcionario(id),
    medico_responsavel_id      BIGINT       NOT NULL REFERENCES medico(id)
);

CREATE TABLE internacao (
    id                 BIGSERIAL    PRIMARY KEY,
    paciente_id        BIGINT       NOT NULL REFERENCES paciente(id),
    leito_id           BIGINT       NOT NULL REFERENCES leito(id),
    data_internacao    DATE         NOT NULL,
    data_prevista_alta DATE,
    data_alta          DATE,
    motivo             VARCHAR(500) NOT NULL,
    status             VARCHAR(30)  NOT NULL,
    observacoes        VARCHAR(500),
    CONSTRAINT ck_internacao_data_prevista CHECK (data_prevista_alta IS NULL OR data_prevista_alta >= data_internacao),
    CONSTRAINT ck_internacao_data_alta CHECK (data_alta IS NULL OR data_alta >= data_internacao)
);

-- Regra: um leito só pode ter uma internação ativa por vez
CREATE UNIQUE INDEX uk_internacao_leito_ativo
    ON internacao (leito_id)
    WHERE data_alta IS NULL;

-- Um paciente só pode possuir uma internação ativa por vez.
CREATE UNIQUE INDEX uk_internacao_paciente_ativo
    ON internacao (paciente_id)
    WHERE data_alta IS NULL;


CREATE TABLE agenda_medica (
    id            BIGSERIAL    PRIMARY KEY,
    medico_id     BIGINT       NOT NULL REFERENCES medico(id),
    hora_inicio   TIMESTAMP    NOT NULL,
    hora_fim      TIMESTAMP    NOT NULL,
    status        VARCHAR(30)  NOT NULL,
    tipo_consulta VARCHAR(80)  NOT NULL,
    observacoes   VARCHAR(500),
    CONSTRAINT ck_agenda_horario CHECK (hora_fim > hora_inicio)
);

CREATE TABLE agendamento (
    id          BIGSERIAL    PRIMARY KEY,
    paciente_id BIGINT       NOT NULL REFERENCES paciente(id),
    medico_id   BIGINT       NOT NULL REFERENCES medico(id),
    data        DATE         NOT NULL,
    horario     TIME         NOT NULL,
    duracao     INTEGER      NOT NULL,
    status      VARCHAR(30)  NOT NULL,
    tipo        VARCHAR(80)  NOT NULL,
    observacoes VARCHAR(500),
    CONSTRAINT ck_agendamento_duracao CHECK (duracao > 0)
);


CREATE TABLE prescricao (
    id             BIGSERIAL    PRIMARY KEY,
    data           TIMESTAMP    NOT NULL,
    observacao     VARCHAR(500),
    status         VARCHAR(30)  NOT NULL,
    paciente_id    BIGINT       NOT NULL REFERENCES paciente(id),
    medico_id      BIGINT       NOT NULL REFERENCES medico(id),
    atendimento_id BIGINT       NOT NULL REFERENCES atendimento(id)
);

CREATE TABLE item_prescricao (
    id                BIGSERIAL    PRIMARY KEY,
    prescricao_id     BIGINT       NOT NULL REFERENCES prescricao(id) ON DELETE CASCADE,
    medicamento_id    BIGINT       NOT NULL REFERENCES medicamento(id),
    dose              VARCHAR(50)  NOT NULL,
    via_administracao VARCHAR(50)  NOT NULL,
    frequencia        VARCHAR(50)  NOT NULL,
    duracao           VARCHAR(50)  NOT NULL,
    observacoes       VARCHAR(500)
);

CREATE TABLE administracao_medicamento (
    id                 BIGSERIAL   PRIMARY KEY,
    data_hora          TIMESTAMP   NOT NULL,
    dose               VARCHAR(50) NOT NULL,
    via                VARCHAR(50) NOT NULL,
    observacao         VARCHAR(500),
    item_prescricao_id BIGINT      NOT NULL REFERENCES item_prescricao(id),
    paciente_id        BIGINT      NOT NULL REFERENCES paciente(id),
    administrado_por   BIGINT      NOT NULL REFERENCES funcionario(id)
);

CREATE TABLE exame_imagem (
    id               BIGSERIAL    PRIMARY KEY,
    data_solicitacao TIMESTAMP    NOT NULL,
    status           VARCHAR(30)  NOT NULL,
    observacoes      VARCHAR(500),
    modalidade       VARCHAR(50)  NOT NULL,
    regiao_corpo     VARCHAR(80)  NOT NULL,
    arquivo_digital  VARCHAR(255)
);

CREATE TABLE exame_laboratorial (
    id               BIGSERIAL   PRIMARY KEY,
    data_solicitacao TIMESTAMP   NOT NULL,
    status           VARCHAR(30) NOT NULL,
    observacoes      VARCHAR(500),
    tipo_analise     VARCHAR(80) NOT NULL,
    amostra          VARCHAR(50) NOT NULL,
    metodo           VARCHAR(80) NOT NULL
);


CREATE TABLE ecg (
    id                  BIGSERIAL    PRIMARY KEY,
    data_hora           TIMESTAMP    NOT NULL,
    frequencia_cardiaca INTEGER      NOT NULL,
    ritmo               VARCHAR(80)  NOT NULL,
    intervalo_pr        INTEGER      NOT NULL,
    duracao_qrs         INTEGER      NOT NULL,
    eixo                VARCHAR(30),
    observacao          VARCHAR(500),
    paciente_id         BIGINT       NOT NULL REFERENCES paciente(id),
    atendimento_id      BIGINT       NOT NULL REFERENCES atendimento(id)
);

CREATE TABLE resultado_exame (
    id             BIGSERIAL     PRIMARY KEY,
    data_liberacao TIMESTAMP     NOT NULL,
    laudo          VARCHAR(2000) NOT NULL,
    arquivo_anexo  VARCHAR(255),
    liberado       BOOLEAN       NOT NULL DEFAULT FALSE
);

CREATE TABLE alerta (
    id          BIGSERIAL    PRIMARY KEY,
    tipo        VARCHAR(80)  NOT NULL,
    mensagem    VARCHAR(500) NOT NULL,
    data_hora   TIMESTAMP    NOT NULL,
    nivel       VARCHAR(30)  NOT NULL,
    ativo       BOOLEAN      NOT NULL DEFAULT TRUE,
    paciente_id BIGINT       NOT NULL REFERENCES paciente(id)
);

CREATE TABLE registro_clinico (
    id             BIGSERIAL PRIMARY KEY,
    data           TIMESTAMP NOT NULL,
    descricao      TEXT      NOT NULL,
    anamnese       TEXT,
    exame_fisico   TEXT,
    diagnostico    TEXT,
    conduta        TEXT,
    observacao     TEXT,
    medico_id      BIGINT    NOT NULL REFERENCES medico(id),
    atendimento_id BIGINT    NOT NULL REFERENCES atendimento(id)
);

CREATE TABLE ficha_atendimento (
    id             BIGSERIAL    PRIMARY KEY,
    atendimento_id BIGINT       NOT NULL REFERENCES atendimento(id),
    paciente_id    BIGINT       NOT NULL REFERENCES paciente(id),
    versao         INTEGER      NOT NULL,
    emitido_em     TIMESTAMP    NOT NULL,
    emitido_por    BIGINT       NOT NULL REFERENCES funcionario(id),
    hash_conteudo  VARCHAR(64)  NOT NULL,
    arquivo_pdf    VARCHAR(255) NOT NULL,
    CONSTRAINT uk_ficha_atendimento_versao UNIQUE (atendimento_id, versao)
);

-- Pessoa / Paciente
CREATE INDEX idx_pessoa_nome         ON pessoa (nome);
CREATE INDEX idx_paciente_convenio   ON paciente (convenio);

-- Funcionário
CREATE INDEX idx_funcionario_cargo     ON funcionario (cargo);
CREATE INDEX idx_medico_especialidade  ON medico (especialidade);
CREATE INDEX idx_enfermeira_setor      ON enfermeira (setor);

-- Atendimento
CREATE INDEX idx_atendimento_paciente ON atendimento (paciente_id);
CREATE INDEX idx_atendimento_medico   ON atendimento (medico_responsavel_id);
CREATE INDEX idx_atendimento_data     ON atendimento (data);
CREATE INDEX idx_atendimento_status   ON atendimento (status);

-- Internação
CREATE INDEX idx_internacao_paciente ON internacao (paciente_id);
CREATE INDEX idx_internacao_status   ON internacao (status);

-- Agendamento
CREATE INDEX idx_agendamento_medico_data ON agendamento (medico_id, data);
CREATE INDEX idx_agendamento_paciente    ON agendamento (paciente_id);
CREATE INDEX idx_agenda_medico           ON agenda_medica (medico_id);

-- Prescrição
CREATE INDEX idx_prescricao_paciente    ON prescricao (paciente_id);
CREATE INDEX idx_prescricao_atendimento ON prescricao (atendimento_id);
CREATE INDEX idx_item_prescricao_presc  ON item_prescricao (prescricao_id);

-- Administração
CREATE INDEX idx_adm_med_item     ON administracao_medicamento (item_prescricao_id);
CREATE INDEX idx_adm_med_paciente ON administracao_medicamento (paciente_id);

-- Exames
CREATE INDEX idx_exame_imagem_status ON exame_imagem (status);
CREATE INDEX idx_exame_lab_status    ON exame_laboratorial (status);
CREATE INDEX idx_ecg_paciente_data   ON ecg (paciente_id, data_hora DESC);

-- Alerta
CREATE INDEX idx_alerta_paciente_ativo ON alerta (paciente_id) WHERE ativo = TRUE;
CREATE INDEX idx_alerta_data           ON alerta (data_hora DESC);

-- Registro Clínico
CREATE INDEX idx_registro_atendimento ON registro_clinico (atendimento_id);
CREATE INDEX idx_registro_medico      ON registro_clinico (medico_id);

-- Ficha
CREATE INDEX idx_ficha_atendimento ON ficha_atendimento (atendimento_id);
