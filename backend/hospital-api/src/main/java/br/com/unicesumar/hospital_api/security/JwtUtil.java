package br.com.unicesumar.hospital_api.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileAlreadyExistsException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;
import java.util.Date;

@Component
public class JwtUtil {
    private final SecretKey key;
    private final long expirationMs;

    public JwtUtil(
            @Value("${app.jwt.secret:}") String secret,
            @Value("${app.jwt.local-secret-file}") String localSecretFile,
            @Value("${app.jwt.expiration-ms:3600000}") long expirationMs,
            Environment environment) {
        String signingSecret = secret;
        if (signingSecret == null || signingSecret.isBlank()) {
            boolean localProfile = Arrays.asList(environment.getActiveProfiles()).contains("local");
            if (!localProfile) {
                throw new IllegalStateException("JWT_SECRET deve ser configurado fora do perfil local.");
            }
            signingSecret = carregarOuCriarChaveLocal(Path.of(localSecretFile));
        }
        try {
            this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(signingSecret));
        } catch (RuntimeException e) {
            throw new IllegalStateException("JWT_SECRET deve ser Base64 e conter ao menos 32 bytes.", e);
        }
        this.expirationMs = expirationMs;
    }

    private String carregarOuCriarChaveLocal(Path arquivo) {
        try {
            Path absoluto = arquivo.toAbsolutePath();
            Files.createDirectories(absoluto.getParent());
            byte[] bytes = new byte[32];
            new SecureRandom().nextBytes(bytes);
            String segredo = Base64.getEncoder().encodeToString(bytes);

            boolean criado = false;
            try {
                Files.createFile(absoluto, PosixFilePermissions.asFileAttribute(
                        PosixFilePermissions.fromString("rw-------")));
                criado = true;
            } catch (UnsupportedOperationException ignored) {
                try {
                    Files.createFile(absoluto);
                    criado = true;
                } catch (FileAlreadyExistsException arquivoCriadoEmParalelo) {
                    // Outra inicialização local criou o arquivo.
                }
            } catch (FileAlreadyExistsException arquivoExistente) {
                // A chave já foi criada em uma execução anterior.
            }

            if (criado) {
                Files.writeString(absoluto, segredo, StandardCharsets.US_ASCII,
                        StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE);
                return segredo;
            }
            String segredoExistente = Files.readString(absoluto, StandardCharsets.US_ASCII).trim();
            if (segredoExistente.isBlank()) {
                throw new IllegalStateException("O arquivo de chave JWT local está vazio: " + absoluto);
            }
            return segredoExistente;
        } catch (IOException e) {
            throw new IllegalStateException("Não foi possível carregar ou criar a chave JWT local.", e);
        }
    }

    public String gerarToken(UsuarioPrincipal usuario) {
        Date agora = new Date();
        return Jwts.builder().subject(usuario.getUsername()).claim("role", usuario.role())
                .issuedAt(agora).expiration(new Date(agora.getTime() + expirationMs)).signWith(key).compact();
    }
    public String extrairEmail(String token) { return claims(token).getSubject(); }
    public boolean validar(String token, String email) {
        try { return email.equals(extrairEmail(token)) && claims(token).getExpiration().after(new Date()); }
        catch (RuntimeException e) { return false; }
    }
    public long getExpirationMs() { return expirationMs; }
    private Claims claims(String token) { return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload(); }
}
