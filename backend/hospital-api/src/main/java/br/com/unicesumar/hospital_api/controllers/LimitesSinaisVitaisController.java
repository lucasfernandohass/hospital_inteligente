package br.com.unicesumar.hospital_api.controllers;

import br.com.unicesumar.hospital_api.dtos.request.LimitesSinaisVitaisRequest;
import br.com.unicesumar.hospital_api.dtos.response.LimitesSinaisVitaisResponse;
import br.com.unicesumar.hospital_api.security.UsuarioPrincipal;
import br.com.unicesumar.hospital_api.services.LimitesSinaisVitaisService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@PreAuthorize("hasAnyRole('ADMINISTRADOR','MEDICO','ENFERMEIRA')")
public class LimitesSinaisVitaisController {
    private final LimitesSinaisVitaisService service;

    public LimitesSinaisVitaisController(LimitesSinaisVitaisService service) {
        this.service = service;
    }

    @GetMapping("/api/configuracoes/limites-sinais-vitais")
    public LimitesSinaisVitaisResponse buscarPadrao() {
        return service.buscarPadrao();
    }

    @PutMapping("/api/configuracoes/limites-sinais-vitais")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public LimitesSinaisVitaisResponse atualizarPadrao(
            @Valid @RequestBody LimitesSinaisVitaisRequest request,
            @AuthenticationPrincipal UsuarioPrincipal usuario
    ) {
        return service.atualizarPadrao(request, usuario.id());
    }

    @GetMapping("/api/pacientes/{pacienteId}/limites-sinais-vitais")
    public LimitesSinaisVitaisResponse buscarPaciente(@PathVariable Long pacienteId) {
        return service.buscarPaciente(pacienteId);
    }

    @PutMapping("/api/pacientes/{pacienteId}/limites-sinais-vitais")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','MEDICO','ENFERMEIRA')")
    public LimitesSinaisVitaisResponse atualizarPaciente(
            @PathVariable Long pacienteId,
            @Valid @RequestBody LimitesSinaisVitaisRequest request,
            @AuthenticationPrincipal UsuarioPrincipal usuario
    ) {
        return service.atualizarPaciente(pacienteId, request, usuario.id());
    }

    @DeleteMapping("/api/pacientes/{pacienteId}/limites-sinais-vitais")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','MEDICO','ENFERMEIRA')")
    public LimitesSinaisVitaisResponse restaurarPadraoPaciente(@PathVariable Long pacienteId) {
        return service.restaurarPadraoPaciente(pacienteId);
    }
}
