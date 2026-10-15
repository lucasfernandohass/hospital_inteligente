package br.com.unicesumar.hospital_api.repositories;

import br.com.unicesumar.hospital_api.models.Medicamento;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MedicamentoRepository extends JpaRepository<Medicamento, Long> {

    List<Medicamento> findByAtivoTrue();
    Optional<Medicamento> findByNomeAndDosagem(String nome, String dosagem);
    boolean existsByNomeAndDosagem(String nome, String dosagem);
}