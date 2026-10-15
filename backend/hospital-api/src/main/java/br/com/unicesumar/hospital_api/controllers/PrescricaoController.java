package br.com.unicesumar.hospital_api.controllers;

import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import br.com.unicesumar.hospital_api.services.PrescricaoService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/prescricoes")
@PreAuthorize("hasAnyRole('ADMINISTRADOR','MEDICO')")
public class PrescricaoController extends AbstractDomainController<DomainRequestDTOs.Prescricao, DomainResponseDTOs.Prescricao> {
    public PrescricaoController(PrescricaoService service) { super(service); }
}
