package br.com.unicesumar.hospital_api.controllers;

import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import br.com.unicesumar.hospital_api.services.AgendaMedicaService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/agendas-medicas")
@PreAuthorize("hasAnyRole('ADMINISTRADOR','RECEPCIONISTA','MEDICO')")
public class AgendaMedicaController extends AbstractDomainController<DomainRequestDTOs.AgendaMedica, DomainResponseDTOs.AgendaMedica> {
    public AgendaMedicaController(AgendaMedicaService service) { super(service); }
}
