package br.com.unicesumar.hospital_api;

import static org.junit.jupiter.api.Assertions.*;

import java.net.http.HttpResponse;
import java.util.List;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class FluxosClinicosIT extends BackendTransportFixture {
    private static final String DATA = "2026-01-10T12:30:00";
    private String admin;
    private Conta medico;
    private Conta enfermagem;
    private Conta recepcao;

    @BeforeAll
    void prepararProfissionais() throws Exception {
        admin = adminToken();
        medico = funcionario(admin, "MEDICO", "\"crm\":\"QA-CLIN-M\",\"especialidade\":\"Clinica\"");
        enfermagem = funcionario(admin, "ENFERMEIRA", "\"coren\":\"QA-CLIN-E\",\"setor\":\"QA\"");
        recepcao = funcionario(admin, "RECEPCIONISTA", "\"setor\":\"QA\"");
    }

    @Test
    void criaAtualizaEConsultaAtendimentoERegistroClinico() throws Exception {
        int paciente = paciente(admin);
        int atendimento = atendimento(paciente);
        String url = "/api/atendimentos/" + atendimento;
        String atualizado = atendimentoBody(paciente, "Reavaliacao sintetica");
        expect(200, request("PUT", url, medico.token(), atualizado));
        var leitura = ler(url, medico.token());
        campo(leitura, "$.pacienteId", paciente);
        campo(leitura, "$.funcionarioResponsavelId", recepcao.id());
        campo(leitura, "$.medicoResponsavelId", medico.id());
        campo(leitura, "$.descricao", "Reavaliacao sintetica");

        int registro = id(request("POST", "/api/registros-clinicos", medico.token(), """
                {"data":"%s","descricao":"Evolucao sintetica","diagnostico":"Diagnostico QA",
                 "conduta":"Conduta QA","medicoId":%d,"atendimentoId":%d}
                """.formatted(DATA, medico.id(), atendimento)));
        var prontuario = ler("/api/registros-clinicos/" + registro, medico.token());
        campo(prontuario, "$.atendimentoId", atendimento);
        campo(prontuario, "$.medicoId", medico.id());
        campo(prontuario, "$.conduta", "Conduta QA");
    }

    @Test
    void rejeitaAtendimentoInvalidoEAcessoIndevidoAoProntuario() throws Exception {
        int paciente = paciente(admin);
        int atendimento = atendimento(paciente);
        expect(400, request("POST", "/api/atendimentos", medico.token(), atendimentoBody(paciente, "")));
        expect(409, request("POST", "/api/atendimentos", medico.token(), atendimentoBody(99999999, "QA")));
        expect(401, request("GET", "/api/atendimentos/" + atendimento, null, null));
        expect(403, request("GET", "/api/registros-clinicos", recepcao.token(), null));
        expect(400, request("POST", "/api/registros-clinicos", medico.token(), "{}"));
        String ficha = """
                {"atendimentoId":%d,"pacienteId":%d,"versao":1,"emitidoEm":"%s","emitidoPor":%d,
                 "hashConteudo":"%s","arquivoPdf":"qa.pdf"}
                """.formatted(atendimento, paciente, DATA, recepcao.id(), "a".repeat(64));
        id(request("POST", "/api/fichas-atendimento", recepcao.token(), ficha));
        expect(409, request("POST", "/api/fichas-atendimento", recepcao.token(), ficha));
    }

    @Test
    void prescricaoEAdministracoesPreservamPacienteItemEProfissional() throws Exception {
        int paciente = paciente(admin);
        int atendimento = atendimento(paciente);
        int prescricao = id(request("POST", "/api/prescricoes", medico.token(), prescricao(paciente, atendimento)));
        expect(403, request("POST", "/api/prescricoes", enfermagem.token(), prescricao(paciente, atendimento)));
        expect(403, request("GET", "/api/prescricoes/" + prescricao, recepcao.token(), null));
        campo(ler("/api/prescricoes/" + prescricao, enfermagem.token()), "$.atendimentoId", atendimento);
        int item = item(prescricao);
        int primeira = id(request("POST", "/api/administracoes-medicamento", enfermagem.token(),
                administracao(paciente, item, DATA)));
        int segunda = id(request("POST", "/api/administracoes-medicamento", enfermagem.token(),
                administracao(paciente, item, "2026-01-11T12:30:00")));
        assertNotEquals(primeira, segunda);
        var administracao = ler("/api/administracoes-medicamento/" + primeira, medico.token());
        campo(administracao, "$.itemPrescricaoId", item);
        campo(administracao, "$.pacienteId", paciente);
        campo(administracao, "$.administradoPor", enfermagem.id());
        expect(400, request("POST", "/api/administracoes-medicamento", enfermagem.token(), "{}"));
        expect(404, request("POST", "/api/itens-prescricao", medico.token(),
                itemBody(99999999, 99999999)));
    }

    @Test
    void rejeitaPrescricaoEAdministracaoAssociadasAoPacienteErrado() throws Exception {
        int paciente = paciente(admin);
        int outro = paciente(admin);
        int atendimento = atendimento(paciente);
        int prescricao = id(request("POST", "/api/prescricoes", medico.token(), prescricao(paciente, atendimento)));
        int item = item(prescricao);

        expect(422, request("POST", "/api/prescricoes", medico.token(), prescricao(outro, atendimento)));
        expect(422, request("POST", "/api/administracoes-medicamento", enfermagem.token(),
                administracao(outro, item, DATA)));
        int registro = id(request("POST", "/api/administracoes-medicamento", enfermagem.token(),
                administracao(paciente, item, DATA)));
        expect(422, request("PUT", "/api/administracoes-medicamento/" + registro, enfermagem.token(),
                administracao(outro, item, DATA)));
        campo(ler("/api/administracoes-medicamento/" + registro, medico.token()), "$.pacienteId", paciente);
    }

    @Test
    void alertaManualPodeSerReconhecidoConsultadoNoHistoricoEExcluido() throws Exception {
        int paciente = paciente(admin);
        String alerta = """
                {"tipo":"FC","mensagem":"Alerta sintetico","dataHora":"%s",
                 "nivel":"CRITICO","ativo":true,"pacienteId":%d}
                """.formatted(DATA, paciente);
        expect(403, request("POST", "/api/alertas", recepcao.token(), alerta));
        int id = id(request("POST", "/api/alertas", medico.token(), alerta));
        String url = "/api/alertas/" + id;
        campo(ler(url, enfermagem.token()), "$.ativo", true);
        expect(200, request("PUT", url, enfermagem.token(), alerta.replace("true", "false")));
        campo(ler(url, medico.token()), "$.ativo", false);
        campo(ler(url, medico.token()), "$.pacienteId", paciente);
        List<Integer> historico = JsonPath.read(ler("/api/alertas", medico.token()).body(), "$[*].id");
        assertTrue(historico.contains(id));
        expect(403, request("GET", url, recepcao.token(), null));
        expect(400, request("POST", "/api/alertas", medico.token(), "{}"));
        expect(204, request("DELETE", url, admin, null));
        expect(404, request("GET", url, medico.token(), null));
    }

    @Test
    void examesEEcgPersistemVinculosEValidamPermissoes() throws Exception {
        int paciente = paciente(admin);
        int atendimento = atendimento(paciente);
        String imagem = exame(paciente, atendimento, true);
        String laboratorio = exame(paciente, atendimento, false);
        int imagemId = id(request("POST", "/api/exames-imagem", medico.token(), imagem));
        int labId = id(request("POST", "/api/exames-laboratoriais", medico.token(), laboratorio));
        campo(ler("/api/exames-imagem/" + imagemId, enfermagem.token()), "$.pacienteId", paciente);
        campo(ler("/api/exames-laboratoriais/" + labId, medico.token()), "$.medicoId", medico.id());
        campo(ler("/api/exames-laboratoriais/" + labId, medico.token()), "$.atendimentoId", atendimento);
        expect(403, request("POST", "/api/exames-imagem", enfermagem.token(), imagem));
        expect(400, request("POST", "/api/exames-laboratoriais", medico.token(), "{}"));

        int ecg = id(request("POST", "/api/ecgs", medico.token(), ecg(paciente, atendimento, 72)));
        var leitura = ler("/api/ecgs/" + ecg, enfermagem.token());
        campo(leitura, "$.pacienteId", paciente);
        campo(leitura, "$.atendimentoId", atendimento);
        campo(leitura, "$.frequenciaCardiaca", 72);
        expect(403, request("POST", "/api/ecgs", enfermagem.token(), ecg(paciente, atendimento, 72)));
        expect(403, request("GET", "/api/ecgs/" + ecg, recepcao.token(), null));
        expect(400, request("POST", "/api/ecgs", medico.token(), ecg(paciente, atendimento, 0)));
    }

    @Test
    void rejeitaExamesEEcgComPacienteDiferenteDoAtendimento() throws Exception {
        int paciente = paciente(admin);
        int outro = paciente(admin);
        int atendimento = atendimento(paciente);
        expect(422, request("POST", "/api/exames-imagem", medico.token(), exame(outro, atendimento, true)));
        expect(422, request("POST", "/api/exames-laboratoriais", medico.token(), exame(outro, atendimento, false)));
        expect(422, request("POST", "/api/ecgs", medico.token(), ecg(outro, atendimento, 72)));
    }

    @Test
    void resultadoDeExamePersisteLaudoELiberacaoComPermissoes() throws Exception {
        String resultado = """
                {"dataLiberacao":"%s","laudo":"Laudo sintetico","liberado":false}
                """.formatted(DATA);
        expect(403, request("POST", "/api/resultados-exame", enfermagem.token(), resultado));
        int id = id(request("POST", "/api/resultados-exame", medico.token(), resultado));
        String url = "/api/resultados-exame/" + id;
        campo(ler(url, enfermagem.token()), "$.liberado", false);
        expect(200, request("PUT", url, medico.token(), resultado.replace("false", "true")));
        var liberado = ler(url, enfermagem.token());
        campo(liberado, "$.liberado", true);
        campo(liberado, "$.laudo", "Laudo sintetico");
        expect(403, request("GET", url, recepcao.token(), null));
    }

    private int atendimento(int paciente) throws Exception {
        return id(request("POST", "/api/atendimentos", recepcao.token(), atendimentoBody(paciente, "Atendimento QA")));
    }

    private String atendimentoBody(int paciente, String descricao) {
        return """
                {"data":"%s","tipo":"CONSULTA","descricao":"%s","status":"REGISTRADO",
                 "pacienteId":%d,"funcionarioResponsavelId":%d,"medicoResponsavelId":%d}
                """.formatted(DATA, descricao, paciente, recepcao.id(), medico.id());
    }

    private String prescricao(int paciente, int atendimento) {
        return """
                {"data":"%s","status":"ATIVA","pacienteId":%d,"medicoId":%d,"atendimentoId":%d}
                """.formatted(DATA, paciente, medico.id(), atendimento);
    }

    private int item(int prescricao) throws Exception {
        int medicamento = id(request("POST", "/api/medicamentos", medico.token(),
                "{\"nome\":\"Medicamento sintetico\",\"dosagem\":\"1 unidade\",\"ativo\":true}"));
        return id(request("POST", "/api/itens-prescricao", medico.token(), itemBody(prescricao, medicamento)));
    }

    private static String itemBody(int prescricao, int medicamento) {
        return """
                {"prescricaoId":%d,"medicamentoId":%d,"dose":"1 unidade",
                 "viaAdministracao":"Oral","frequencia":"24 h","duracao":"2 dias"}
                """.formatted(prescricao, medicamento);
    }

    private String administracao(int paciente, int item, String data) {
        return """
                {"dataHora":"%s","dose":"1 unidade","via":"Oral",
                 "itemPrescricaoId":%d,"pacienteId":%d,"administradoPor":%d}
                """.formatted(data, item, paciente, enfermagem.id());
    }

    private String exame(int paciente, int atendimento, boolean imagem) {
        String campos = imagem ? "\"modalidade\":\"RX\",\"regiaoCorpo\":\"Torax\""
                : "\"tipoAnalise\":\"Hemograma\",\"amostra\":\"Sangue\",\"metodo\":\"QA\"";
        return """
                {"dataSolicitacao":"%s","status":"SOLICITADO","pacienteId":%d,"medicoId":%d,"atendimentoId":%d,%s}
                """.formatted(DATA, paciente, medico.id(), atendimento, campos);
    }

    private static String ecg(int paciente, int atendimento, int frequencia) {
        return """
                {"dataHora":"%s","frequenciaCardiaca":%d,"ritmo":"Sinusal",
                 "intervaloPR":120,"duracaoQRS":90,"pacienteId":%d,"atendimentoId":%d}
                """.formatted(DATA, frequencia, paciente, atendimento);
    }

    private HttpResponse<String> ler(String url, String token) throws Exception {
        var resposta = request("GET", url, token, null);
        expect(200, resposta);
        return resposta;
    }

    static void campo(HttpResponse<String> resposta, String caminho, Object valor) {
        assertEquals(valor, JsonPath.read(resposta.body(), caminho));
    }
}
