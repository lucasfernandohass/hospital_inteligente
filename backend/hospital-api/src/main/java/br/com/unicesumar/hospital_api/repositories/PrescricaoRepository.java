package br.com.unicesumar.hospital_api.repositories;

import br.com.unicesumar.hospital_api.models.Prescricao;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PrescricaoRepository extends JpaRepository<Prescricao, Long> {

    List<Prescricao> findByPacienteId(Long pacienteId);
    List<Prescricao> findByMedicoId(Long medicoId);
    List<Prescricao> findByAtendimentoId(Long atendimentoId);
    List<Prescricao> findByStatus(String status);
}