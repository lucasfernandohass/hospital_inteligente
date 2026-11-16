package br.com.unicesumar.hospital_api.controllers;

import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import br.com.unicesumar.hospital_api.services.PrescricaoService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@RestController
@RequestMapping("/api/prescricoes")
public class PrescricaoController extends AbstractDomainController<DomainRequestDTOs.Prescricao, DomainResponseDTOs.Prescricao> {
    public PrescricaoController(PrescricaoService service) { super(service); }

    @Override
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','MEDICO','ENFERMEIRA')")
    public List<DomainResponseDTOs.Prescricao> listar() { return super.listar(); }

    @Override
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR','MEDICO','ENFERMEIRA')")
    public DomainResponseDTOs.Prescricao buscar(@PathVariable Long id) { return super.buscar(id); }
}
