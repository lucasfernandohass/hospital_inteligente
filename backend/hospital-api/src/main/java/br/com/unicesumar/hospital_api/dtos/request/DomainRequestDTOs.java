package br.com.unicesumar.hospital_api.dtos.request;

import jakarta.validation.constraints.*;
import java.time.*;

public final class DomainRequestDTOs {
    private DomainRequestDTOs() {}
    public record Paciente(@NotBlank @Size(max=150) String nome, @NotBlank @Pattern(regexp="\\d{11}") String cpf, @NotNull @Past LocalDate dataNascimento, String telefone, String endereco, @NotBlank @Size(max=20) String numeroProntuario, @NotBlank @Size(max=100) String convenio) {}
    public record Medicamento(@NotBlank @Size(max=150) String nome, @NotBlank @Size(max=50) String dosagem, @NotNull Boolean ativo) {}
    public record Leito(@NotBlank @Size(max=20) String numero, @NotNull Integer andar, @NotBlank @Size(max=20) String quarto, @NotBlank @Size(max=50) String tipo, @NotBlank @Size(max=30) String status, String observacao) {}
    public record Atendimento(@NotNull LocalDateTime data, @NotBlank @Size(max=50) String tipo, @NotBlank @Size(max=500) String descricao, @NotBlank @Size(max=30) String status, Long leitoId, @NotNull Long pacienteId, @NotNull Long funcionarioResponsavelId, @NotNull Long medicoResponsavelId) {}
    public record Internacao(@NotNull Long pacienteId, @NotNull Long leitoId, @NotNull LocalDate dataInternacao, LocalDate dataPrevistaAlta, LocalDate dataAlta, @NotBlank @Size(max=500) String motivo, @NotBlank @Size(max=30) String status, String observacoes) {}
    public record AgendaMedica(@NotNull Long medicoId, @NotNull LocalDateTime horaInicio, @NotNull LocalDateTime horaFim, @NotBlank @Size(max=30) String status, @NotBlank @Size(max=80) String tipoConsulta, String observacoes) {}
    public record Agendamento(@NotNull Long pacienteId, @NotNull Long medicoId, @NotNull LocalDate data, @NotNull LocalTime horario, @NotNull @Positive Integer duracao, @NotBlank @Size(max=30) String status, @NotBlank @Size(max=80) String tipo, String observacoes) {}
    public record Prescricao(@NotNull LocalDateTime data, String observacao, @NotBlank @Size(max=30) String status, @NotNull Long pacienteId, @NotNull Long medicoId, @NotNull Long atendimentoId) {}
    public record ItemPrescricao(@NotNull Long prescricaoId, @NotNull Long medicamentoId, @NotBlank @Size(max=50) String dose, @NotBlank @Size(max=50) String viaAdministracao, @NotBlank @Size(max=50) String frequencia, @NotBlank @Size(max=50) String duracao, String observacoes) {}
    public record AdministracaoMedicamento(@NotNull LocalDateTime dataHora, @NotBlank @Size(max=50) String dose, @NotBlank @Size(max=50) String via, String observacao, @NotNull Long itemPrescricaoId, @NotNull Long pacienteId, @NotNull Long administradoPor) {}
    public record ExameImagem(@NotNull LocalDateTime dataSolicitacao, @NotBlank @Size(max=30) String status, String observacoes, @NotBlank @Size(max=50) String modalidade, @NotBlank @Size(max=80) String regiaoCorpo, @Size(max=255) String arquivoDigital) {}
    public record ExameLaboratorial(@NotNull LocalDateTime dataSolicitacao, @NotBlank @Size(max=30) String status, String observacoes, @NotBlank @Size(max=80) String tipoAnalise, @NotBlank @Size(max=50) String amostra, @NotBlank @Size(max=80) String metodo) {}
    public record ECG(@NotNull LocalDateTime dataHora, @NotNull @Positive Integer frequenciaCardiaca, @NotBlank @Size(max=80) String ritmo, @NotNull Integer intervaloPR, @NotNull Integer duracaoQRS, String eixo, String observacao, @NotNull Long pacienteId, @NotNull Long atendimentoId) {}
    public record ResultadoExame(@NotNull LocalDateTime dataLiberacao, @NotBlank @Size(max=2000) String laudo, @Size(max=255) String arquivoAnexo, @NotNull Boolean liberado) {}
    public record Alerta(@NotBlank @Size(max=80) String tipo, @NotBlank @Size(max=500) String mensagem, @NotNull LocalDateTime dataHora, @NotBlank @Size(max=30) String nivel, @NotNull Boolean ativo, @NotNull Long pacienteId) {}
    public record RegistroClinico(@NotNull LocalDateTime data, @NotBlank String descricao, String anamnese, String exameFisico, String diagnostico, String conduta, String observacao, @NotNull Long medicoId, @NotNull Long atendimentoId) {}
    public record FichaAtendimento(@NotNull Long atendimentoId, @NotNull Long pacienteId, @NotNull @Positive Integer versao, @NotNull LocalDateTime emitidoEm, @NotNull Long emitidoPor, @NotBlank @Size(min=64,max=64) String hashConteudo, @NotBlank @Size(max=255) String arquivoPdf) {}
}
