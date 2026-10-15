package br.com.unicesumar.hospital_api.repositories;

import br.com.unicesumar.hospital_api.models.Recepcionista;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RecepcionistaRepository extends JpaRepository<Recepcionista, Long> {

    Optional<Recepcionista> findByEmail(String email);
    boolean existsByEmail(String email);

    List<Recepcionista> findBySetor(String setor);
}