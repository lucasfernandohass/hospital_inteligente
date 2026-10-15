package br.com.unicesumar.hospital_api.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "administracao_medicamento")
public class AdministracaoMedicamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "data_hora", nullable = false)
    private LocalDateTime dataHora;

    @Column(nullable = false, length = 50)
    private String dose;

    @Column(nullable = false, length = 50)
    private String via;

    @Column(length = 500, nullable = true)
    private String observacao;

    @Column(name = "item_prescricao_id", nullable = false)
    private Long itemPrescricaoId;

    @Column(name = "paciente_id", nullable = false)
    private Long pacienteId;

    @Column(name = "administrado_por", nullable = false)
    private Long administradoPor;
}