package br.com.unicesumar.hospital_api.security;

import br.com.unicesumar.hospital_api.models.Funcionario;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Collection;
import java.util.List;

public record UsuarioPrincipal(Long id, String nome, String email, String senha, String role) implements UserDetails {
    public static UsuarioPrincipal from(Funcionario f) {
        return new UsuarioPrincipal(f.getId(), f.getNome(), f.getEmail(), f.getSenha(), f.getRole().name());
    }
    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return List.of(new SimpleGrantedAuthority("ROLE_" + role)); }
    @Override public String getPassword() { return senha; }
    @Override public String getUsername() { return email; }
}
