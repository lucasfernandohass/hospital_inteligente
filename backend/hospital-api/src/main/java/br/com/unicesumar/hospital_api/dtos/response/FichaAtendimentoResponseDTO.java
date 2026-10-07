package br.com.unicesumar.hospital_api.dtos.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record FichaAtendimentoResponseDTO(
    Long atendimentoId,
    LocalDateTime dataAtendimento,
    String tipoAtendimento,
    String statusAtendimento,

    Long pacienteId,
    String pacienteNome,
    String pacienteCpf,
    LocalDate pacienteDataNascimento,
    String pacienteTelefone,
    String pacienteEndereco,
    String pacienteNumeroProntuario,
    String pacienteConvenio,

    String medicoResponsavelNome,
    String medicoCrm,
    String medicoEspecialidade,
    String recepcionistaResponsavelNome,

    Long leitoId,
    String leitoNumero,
    String leitoQuarto,
    Integer leitoAndar,

    String descricao,
    String observacoes,

    List<ItemPrescricaoFicha> prescricoes,
    List<ExameFicha> exames,

    Integer versao,
    LocalDateTime emitidoEm,
    String emitidoPorNome
) {

    public record ItemPrescricaoFicha(
        String medicamentoNome,
        String dosagem,
        String dose,
        String viaAdministracao,
        String frequencia,
        String duracao,
        String observacoes
    ) {}

    public record ExameFicha(
        Long exameId,
        String tipo,
        String descricao,
        LocalDateTime dataSolicitacao,
        String status
    ) {}
}