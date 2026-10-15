package br.com.unicesumar.hospital_api.controllers;

import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import br.com.unicesumar.hospital_api.services.AdministracaoMedicamentoService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/administracoes-medicamento")
@PreAuthorize("hasAnyRole('ADMINISTRADOR','MEDICO','ENFERMEIRA')")
public class AdministracaoMedicamentoController extends AbstractDomainController<DomainRequestDTOs.AdministracaoMedicamento, DomainResponseDTOs.AdministracaoMedicamento> {
    public AdministracaoMedicamentoController(AdministracaoMedicamentoService service) { super(service); }
}
