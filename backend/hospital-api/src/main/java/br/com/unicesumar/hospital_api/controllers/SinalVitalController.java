package br.com.unicesumar.hospital_api.controllers;

import br.com.unicesumar.hospital_api.dtos.request.SinaisVitaisRequest;
import br.com.unicesumar.hospital_api.dtos.websocket.SinalVital;
import br.com.unicesumar.hospital_api.security.ApiAuthorization;
import br.com.unicesumar.hospital_api.services.SinalVitalService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

@RestController
public class SinalVitalController {
    private final SinalVitalService service;
    private final ApiAuthorization authorization;
    private final byte[] monitorApiKey;

    public SinalVitalController(SinalVitalService service, ApiAuthorization authorization,
            @Value("${app.monitor.api-key:}") String monitorApiKey) {
        this.service = service;
        this.authorization = authorization;
        this.monitorApiKey = monitorApiKey.getBytes(StandardCharsets.UTF_8);
    }

    @PostMapping("/api/ingestao/sinais-vitais")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public List<SinalVital> receber(@RequestHeader(name = "X-Monitor-Api-Key", required = false) String apiKey,
            @Valid @RequestBody SinaisVitaisRequest request) {
        if (monitorApiKey.length == 0 || apiKey == null
                || !MessageDigest.isEqual(monitorApiKey, apiKey.getBytes(StandardCharsets.UTF_8))) {
            throw new AccessDeniedException("Credencial do monitor inválida");
        }
        return service.receber(request);
    }

    @GetMapping("/api/pacientes/{pacienteId}/sinais-vitais/atuais")
    public List<SinalVital> atuais(@PathVariable Long pacienteId, Authentication authentication) {
        if (!authorization.podeLer(authentication, "pacientes")) {
            throw new AccessDeniedException("Sem permissão para consultar sinais vitais");
        }
        return service.atuais(pacienteId);
    }
}
