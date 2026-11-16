package br.com.unicesumar.hospital_api.dtos.request;

import br.com.unicesumar.hospital_api.models.Role;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record DadosTesteRequest(
        @AssertTrue(message = "Confirme explicitamente a inserção dos dados de demonstração") boolean confirmarInsercao,
        @NotEmpty List<@Valid Usuario> usuarios,
        @NotEmpty List<@Valid Paciente> pacientes,
        @NotEmpty List<@Valid Leito> leitos,
        @NotEmpty List<@Valid Internacao> internacoes,
        List<@Valid Agendamento> agendamentos) {

    public record Usuario(
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

    public record Paciente(
            @NotBlank @Size(max = 150) String nome,
            @NotBlank @Pattern(regexp = "\\d{11}") String cpf,
            @NotNull @Past LocalDate dataNascimento,
            @Size(max = 20) String telefone,
            @Size(max = 255) String endereco,
            @NotBlank @Size(max = 20) String numeroProntuario,
            @NotBlank @Size(max = 100) String convenio,
            @Size(max = 20) String sexo) {}

    public record Leito(
            @NotBlank @Size(max = 20) String numero,
            @NotNull @Positive Integer andar,
            @NotBlank @Size(max = 20) String quarto,
            @NotBlank @Size(max = 50) String tipo,
            @NotBlank @Size(max = 30) String status,
            @Size(max = 500) String observacao,
            @Size(max = 80) String setor) {}

    public record Internacao(
            @NotBlank String numeroProntuario,
            @NotBlank String numeroLeito,
            @NotBlank @Email String emailMedico,
            @NotNull @Positive Integer diasDesdeInternacao,
            @NotNull @Positive Integer diasAteAltaPrevista,
            @NotBlank @Size(max = 500) String motivo,
            @Size(max = 500) String observacoes) {}

    public record Agendamento(
            @NotBlank @Size(max = 40) String chave,
            @NotBlank String numeroProntuario,
            @NotBlank @Email String emailMedico,
            @NotNull @PositiveOrZero Integer diasAteAgendamento,
            @NotNull LocalTime horario,
            @NotNull @Positive Integer duracao,
            @NotBlank @Size(max = 30) String status,
            @NotBlank @Size(max = 80) String tipo,
            @Size(max = 440) String observacoes) {}
}
