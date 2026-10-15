package br.com.unicesumar.hospital_api.services;

import br.com.unicesumar.hospital_api.dtos.request.CriarFuncionarioRequest;
import br.com.unicesumar.hospital_api.dtos.response.FuncionarioResponseDTO;
import br.com.unicesumar.hospital_api.exception.BusinessException;
import br.com.unicesumar.hospital_api.exception.DuplicateResourceException;
import br.com.unicesumar.hospital_api.models.*;
import br.com.unicesumar.hospital_api.repositories.FuncionarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
public class FuncionarioService {
    private final FuncionarioRepository repository;
    private final PasswordEncoder encoder;
    public FuncionarioService(FuncionarioRepository repository, PasswordEncoder encoder) { this.repository = repository; this.encoder = encoder; }

    @Transactional(readOnly = true) public List<FuncionarioResponseDTO> listar() { return repository.findAll().stream().map(this::paraResponse).toList(); }
    
    @Transactional(readOnly = true) public FuncionarioResponseDTO buscar(Long id) {
        return paraResponse(repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Funcionário não encontrado")));
    }

    @Transactional public FuncionarioResponseDTO criar(CriarFuncionarioRequest r) {
        if (repository.existsByEmailIgnoreCase(r.email())) throw new DuplicateResourceException("E-mail já cadastrado");
        if (repository.existsByCpf(r.cpf())) throw new DuplicateResourceException("CPF já cadastrado");
        if (repository.existsByMatricula(r.matricula())) throw new DuplicateResourceException("Matrícula já cadastrada");
        validarDadosDaRole(r);
        String email = r.email().trim().toLowerCase();
        String senha = encoder.encode(r.senha());
        Funcionario funcionario = switch (r.role()) {
            case RECEPCIONISTA -> Recepcionista.builder().setor(r.setor()).build();
            case MEDICO -> Medico.builder().crm(r.crm()).especialidade(r.especialidade()).build();
            case ENFERMEIRA -> Enfermeira.builder().coren(r.coren()).setor(r.setor()).build();
            case ADMINISTRADOR -> Administrador.builder().build();
        };
        funcionario.setNome(r.nome().trim()); funcionario.setCpf(r.cpf()); funcionario.setDataNascimento(r.dataNascimento());
        funcionario.setTelefone(r.telefone()); funcionario.setEndereco(r.endereco()); funcionario.setMatricula(r.matricula());
        funcionario.setCargo(r.role().name()); funcionario.setDataAdmissao(r.dataAdmissao()); funcionario.setEmail(email);
        funcionario.setSenha(senha); funcionario.setRole(r.role());
        return paraResponse(repository.save(funcionario));
    }

    @Transactional public FuncionarioResponseDTO atualizar(Long id, CriarFuncionarioRequest r) {
        Funcionario funcionario = repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Funcionário não encontrado"));
        if (funcionario.getRole() != r.role()) throw new BusinessException("A role de um funcionário não pode ser alterada por este endpoint");
        validarDadosDaRole(r);
        if (repository.existsByEmailIgnoreCase(r.email()) && !funcionario.getEmail().equalsIgnoreCase(r.email())) throw new DuplicateResourceException("E-mail já cadastrado");
        if (repository.existsByCpf(r.cpf()) && !funcionario.getCpf().equals(r.cpf())) throw new DuplicateResourceException("CPF já cadastrado");
        if (repository.existsByMatricula(r.matricula()) && !funcionario.getMatricula().equals(r.matricula())) throw new DuplicateResourceException("Matrícula já cadastrada");
        funcionario.setNome(r.nome().trim()); funcionario.setCpf(r.cpf()); funcionario.setDataNascimento(r.dataNascimento());
        funcionario.setTelefone(r.telefone()); funcionario.setEndereco(r.endereco()); funcionario.setMatricula(r.matricula());
        funcionario.setCargo(r.role().name()); funcionario.setDataAdmissao(r.dataAdmissao()); funcionario.setEmail(r.email().trim().toLowerCase());
        funcionario.setSenha(encoder.encode(r.senha()));
        if (funcionario instanceof Medico m) { m.setCrm(r.crm()); m.setEspecialidade(r.especialidade()); }
        if (funcionario instanceof Enfermeira e) { e.setCoren(r.coren()); e.setSetor(r.setor()); }
        if (funcionario instanceof Recepcionista receptionist) receptionist.setSetor(r.setor());
        return paraResponse(repository.save(funcionario));
    }
    
    @Transactional public void excluir(Long id) {
        Funcionario funcionario = repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Funcionário não encontrado"));
        repository.delete(funcionario);
    }
    private FuncionarioResponseDTO paraResponse(Funcionario f) {
        String crm = f instanceof Medico m ? m.getCrm() : null;
        String especialidade = f instanceof Medico m ? m.getEspecialidade() : null;
        String coren = f instanceof Enfermeira e ? e.getCoren() : null;
        String setor = f instanceof Recepcionista r ? r.getSetor() : f instanceof Enfermeira e ? e.getSetor() : null;
        return new FuncionarioResponseDTO(f.getId(), f.getNome(), f.getCpf(), f.getDataNascimento(), f.getTelefone(), f.getEndereco(),
                f.getMatricula(), f.getCargo(), f.getDataAdmissao(), f.getEmail(), f.getRole(), crm, especialidade, coren, setor);
    }
    private void validarDadosDaRole(CriarFuncionarioRequest r) {
        if (r.role() == Role.MEDICO && (vazio(r.crm()) || vazio(r.especialidade())))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CRM e especialidade são obrigatórios para médico");
        if (r.role() == Role.ENFERMEIRA && (vazio(r.coren()) || vazio(r.setor())))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "COREN e setor são obrigatórios para enfermeira");
        if (r.role() == Role.RECEPCIONISTA && vazio(r.setor()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Setor é obrigatório para recepcionista");
    }
    private boolean vazio(String valor) { return valor == null || valor.isBlank(); }
}
