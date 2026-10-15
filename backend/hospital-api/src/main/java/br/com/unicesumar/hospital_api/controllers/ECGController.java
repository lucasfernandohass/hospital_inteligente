package br.com.unicesumar.hospital_api.controllers;

import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import br.com.unicesumar.hospital_api.services.ECGService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ecgs")
@PreAuthorize("hasAnyRole('ADMINISTRADOR','MEDICO')")
public class ECGController extends AbstractDomainController<DomainRequestDTOs.ECG, DomainResponseDTOs.ECG> {
    public ECGController(ECGService service) { super(service); }
}
