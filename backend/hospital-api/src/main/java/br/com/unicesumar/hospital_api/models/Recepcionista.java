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
@Table(name = "recepcionista")
@PrimaryKeyJoinColumn(name = "id")
public class Recepcionista extends Funcionario {

    @Column(nullable = false, length = 80)
    private String setor;
}