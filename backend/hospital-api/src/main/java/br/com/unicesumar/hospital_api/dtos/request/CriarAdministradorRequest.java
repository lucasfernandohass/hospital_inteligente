package br.com.unicesumar.hospital_api.dtos.request;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record CriarAdministradorRequest(
        @NotBlank @Size(max = 150) String nome,
        @NotBlank @Pattern(regexp = "\\d{11}") String cpf,
        @NotNull @Past LocalDate dataNascimento,
        @Size(max = 20) String telefone,
        @Size(max = 255) String endereco,
        @NotBlank @Size(max = 30) String matricula,
        @NotNull @PastOrPresent LocalDate dataAdmissao,
        @NotBlank @Email @Size(max = 150) String email,
        @NotBlank @Size(min = 12, max = 72) String senha) {}
