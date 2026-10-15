package br.com.unicesumar.hospital_api.services;

import br.com.unicesumar.hospital_api.models.Alerta;
import br.com.unicesumar.hospital_api.repositories.AlertaRepository;
import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class AlertaService extends AbstractDomainService<Alerta, DomainRequestDTOs.Alerta, DomainResponseDTOs.Alerta> {
    public AlertaService(AlertaRepository repository, ObjectMapper mapper) {
        super(repository, mapper, Alerta.class, DomainResponseDTOs.Alerta.class, "alertas");
    }
}
