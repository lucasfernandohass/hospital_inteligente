package br.com.unicesumar.hospital_api.models;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@MappedSuperclass
public abstract class Exame {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    protected Long id;

    @Column(name = "data_solicitacao", nullable = false)
    protected LocalDateTime dataSolicitacao;

    @Column(nullable = false, length = 30)
    protected String status;

    @Column(length = 500, nullable = true)
    protected String observacoes;
}