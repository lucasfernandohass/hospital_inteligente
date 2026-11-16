package br.com.unicesumar.hospital_api.dtos.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegistrarAtividadeRequest(
        @NotBlank @Size(max = 120) String acao,
        @NotBlank @Size(max = 120) String entidade,
        @Size(max = 500) String detalhes
) {}
