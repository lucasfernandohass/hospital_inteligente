package br.com.unicesumar.hospital_api.controllers;

import br.com.unicesumar.hospital_api.services.AbstractDomainService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import br.com.unicesumar.hospital_api.security.ApiAuthorization;
import org.springframework.web.bind.annotation.*;
import java.util.List;

public abstract class AbstractDomainController<Q, S> {
    @Autowired private ApiAuthorization authorization;
    protected final AbstractDomainService<?, Q, S> service;
    protected AbstractDomainController(AbstractDomainService<?, Q, S> service) { this.service = service; }
    public String getResourceKey() { return service.getResourceKey(); }
    @GetMapping public List<S> listar() { exigirPermissao(false); return service.listar(); }
    @GetMapping("/{id}") public S buscar(@PathVariable Long id) { exigirPermissao(false); return service.buscar(id); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public S criar(@Valid @RequestBody Q request) { exigirPermissao(true); return service.criar(request); }
    @PutMapping("/{id}") public S atualizar(@PathVariable Long id, @Valid @RequestBody Q request) { exigirPermissao(true); return service.atualizar(id, request); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void excluir(@PathVariable Long id) { exigirPermissao(true); service.excluir(id); }
    private void exigirPermissao(boolean escrita) {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean permitido = escrita ? authorization.podeEscrever(authentication, getResourceKey()) : authorization.podeLer(authentication, getResourceKey());
        if (!permitido) throw new AccessDeniedException("Acesso negado ao recurso " + getResourceKey());
    }
}
