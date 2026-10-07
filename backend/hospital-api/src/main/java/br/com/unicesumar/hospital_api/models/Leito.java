package br.com.unicesumar.hospital_api.models;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "leito")
public class Leito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String numero;

    @Column(nullable = false)
    private Integer andar;

    @Column(nullable = false, length = 20)
    private String quarto;

    @Column(nullable = false, length = 50)
    private String tipo;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(length = 500, nullable = true)
    private String observacao;
}