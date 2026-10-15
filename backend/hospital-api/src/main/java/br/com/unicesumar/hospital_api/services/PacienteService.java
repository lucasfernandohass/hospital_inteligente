package br.com.unicesumar.hospital_api.services;

import br.com.unicesumar.hospital_api.models.Paciente;
import br.com.unicesumar.hospital_api.repositories.PacienteRepository;
import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class PacienteService extends AbstractDomainService<Paciente, DomainRequestDTOs.Paciente, DomainResponseDTOs.Paciente> {
    public PacienteService(PacienteRepository repository, ObjectMapper mapper) {
        super(repository, mapper, Paciente.class, DomainResponseDTOs.Paciente.class, "pacientes");
    }
}
