package br.com.unicesumar.hospital_api.services;

import br.com.unicesumar.hospital_api.models.Agendamento;
import br.com.unicesumar.hospital_api.repositories.AgendamentoRepository;
import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class AgendamentoService extends AbstractDomainService<Agendamento, DomainRequestDTOs.Agendamento, DomainResponseDTOs.Agendamento> {
    public AgendamentoService(AgendamentoRepository repository, ObjectMapper mapper) {
        super(repository, mapper, Agendamento.class, DomainResponseDTOs.Agendamento.class, "agendamentos");
    }
}
