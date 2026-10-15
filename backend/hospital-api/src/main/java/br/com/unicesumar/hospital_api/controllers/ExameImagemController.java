package br.com.unicesumar.hospital_api.controllers;

import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import br.com.unicesumar.hospital_api.services.ExameImagemService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/exames-imagem")
@PreAuthorize("hasAnyRole('ADMINISTRADOR','MEDICO')")
public class ExameImagemController extends AbstractDomainController<DomainRequestDTOs.ExameImagem, DomainResponseDTOs.ExameImagem> {
    public ExameImagemController(ExameImagemService service) { super(service); }
}
