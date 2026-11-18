package br.com.unicesumar.hospital_api.dtos.response;

import java.util.List;

public record DadosTesteResponse(
        int funcionariosCriados,
        int pacientesCriados,
        int leitosCriados,
        int internacoesCriadas,
        int agendamentosCriados,
        List<ContaResultado> contas) {

    public record ContaResultado(String nome, String email, String role, String resultado, String senhaTemporaria) {}
}
