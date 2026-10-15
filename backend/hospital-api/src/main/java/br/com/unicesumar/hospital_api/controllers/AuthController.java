package br.com.unicesumar.hospital_api.controllers;

import br.com.unicesumar.hospital_api.dtos.request.CriarAdministradorRequest;
import br.com.unicesumar.hospital_api.dtos.request.LoginRequest;
import br.com.unicesumar.hospital_api.dtos.response.AuthResponse;
import br.com.unicesumar.hospital_api.services.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService service;
    public AuthController(AuthService service) { this.service = service; }
    @PostMapping("/login") public AuthResponse login(@Valid @RequestBody LoginRequest request) { return service.login(request); }
    @PostMapping("/setup") @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse setupAdmin(@Valid @RequestBody CriarAdministradorRequest request) { return service.criarPrimeiroAdministrador(request); }
}
