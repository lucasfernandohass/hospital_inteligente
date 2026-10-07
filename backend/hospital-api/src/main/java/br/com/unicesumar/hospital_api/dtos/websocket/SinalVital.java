package br.com.unicesumar.hospital_api.dtos.websocket;

import br.com.unicesumar.hospital_api.models.TipoSinal;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SinalVital(
    Long pacienteId,
    Long leitoId,
    TipoSinal tipo,
    BigDecimal valor,
    String unidade,
    LocalDateTime capturadoEm
) {}
