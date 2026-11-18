package br.com.unicesumar.hospital_api.repositories;

import br.com.unicesumar.hospital_api.models.Internacao;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InternacaoRepository extends JpaRepository<Internacao, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from Internacao i where i.id = :id")
    Optional<Internacao> buscarParaAtualizacao(@Param("id") Long id);

    List<Internacao> findByPacienteId(Long pacienteId);

    // Internação ativa = sem data de alta
    Optional<Internacao> findByLeitoIdAndDataAltaIsNull(Long leitoId);
    List<Internacao> findByDataAltaIsNull();
    Optional<Internacao> findByPacienteIdAndDataAltaIsNull(Long pacienteId);

    boolean existsByLeitoIdAndDataAltaIsNull(Long leitoId);
}
