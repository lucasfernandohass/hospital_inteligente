package br.com.unicesumar.hospital_api.repositories;

import br.com.unicesumar.hospital_api.models.AgendaMedica;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AgendaMedicaRepository extends JpaRepository<AgendaMedica, Long> {

    List<AgendaMedica> findByMedicoId(Long medicoId);
    List<AgendaMedica> findByMedicoIdAndHoraInicioBetween(
        Long medicoId, LocalDateTime inicio, LocalDateTime fim
    );
    List<AgendaMedica> findByStatus(String status);
}