package br.com.unicesumar.hospital_api.services;

import br.com.unicesumar.hospital_api.models.Atendimento;
import br.com.unicesumar.hospital_api.repositories.AtendimentoRepository;
import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class AtendimentoService extends AbstractDomainService<Atendimento, DomainRequestDTOs.Atendimento, DomainResponseDTOs.Atendimento> {
    public AtendimentoService(AtendimentoRepository repository, ObjectMapper mapper) {
        super(repository, mapper, Atendimento.class, DomainResponseDTOs.Atendimento.class, "atendimentos");
    }
}
