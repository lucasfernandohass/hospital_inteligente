package br.com.unicesumar.hospital_api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;

@TestPropertySource(properties = {
        "app.cors.allowed-origin-patterns=http://127.0.0.1:18543",
        "app.websocket.allowed-origin-patterns=http://127.0.0.1:18543"
})
class DemonstracaoProbe extends BackendTransportFixture {
    @Test
    void recebeLancamentoLaravelNoNavegador() throws Exception {
        String php = System.getenv("HOSPITAL_QA_DEMO_PHP");
        assertTrue(php != null && Files.isRegularFile(Path.of(php)), "Informe o PHP portátil da execução de QA.");
        String admin = adminToken();
        Conta enfermeira = funcionario(admin, "ENFERMEIRA", "\"coren\":\"QA-DEMO\",\"setor\":\"QA\"");
        int paciente = paciente(admin);
        int leito = leito(admin);
        id(request("POST", INTERNACOES, admin, internacao(paciente, leito, "null", "ATIVA")));

        Path frontend = Path.of("..", "..", "frontend").toAbsolutePath().normalize();
        var runner = new ProcessBuilder("node", "node_modules/@playwright/test/cli.js", "test")
                .directory(frontend.toFile()).inheritIO();
        var env = runner.environment();
        env.put("HOSPITAL_QA_DEMO_API", uri("").toString());
        env.put("HOSPITAL_QA_DEMO_PATIENT", Integer.toString(paciente));
        env.put("HOSPITAL_QA_DEMO_EMAIL", enfermeira.email());
        env.put("HOSPITAL_QA_DEMO_PASSWORD", PASSWORD);
        Process browser = runner.start();
        try {
            assertTrue(browser.waitFor(90, TimeUnit.SECONDS), "A verificação no navegador excedeu o tempo.");
            assertEquals(0, browser.exitValue(), "O cenário integrado falhou. Consulte o relatório Playwright.");
        } finally {
            if (browser.isAlive()) {
                browser.descendants().forEach(ProcessHandle::destroy);
                browser.destroy();
            }
        }
    }
}
