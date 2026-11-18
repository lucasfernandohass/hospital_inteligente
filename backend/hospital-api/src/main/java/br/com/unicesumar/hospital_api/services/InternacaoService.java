package br.com.unicesumar.hospital_api.services;

import br.com.unicesumar.hospital_api.models.Internacao;
import br.com.unicesumar.hospital_api.models.Leito;
import br.com.unicesumar.hospital_api.repositories.InternacaoRepository;
import br.com.unicesumar.hospital_api.repositories.LeitoRepository;
import br.com.unicesumar.hospital_api.dtos.request.DomainRequestDTOs;
import br.com.unicesumar.hospital_api.dtos.response.DomainResponseDTOs;
import br.com.unicesumar.hospital_api.exception.ResourceNotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InternacaoService extends AbstractDomainService<Internacao, DomainRequestDTOs.Internacao, DomainResponseDTOs.Internacao> {
    private final InternacaoRepository internacoes;
    private final LeitoRepository leitos;

    public InternacaoService(InternacaoRepository repository, ObjectMapper mapper, LeitoRepository leitos) {
        super(repository, mapper, Internacao.class, DomainResponseDTOs.Internacao.class, "internacoes");
        this.internacoes = repository;
        this.leitos = leitos;
    }

    @Override
    @Transactional
    public DomainResponseDTOs.Internacao criar(DomainRequestDTOs.Internacao request) {
        if (request.dataAlta() == null) ocupar(bloquearLeito(request.leitoId()));
        return super.criar(request);
    }

    @Override
    @Transactional
    public DomainResponseDTOs.Internacao atualizar(Long id, DomainRequestDTOs.Internacao request) {
        Internacao atual = bloquearInternacao(id);
        if (atual.getDataAlta() != null) throw new IllegalStateException("A internação já foi encerrada.");

        Long origem = atual.getLeitoId();
        Long destino = request.leitoId();
        if (request.dataAlta() != null) {
            if (!origem.equals(destino)) throw new IllegalStateException("O leito da internação não pode mudar na alta.");
            bloquearLeito(origem).setStatus("Disponível");
        } else if (!origem.equals(destino)) {
            // A mesma ordem de bloqueio evita que transferências inversas aguardem uma à outra.
            Leito primeiro = bloquearLeito(Math.min(origem, destino));
            Leito segundo = bloquearLeito(Math.max(origem, destino));
            Leito anterior = origem.equals(primeiro.getId()) ? primeiro : segundo;
            Leito novo = destino.equals(primeiro.getId()) ? primeiro : segundo;
            ocupar(novo);
            anterior.setStatus("Disponível");
        }
        return super.atualizar(id, request);
    }

    @Override
    @Transactional
    public void excluir(Long id) {
        Internacao atual = bloquearInternacao(id);
        if (atual.getDataAlta() == null) bloquearLeito(atual.getLeitoId()).setStatus("Disponível");
        internacoes.delete(atual);
    }

    private Internacao bloquearInternacao(Long id) {
        return internacoes.buscarParaAtualizacao(id)
                .orElseThrow(() -> new ResourceNotFoundException("internacoes", id));
    }

    private Leito bloquearLeito(Long id) {
        return leitos.buscarParaAtualizacao(id).orElseThrow(() -> new ResourceNotFoundException("leitos", id));
    }

    private void ocupar(Leito leito) {
        String status = leito.getStatus().strip();
        if (!status.equalsIgnoreCase("Disponível") && !status.equalsIgnoreCase("Disponivel")) {
            throw new IllegalStateException("O leito não está disponível para internação.");
        }
        leito.setStatus("Ocupado");
    }
}
