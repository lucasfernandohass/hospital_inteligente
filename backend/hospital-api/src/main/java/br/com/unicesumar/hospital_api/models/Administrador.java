package br.com.unicesumar.hospital_api.models;

import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "administrador")
@PrimaryKeyJoinColumn(name = "id")
@NoArgsConstructor
@SuperBuilder
public class Administrador extends Funcionario {
}
