package br.com.unicesumar.hospital_api.services;

import br.com.unicesumar.hospital_api.exception.BusinessException;
import br.com.unicesumar.hospital_api.repositories.AtendimentoRepository;
import br.com.unicesumar.hospital_api.repositories.ItemPrescricaoRepository;
import org.springframework.stereotype.Component;

@Component
class VinculosClinicos {
    private final AtendimentoRepository atendimentos;
    private final ItemPrescricaoRepository itens;

    VinculosClinicos(AtendimentoRepository atendimentos, ItemPrescricaoRepository itens) {
        this.atendimentos = atendimentos;
        this.itens = itens;
    }

    void validarPacienteDoAtendimento(Long pacienteId, Long atendimentoId) {
        // Referências inexistentes continuam sujeitas às chaves estrangeiras do banco.
        atendimentos.findById(atendimentoId).ifPresent(atendimento -> {
            if (!pacienteId.equals(atendimento.getPacienteId())) {
                throw new BusinessException("O atendimento informado pertence a outro paciente.");
            }
        });
    }

    void validarPacienteDaPrescricao(Long pacienteId, Long itemId) {
        itens.findById(itemId).ifPresent(item -> {
            if (!pacienteId.equals(item.getPrescricao().getPacienteId())) {
                throw new BusinessException("O item da prescrição informado pertence a outro paciente.");
            }
        });
    }
}
