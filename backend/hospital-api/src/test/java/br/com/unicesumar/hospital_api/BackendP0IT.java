package br.com.unicesumar.hospital_api;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.Instant;
import java.util.Base64;
import java.util.Date;

import com.jayway.jsonpath.JsonPath;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
@ContextConfiguration(initializers = QaDatabaseInitializer.class)
@Transactional
class BackendP0IT {
    private static final String INGESTAO = "/api/ingestao/sinais-vitais";
    private static final String PADRAO = "/api/configuracoes/limites-sinais-vitais";
    private static final String ADMIN_EMAIL = "admin@qa.example.test";
    private static final String SENHA_SINTETICA = "Fixture-QA-Backend-2026";
    private static final String CADASTRO = """
            {"nome":"Conta sintetica QA","cpf":"%s","dataNascimento":"1990-01-01",
             "matricula":"QA-%s","dataAdmissao":"2024-01-01","email":"%s","senha":"%s"%s}
            """;

    @Autowired private WebApplicationContext context;
    private MockMvc mvc;

    @BeforeEach
    void configurarMvc() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void criaPrimeiroAdministradorUmaVezEAutenticaComSenhaCorreta() throws Exception {
        criarAdmin();
        json(post("/api/auth/setup"), cadastro("00000000002", "outro@qa.example.test", ""))
                .andExpect(status().isConflict());
        json(post("/api/auth/login"), login(ADMIN_EMAIL, SENHA_SINTETICA))
                .andExpect(status().isOk()).andExpect(jsonPath("$.role").value("ADMINISTRADOR"))
                .andExpect(jsonPath("$.token").isNotEmpty()).andExpect(jsonPath("$.senha").doesNotExist());
        json(post("/api/auth/login"), login(ADMIN_EMAIL, "Senha-Incorreta-QA"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.token").doesNotExist());
    }

    @Test
    void retorna401ParaRequisicaoSemToken() throws Exception {
        verificarNaoAutenticado(mvc.perform(get(PADRAO)));
    }

    @Test
    void retorna401ParaRequisicaoComTokenInvalido() throws Exception {
        verificarNaoAutenticado(mvc.perform(get(PADRAO).header("Authorization", bearer("token-invalido"))));
    }

    @Test
    void retorna401ParaRequisicaoComTokenExpirado() throws Exception {
        criarAdmin();
        var key = Keys.hmacShaKeyFor(Base64.getDecoder().decode(QaDatabaseInitializer.jwtSecret()));
        String expirado = Jwts.builder().subject(ADMIN_EMAIL)
                .expiration(Date.from(Instant.now().minusSeconds(60))).signWith(key).compact();
        verificarNaoAutenticado(mvc.perform(get(PADRAO).header("Authorization", bearer(expirado))));
    }

    @Test
    void recebeLoteDerivaLeitoERetornaUltimoSinalNoSnapshot() throws Exception {
        String admin = criarAdmin();
        int paciente = criarPaciente(admin);
        int leito = id(json(post("/api/leitos").header("Authorization", admin), """
                {"numero":"QA-01","andar":1,"quarto":"QA","tipo":"UTI","status":"Disponivel"}
                """).andExpect(status().isCreated()));
        json(post("/api/internacoes").header("Authorization", admin), """
                {"pacienteId":%d,"leitoId":%d,"dataInternacao":"2026-01-01","motivo":"Fixture","status":"ATIVA"}
                """.formatted(paciente, leito)).andExpect(status().isCreated());

        ingerir(lote(paciente, "{\"tipo\":\"FREQUENCIA_CARDIACA\",\"valor\":72}"))
                .andExpect(status().isAccepted()).andExpect(jsonPath("$[0].pacienteId").value(paciente))
                .andExpect(jsonPath("$[0].leitoId").value(leito)).andExpect(jsonPath("$[0].unidade").value("bpm"));
        ingerir(lote(paciente, "{\"tipo\":\"FREQUENCIA_CARDIACA\",\"valor\":-1}"))
                .andExpect(status().isUnprocessableContent());
        mvc.perform(get(snapshot(paciente)).header("Authorization", admin))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].valor").value(72));
    }

    @Test
    void rejeitaChaveAusenteOuIncorretaELotesInvalidos() throws Exception {
        String medida = "{\"tipo\":\"TEMPERATURA\",\"valor\":37}";
        json(post(INGESTAO), lote(123, medida)).andExpect(status().isForbidden());
        json(post(INGESTAO).header("X-Monitor-Api-Key", "incorreta"), lote(123, medida))
                .andExpect(status().isForbidden());
        ingerir(lote(123, "")).andExpect(status().isBadRequest());
        ingerir(lote(123, "{\"tipo\":\"ECG\",\"valor\":37}")).andExpect(status().isBadRequest());
        ingerir(lote(123, "{\"tipo\":\"TEMPERATURA\"}")).andExpect(status().isBadRequest());
    }

    @Test
    void rejeitaIngestaoParaPacienteCadastradoSemInternacao() throws Exception {
        String admin = criarAdmin();
        int paciente = criarPaciente(admin);
        ingerir(lote(paciente, "{\"tipo\":\"TEMPERATURA\",\"valor\":37}"))
                .andExpect(status().isNotFound());
        mvc.perform(get(snapshot(paciente)).header("Authorization", admin))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void aplicaPermissoesEPersistePersonalizacaoComAuditoriaERestauracao() throws Exception {
        String admin = criarAdmin();
        String medico = criarFuncionario(admin, "00000001163", "medico",
                ",\"role\":\"MEDICO\",\"crm\":\"QA-11\",\"especialidade\":\"Clinica\"");
        String enfermeira = criarFuncionario(admin, "00000001244", "enfermeira",
                ",\"role\":\"ENFERMEIRA\",\"coren\":\"QA-12\",\"setor\":\"QA\"");
        String recepcao = criarFuncionario(admin, "00000001325", "recepcao",
                ",\"role\":\"RECEPCIONISTA\",\"setor\":\"QA\"");
        String url = "/api/pacientes/" + criarPaciente(admin) + "/limites-sinais-vitais";
        int autor = JsonPath.read(json(post("/api/auth/login"), login("medico@qa.example.test", SENHA_SINTETICA))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString(), "$.id");

        mvc.perform(get(PADRAO).header("Authorization", recepcao)).andExpect(status().isForbidden());
        json(put(PADRAO).header("Authorization", medico), limites(111)).andExpect(status().isForbidden());
        json(put(PADRAO).header("Authorization", admin), limites(130)).andExpect(status().isBadRequest());
        json(put(PADRAO).header("Authorization", admin), limites(112)).andExpect(status().isOk());
        mvc.perform(get(url).header("Authorization", enfermeira))
                .andExpect(status().isOk()).andExpect(jsonPath("$.personalizado").value(false))
                .andExpect(jsonPath("$.fcAlertaMax").value(112));
        json(put(url).header("Authorization", medico), limites(115)).andExpect(status().isOk());
        mvc.perform(get(url).header("Authorization", enfermeira))
                .andExpect(status().isOk()).andExpect(jsonPath("$.personalizado").value(true))
                .andExpect(jsonPath("$.fcAlertaMax").value(115))
                .andExpect(jsonPath("$.atualizadoPorId").value(autor))
                .andExpect(jsonPath("$.atualizadoEm").isNotEmpty());
        mvc.perform(delete(url).header("Authorization", enfermeira)).andExpect(status().isOk());
        mvc.perform(get(url).header("Authorization", medico))
                .andExpect(status().isOk()).andExpect(jsonPath("$.personalizado").value(false))
                .andExpect(jsonPath("$.fcAlertaMax").value(112));
    }

    private String criarAdmin() throws Exception {
        return token(json(post("/api/auth/setup"), cadastro("00000000001", ADMIN_EMAIL, ""))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.role").value("ADMINISTRADOR"))
                .andExpect(jsonPath("$.senha").doesNotExist()));
    }

    private String criarFuncionario(String admin, String cpf, String nome, String campos) throws Exception {
        String email = nome + "@qa.example.test";
        json(post("/api/funcionarios").header("Authorization", admin), cadastro(cpf, email, campos))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.senha").doesNotExist());
        return token(json(post("/api/auth/login"), login(email, SENHA_SINTETICA)).andExpect(status().isOk()));
    }

    private int criarPaciente(String admin) throws Exception {
        return id(json(post("/api/pacientes").header("Authorization", admin), """
                {"nome":"Paciente sintetico","cpf":"00000000021","dataNascimento":"1990-01-01",
                 "numeroProntuario":"QA-21","convenio":"Fixture"}
                """).andExpect(status().isCreated()));
    }

    private ResultActions ingerir(String body) throws Exception {
        return json(post(INGESTAO).header("X-Monitor-Api-Key", QaDatabaseInitializer.monitorKey()), body);
    }

    private ResultActions json(MockHttpServletRequestBuilder request, String body) throws Exception {
        return mvc.perform(request.contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private static void verificarNaoAutenticado(ResultActions result) throws Exception {
        result.andExpect(status().isUnauthorized())
                .andExpect(header().string("WWW-Authenticate", "Bearer"))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.detail").isNotEmpty());
    }

    private static String cadastro(String cpf, String email, String campos) {
        return CADASTRO.formatted(cpf, cpf, email, SENHA_SINTETICA, campos);
    }

    private static String login(String email, String senha) {
        return "{\"email\":\"%s\",\"senha\":\"%s\"}".formatted(email, senha);
    }

    private static String token(ResultActions result) throws Exception {
        return bearer(JsonPath.<String>read(result.andReturn().getResponse().getContentAsString(), "$.token"));
    }

    private static int id(ResultActions result) throws Exception {
        return JsonPath.read(result.andReturn().getResponse().getContentAsString(), "$.id");
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }

    private static String snapshot(int paciente) {
        return "/api/pacientes/" + paciente + "/sinais-vitais/atuais";
    }

    private static String lote(int paciente, String medidas) {
        return """
                {"pacienteId":%d,"capturadoEm":"2026-01-01T12:00:00","medidas":[%s]}
                """.formatted(paciente, medidas);
    }

    private static String limites(int fcMax) {
        return """
                {"fcAlertaMin":50,"fcAlertaMax":%d,"fcCriticoMin":40,"fcCriticoMax":130,
                 "spo2AlertaMin":92,"spo2CriticoMin":88,"frAlertaMax":24,"frCriticoMax":30,
                 "temperaturaAlertaMax":38,"temperaturaCriticoMax":39,
                 "paSistolicaAlertaMax":140,"paSistolicaCriticoMax":180}
                """.formatted(fcMax);
    }
}
