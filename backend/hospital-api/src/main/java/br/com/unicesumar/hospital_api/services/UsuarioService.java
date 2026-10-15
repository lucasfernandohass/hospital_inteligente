package br.com.unicesumar.hospital_api.services;

import br.com.unicesumar.hospital_api.models.Funcionario;
import br.com.unicesumar.hospital_api.repositories.FuncionarioRepository;
import br.com.unicesumar.hospital_api.security.UsuarioPrincipal;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UsuarioService implements UserDetailsService {
    private final FuncionarioRepository repository;
    public UsuarioService(FuncionarioRepository repository) { this.repository = repository; }
    @Override public UsuarioPrincipal loadUserByUsername(String email) {
        Funcionario f = repository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado"));
        return UsuarioPrincipal.from(f);
    }
}
