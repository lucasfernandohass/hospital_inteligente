package br.com.unicesumar.hospital_api;

import br.com.unicesumar.hospital_api.dtos.request.LimitesSinaisVitaisRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LimitesSinaisVitaisRequestTest {
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void acceptsDefaultThresholdRanges() {
        assertTrue(validator.validate(defaultThresholds()).isEmpty());
    }

    @Test
    void rejectsCriticalRangesInsideWarningRanges() {
        LimitesSinaisVitaisRequest request = new LimitesSinaisVitaisRequest(
                50, 110, 50, 130,
                new BigDecimal("92"), new BigDecimal("88"),
                24, 30,
                new BigDecimal("38"), new BigDecimal("39"),
                140, 180
        );

        assertFalse(validator.validate(request).isEmpty());
    }

    @ParameterizedTest
    @CsvSource({
            "49, 40, 130, 88, 30, 39, 180",
            "110, 50, 130, 88, 30, 39, 180",
            "130, 40, 130, 88, 30, 39, 180",
            "110, 40, 130, 92, 30, 39, 180",
            "110, 40, 130, 88, 24, 39, 180",
            "110, 40, 130, 88, 30, 38, 180",
            "110, 40, 130, 88, 30, 39, 140"
    })
    void rejectsEachNonStrictThresholdBoundary(int fcAlertaMax, int fcCriticoMin, int fcCriticoMax,
            String spo2CriticoMin, int frCriticoMax, String temperaturaCriticoMax, int paCriticoMax) {
        var request = new LimitesSinaisVitaisRequest(
                50, fcAlertaMax, fcCriticoMin, fcCriticoMax,
                new BigDecimal("92"), new BigDecimal(spo2CriticoMin),
                24, frCriticoMax,
                new BigDecimal("38"), new BigDecimal(temperaturaCriticoMax),
                140, paCriticoMax);

        assertTrue(validator.validate(request).stream()
                .anyMatch(violation -> violation.getPropertyPath().toString().equals("faixasValidas")));
    }

    private LimitesSinaisVitaisRequest defaultThresholds() {
        return new LimitesSinaisVitaisRequest(
                50, 110, 40, 130,
                new BigDecimal("92"), new BigDecimal("88"),
                24, 30,
                new BigDecimal("38"), new BigDecimal("39"),
                140, 180
        );
    }
}
