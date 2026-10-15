package br.com.unicesumar.hospital_api.controllers;

import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import br.com.unicesumar.hospital_api.services.ResultadoExameService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/resultados-exame")
@PreAuthorize("hasAnyRole('ADMINISTRADOR','MEDICO')")
public class ResultadoExameController extends AbstractDomainController<DomainRequestDTOs.ResultadoExame, DomainResponseDTOs.ResultadoExame> {
    public ResultadoExameController(ResultadoExameService service) { super(service); }
}
