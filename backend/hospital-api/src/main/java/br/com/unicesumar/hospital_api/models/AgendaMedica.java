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
@Table(name = "agenda_medica")
public class AgendaMedica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "medico_id", nullable = false)
    private Long medicoId;

    @Column(name = "hora_inicio", nullable = false)
    private LocalDateTime horaInicio;

    @Column(name = "hora_fim", nullable = false)
    private LocalDateTime horaFim;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "tipo_consulta", nullable = false, length = 80)
    private String tipoConsulta;

    @Column(length = 500, nullable = true)
    private String observacoes;
}