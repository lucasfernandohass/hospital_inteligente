package br.com.unicesumar.hospital_api.services;

import br.com.unicesumar.hospital_api.dtos.request.RegistrarAtividadeRequest;
import br.com.unicesumar.hospital_api.dtos.response.RegistroAtividadeResponse;
import br.com.unicesumar.hospital_api.models.Funcionario;
import br.com.unicesumar.hospital_api.models.RegistroAtividade;
import br.com.unicesumar.hospital_api.repositories.FuncionarioRepository;
import br.com.unicesumar.hospital_api.repositories.RegistroAtividadeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RegistroAtividadeService {
    private final RegistroAtividadeRepository atividades;
    private final FuncionarioRepository funcionarios;

    public RegistroAtividadeService(RegistroAtividadeRepository atividades, FuncionarioRepository funcionarios) {
        this.atividades = atividades;
        this.funcionarios = funcionarios;
    }

    @Transactional(readOnly = true)
    public List<RegistroAtividadeResponse> listar(Long funcionarioId, boolean administrador) {
        List<RegistroAtividade> registros = administrador
                ? atividades.findAllByOrderByDataHoraDesc()
                : atividades.findByFuncionarioIdOrderByDataHoraDesc(funcionarioId);
        return registros.stream().map(this::paraResponse).toList();
    }

    @Transactional
    public RegistroAtividadeResponse registrar(Long funcionarioId, RegistrarAtividadeRequest request) {
        Funcionario funcionario = funcionarios.findById(funcionarioId)
                .orElseThrow(() -> new IllegalStateException("Funcionário autenticado não encontrado"));
        RegistroAtividade registro = new RegistroAtividade();
        registro.setFuncionarioId(funcionario.getId());
        registro.setFuncionarioNome(funcionario.getNome());
        registro.setFuncionarioRole(funcionario.getRole());
        registro.setAcao(request.acao().trim());
        registro.setEntidade(request.entidade().trim());
        registro.setDetalhes(request.detalhes() == null || request.detalhes().isBlank() ? null : request.detalhes().trim());
        registro.setDataHora(LocalDateTime.now());
        return paraResponse(atividades.save(registro));
    }

    private RegistroAtividadeResponse paraResponse(RegistroAtividade registro) {
        return new RegistroAtividadeResponse(registro.getId(), registro.getDataHora(), registro.getFuncionarioId(),
                registro.getFuncionarioNome(), registro.getFuncionarioRole(), registro.getAcao(), registro.getEntidade(), registro.getDetalhes());
    }
}
