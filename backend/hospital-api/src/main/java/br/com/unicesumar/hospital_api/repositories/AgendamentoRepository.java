package br.com.unicesumar.hospital_api.repositories;

import br.com.unicesumar.hospital_api.models.Agendamento;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {

    List<Agendamento> findByPacienteId(Long pacienteId);
    List<Agendamento> findByMedicoId(Long medicoId);
    List<Agendamento> findByData(LocalDate data);
    List<Agendamento> findByMedicoIdAndData(Long medicoId, LocalDate data);
    List<Agendamento> findByStatus(String status);
}