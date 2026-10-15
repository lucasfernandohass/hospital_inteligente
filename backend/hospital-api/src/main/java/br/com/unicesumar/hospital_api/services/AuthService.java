package br.com.unicesumar.hospital_api.services;

import br.com.unicesumar.hospital_api.dtos.request.CriarAdministradorRequest;
import br.com.unicesumar.hospital_api.dtos.request.LoginRequest;
import br.com.unicesumar.hospital_api.dtos.response.AuthResponse;
import br.com.unicesumar.hospital_api.exception.DuplicateResourceException;
import br.com.unicesumar.hospital_api.models.Administrador;
import br.com.unicesumar.hospital_api.models.Funcionario;
import br.com.unicesumar.hospital_api.models.Role;
import br.com.unicesumar.hospital_api.repositories.FuncionarioRepository;
import br.com.unicesumar.hospital_api.security.JwtUtil;
import br.com.unicesumar.hospital_api.security.UsuarioPrincipal;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final FuncionarioRepository repository;
    private final PasswordEncoder encoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    public AuthService(FuncionarioRepository repository, PasswordEncoder encoder, AuthenticationManager authenticationManager, JwtUtil jwtUtil) {
        this.repository = repository; this.encoder = encoder; this.authenticationManager = authenticationManager; this.jwtUtil = jwtUtil;
    }

    @Transactional
    public AuthResponse criarPrimeiroAdministrador(CriarAdministradorRequest r) {
        if (repository.existsByRole(Role.ADMINISTRADOR)) throw new IllegalStateException("O administrador inicial já foi criado");
        if (repository.existsByEmailIgnoreCase(r.email())) throw new DuplicateResourceException("E-mail já cadastrado");
        if (repository.existsByCpf(r.cpf())) throw new DuplicateResourceException("CPF já cadastrado");
        Administrador admin = Administrador.builder().nome(r.nome().trim()).cpf(r.cpf()).dataNascimento(r.dataNascimento())
                .telefone(r.telefone()).endereco(r.endereco()).matricula(r.matricula()).cargo("Administrador")
                .dataAdmissao(r.dataAdmissao()).email(r.email().trim().toLowerCase()).senha(encoder.encode(r.senha()))
                .role(Role.ADMINISTRADOR).build();
        return resposta(repository.save(admin));
    }

    public AuthResponse login(LoginRequest r) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(r.email().trim().toLowerCase(), r.senha()));
        Funcionario f = repository.findByEmailIgnoreCase(r.email()).orElseThrow();
        return resposta(f);
    }
    
    private AuthResponse resposta(Funcionario f) {
        UsuarioPrincipal principal = UsuarioPrincipal.from(f);
        return new AuthResponse(jwtUtil.gerarToken(principal), "Bearer", jwtUtil.getExpirationMs() / 1000, f.getId(), f.getNome(), f.getEmail(), f.getRole());
    }
}
