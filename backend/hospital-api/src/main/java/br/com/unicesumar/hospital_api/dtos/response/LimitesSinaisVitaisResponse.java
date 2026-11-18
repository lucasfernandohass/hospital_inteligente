package br.com.unicesumar.hospital_api.dtos.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record LimitesSinaisVitaisResponse(
        Long pacienteId,
        boolean personalizado,
        Integer fcAlertaMin,
        Integer fcAlertaMax,
        Integer fcCriticoMin,
        Integer fcCriticoMax,
        BigDecimal spo2AlertaMin,
        BigDecimal spo2CriticoMin,
        Integer frAlertaMax,
        Integer frCriticoMax,
        BigDecimal temperaturaAlertaMax,
        BigDecimal temperaturaCriticoMax,
        Integer paSistolicaAlertaMax,
        Integer paSistolicaCriticoMax,
        Long atualizadoPorId,
        LocalDateTime atualizadoEm
) {}
