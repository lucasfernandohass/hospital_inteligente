package br.com.unicesumar.hospital_api.models;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(name = "funcionario")
@PrimaryKeyJoinColumn(name = "id")
public abstract class Funcionario extends Pessoa {

    @Column(nullable = false, unique = true, length = 30)
    protected String matricula;

    @Column(nullable = false, length = 80)
    protected String cargo;

    @Column(name = "data_admissao", nullable = false)
    protected LocalDate dataAdmissao;

    @Column(nullable = false, unique = true, length = 150)
    protected String email;

    @Column(nullable = false, length = 100)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String senha;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;
}
