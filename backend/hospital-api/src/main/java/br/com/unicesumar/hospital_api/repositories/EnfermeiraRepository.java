package br.com.unicesumar.hospital_api.repositories;

import br.com.unicesumar.hospital_api.models.Enfermeira;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EnfermeiraRepository extends JpaRepository<Enfermeira, Long> {

    Optional<Enfermeira> findByCoren(String coren);
    Optional<Enfermeira> findByEmail(String email);

    boolean existsByCoren(String coren);
    boolean existsByEmail(String email);

    List<Enfermeira> findBySetor(String setor);
}