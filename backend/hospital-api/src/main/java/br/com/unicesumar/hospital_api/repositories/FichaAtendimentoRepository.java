package br.com.unicesumar.hospital_api.repositories;

import br.com.unicesumar.hospital_api.models.FichaAtendimento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FichaAtendimentoRepository extends JpaRepository<FichaAtendimento, Long> {

    List<FichaAtendimento> findByAtendimentoIdOrderByVersaoDesc(Long atendimentoId);
    List<FichaAtendimento> findByPacienteId(Long pacienteId);

    @Query("SELECT MAX(f.versao) FROM FichaAtendimento f WHERE f.atendimentoId = :atendimentoId")
    Optional<Integer> findMaxVersaoByAtendimentoId(@Param("atendimentoId") Long atendimentoId);

    Optional<FichaAtendimento> findByAtendimentoIdAndVersao(Long atendimentoId, Integer versao);
}