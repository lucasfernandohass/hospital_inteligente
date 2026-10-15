package br.com.unicesumar.hospital_api.repositories;

import br.com.unicesumar.hospital_api.models.AdministracaoMedicamento;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdministracaoMedicamentoRepository extends JpaRepository<AdministracaoMedicamento, Long> {

    List<AdministracaoMedicamento> findByItemPrescricaoId(Long itemPrescricaoId);
    List<AdministracaoMedicamento> findByPacienteId(Long pacienteId);
    List<AdministracaoMedicamento> findByAdministradoPor(Long funcionarioId);
}