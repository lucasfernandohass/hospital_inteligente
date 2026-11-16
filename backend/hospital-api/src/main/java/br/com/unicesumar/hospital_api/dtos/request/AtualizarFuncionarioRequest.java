package br.com.unicesumar.hospital_api.dtos.request;

import br.com.unicesumar.hospital_api.models.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record AtualizarFuncionarioRequest(
        @NotBlank @Size(max = 150) String nome,
        @NotBlank @Pattern(regexp = "\\d{11}") String cpf,
        @NotNull @Past LocalDate dataNascimento,
        @Size(max = 20) String telefone,
        @Size(max = 255) String endereco,
        @NotBlank @Size(max = 30) String matricula,
        @NotNull @PastOrPresent LocalDate dataAdmissao,
        @NotBlank @Email @Size(max = 150) String email,
        @Size(min = 12, max = 72) String senha,
        @NotNull Role role,
        @Size(max = 20) String crm,
        @Size(max = 80) String especialidade,
        @Size(max = 20) String coren,
        @Size(max = 80) String setor) {}
