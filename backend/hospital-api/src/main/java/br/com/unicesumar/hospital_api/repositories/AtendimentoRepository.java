package br.com.unicesumar.hospital_api.repositories;

import br.com.unicesumar.hospital_api.models.Atendimento;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AtendimentoRepository extends JpaRepository<Atendimento, Long> {

    List<Atendimento> findByPacienteId(Long pacienteId);
    List<Atendimento> findByMedicoResponsavelId(Long medicoId);
    List<Atendimento> findByStatus(String status);
    List<Atendimento> findByDataBetween(LocalDateTime inicio, LocalDateTime fim);
    List<Atendimento> findByLeitoId(Long leitoId);
}