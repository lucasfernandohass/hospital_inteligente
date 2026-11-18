package br.com.unicesumar.hospital_api;

import static org.junit.jupiter.api.Assertions.*;

import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;

class InternacaoLeitoIT extends BackendTransportFixture {
    @Test
    void ocupaLeitoNaInternacaoLiberaNaAltaEMantemHistorico() throws Exception {
        String token = adminToken();
        int paciente = paciente(token);
        int leito = leito(token);
        int registro = id(request("POST", INTERNACOES, token, internacao(paciente, leito, "null", "ATIVA")));
        assertStatusLeito(token, leito, "Ocupado");
        expect(202, ingerir(paciente, 76));

        String url = INTERNACOES + "/" + registro;
        String alta = internacao(paciente, leito, "\"2026-01-02\"", "ALTA");
        expect(200, request("PUT", url, token, alta));
        assertStatusLeito(token, leito, "Disponível");
        expect(404, ingerir(paciente, 81));
        assertEquals("2026-01-02", JsonPath.<String>read(request("GET", url, token, null).body(), "$.dataAlta"));

        id(request("POST", INTERNACOES, token, internacao(paciente(token), leito, "null", "ATIVA")));
        problema(409, request("PUT", url, token, alta));
        assertStatusLeito(token, leito, "Ocupado");
    }

    @Test
    void permiteSomenteUmaInternacaoSimultaneaNoMesmoLeito() throws Exception {
        String token = adminToken();
        int leito = leito(token);
        String primeiro = internacao(paciente(token), leito, "null", "ATIVA");
        String segundo = internacao(paciente(token), leito, "null", "ATIVA");
        var resultados = concorrer(() -> request("POST", INTERNACOES, token, primeiro),
                () -> request("POST", INTERNACOES, token, segundo));
        verificarConflito(resultados, 201);
        assertEquals(1, totalAtivas(token, "leitoId", leito));
    }

    @Test
    void permiteSomenteUmaInternacaoSimultaneaParaOMesmoPaciente() throws Exception {
        String token = adminToken();
        int paciente = paciente(token);
        int primeiroLeito = leito(token);
        int segundoLeito = leito(token);
        var resultados = concorrer(
                () -> request("POST", INTERNACOES, token, internacao(paciente, primeiroLeito, "null", "ATIVA")),
                () -> request("POST", INTERNACOES, token, internacao(paciente, segundoLeito, "null", "ATIVA")));
        verificarConflito(resultados, 201);
        assertEquals(1, totalAtivas(token, "pacienteId", paciente));
        var vencedora = resultados.stream().filter(r -> r.statusCode() == 201).findFirst().orElseThrow();
        int leitoOcupado = JsonPath.read(vencedora.body(), "$.leitoId");
        assertStatusLeito(token, leitoOcupado, "Ocupado");
        assertStatusLeito(token, leitoOcupado == primeiroLeito ? segundoLeito : primeiroLeito, "Disponível");
    }

    @Test
    void permiteSomenteUmaAltaSimultaneaParaAMesmaInternacao() throws Exception {
        String token = adminToken();
        int paciente = paciente(token);
        int leito = leito(token);
        int registro = id(request("POST", INTERNACOES, token, internacao(paciente, leito, "null", "ATIVA")));
        String url = INTERNACOES + "/" + registro;
        String alta = internacao(paciente, leito, "\"2026-01-02\"", "ALTA");
        verificarConflito(concorrer(() -> request("PUT", url, token, alta),
                () -> request("PUT", url, token, alta)), 200);
        assertStatusLeito(token, leito, "Disponível");
        assertEquals(0, totalAtivas(token, "pacienteId", paciente));
    }

    @Test
    void rejeitaLeitoEmManutencaoSemCriarInternacao() throws Exception {
        String token = adminToken();
        int paciente = paciente(token);
        String body = leitoBody("MANUT-" + paciente).replace("Disponível", "Manutenção");
        int leito = id(request("POST", LEITOS, token, body));
        problema(409, request("POST", INTERNACOES, token, internacao(paciente, leito, "null", "ATIVA")));
        assertEquals(0, totalAtivas(token, "pacienteId", paciente));
        assertStatusLeito(token, leito, "Manutenção");
    }

