package br.com.unicesumar.hospital_api.security;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.Set;

@Component("apiAuthorization")
public class ApiAuthorization {
    private static final Map<String, Set<String>> LEITURA = Map.ofEntries(
            Map.entry("pacientes", Set.of("ROLE_RECEPCIONISTA", "ROLE_MEDICO", "ROLE_ENFERMEIRA")),
            Map.entry("atendimentos", Set.of("ROLE_RECEPCIONISTA", "ROLE_MEDICO", "ROLE_ENFERMEIRA")),
            Map.entry("agendamentos", Set.of("ROLE_RECEPCIONISTA", "ROLE_MEDICO")),
            Map.entry("agendas-medicas", Set.of("ROLE_RECEPCIONISTA", "ROLE_MEDICO")),
            Map.entry("leitos", Set.of("ROLE_RECEPCIONISTA", "ROLE_MEDICO", "ROLE_ENFERMEIRA")),
            Map.entry("internacoes", Set.of("ROLE_RECEPCIONISTA", "ROLE_MEDICO", "ROLE_ENFERMEIRA")),
            Map.entry("medicamentos", Set.of("ROLE_MEDICO", "ROLE_ENFERMEIRA")),
            Map.entry("prescricoes", Set.of("ROLE_MEDICO", "ROLE_ENFERMEIRA")),
            Map.entry("itens-prescricao", Set.of("ROLE_MEDICO", "ROLE_ENFERMEIRA")),
            Map.entry("administracoes-medicamento", Set.of("ROLE_MEDICO", "ROLE_ENFERMEIRA")),
            Map.entry("exames-imagem", Set.of("ROLE_MEDICO", "ROLE_ENFERMEIRA")),
            Map.entry("exames-laboratoriais", Set.of("ROLE_MEDICO", "ROLE_ENFERMEIRA")),
            Map.entry("ecgs", Set.of("ROLE_MEDICO", "ROLE_ENFERMEIRA")),
            Map.entry("resultados-exame", Set.of("ROLE_MEDICO", "ROLE_ENFERMEIRA")),
            Map.entry("alertas", Set.of("ROLE_MEDICO", "ROLE_ENFERMEIRA")),
            Map.entry("registros-clinicos", Set.of("ROLE_MEDICO")),
            Map.entry("fichas-atendimento", Set.of("ROLE_RECEPCIONISTA", "ROLE_MEDICO", "ROLE_ENFERMEIRA"))
    );

    public boolean podeLer(Authentication authentication, String recurso) { return pode(authentication, recurso, false); }
    public boolean podeEscrever(Authentication authentication, String recurso) { return pode(authentication, recurso, true); }
    private boolean pode(Authentication auth, String recurso, boolean escrita) {
        if (auth == null || !auth.isAuthenticated()) return false;
        if (auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMINISTRADOR"))) return true;
        if (escrita && Set.of("pacientes", "atendimentos", "agendamentos", "agendas-medicas", "leitos", "internacoes", "fichas-atendimento").contains(recurso))
            return auth.getAuthorities().stream().anyMatch(a -> Set.of("ROLE_RECEPCIONISTA", "ROLE_MEDICO", "ROLE_ENFERMEIRA").contains(a.getAuthority()));
        if (escrita && Set.of("medicamentos", "prescricoes", "itens-prescricao", "exames-imagem", "exames-laboratoriais", "ecgs", "resultados-exame", "registros-clinicos").contains(recurso))
            return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_MEDICO"));
        if (escrita && Set.of("administracoes-medicamento", "alertas").contains(recurso))
            return auth.getAuthorities().stream().anyMatch(a -> Set.of("ROLE_MEDICO", "ROLE_ENFERMEIRA").contains(a.getAuthority()));
        return !escrita && LEITURA.getOrDefault(recurso, Set.of()).stream().anyMatch(role -> auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals(role)));
    }
}
