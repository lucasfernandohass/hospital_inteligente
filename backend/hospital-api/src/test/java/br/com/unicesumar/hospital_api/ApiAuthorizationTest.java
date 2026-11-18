package br.com.unicesumar.hospital_api;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;

import br.com.unicesumar.hospital_api.security.ApiAuthorization;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

class ApiAuthorizationTest {
    private final ApiAuthorization authorization = new ApiAuthorization();

    @ParameterizedTest
    @CsvSource({
            "ADMINISTRADOR, funcionarios, true, true",
            "MEDICO, prescricoes, true, true",
            "ENFERMEIRA, prescricoes, true, false",
            "RECEPCIONISTA, prescricoes, false, false",
            "RECEPCIONISTA, atendimentos, true, true",
            "ENFERMEIRA, alertas, true, true",
            "MEDICO, administracoes-medicamento, true, true",
            "RECEPCIONISTA, administracoes-medicamento, false, false",
            "MEDICO, exames-laboratoriais, true, true",
            "ENFERMEIRA, ecgs, true, false",
            "RECEPCIONISTA, ecgs, false, false",
            "ENFERMEIRA, agendamentos, false, false",
            "MEDICO, inexistente, false, false",
            "SEM_PAPEL_CLINICO, atendimentos, false, false"
    })
    void aplicaPermissoesPorOperacao(String role, String recurso, boolean leitura, boolean escrita) {
        var usuario = UsernamePasswordAuthenticationToken.authenticated(
                "fixture", null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
        assertEquals(leitura, authorization.podeLer(usuario, recurso));
        assertEquals(escrita, authorization.podeEscrever(usuario, recurso));
    }

    @Test
    void negaAcessoQuandoAutenticacaoNaoExisteOuNaoFoiValidada() {
        var naoAutenticado = UsernamePasswordAuthenticationToken.unauthenticated("fixture", null);
        assertFalse(authorization.podeLer(null, "atendimentos"));
        assertFalse(authorization.podeEscrever(naoAutenticado, "atendimentos"));
    }
}