    @Test
    void transfereInternacaoAtivaEExclusaoLiberaSomenteLeitoAtual() throws Exception {
        String token = adminToken();
        int paciente = paciente(token);
        int destino = leito(token);
        int origem = leito(token);
        int registro = id(request("POST", INTERNACOES, token, internacao(paciente, origem, "null", "ATIVA")));
        String url = INTERNACOES + "/" + registro;

        expect(200, request("PUT", url, token, internacao(paciente, destino, "null", "ATIVA")));
        assertStatusLeito(token, origem, "Disponível");
        assertStatusLeito(token, destino, "Ocupado");
        assertEquals(destino, JsonPath.<Integer>read(ingerir(paciente, 74).body(), "$[0].leitoId"));

        id(request("POST", INTERNACOES, token, internacao(paciente(token), origem, "null", "ATIVA")));
        expect(204, request("DELETE", url, token, null));
        assertStatusLeito(token, origem, "Ocupado");
        assertStatusLeito(token, destino, "Disponível");
        expect(404, ingerir(paciente, 75));
    }

    @Test
    void altaComDataInvalidaOuMudancaDeLeitoMantemInternacaoAtiva() throws Exception {
        String token = adminToken();
        int paciente = paciente(token);
        int leito = leito(token);
        int outroLeito = leito(token);
        int registro = id(request("POST", INTERNACOES, token, internacao(paciente, leito, "null", "ATIVA")));
        String url = INTERNACOES + "/" + registro;

        problema(409, request("PUT", url, token, internacao(paciente, leito, "\"2025-01-01\"", "ALTA")));
        problema(409, request("PUT", url, token, internacao(paciente, outroLeito, "\"2026-01-02\"", "ALTA")));
        assertEquals(1, totalAtivas(token, "pacienteId", paciente));
        assertStatusLeito(token, leito, "Ocupado");
        assertStatusLeito(token, outroLeito, "Disponível");
    }

    @Test
    void traduzValidacaoReferenciaEIntegridadeEmProblemDetail() throws Exception {
        String token = adminToken();
        int paciente = paciente(token);
        int leito = leito(token);
        problema(400, request("POST", INTERNACOES, token, "{}"));
        problema(400, request("POST", INTERNACOES, token, "{"));
        problema(400, request("GET", INTERNACOES + "/invalido", token, null));
        problema(404, request("GET", INTERNACOES + "/99999999", token, null));
        problema(409, request("POST", INTERNACOES, token, internacao(99999999, leito, "null", "ATIVA")));
        problema(409, request("POST", INTERNACOES, token, internacao(paciente, leito, "\"2025-01-01\"", "ALTA")));
        assertEquals(0, totalAtivas(token, "leitoId", leito));
        assertStatusLeito(token, leito, "Disponível");

        String leitoDuplicado = leitoBody("DUP-" + paciente);
        id(request("POST", LEITOS, token, leitoDuplicado));
        problema(409, request("POST", LEITOS, token, leitoDuplicado));
        id(request("POST", INTERNACOES, token, internacao(paciente, leito, "null", "ATIVA")));
        problema(409, request("DELETE", LEITOS + "/" + leito, token, null));
    }

    private void assertStatusLeito(String token, int leito, String status) throws Exception {
        var resposta = request("GET", LEITOS + "/" + leito, token, null);
        expect(200, resposta);
        assertEquals(status, JsonPath.<String>read(resposta.body(), "$.status"));
    }

    private int totalAtivas(String token, String campo, int id) throws Exception {
        var resposta = request("GET", INTERNACOES, token, null);
        expect(200, resposta);
        List<Map<String, Object>> registros = JsonPath.read(resposta.body(), "$");
        return (int) registros.stream()
                .filter(registro -> Integer.valueOf(id).equals(registro.get(campo)) && registro.get("dataAlta") == null)
                .count();
    }

    private static void problema(int status, HttpResponse<String> response) {
        expect(status, response);
        assertTrue(response.headers().firstValue("Content-Type").orElse("").startsWith("application/problem+json"));
        assertEquals(status, JsonPath.<Integer>read(response.body(), "$.status"));
        assertFalse(JsonPath.<String>read(response.body(), "$.detail").isBlank());
    }

    private static void verificarConflito(List<HttpResponse<String>> resultados, int sucesso) {
        assertEquals(List.of(sucesso, 409), resultados.stream().map(HttpResponse::statusCode).sorted().toList());
        problema(409, resultados.stream().filter(r -> r.statusCode() == 409).findFirst().orElseThrow());
    }

    private static List<HttpResponse<String>> concorrer(Callable<HttpResponse<String>> primeiro,
            Callable<HttpResponse<String>> segundo) throws Exception {
        var barreira = new CyclicBarrier(2);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var a = executor.submit(() -> { barreira.await(5, TimeUnit.SECONDS); return primeiro.call(); });
            var b = executor.submit(() -> { barreira.await(5, TimeUnit.SECONDS); return segundo.call(); });
            return List.of(a.get(15, TimeUnit.SECONDS), b.get(15, TimeUnit.SECONDS));
        }
    }
}
