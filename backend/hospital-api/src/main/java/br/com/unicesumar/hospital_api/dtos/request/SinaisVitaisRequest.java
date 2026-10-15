package br.com.unicesumar.hospital_api.dtos.request;

import br.com.unicesumar.hospital_api.models.TipoSinal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record SinaisVitaisRequest(
        @NotNull Long pacienteId,
        @NotNull LocalDateTime capturadoEm,
        @NotEmpty List<@Valid Medida> medidas) {
    public record Medida(@NotNull TipoSinal tipo, @NotNull BigDecimal valor) {}
}
