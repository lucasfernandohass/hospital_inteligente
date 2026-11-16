package br.com.unicesumar.hospital_api.repositories;

import br.com.unicesumar.hospital_api.models.RegistroAtividade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RegistroAtividadeRepository extends JpaRepository<RegistroAtividade, Long> {
    List<RegistroAtividade> findAllByOrderByDataHoraDesc();
    List<RegistroAtividade> findByFuncionarioIdOrderByDataHoraDesc(Long funcionarioId);
}
