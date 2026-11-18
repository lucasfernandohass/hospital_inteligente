package br.com.unicesumar.hospital_api;

import br.com.unicesumar.hospital_api.dtos.request.LimitesSinaisVitaisRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

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
