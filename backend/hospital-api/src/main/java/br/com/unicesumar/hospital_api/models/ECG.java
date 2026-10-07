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
@Table(name = "ecg")
public class ECG {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "data_hora", nullable = false)
    private LocalDateTime dataHora;

    @Column(name = "frequencia_cardiaca", nullable = false)
    private Integer frequenciaCardiaca;

    @Column(nullable = false, length = 80)
    private String ritmo;

    @Column(name = "intervalo_pr", nullable = false)
    private Integer intervaloPR;

    @Column(name = "duracao_qrs", nullable = false)
    private Integer duracaoQRS;

    @Column(length = 30)
    private String eixo;

    @Column(length = 500, nullable = true)
    private String observacao;

    @Column(name = "paciente_id", nullable = false)
    private Long pacienteId;

    @Column(name = "atendimento_id", nullable = false)
    private Long atendimentoId;
}