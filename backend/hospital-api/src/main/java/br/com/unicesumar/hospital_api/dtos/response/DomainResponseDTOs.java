package br.com.unicesumar.hospital_api.dtos.response;

import java.time.*;

public final class DomainResponseDTOs {
    private DomainResponseDTOs() {}
    public record Paciente(Long id, String nome, String cpf, LocalDate dataNascimento, String telefone, String endereco, String numeroProntuario, String convenio) {}
    public record Medicamento(Long id, String nome, String dosagem, Boolean ativo) {}
    public record Leito(Long id, String numero, Integer andar, String quarto, String tipo, String status, String observacao) {}
    public record Atendimento(Long id, LocalDateTime data, String tipo, String descricao, String status, Long leitoId, Long pacienteId, Long funcionarioResponsavelId, Long medicoResponsavelId) {}
    public record Internacao(Long id, Long pacienteId, Long leitoId, LocalDate dataInternacao, LocalDate dataPrevistaAlta, LocalDate dataAlta, String motivo, String status, String observacoes) {}
    public record AgendaMedica(Long id, Long medicoId, LocalDateTime horaInicio, LocalDateTime horaFim, String status, String tipoConsulta, String observacoes) {}
    public record Agendamento(Long id, Long pacienteId, Long medicoId, LocalDate data, LocalTime horario, Integer duracao, String status, String tipo, String observacoes) {}
    public record Prescricao(Long id, LocalDateTime data, String observacao, String status, Long pacienteId, Long medicoId, Long atendimentoId) {}
    public record ItemPrescricao(Long id, Long prescricaoId, Long medicamentoId, String dose, String viaAdministracao, String frequencia, String duracao, String observacoes) {}
    public record AdministracaoMedicamento(Long id, LocalDateTime dataHora, String dose, String via, String observacao, Long itemPrescricaoId, Long pacienteId, Long administradoPor) {}
    public record ExameImagem(Long id, LocalDateTime dataSolicitacao, String status, String observacoes, String modalidade, String regiaoCorpo, String arquivoDigital) {}
    public record ExameLaboratorial(Long id, LocalDateTime dataSolicitacao, String status, String observacoes, String tipoAnalise, String amostra, String metodo) {}
    public record ECG(Long id, LocalDateTime dataHora, Integer frequenciaCardiaca, String ritmo, Integer intervaloPR, Integer duracaoQRS, String eixo, String observacao, Long pacienteId, Long atendimentoId) {}
    public record ResultadoExame(Long id, LocalDateTime dataLiberacao, String laudo, String arquivoAnexo, Boolean liberado) {}
    public record Alerta(Long id, String tipo, String mensagem, LocalDateTime dataHora, String nivel, Boolean ativo, Long pacienteId) {}
    public record RegistroClinico(Long id, LocalDateTime data, String descricao, String anamnese, String exameFisico, String diagnostico, String conduta, String observacao, Long medicoId, Long atendimentoId) {}
    public record FichaAtendimento(Long id, Long atendimentoId, Long pacienteId, Integer versao, LocalDateTime emitidoEm, Long emitidoPor, String hashConteudo, String arquivoPdf) {}
}
