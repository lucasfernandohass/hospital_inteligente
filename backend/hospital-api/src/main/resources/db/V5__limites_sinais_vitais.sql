CREATE TABLE limites_sinais_vitais (
    id BIGSERIAL PRIMARY KEY,
    paciente_id BIGINT REFERENCES paciente(id) ON DELETE CASCADE,
    fc_alerta_min INTEGER NOT NULL,
    fc_alerta_max INTEGER NOT NULL,
    fc_critico_min INTEGER NOT NULL,
    fc_critico_max INTEGER NOT NULL,
    spo2_alerta_min NUMERIC(5, 2) NOT NULL,
    spo2_critico_min NUMERIC(5, 2) NOT NULL,
    fr_alerta_max INTEGER NOT NULL,
    fr_critico_max INTEGER NOT NULL,
    temperatura_alerta_max NUMERIC(5, 2) NOT NULL,
    temperatura_critico_max NUMERIC(5, 2) NOT NULL,
    pa_sistolica_alerta_max INTEGER NOT NULL,
    pa_sistolica_critico_max INTEGER NOT NULL,
    atualizado_por_id BIGINT REFERENCES funcionario(id) ON DELETE SET NULL,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_limites_fc CHECK (fc_critico_min < fc_alerta_min AND fc_alerta_min < fc_alerta_max AND fc_alerta_max < fc_critico_max),
    CONSTRAINT ck_limites_spo2 CHECK (spo2_critico_min < spo2_alerta_min),
    CONSTRAINT ck_limites_fr CHECK (fr_alerta_max < fr_critico_max),
    CONSTRAINT ck_limites_temperatura CHECK (temperatura_alerta_max < temperatura_critico_max),
    CONSTRAINT ck_limites_pa_sistolica CHECK (pa_sistolica_alerta_max < pa_sistolica_critico_max)
);

CREATE UNIQUE INDEX uq_limites_sinais_vitais_padrao
    ON limites_sinais_vitais ((TRUE))
    WHERE paciente_id IS NULL;

CREATE UNIQUE INDEX uq_limites_sinais_vitais_paciente
    ON limites_sinais_vitais (paciente_id)
    WHERE paciente_id IS NOT NULL;

INSERT INTO limites_sinais_vitais (
    paciente_id,
    fc_alerta_min,
    fc_alerta_max,
    fc_critico_min,
    fc_critico_max,
    spo2_alerta_min,
    spo2_critico_min,
    fr_alerta_max,
    fr_critico_max,
    temperatura_alerta_max,
    temperatura_critico_max,
    pa_sistolica_alerta_max,
    pa_sistolica_critico_max
) VALUES (
    NULL,
    50, 110, 40, 130,
    92, 88,
    24, 30,
    38, 39,
    140, 180
);
