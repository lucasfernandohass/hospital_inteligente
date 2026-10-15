package br.com.unicesumar.hospital_api.repositories;

import br.com.unicesumar.hospital_api.models.Funcionario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import br.com.unicesumar.hospital_api.models.Role;

public interface FuncionarioRepository extends JpaRepository<Funcionario, Long> {
    Optional<Funcionario> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByCpf(String cpf);
    boolean existsByRole(Role role);
    boolean existsByMatricula(String matricula);
}
