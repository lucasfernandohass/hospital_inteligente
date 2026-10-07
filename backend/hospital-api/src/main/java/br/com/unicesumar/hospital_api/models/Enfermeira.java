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
@Table(name = "enfermeira")
@PrimaryKeyJoinColumn(name = "id")
public class Enfermeira extends Funcionario {

    @Column(nullable = false, unique = true, length = 20)
    private String coren;

    @Column(nullable = false, length = 80)
    private String setor;
}