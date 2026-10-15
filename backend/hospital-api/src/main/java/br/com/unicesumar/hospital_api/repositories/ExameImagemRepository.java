package br.com.unicesumar.hospital_api.repositories;

import br.com.unicesumar.hospital_api.models.ExameImagem;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExameImagemRepository extends JpaRepository<ExameImagem, Long> {

    List<ExameImagem> findByModalidade(String modalidade);
    List<ExameImagem> findByStatus(String status);
}