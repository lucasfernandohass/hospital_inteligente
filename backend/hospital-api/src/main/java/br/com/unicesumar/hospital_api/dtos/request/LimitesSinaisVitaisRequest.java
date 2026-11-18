package br.com.unicesumar.hospital_api.dtos.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record LimitesSinaisVitaisRequest(
        @NotNull @Min(1) @Max(300) Integer fcAlertaMin,
        @NotNull @Min(1) @Max(300) Integer fcAlertaMax,
        @NotNull @Min(1) @Max(300) Integer fcCriticoMin,
        @NotNull @Min(1) @Max(300) Integer fcCriticoMax,
        @NotNull @DecimalMin("0.0") @DecimalMax("100.0") @Digits(integer = 3, fraction = 2) BigDecimal spo2AlertaMin,
        @NotNull @DecimalMin("0.0") @DecimalMax("100.0") @Digits(integer = 3, fraction = 2) BigDecimal spo2CriticoMin,
        @NotNull @Min(1) @Max(100) Integer frAlertaMax,
        @NotNull @Min(1) @Max(100) Integer frCriticoMax,
        @NotNull @DecimalMin("20.0") @DecimalMax("50.0") @Digits(integer = 2, fraction = 2) BigDecimal temperaturaAlertaMax,
        @NotNull @DecimalMin("20.0") @DecimalMax("50.0") @Digits(integer = 2, fraction = 2) BigDecimal temperaturaCriticoMax,
        @NotNull @Min(40) @Max(300) Integer paSistolicaAlertaMax,
        @NotNull @Min(40) @Max(300) Integer paSistolicaCriticoMax
) {
    @AssertTrue(message = "Os limites críticos devem ser mais amplos que os limites de alerta")
    public boolean isFaixasValidas() {
        return fcCriticoMin != null && fcAlertaMin != null && fcAlertaMax != null && fcCriticoMax != null
                && spo2CriticoMin != null && spo2AlertaMin != null
                && frAlertaMax != null && frCriticoMax != null
                && temperaturaAlertaMax != null && temperaturaCriticoMax != null
                && paSistolicaAlertaMax != null && paSistolicaCriticoMax != null
                && fcCriticoMin < fcAlertaMin && fcAlertaMin < fcAlertaMax && fcAlertaMax < fcCriticoMax
                && spo2CriticoMin.compareTo(spo2AlertaMin) < 0
                && frAlertaMax < frCriticoMax
                && temperaturaAlertaMax.compareTo(temperaturaCriticoMax) < 0
                && paSistolicaAlertaMax < paSistolicaCriticoMax;
    }
}
