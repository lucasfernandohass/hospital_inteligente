package br.com.unicesumar.hospital_api.dtos.response;

import br.com.unicesumar.hospital_api.models.Role;

public record AuthResponse(String token, String tipo, long expiraEmSegundos, Long id, String nome, String email, Role role) {}
