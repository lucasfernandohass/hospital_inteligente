package br.com.unicesumar.hospital_api.services;

import br.com.unicesumar.hospital_api.models.AgendaMedica;
import br.com.unicesumar.hospital_api.repositories.AgendaMedicaRepository;
import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class AgendaMedicaService extends AbstractDomainService<AgendaMedica, DomainRequestDTOs.AgendaMedica, DomainResponseDTOs.AgendaMedica> {
    public AgendaMedicaService(AgendaMedicaRepository repository, ObjectMapper mapper) {
        super(repository, mapper, AgendaMedica.class, DomainResponseDTOs.AgendaMedica.class, "agendas-medicas");
    }
}
