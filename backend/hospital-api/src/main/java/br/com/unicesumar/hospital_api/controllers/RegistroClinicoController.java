package br.com.unicesumar.hospital_api.controllers;

import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import br.com.unicesumar.hospital_api.services.RegistroClinicoService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/registros-clinicos")
@PreAuthorize("hasAnyRole('ADMINISTRADOR','MEDICO')")
public class RegistroClinicoController extends AbstractDomainController<DomainRequestDTOs.RegistroClinico, DomainResponseDTOs.RegistroClinico> {
    public RegistroClinicoController(RegistroClinicoService service) { super(service); }
}
