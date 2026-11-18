package br.com.unicesumar.hospital_api.repositories;

import br.com.unicesumar.hospital_api.models.LimitesSinaisVitais;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LimitesSinaisVitaisRepository extends JpaRepository<LimitesSinaisVitais, Long> {
    Optional<LimitesSinaisVitais> findByPacienteId(Long pacienteId);
    Optional<LimitesSinaisVitais> findFirstByPacienteIdIsNull();
}
