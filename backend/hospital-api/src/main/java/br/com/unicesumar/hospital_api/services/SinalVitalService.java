package br.com.unicesumar.hospital_api.services;

import br.com.unicesumar.hospital_api.dtos.request.SinaisVitaisRequest;
import br.com.unicesumar.hospital_api.dtos.websocket.SinalVital;
import br.com.unicesumar.hospital_api.exception.BusinessException;
import br.com.unicesumar.hospital_api.exception.ResourceNotFoundException;
import br.com.unicesumar.hospital_api.models.Internacao;
import br.com.unicesumar.hospital_api.models.TipoSinal;
import br.com.unicesumar.hospital_api.repositories.InternacaoRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SinalVitalService {
    private final InternacaoRepository internacaoRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ConcurrentHashMap<Long, ConcurrentHashMap<TipoSinal, SinalVital>> valoresAtuais = new ConcurrentHashMap<>();

    public SinalVitalService(InternacaoRepository internacaoRepository, SimpMessagingTemplate messagingTemplate) {
        this.internacaoRepository = internacaoRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public List<SinalVital> receber(SinaisVitaisRequest request) {
        Internacao internacao = internacaoRepository.findByPacienteIdAndDataAltaIsNull(request.pacienteId())
                .orElseThrow(() -> new ResourceNotFoundException("Internação ativa do paciente", request.pacienteId()));
        var sinais = request.medidas().stream().map(medida -> {
            if (medida.valor().signum() < 0) throw new BusinessException("O valor do sinal vital não pode ser negativo");
            return new SinalVital(request.pacienteId(), internacao.getLeitoId(), medida.tipo(), medida.valor(),
                    medida.tipo().getUnidade(), request.capturadoEm());
        }).toList();

        var atuaisPaciente = valoresAtuais.computeIfAbsent(request.pacienteId(), ignored -> new ConcurrentHashMap<>());
        sinais.forEach(sinal -> {
            atuaisPaciente.compute(sinal.tipo(), (tipo, atual) -> atual == null || !sinal.capturadoEm().isBefore(atual.capturadoEm()) ? sinal : atual);
            messagingTemplate.convertAndSend("/topic/pacientes/" + sinal.pacienteId() + "/sinais-vitais", sinal);
        });
        return sinais;
    }

    public List<SinalVital> atuais(Long pacienteId) {
        return valoresAtuais.getOrDefault(pacienteId, new ConcurrentHashMap<>()).values().stream()
                .sorted(Comparator.comparing(SinalVital::tipo)).toList();
    }
}
