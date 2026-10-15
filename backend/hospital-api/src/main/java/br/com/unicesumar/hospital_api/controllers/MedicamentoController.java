package br.com.unicesumar.hospital_api.controllers;

import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import br.com.unicesumar.hospital_api.services.MedicamentoService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/medicamentos")
@PreAuthorize("hasAnyRole('ADMINISTRADOR','MEDICO','ENFERMEIRA')")
public class MedicamentoController extends AbstractDomainController<DomainRequestDTOs.Medicamento, DomainResponseDTOs.Medicamento> {
    public MedicamentoController(MedicamentoService service) { super(service); }
}
