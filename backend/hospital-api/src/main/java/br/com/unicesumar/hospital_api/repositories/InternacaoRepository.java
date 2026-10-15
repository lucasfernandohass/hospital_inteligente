package br.com.unicesumar.hospital_api.repositories;

import br.com.unicesumar.hospital_api.models.Internacao;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InternacaoRepository extends JpaRepository<Internacao, Long> {

    List<Internacao> findByPacienteId(Long pacienteId);

    // Internação ativa = sem data de alta
    Optional<Internacao> findByLeitoIdAndDataAltaIsNull(Long leitoId);
    List<Internacao> findByDataAltaIsNull();
    Optional<Internacao> findByPacienteIdAndDataAltaIsNull(Long pacienteId);

    boolean existsByLeitoIdAndDataAltaIsNull(Long leitoId);
}