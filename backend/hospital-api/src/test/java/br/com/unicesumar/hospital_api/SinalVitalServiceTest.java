package br.com.unicesumar.hospital_api;

import static br.com.unicesumar.hospital_api.models.TipoSinal.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import br.com.unicesumar.hospital_api.dtos.request.SinaisVitaisRequest;
import br.com.unicesumar.hospital_api.dtos.request.SinaisVitaisRequest.Medida;
import br.com.unicesumar.hospital_api.dtos.websocket.SinalVital;
import br.com.unicesumar.hospital_api.exception.BusinessException;
import br.com.unicesumar.hospital_api.exception.ResourceNotFoundException;
import br.com.unicesumar.hospital_api.models.Internacao;
import br.com.unicesumar.hospital_api.models.TipoSinal;
import br.com.unicesumar.hospital_api.repositories.InternacaoRepository;
import br.com.unicesumar.hospital_api.services.SinalVitalService;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;

class SinalVitalServiceTest {
    private static final LocalDateTime CAPTURA = LocalDateTime.of(2026, 1, 1, 12, 0);
    private final InternacaoRepository internacoes = mock(InternacaoRepository.class);
    private final SimpMessagingTemplate mensagens = mock(SimpMessagingTemplate.class);
    private final SinalVitalService service = new SinalVitalService(internacoes, mensagens);

    @Test
    void publicaOsSeisSinaisComUnidadesELeitoDaInternacao() {
        internar(1, 30);
        var resultado = service.receber(new SinaisVitaisRequest(1L, CAPTURA, List.of(
                medida(TEMPERATURA, "36.7"), medida(PRESSAO_SISTOLICA, "120"),
                medida(PRESSAO_DIASTOLICA, "80"), medida(FREQUENCIA_CARDIACA, "72"),
                medida(FREQUENCIA_RESPIRATORIA, "16"), medida(SATURACAO_OXIGENIO, "98"))));

        var esperados = List.of(
                sinal(TEMPERATURA, "36.7", "\u00b0C"), sinal(PRESSAO_SISTOLICA, "120", "mmHg"),
                sinal(PRESSAO_DIASTOLICA, "80", "mmHg"), sinal(FREQUENCIA_CARDIACA, "72", "bpm"),
                sinal(FREQUENCIA_RESPIRATORIA, "16", "irpm"), sinal(SATURACAO_OXIGENIO, "98", "%"));
        assertEquals(esperados, resultado);
        assertEquals(esperados, service.atuais(1L));
        for (var sinal : esperados) {
            verify(mensagens).convertAndSend("/topic/pacientes/1/sinais-vitais", sinal);
        }
        verifyNoMoreInteractions(mensagens);
    }

    @Test
    void rejeitaLoteQueContemValorNegativoSemAplicarMedidasValidasDoMesmoLote() {
        internar(1, 30);
        service.receber(new SinaisVitaisRequest(1L, CAPTURA, List.of(medida(FREQUENCIA_CARDIACA, "72"))));
        var anteriores = service.atuais(1L);
        clearInvocations(mensagens);

        var lote = new SinaisVitaisRequest(1L, CAPTURA.plusSeconds(1),
                List.of(medida(FREQUENCIA_CARDIACA, "90"), medida(SATURACAO_OXIGENIO, "-1")));
        assertThrows(BusinessException.class, () -> service.receber(lote));
        assertEquals(anteriores, service.atuais(1L));
        verifyNoInteractions(mensagens);
    }

    @Test
    void rejeitaPacienteSemInternacaoAtiva() {
        when(internacoes.findByPacienteIdAndDataAltaIsNull(1L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.receber(
                new SinaisVitaisRequest(1L, CAPTURA, List.of(medida(FREQUENCIA_CARDIACA, "72")))));
        assertTrue(service.atuais(1L).isEmpty());
        verifyNoInteractions(mensagens);
    }

    @Test
    void preservaUltimaMedidaPorTipoEPacienteQuandoChegaUmLoteAtrasado() {
        internar(1, 30);
        internar(2, 31);
        service.receber(new SinaisVitaisRequest(1L, CAPTURA, List.of(medida(FREQUENCIA_CARDIACA, "75"))));
        service.receber(new SinaisVitaisRequest(2L, CAPTURA, List.of(medida(FREQUENCIA_CARDIACA, "62"))));
        service.receber(new SinaisVitaisRequest(1L, CAPTURA.minusSeconds(1),
                List.of(medida(FREQUENCIA_CARDIACA, "40"), medida(SATURACAO_OXIGENIO, "97"))));

        assertEquals(List.of(sinal(FREQUENCIA_CARDIACA, "75", "bpm"),
                new SinalVital(1L, 30L, SATURACAO_OXIGENIO, new BigDecimal("97"), "%", CAPTURA.minusSeconds(1))),
                service.atuais(1L));
        assertEquals(List.of(new SinalVital(2L, 31L, FREQUENCIA_CARDIACA, new BigDecimal("62"), "bpm", CAPTURA)),
                service.atuais(2L));
    }

    private void internar(long paciente, long leito) {
        var internacao = new Internacao();
        internacao.setLeitoId(leito);
        when(internacoes.findByPacienteIdAndDataAltaIsNull(paciente)).thenReturn(Optional.of(internacao));
    }

    private static Medida medida(TipoSinal tipo, String valor) {
        return new Medida(tipo, new BigDecimal(valor));
    }

    private static SinalVital sinal(TipoSinal tipo, String valor, String unidade) {
        return new SinalVital(1L, 30L, tipo, new BigDecimal(valor), unidade, CAPTURA);
    }
}
