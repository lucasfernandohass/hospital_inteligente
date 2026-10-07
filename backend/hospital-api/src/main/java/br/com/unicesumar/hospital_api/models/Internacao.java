package br.com.unicesumar.hospital_api.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "internacao")
public class Internacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "paciente_id", nullable = false)
    private Long pacienteId;

    @Column(name = "leito_id", nullable = false)
    private Long leitoId;

    @Column(name = "data_internacao", nullable = false)
    private LocalDate dataInternacao;

    @Column(name = "data_prevista_alta", nullable = true)
    private LocalDate dataPrevistaAlta;

    @Column(name = "data_alta", nullable = true)
    private LocalDate dataAlta;

    @Column(nullable = false, length = 500)
    private String motivo;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(length = 500, nullable = true)
    private String observacoes;
}