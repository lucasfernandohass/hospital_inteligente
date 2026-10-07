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
@Table(name = "atendimento")
public class Atendimento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime data;

    @Column(nullable = false, length = 50)
    private String tipo;

    @Column(nullable = false, length = 500)
    private String descricao;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "leito_id", nullable = true)
    private Long leitoId;

    @Column(name = "paciente_id", nullable = false)
    private Long pacienteId;

    @Column(name = "funcionario_responsavel_id", nullable = false)
    private Long funcionarioResponsavelId;

    @Column(name = "medico_responsavel_id", nullable = false)
    private Long medicoResponsavelId;
}