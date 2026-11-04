ALTER TABLE paciente
    ADD COLUMN sexo VARCHAR(20);

ALTER TABLE leito
    ADD COLUMN setor VARCHAR(80);

ALTER TABLE internacao
    ADD COLUMN medico_id BIGINT REFERENCES medico(id);
