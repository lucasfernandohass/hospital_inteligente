package br.com.unicesumar.hospital_api.controllers;

import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import br.com.unicesumar.hospital_api.services.AlertaService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/alertas")
@PreAuthorize("hasAnyRole('ADMINISTRADOR','MEDICO','ENFERMEIRA')")
public class AlertaController extends AbstractDomainController<DomainRequestDTOs.Alerta, DomainResponseDTOs.Alerta> {
    public AlertaController(AlertaService service) { super(service); }
}
