package br.com.unicesumar.hospital_api.services;

import br.com.unicesumar.hospital_api.models.Internacao;
import br.com.unicesumar.hospital_api.repositories.InternacaoRepository;
import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class InternacaoService extends AbstractDomainService<Internacao, DomainRequestDTOs.Internacao, DomainResponseDTOs.Internacao> {
    public InternacaoService(InternacaoRepository repository, ObjectMapper mapper) {
        super(repository, mapper, Internacao.class, DomainResponseDTOs.Internacao.class, "internacoes");
    }
}
