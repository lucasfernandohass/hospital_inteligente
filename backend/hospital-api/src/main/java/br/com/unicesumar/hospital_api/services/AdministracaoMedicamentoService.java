package br.com.unicesumar.hospital_api.services;

import br.com.unicesumar.hospital_api.models.AdministracaoMedicamento;
import br.com.unicesumar.hospital_api.repositories.AdministracaoMedicamentoRepository;
import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class AdministracaoMedicamentoService extends AbstractDomainService<AdministracaoMedicamento, DomainRequestDTOs.AdministracaoMedicamento, DomainResponseDTOs.AdministracaoMedicamento> {
    public AdministracaoMedicamentoService(AdministracaoMedicamentoRepository repository, ObjectMapper mapper) {
        super(repository, mapper, AdministracaoMedicamento.class, DomainResponseDTOs.AdministracaoMedicamento.class, "administracoes-medicamento");
    }
}
