package br.com.unicesumar.hospital_api.services;

import br.com.unicesumar.hospital_api.models.FichaAtendimento;
import br.com.unicesumar.hospital_api.repositories.FichaAtendimentoRepository;
import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class FichaAtendimentoService extends AbstractDomainService<FichaAtendimento, DomainRequestDTOs.FichaAtendimento, DomainResponseDTOs.FichaAtendimento> {
    public FichaAtendimentoService(FichaAtendimentoRepository repository, ObjectMapper mapper) {
        super(repository, mapper, FichaAtendimento.class, DomainResponseDTOs.FichaAtendimento.class, "fichas-atendimento");
    }
}
