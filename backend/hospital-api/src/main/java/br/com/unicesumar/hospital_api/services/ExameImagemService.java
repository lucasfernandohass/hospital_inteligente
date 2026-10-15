package br.com.unicesumar.hospital_api.services;

import br.com.unicesumar.hospital_api.models.ExameImagem;
import br.com.unicesumar.hospital_api.repositories.ExameImagemRepository;
import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class ExameImagemService extends AbstractDomainService<ExameImagem, DomainRequestDTOs.ExameImagem, DomainResponseDTOs.ExameImagem> {
    public ExameImagemService(ExameImagemRepository repository, ObjectMapper mapper) {
        super(repository, mapper, ExameImagem.class, DomainResponseDTOs.ExameImagem.class, "exames-imagem");
    }
}
