package br.com.unicesumar.hospital_api.models;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(name = "exame_laboratorial")
@PrimaryKeyJoinColumn(name = "id")
public class ExameLaboratorial extends Exame {

    @Column(name = "tipo_analise", nullable = false, length = 80)
    private String tipoAnalise;

    @Column(nullable = false, length = 50)
    private String amostra;

    @Column(nullable = false, length = 80)
    private String metodo;
}