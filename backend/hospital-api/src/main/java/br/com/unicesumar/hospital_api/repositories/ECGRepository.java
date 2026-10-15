package br.com.unicesumar.hospital_api.repositories;

import br.com.unicesumar.hospital_api.models.ECG;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ECGRepository extends JpaRepository<ECG, Long> {

    List<ECG> findByPacienteId(Long pacienteId);
    List<ECG> findByAtendimentoId(Long atendimentoId);
    List<ECG> findByPacienteIdOrderByDataHoraDesc(Long pacienteId);
}