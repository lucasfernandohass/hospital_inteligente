package br.com.unicesumar.hospital_api.dtos.response;

import br.com.unicesumar.hospital_api.models.Role;
import java.time.LocalDate;

public record FuncionarioResponseDTO(Long id, String nome, String cpf, LocalDate dataNascimento, String telefone, String endereco,
                                     String matricula, String cargo, LocalDate dataAdmissao, String email, Role role,
                                     String crm, String especialidade, String coren, String setor) {}
