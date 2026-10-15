package br.com.unicesumar.hospital_api.controllers;

import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import br.com.unicesumar.hospital_api.services.PacienteService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pacientes")
@PreAuthorize("hasAnyRole('ADMINISTRADOR','RECEPCIONISTA','MEDICO','ENFERMEIRA')")
public class PacienteController extends AbstractDomainController<DomainRequestDTOs.Paciente, DomainResponseDTOs.Paciente> {
    public PacienteController(PacienteService service) { super(service); }
}
