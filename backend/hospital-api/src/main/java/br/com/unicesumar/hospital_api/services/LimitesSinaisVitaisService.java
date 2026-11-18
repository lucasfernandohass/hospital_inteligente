package br.com.unicesumar.hospital_api.services;

import br.com.unicesumar.hospital_api.dtos.request.LimitesSinaisVitaisRequest;
import br.com.unicesumar.hospital_api.dtos.response.LimitesSinaisVitaisResponse;
import br.com.unicesumar.hospital_api.models.LimitesSinaisVitais;
import br.com.unicesumar.hospital_api.repositories.LimitesSinaisVitaisRepository;
import br.com.unicesumar.hospital_api.repositories.PacienteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
public class LimitesSinaisVitaisService {
    private final LimitesSinaisVitaisRepository limites;
    private final PacienteRepository pacientes;

    public LimitesSinaisVitaisService(LimitesSinaisVitaisRepository limites, PacienteRepository pacientes) {
        this.limites = limites;
        this.pacientes = pacientes;
    }

    @Transactional(readOnly = true)
    public LimitesSinaisVitaisResponse buscarPadrao() {
        return paraResponse(padrao(), false);
    }

    @Transactional
    public LimitesSinaisVitaisResponse atualizarPadrao(LimitesSinaisVitaisRequest request, Long funcionarioId) {
        LimitesSinaisVitais config = padrao();
        aplicar(config, request);
        config.setAtualizadoPorId(funcionarioId);
        config.setAtualizadoEm(LocalDateTime.now());
        return paraResponse(limites.save(config), false);
    }

    @Transactional(readOnly = true)
    public LimitesSinaisVitaisResponse buscarPaciente(Long pacienteId) {
        validarPaciente(pacienteId);
        return limites.findByPacienteId(pacienteId)
                .map(config -> paraResponse(config, true))
                .orElseGet(() -> paraResponse(padrao(), false));
    }

    @Transactional
    public LimitesSinaisVitaisResponse atualizarPaciente(Long pacienteId, LimitesSinaisVitaisRequest request, Long funcionarioId) {
        validarPaciente(pacienteId);
        LimitesSinaisVitais config = limites.findByPacienteId(pacienteId).orElseGet(LimitesSinaisVitais::new);
        config.setPacienteId(pacienteId);
        aplicar(config, request);
        config.setAtualizadoPorId(funcionarioId);
        config.setAtualizadoEm(LocalDateTime.now());
        return paraResponse(limites.save(config), true);
    }

    @Transactional
    public LimitesSinaisVitaisResponse restaurarPadraoPaciente(Long pacienteId) {
        validarPaciente(pacienteId);
        limites.findByPacienteId(pacienteId).ifPresent(limites::delete);
        return buscarPaciente(pacienteId);
    }

    private LimitesSinaisVitais padrao() {
        return limites.findFirstByPacienteIdIsNull()
                .orElseThrow(() -> new IllegalStateException("Configuração padrão de limites vitais não encontrada"));
    }

    private void validarPaciente(Long pacienteId) {
        if (!pacientes.existsById(pacienteId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente não encontrado");
        }
    }

    private void aplicar(LimitesSinaisVitais config, LimitesSinaisVitaisRequest request) {
        config.setFcAlertaMin(request.fcAlertaMin());
        config.setFcAlertaMax(request.fcAlertaMax());
        config.setFcCriticoMin(request.fcCriticoMin());
        config.setFcCriticoMax(request.fcCriticoMax());
        config.setSpo2AlertaMin(request.spo2AlertaMin());
        config.setSpo2CriticoMin(request.spo2CriticoMin());
        config.setFrAlertaMax(request.frAlertaMax());
        config.setFrCriticoMax(request.frCriticoMax());
        config.setTemperaturaAlertaMax(request.temperaturaAlertaMax());
        config.setTemperaturaCriticoMax(request.temperaturaCriticoMax());
        config.setPaSistolicaAlertaMax(request.paSistolicaAlertaMax());
        config.setPaSistolicaCriticoMax(request.paSistolicaCriticoMax());
    }

    private LimitesSinaisVitaisResponse paraResponse(LimitesSinaisVitais config, boolean personalizado) {
        return new LimitesSinaisVitaisResponse(
                config.getPacienteId(),
                personalizado,
                config.getFcAlertaMin(),
                config.getFcAlertaMax(),
                config.getFcCriticoMin(),
                config.getFcCriticoMax(),
                config.getSpo2AlertaMin(),
                config.getSpo2CriticoMin(),
                config.getFrAlertaMax(),
                config.getFrCriticoMax(),
                config.getTemperaturaAlertaMax(),
                config.getTemperaturaCriticoMax(),
                config.getPaSistolicaAlertaMax(),
                config.getPaSistolicaCriticoMax(),
                config.getAtualizadoPorId(),
                config.getAtualizadoEm()
        );
    }
}
