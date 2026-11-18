package br.com.unicesumar.hospital_api.services;

import br.com.unicesumar.hospital_api.models.ECG;
import br.com.unicesumar.hospital_api.repositories.ECGRepository;
import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class ECGService extends AbstractDomainService<ECG, DomainRequestDTOs.ECG, DomainResponseDTOs.ECG> {
    private final VinculosClinicos vinculos;

    public ECGService(ECGRepository repository, ObjectMapper mapper, VinculosClinicos vinculos) {
        super(repository, mapper, ECG.class, DomainResponseDTOs.ECG.class, "ecgs");
        this.vinculos = vinculos;
    }

    @Override
    protected ECG toEntity(DomainRequestDTOs.ECG request) {
        vinculos.validarPacienteDoAtendimento(request.pacienteId(), request.atendimentoId());
        return super.toEntity(request);
    }
}
