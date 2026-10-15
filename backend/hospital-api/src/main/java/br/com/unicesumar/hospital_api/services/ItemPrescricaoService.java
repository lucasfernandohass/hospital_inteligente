package br.com.unicesumar.hospital_api.services;

import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import br.com.unicesumar.hospital_api.exception.ResourceNotFoundException;
import br.com.unicesumar.hospital_api.models.ItemPrescricao;
import br.com.unicesumar.hospital_api.models.Prescricao;
import br.com.unicesumar.hospital_api.repositories.ItemPrescricaoRepository;
import br.com.unicesumar.hospital_api.repositories.PrescricaoRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class ItemPrescricaoService extends AbstractDomainService<ItemPrescricao, DomainRequestDTOs.ItemPrescricao, DomainResponseDTOs.ItemPrescricao> {
    private final PrescricaoRepository prescricaoRepository;
    public ItemPrescricaoService(ItemPrescricaoRepository repository, PrescricaoRepository prescricaoRepository, ObjectMapper mapper) {
        super(repository, mapper, ItemPrescricao.class, DomainResponseDTOs.ItemPrescricao.class, "itens-prescricao");
        this.prescricaoRepository = prescricaoRepository;
    }
    @Override protected ItemPrescricao toEntity(DomainRequestDTOs.ItemPrescricao r) {
        Prescricao p = prescricaoRepository.findById(r.prescricaoId()).orElseThrow(() -> new ResourceNotFoundException("Prescrição", r.prescricaoId()));
        return ItemPrescricao.builder().prescricao(p).medicamentoId(r.medicamentoId()).dose(r.dose())
                .viaAdministracao(r.viaAdministracao()).frequencia(r.frequencia()).duracao(r.duracao()).observacoes(r.observacoes()).build();
    }
    @Override protected DomainResponseDTOs.ItemPrescricao toResponse(ItemPrescricao e) {
        return new DomainResponseDTOs.ItemPrescricao(e.getId(), e.getPrescricao().getId(), e.getMedicamentoId(), e.getDose(),
                e.getViaAdministracao(), e.getFrequencia(), e.getDuracao(), e.getObservacoes());
    }
}
