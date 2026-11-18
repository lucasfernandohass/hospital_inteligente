package br.com.unicesumar.hospital_api;

import static br.com.unicesumar.hospital_api.FluxosClinicosIT.campo;
import static org.junit.jupiter.api.Assertions.*;

import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;

class AuditoriaPermissoesIT extends BackendTransportFixture {
    @Test
    void auditoriaVinculaAutoriaAoTokenERestringeConsultaAoProprioAutor() throws Exception {
        String admin = adminToken();
        Conta medico = funcionario(admin, "MEDICO", "\"crm\":\"QA-AUD-M\",\"especialidade\":\"Clinica\"");
        Conta enfermeira = funcionario(admin, "ENFERMEIRA", "\"coren\":\"QA-AUD-E\",\"setor\":\"QA\"");
        String url = "/api/atividades";
        var registro = request("POST", url, enfermeira.token(), """
                {"acao":"  Registro QA  ","entidade":"Atendimento","detalhes":"   ",
                 "funcionarioId":%d,"funcionarioRole":"ADMINISTRADOR","dataHora":"1900-01-01T00:00:00"}
                """.formatted(medico.id()));
        int id = id(registro);
        campo(registro, "$.funcionarioId", enfermeira.id());
        campo(registro, "$.funcionarioRole", "ENFERMEIRA");
        campo(registro, "$.acao", "Registro QA");
        assertNull(JsonPath.<Map<String, Object>>read(registro.body(), "$").get("detalhes"));
        assertFalse(JsonPath.<String>read(registro.body(), "$.dataHora").startsWith("1900-"));

        int outro = id(request("POST", url, medico.token(),
                "{\"acao\":\"Outra atividade QA\",\"entidade\":\"Consulta\"}"));
        assertEquals(List.of(id), ids(request("GET", url, enfermeira.token(), null)));
        assertEquals(List.of(outro), ids(request("GET", url, medico.token(), null)));
        assertTrue(ids(request("GET", url, admin, null)).containsAll(List.of(id, outro)));
        expect(401, request("GET", url, null, null));
        expect(400, request("POST", url, enfermeira.token(), "{\"acao\":\"\",\"entidade\":\"Consulta\"}"));
        var metodoNaoPermitido = request("PUT", url, enfermeira.token(), "{}");
        expect(405, metodoNaoPermitido);
        assertTrue(metodoNaoPermitido.headers().firstValue("Allow").orElse("").contains("POST"));
        campo(metodoNaoPermitido, "$.status", 405);
        assertEquals(List.of(id), ids(request("GET", url, enfermeira.token(), null)));
    }

    @Test
    void auditoriaPreservaNomeEPerfilMesmoAposRemocaoDaConta() throws Exception {
        String admin = adminToken();
        Conta autor = funcionario(admin, "RECEPCIONISTA", "\"setor\":\"QA\"");
        String url = "/api/atividades";
        var original = request("POST", url, autor.token(), "{\"acao\":\"Persistencia QA\",\"entidade\":\"Recepcao\"}");
        int id = id(original);
        String nome = JsonPath.read(original.body(), "$.funcionarioNome");
        expect(204, request("DELETE", "/api/funcionarios/" + autor.id(), admin, null));
        expect(401, request("GET", url, autor.token(), null));
        var leitura = request("GET", url, admin, null);
        expect(200, leitura);
        List<String> nomes = JsonPath.read(leitura.body(), "$[?(@.id == " + id + ")].funcionarioNome");
        List<String> perfis = JsonPath.read(leitura.body(), "$[?(@.id == " + id + ")].funcionarioRole");
        assertEquals(List.of(nome), nomes);
        assertEquals(List.of("RECEPCIONISTA"), perfis);
    }

    @Test
    void matrizHttpRestringeRecursosClinicosEGestaoDeFuncionarios() throws Exception {
        String admin = adminToken();
        Conta medico = funcionario(admin, "MEDICO", "\"crm\":\"QA-PERM-M\",\"especialidade\":\"Clinica\"");
        Conta enfermeira = funcionario(admin, "ENFERMEIRA", "\"coren\":\"QA-PERM-E\",\"setor\":\"QA\"");
        Conta recepcao = funcionario(admin, "RECEPCIONISTA", "\"setor\":\"QA\"");

        for (String token : List.of(admin, medico.token(), enfermeira.token(), recepcao.token())) {
            expect(200, request("GET", "/api/atendimentos", token, null));
        }
        for (String token : List.of(medico.token(), enfermeira.token(), recepcao.token())) {
            expect(403, request("GET", "/api/funcionarios", token, null));
        }
        expect(200, request("GET", "/api/funcionarios", admin, null));
        expect(403, request("GET", "/api/alertas", recepcao.token(), null));
        expect(403, request("GET", "/api/administracoes-medicamento", recepcao.token(), null));
        expect(200, request("GET", "/api/alertas", enfermeira.token(), null));
        expect(200, request("GET", "/api/administracoes-medicamento", medico.token(), null));
    }

    private static List<Integer> ids(HttpResponse<String> response) {
        expect(200, response);
        return JsonPath.read(response.body(), "$[*].id");
    }
}
