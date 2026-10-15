package br.com.unicesumar.hospital_api.controllers;

import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import br.com.unicesumar.hospital_api.services.ItemPrescricaoService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/itens-prescricao")
@PreAuthorize("hasAnyRole('ADMINISTRADOR','MEDICO','ENFERMEIRA')")
public class ItemPrescricaoController extends AbstractDomainController<DomainRequestDTOs.ItemPrescricao, DomainResponseDTOs.ItemPrescricao> {
    public ItemPrescricaoController(ItemPrescricaoService service) { super(service); }
}
