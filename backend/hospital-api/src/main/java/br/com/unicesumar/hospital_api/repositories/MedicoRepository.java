package br.com.unicesumar.hospital_api.repositories;

import br.com.unicesumar.hospital_api.models.Medico;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MedicoRepository extends JpaRepository<Medico, Long> {

    Optional<Medico> findByCrm(String crm);
    Optional<Medico> findByEmail(String email);

    boolean existsByCrm(String crm);
    boolean existsByEmail(String email);

    List<Medico> findByEspecialidade(String especialidade);
}