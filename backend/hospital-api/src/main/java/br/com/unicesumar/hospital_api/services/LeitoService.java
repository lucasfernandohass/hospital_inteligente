package br.com.unicesumar.hospital_api.services;

import br.com.unicesumar.hospital_api.models.Leito;
import br.com.unicesumar.hospital_api.repositories.LeitoRepository;
import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class LeitoService extends AbstractDomainService<Leito, DomainRequestDTOs.Leito, DomainResponseDTOs.Leito> {
    public LeitoService(LeitoRepository repository, ObjectMapper mapper) {
        super(repository, mapper, Leito.class, DomainResponseDTOs.Leito.class, "leitos");
    }
}
