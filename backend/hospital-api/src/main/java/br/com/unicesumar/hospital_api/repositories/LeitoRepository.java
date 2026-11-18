package br.com.unicesumar.hospital_api.repositories;

import br.com.unicesumar.hospital_api.models.Leito;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LeitoRepository extends JpaRepository<Leito, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select l from Leito l where l.id = :id")
    Optional<Leito> buscarParaAtualizacao(@Param("id") Long id);

    Optional<Leito> findByAndarAndQuartoAndNumero(Integer andar, String quarto, String numero);
    boolean existsByAndarAndQuartoAndNumero(Integer andar, String quarto, String numero);

    List<Leito> findByStatus(String status);
    List<Leito> findByTipo(String tipo);
    List<Leito> findByAndar(Integer andar);
}
