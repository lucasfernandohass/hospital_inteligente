package br.com.unicesumar.hospital_api.controllers;

import br.com.unicesumar.hospital_api.dtos.request.DadosTesteRequest;
import br.com.unicesumar.hospital_api.dtos.response.DadosTesteResponse;
import br.com.unicesumar.hospital_api.services.DadosTesteService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dados-teste")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class DadosTesteController {
    private final DadosTesteService service;

    public DadosTesteController(DadosTesteService service) {
        this.service = service;
    }

    @PostMapping
    public DadosTesteResponse inserir(@Valid @RequestBody DadosTesteRequest request) {
        return service.inserir(request);
    }
}
