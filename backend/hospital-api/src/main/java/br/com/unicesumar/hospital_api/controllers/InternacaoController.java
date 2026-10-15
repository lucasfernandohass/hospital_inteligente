package br.com.unicesumar.hospital_api.controllers;

import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import br.com.unicesumar.hospital_api.services.InternacaoService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/internacoes")
@PreAuthorize("hasAnyRole('ADMINISTRADOR','RECEPCIONISTA','MEDICO','ENFERMEIRA')")
public class InternacaoController extends AbstractDomainController<DomainRequestDTOs.Internacao, DomainResponseDTOs.Internacao> {
    public InternacaoController(InternacaoService service) { super(service); }
}
