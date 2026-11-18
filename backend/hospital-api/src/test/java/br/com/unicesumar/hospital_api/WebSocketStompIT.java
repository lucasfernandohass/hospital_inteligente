package br.com.unicesumar.hospital_api;

import static org.awaitility.Awaitility.await;
import static org.junit.jupiter.api.Assertions.*;

import java.net.URI;
import java.net.http.WebSocket;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageType;
import org.springframework.messaging.simp.broker.SimpleBrokerMessageHandler;
import org.springframework.messaging.support.MessageBuilder;

class WebSocketStompIT extends BackendTransportFixture {
    @Autowired private SimpleBrokerMessageHandler broker;

    @Test
    void exigeTokenNoConnect() throws Exception {
        try (var ws = abrir(null)) {
            ws.expect("ERROR");
        }
    }

    @Test
    void rejeitaTokenInvalidoNoConnect() throws Exception {
        try (var ws = abrir("token-invalido")) {
            ws.expect("ERROR");
        }
    }

    @Test
    void rejeitaInscricaoForaDosTopicosPermitidos() throws Exception {
        try (var ws = conectar(adminToken())) {
            ws.subscribe("/topic/fora-do-contrato");
            ws.expect("ERROR");
        }
    }

    @Test
    void rejeitaPublicacaoDoCliente() throws Exception {
        try (var ws = conectar(adminToken())) {
            ws.send("SEND\ndestination:/app/teste-qa\n\n{}");
            ws.expect("ERROR");
        }
    }

    @Test
    void entregaApenasSinaisDoPacienteInscrito() throws Exception {
        String token = adminToken();
        int primeiro = internar(token);
        int segundo = internar(token);

        try (var a = conectar(token); var b = conectar(token)) {
            a.subscribe(topic(primeiro));
            b.subscribe(topic(segundo));
            aguardarInscricoes(primeiro, 1);
            aguardarInscricoes(segundo, 1);

            expect(202, ingerir(primeiro, 76));
            expect(202, ingerir(segundo, 94));
            verificarMedida(a, primeiro, 76);
            verificarMedida(b, segundo, 94);
            a.verificarSilencio();
            b.verificarSilencio();
        }
    }

    @Test
    void desconexaoRemoveInscricaoEReconexaoExigeNovaInscricaoSemReplay() throws Exception {
        String token = adminToken();
        int paciente = internar(token);

        try (var anterior = conectar(token)) {
            anterior.subscribe(topic(paciente));
            aguardarInscricoes(paciente, 1);
            expect(202, ingerir(paciente, 70));
            verificarMedida(anterior, paciente, 70);
            anterior.send("DISCONNECT\n\n");
        }
        aguardarInscricoes(paciente, 0);
        expect(202, ingerir(paciente, 80));

        try (var nova = conectar(token)) {
            assertEquals(80, JsonPath.<Integer>read(request("GET",
                    "/api/pacientes/" + paciente + "/sinais-vitais/atuais", token, null).body(), "$[0].valor"));
            nova.subscribe(topic(paciente));
            aguardarInscricoes(paciente, 1);
            expect(202, ingerir(paciente, 90));
            verificarMedida(nova, paciente, 90);
            nova.verificarSilencio();
        }
    }

    private int internar(String token) throws Exception {
        int paciente = paciente(token);
        id(request("POST", INTERNACOES, token, internacao(paciente, leito(token), "null", "ATIVA")));
        return paciente;
    }

    private StompSocket conectar(String token) throws Exception {
        var ws = abrir(token);
        try {
            ws.expect("CONNECTED");
            return ws;
        } catch (Exception | AssertionError e) {
            ws.close();
            throw e;
        }
    }

    private StompSocket abrir(String token) throws Exception {
        var listener = new StompSocket();
        listener.socket = http.newWebSocketBuilder().subprotocols("v12.stomp")
                .connectTimeout(Duration.ofSeconds(5))
                .buildAsync(URI.create("ws://127.0.0.1:" + port + "/ws"), listener)
                .get(5, TimeUnit.SECONDS);
        try {
            listener.send("CONNECT\naccept-version:1.2\nhost:localhost\n"
                    + (token == null ? "" : "Authorization:Bearer " + token + "\n") + "\n");
            return listener;
        } catch (Exception e) {
            listener.close();
            throw e;
        }
    }

    private void aguardarInscricoes(int paciente, int total) {
        var headers = SimpMessageHeaderAccessor.create(SimpMessageType.MESSAGE);
        headers.setDestination(topic(paciente));
        var sondagem = MessageBuilder.createMessage(new byte[0], headers.getMessageHeaders());
        await().atMost(Duration.ofSeconds(5)).untilAsserted(() ->
                assertEquals(total, broker.getSubscriptionRegistry().findSubscriptions(sondagem).values()
                        .stream().mapToInt(java.util.Collection::size).sum()));
    }

    private static String topic(int paciente) {
        return "/topic/pacientes/" + paciente + "/sinais-vitais";
    }

    private static void verificarMedida(StompSocket ws, int paciente, int valor) throws Exception {
        String frame = ws.expect("MESSAGE");
        assertTrue(frame.contains("destination:" + topic(paciente) + "\n"));
        String body = frame.substring(frame.indexOf("\n\n") + 2);
        assertEquals(paciente, JsonPath.<Integer>read(body, "$.pacienteId"));
        assertEquals(valor, JsonPath.<Integer>read(body, "$.valor"));
        assertEquals("bpm", JsonPath.<String>read(body, "$.unidade"));
    }

    private static final class StompSocket implements WebSocket.Listener, AutoCloseable {
        private final LinkedBlockingQueue<String> frames = new LinkedBlockingQueue<>();
        private final StringBuilder buffer = new StringBuilder();
        private WebSocket socket;

        @Override
        public CompletableFuture<Void> onText(WebSocket ws, CharSequence data, boolean last) {
            buffer.append(data);
            int end;
            while ((end = buffer.indexOf("\0")) >= 0) {
                frames.add(buffer.substring(0, end).stripLeading());
                buffer.delete(0, end + 1);
            }
            ws.request(1);
            return CompletableFuture.completedFuture(null);
        }

        void send(String frame) throws Exception {
            socket.sendText(frame + "\0", true).get(5, TimeUnit.SECONDS);
        }

        void subscribe(String topic) throws Exception {
            send("SUBSCRIBE\nid:qa-1\ndestination:" + topic + "\nack:auto\n\n");
        }

        String expect(String command) throws InterruptedException {
            String frame = frames.poll(5, TimeUnit.SECONDS);
            assertNotNull(frame, () -> "Frame " + command + " não recebido");
            assertEquals(command, frame.lines().findFirst().orElse(""));
            return frame;
        }

        void verificarSilencio() throws InterruptedException {
            assertNull(frames.poll(300, TimeUnit.MILLISECONDS), "Mensagem STOMP inesperada");
        }

        @Override
        public void close() {
            socket.abort();
        }
    }
}
