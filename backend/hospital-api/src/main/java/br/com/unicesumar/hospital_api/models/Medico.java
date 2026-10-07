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
@Table(name = "medico")
@PrimaryKeyJoinColumn(name = "id")
public class Medico extends Funcionario {

    @Column(nullable = false, unique = true, length = 20)
    private String crm;

    @Column(nullable = false, length = 80)
    private String especialidade;
}
