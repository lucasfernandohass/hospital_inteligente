package br.com.unicesumar.hospital_api.dtos.response;

import br.com.unicesumar.hospital_api.models.Role;

import java.time.LocalDateTime;

public record RegistroAtividadeResponse(
        Long id,
        LocalDateTime dataHora,
        Long funcionarioId,
        String funcionarioNome,
        Role funcionarioRole,
        String acao,
        String entidade,
        String detalhes
) {}
