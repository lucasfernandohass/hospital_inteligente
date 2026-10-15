package br.com.unicesumar.hospital_api.controllers;

import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import br.com.unicesumar.hospital_api.services.ExameLaboratorialService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/exames-laboratoriais")
@PreAuthorize("hasAnyRole('ADMINISTRADOR','MEDICO')")
public class ExameLaboratorialController extends AbstractDomainController<DomainRequestDTOs.ExameLaboratorial, DomainResponseDTOs.ExameLaboratorial> {
    public ExameLaboratorialController(ExameLaboratorialService service) { super(service); }
}
