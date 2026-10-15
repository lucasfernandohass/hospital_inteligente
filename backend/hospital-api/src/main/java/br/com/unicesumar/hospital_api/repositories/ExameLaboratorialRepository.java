package br.com.unicesumar.hospital_api.repositories;

import br.com.unicesumar.hospital_api.models.ExameLaboratorial;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExameLaboratorialRepository extends JpaRepository<ExameLaboratorial, Long> {

    List<ExameLaboratorial> findByTipoAnalise(String tipoAnalise);
    List<ExameLaboratorial> findByStatus(String status);
    List<ExameLaboratorial> findByAmostra(String amostra);
}