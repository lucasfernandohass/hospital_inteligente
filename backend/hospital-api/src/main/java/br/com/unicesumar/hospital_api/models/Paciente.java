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
@Table(
    name = "paciente",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_paciente_numero_prontuario", columnNames = "numero_prontuario")
    }
)
@PrimaryKeyJoinColumn(name = "id")
public class Paciente extends Pessoa {

    @Column(name = "numero_prontuario", nullable = false, length = 20)
    private String numeroProntuario;

    @Column(nullable = false, length = 100)
    private String convenio;
}