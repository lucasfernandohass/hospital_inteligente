package br.com.unicesumar.hospital_api.repositories;

import br.com.unicesumar.hospital_api.models.RegistroClinico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RegistroClinicoRepository extends JpaRepository<RegistroClinico, Long> {

    List<RegistroClinico> findByAtendimentoIdOrderByDataDesc(Long atendimentoId);
    List<RegistroClinico> findByMedicoId(Long medicoId);

    // Buscar todos os registros de um paciente via JOIN com atendimento
    @Query("""
        SELECT r FROM RegistroClinico r
        JOIN Atendimento a ON a.id = r.atendimentoId
        WHERE a.pacienteId = :pacienteId
        ORDER BY r.data DESC
    """)
    List<RegistroClinico> findByPacienteId(@Param("pacienteId") Long pacienteId);
}