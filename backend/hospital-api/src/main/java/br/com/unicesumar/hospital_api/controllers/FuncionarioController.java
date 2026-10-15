package br.com.unicesumar.hospital_api.controllers;

import br.com.unicesumar.hospital_api.dtos.request.CriarFuncionarioRequest;
import br.com.unicesumar.hospital_api.dtos.response.FuncionarioResponseDTO;
import br.com.unicesumar.hospital_api.services.FuncionarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/funcionarios")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class FuncionarioController {
    private final FuncionarioService service;
    public FuncionarioController(FuncionarioService service) { this.service = service; }
    @GetMapping public List<FuncionarioResponseDTO> listar() { return service.listar(); }
    @GetMapping("/{id}") public FuncionarioResponseDTO buscar(@PathVariable Long id) { return service.buscar(id); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public FuncionarioResponseDTO criar(@Valid @RequestBody CriarFuncionarioRequest request) { return service.criar(request); }
    @PutMapping("/{id}") public FuncionarioResponseDTO atualizar(@PathVariable Long id, @Valid @RequestBody CriarFuncionarioRequest request) { return service.atualizar(id, request); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void excluir(@PathVariable Long id) { service.excluir(id); }
}
