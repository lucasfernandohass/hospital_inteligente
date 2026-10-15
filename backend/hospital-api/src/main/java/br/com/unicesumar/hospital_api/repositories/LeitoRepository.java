package br.com.unicesumar.hospital_api.repositories;

import br.com.unicesumar.hospital_api.models.Leito;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LeitoRepository extends JpaRepository<Leito, Long> {

    Optional<Leito> findByAndarAndQuartoAndNumero(Integer andar, String quarto, String numero);
    boolean existsByAndarAndQuartoAndNumero(Integer andar, String quarto, String numero);

    List<Leito> findByStatus(String status);
    List<Leito> findByTipo(String tipo);
    List<Leito> findByAndar(Integer andar);
}