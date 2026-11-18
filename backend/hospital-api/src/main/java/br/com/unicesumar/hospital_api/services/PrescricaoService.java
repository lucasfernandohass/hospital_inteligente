package br.com.unicesumar.hospital_api.services;

import br.com.unicesumar.hospital_api.models.Prescricao;
import br.com.unicesumar.hospital_api.repositories.PrescricaoRepository;
import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class PrescricaoService extends AbstractDomainService<Prescricao, DomainRequestDTOs.Prescricao, DomainResponseDTOs.Prescricao> {
    private final VinculosClinicos vinculos;

    public PrescricaoService(PrescricaoRepository repository, ObjectMapper mapper, VinculosClinicos vinculos) {
        super(repository, mapper, Prescricao.class, DomainResponseDTOs.Prescricao.class, "prescricoes");
        this.vinculos = vinculos;
    }

    @Override
    protected Prescricao toEntity(DomainRequestDTOs.Prescricao request) {
        vinculos.validarPacienteDoAtendimento(request.pacienteId(), request.atendimentoId());
        return super.toEntity(request);
    }
}
