package br.com.unicesumar.hospital_api;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import com.jayway.jsonpath.JsonPath;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ContextConfiguration;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {"server.address=127.0.0.1", "hospital.qa.schema=transport"})
@ContextConfiguration(initializers = QaDatabaseInitializer.class)
abstract class BackendTransportFixture {
    static final String INTERNACOES = "/api/internacoes";
    static final String LEITOS = "/api/leitos";
    private static final String EMAIL = "transporte@qa.example.test";
    static final String PASSWORD = "Fixture-Transporte-QA-2026";
    private static final AtomicInteger ACCOUNT_SEQUENCE = new AtomicInteger();

    @LocalServerPort int port;
    final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    String adminToken() throws Exception {
        var login = request("POST", "/api/auth/login", null,
                "{\"email\":\"%s\",\"senha\":\"%s\"}".formatted(EMAIL, PASSWORD));
        if (login.statusCode() == 200) return JsonPath.read(login.body(), "$.token");

        var setup = request("POST", "/api/auth/setup", null, """
                {"nome":"Conta QA Transporte","cpf":"00000000031","dataNascimento":"1990-01-01",
                 "matricula":"QA-TRANSPORTE","dataAdmissao":"2024-01-01","email":"%s","senha":"%s"}
                """.formatted(EMAIL, PASSWORD));
        expect(201, setup);
        return JsonPath.read(setup.body(), "$.token");
    }

    int paciente(String token) throws Exception {
        String codigo = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        String cpf = String.format("0%010d", UUID.randomUUID().getLeastSignificantBits() & 0x7fffffffL);
        return id(request("POST", "/api/pacientes", token, """
                {"nome":"Paciente sintético","cpf":"%s","dataNascimento":"1990-01-01",
                 "numeroProntuario":"QA-%s","convenio":"Fixture QA"}
                """.formatted(cpf, codigo)));
    }

    Conta funcionario(String admin, String role, String campos) throws Exception {
        int numero = ACCOUNT_SEQUENCE.incrementAndGet();
        String email = "conta-" + numero + "@qa.example.test";
        String cpf = "%09d".formatted(910000000 + numero);
        cpf += digitoCpf(cpf);
        cpf += digitoCpf(cpf);
        int id = id(request("POST", "/api/funcionarios", admin, """
                {"nome":"Profissional QA %d","cpf":"%s","dataNascimento":"1990-01-01",
                 "matricula":"CLIN-%d","dataAdmissao":"2024-01-01","email":"%s","senha":"%s",
                 "role":"%s",%s}
                """.formatted(numero, cpf, numero, email, PASSWORD, role, campos)));
        var login = request("POST", "/api/auth/login", null,
                "{\"email\":\"%s\",\"senha\":\"%s\"}".formatted(email, PASSWORD));
        expect(200, login);
        return new Conta(id, JsonPath.read(login.body(), "$.token"), email);
    }

    private static int digitoCpf(String cpf) {
        int soma = 0;
        for (int i = 0; i < cpf.length(); i++) soma += (cpf.charAt(i) - '0') * (cpf.length() + 1 - i);
        return soma * 10 % 11 % 10;
    }

    record Conta(int id, String token, String email) {}

    int leito(String token) throws Exception {
        return id(request("POST", LEITOS, token, leitoBody(UUID.randomUUID().toString().substring(0, 12))));
    }

    static String leitoBody(String numero) {
        return """
                {"numero":"%s","andar":1,"quarto":"QA","tipo":"UTI","status":"Disponível"}
                """.formatted(numero);
    }

    static String internacao(int paciente, int leito, String alta, String status) {
        return """
                {"pacienteId":%d,"leitoId":%d,"dataInternacao":"2026-01-01",
                 "dataAlta":%s,"motivo":"Fixture QA","status":"%s"}
                """.formatted(paciente, leito, alta, status);
    }

    HttpResponse<String> ingerir(int paciente, int medida) throws Exception {
        String body = """
                {"pacienteId":%d,"capturadoEm":"2026-01-01T12:00:00",
                 "medidas":[{"tipo":"FREQUENCIA_CARDIACA","valor":%d}]}
                """.formatted(paciente, medida);
        return http.send(HttpRequest.newBuilder(uri("/api/ingestao/sinais-vitais"))
                .timeout(Duration.ofSeconds(10)).header("Content-Type", "application/json")
                .header("X-Monitor-Api-Key", QaDatabaseInitializer.monitorKey())
                .POST(HttpRequest.BodyPublishers.ofString(body)).build(), HttpResponse.BodyHandlers.ofString());
    }

    HttpResponse<String> request(String method, String path, String token, String body) throws Exception {
        var builder = HttpRequest.newBuilder(uri(path)).timeout(Duration.ofSeconds(10))
                .header("Accept", "application/json, application/problem+json");
        if (token != null) builder.header("Authorization", "Bearer " + token);
        if (body != null) builder.header("Content-Type", "application/json");
        return http.send(builder.method(method, body == null ? HttpRequest.BodyPublishers.noBody()
                : HttpRequest.BodyPublishers.ofString(body)).build(), HttpResponse.BodyHandlers.ofString());
    }

    URI uri(String path) {
        return URI.create("http://127.0.0.1:" + port + path);
    }

    static int id(HttpResponse<String> response) {
        expect(201, response);
        return JsonPath.read(response.body(), "$.id");
    }

    static void expect(int status, HttpResponse<String> response) {
        assertEquals(status, response.statusCode());
    }
}
