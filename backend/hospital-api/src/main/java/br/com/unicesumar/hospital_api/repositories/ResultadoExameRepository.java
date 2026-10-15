package br.com.unicesumar.hospital_api.repositories;

import br.com.unicesumar.hospital_api.models.ResultadoExame;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.time.LocalDateTime;

public interface ResultadoExameRepository extends JpaRepository<ResultadoExame, Long> {

    List<ResultadoExame> findByLiberadoFalse();
    List<ResultadoExame> findByLiberadoTrue();
    List<ResultadoExame> findByDataLiberacaoBetween(LocalDateTime inicio, LocalDateTime fim);
}