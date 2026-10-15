package br.com.unicesumar.hospital_api.repositories;

import br.com.unicesumar.hospital_api.models.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PacienteRepository extends JpaRepository<Paciente, Long> {

    Optional<Paciente> findByCpf(String cpf);
    Optional<Paciente> findByNumeroProntuario(String numeroProntuario);

    boolean existsByCpf(String cpf);
    boolean existsByNumeroProntuario(String numeroProntuario);
}