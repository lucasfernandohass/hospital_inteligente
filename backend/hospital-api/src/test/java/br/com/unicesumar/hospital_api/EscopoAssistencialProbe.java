package br.com.unicesumar.hospital_api;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class EscopoAssistencialProbe extends BackendTransportFixture {
    @Test
    void medicoSemVinculoNaoDeveConsultarRegistroClinicoDeOutroProfissional() throws Exception {
        String admin = adminToken();
        Conta responsavel = funcionario(admin, "MEDICO", "\"crm\":\"QA-ESCOPO-A\",\"especialidade\":\"Clinica\"");
        Conta outro = funcionario(admin, "MEDICO", "\"crm\":\"QA-ESCOPO-B\",\"especialidade\":\"Clinica\"");
        int paciente = paciente(admin);
        int atendimento = id(request("POST", "/api/atendimentos", responsavel.token(), """
                {"data":"2026-01-10T12:30:00","tipo":"CONSULTA","descricao":"Fixture QA","status":"REGISTRADO",
                 "pacienteId":%d,"funcionarioResponsavelId":%d,"medicoResponsavelId":%d}
                """.formatted(paciente, responsavel.id(), responsavel.id())));
        int registro = id(request("POST", "/api/registros-clinicos", responsavel.token(), """
                {"data":"2026-01-10T12:30:00","descricao":"Prontuario sintetico","medicoId":%d,"atendimentoId":%d}
                """.formatted(responsavel.id(), atendimento)));
        String url = "/api/registros-clinicos/" + registro;
        expect(200, request("GET", url, responsavel.token(), null));
        int status = request("GET", url, outro.token(), null).statusCode();

        assertTrue(status == 403 || status == 404, () -> "Esperado acesso negado; HTTP observado: " + status);
    }
}
