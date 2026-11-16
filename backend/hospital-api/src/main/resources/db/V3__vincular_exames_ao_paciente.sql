ALTER TABLE exame_imagem
    ADD COLUMN paciente_id BIGINT REFERENCES paciente(id),
    ADD COLUMN medico_id BIGINT REFERENCES medico(id),
    ADD COLUMN atendimento_id BIGINT REFERENCES atendimento(id);

ALTER TABLE exame_laboratorial
    ADD COLUMN paciente_id BIGINT REFERENCES paciente(id),
    ADD COLUMN medico_id BIGINT REFERENCES medico(id),
    ADD COLUMN atendimento_id BIGINT REFERENCES atendimento(id);

CREATE INDEX idx_exame_imagem_paciente ON exame_imagem (paciente_id);
CREATE INDEX idx_exame_imagem_medico ON exame_imagem (medico_id);
CREATE INDEX idx_exame_laboratorial_paciente ON exame_laboratorial (paciente_id);
CREATE INDEX idx_exame_laboratorial_medico ON exame_laboratorial (medico_id);
