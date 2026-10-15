package br.com.unicesumar.hospital_api.services;

import br.com.unicesumar.hospital_api.models.Medicamento;
import br.com.unicesumar.hospital_api.repositories.MedicamentoRepository;
import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class MedicamentoService extends AbstractDomainService<Medicamento, DomainRequestDTOs.Medicamento, DomainResponseDTOs.Medicamento> {
    public MedicamentoService(MedicamentoRepository repository, ObjectMapper mapper) {
        super(repository, mapper, Medicamento.class, DomainResponseDTOs.Medicamento.class, "medicamentos");
    }
}
