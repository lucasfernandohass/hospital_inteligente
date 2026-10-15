package br.com.unicesumar.hospital_api.repositories;

import br.com.unicesumar.hospital_api.models.Alerta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AlertaRepository extends JpaRepository<Alerta, Long> {

    List<Alerta> findByPacienteId(Long pacienteId);
    List<Alerta> findByPacienteIdAndAtivoTrue(Long pacienteId);
    List<Alerta> findByAtivoTrue();
    List<Alerta> findByNivel(String nivel);
    List<Alerta> findByDataHoraBetween(LocalDateTime inicio, LocalDateTime fim);
}