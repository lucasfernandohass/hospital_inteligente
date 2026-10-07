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
@Table(
    name = "ficha_atendimento",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_ficha_atendimento_versao",
            columnNames = {"atendimento_id", "versao"}
        )
    }
)
public class FichaAtendimento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "atendimento_id", nullable = false)
    private Long atendimentoId;

    @Column(name = "paciente_id", nullable = false)
    private Long pacienteId;

    @Column(nullable = false)
    private Integer versao;

    @Column(name = "emitido_em", nullable = false)
    private LocalDateTime emitidoEm;

    @Column(name = "emitido_por", nullable = false)
    private Long emitidoPor;

    @Column(name = "hash_conteudo", nullable = false, length = 64)
    private String hashConteudo;

    @Column(name = "arquivo_pdf", nullable = false, length = 255)
    private String arquivoPdf;
}