package br.com.unicesumar.hospital_api.controllers;

import br.com.unicesumar.hospital_api.dtos.request.RegistrarAtividadeRequest;
import br.com.unicesumar.hospital_api.dtos.response.RegistroAtividadeResponse;
import br.com.unicesumar.hospital_api.models.Role;
import br.com.unicesumar.hospital_api.security.UsuarioPrincipal;
import br.com.unicesumar.hospital_api.services.RegistroAtividadeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/atividades")
public class RegistroAtividadeController {
    private final RegistroAtividadeService service;

    public RegistroAtividadeController(RegistroAtividadeService service) {
        this.service = service;
    }

    @GetMapping
    public List<RegistroAtividadeResponse> listar(@AuthenticationPrincipal UsuarioPrincipal usuario) {
        return service.listar(usuario.id(), usuario.role().equals(Role.ADMINISTRADOR.name()));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RegistroAtividadeResponse registrar(@AuthenticationPrincipal UsuarioPrincipal usuario,
                                               @Valid @RequestBody RegistrarAtividadeRequest request) {
        return service.registrar(usuario.id(), request);
    }
}
