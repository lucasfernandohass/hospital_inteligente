package br.com.unicesumar.hospital_api.security;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Component
public class JwtStompChannelInterceptor implements ChannelInterceptor {
    private static final Pattern TOPICO_SINAIS_VITAIS = Pattern.compile("^/topic/pacientes/\\d+/sinais-vitais$");
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final ApiAuthorization authorization;

    public JwtStompChannelInterceptor(JwtUtil jwtUtil, UserDetailsService userDetailsService, ApiAuthorization authorization) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.authorization = authorization;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) return message;

        if (StompCommand.CONNECT.equals(accessor.getCommand())) autenticar(accessor);
        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) autorizarInscricao(accessor);
        if (StompCommand.SEND.equals(accessor.getCommand())) {
            throw new AccessDeniedException("Clientes não podem publicar mensagens STOMP");
        }
        return message;
    }

    private void autenticar(StompHeaderAccessor accessor) {
        String header = accessor.getFirstNativeHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            throw new AccessDeniedException("Token JWT ausente no CONNECT STOMP");
        }
        try {
            String token = header.substring(7).trim();
            String email = jwtUtil.extrairEmail(token);
            UserDetails user = userDetailsService.loadUserByUsername(email);
            if (!jwtUtil.validar(token, user.getUsername())) throw new AccessDeniedException("Token JWT inválido ou expirado");
            Authentication authentication = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
            accessor.setUser(authentication);
        } catch (AccessDeniedException e) {
            throw e;
        } catch (RuntimeException e) {
            throw new AccessDeniedException("Token JWT inválido ou expirado", e);
        }
    }

    private void autorizarInscricao(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null || !TOPICO_SINAIS_VITAIS.matcher(destination).matches()
                || !authorization.podeLer((Authentication) accessor.getUser(), "pacientes")) {
            throw new AccessDeniedException("Inscrição STOMP não autorizada");
        }
    }
}
