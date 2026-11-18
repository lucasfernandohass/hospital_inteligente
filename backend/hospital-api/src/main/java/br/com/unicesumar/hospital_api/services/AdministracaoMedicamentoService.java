package br.com.unicesumar.hospital_api.services;

import br.com.unicesumar.hospital_api.models.AdministracaoMedicamento;
import br.com.unicesumar.hospital_api.repositories.AdministracaoMedicamentoRepository;
import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class AdministracaoMedicamentoService extends AbstractDomainService<AdministracaoMedicamento, DomainRequestDTOs.AdministracaoMedicamento, DomainResponseDTOs.AdministracaoMedicamento> {
    private final VinculosClinicos vinculos;

    public AdministracaoMedicamentoService(AdministracaoMedicamentoRepository repository, ObjectMapper mapper, VinculosClinicos vinculos) {
        super(repository, mapper, AdministracaoMedicamento.class, DomainResponseDTOs.AdministracaoMedicamento.class, "administracoes-medicamento");
        this.vinculos = vinculos;
    }

    @Override
    protected AdministracaoMedicamento toEntity(DomainRequestDTOs.AdministracaoMedicamento request) {
        vinculos.validarPacienteDaPrescricao(request.pacienteId(), request.itemPrescricaoId());
        return super.toEntity(request);
    }
}
