package br.com.unicesumar.hospital_api.repositories;

import br.com.unicesumar.hospital_api.models.ItemPrescricao;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemPrescricaoRepository extends JpaRepository<ItemPrescricao, Long> {

    List<ItemPrescricao> findByPrescricaoId(Long prescricaoId);
    List<ItemPrescricao> findByMedicamentoId(Long medicamentoId);
}