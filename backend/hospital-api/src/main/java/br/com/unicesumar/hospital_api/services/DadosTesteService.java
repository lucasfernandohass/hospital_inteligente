package br.com.unicesumar.hospital_api.services;

import br.com.unicesumar.hospital_api.dtos.request.CriarFuncionarioRequest;
import br.com.unicesumar.hospital_api.dtos.request.DadosTesteRequest;
import br.com.unicesumar.hospital_api.dtos.response.DadosTesteResponse;
import br.com.unicesumar.hospital_api.exception.BusinessException;
import br.com.unicesumar.hospital_api.exception.DuplicateResourceException;
import br.com.unicesumar.hospital_api.models.*;
import br.com.unicesumar.hospital_api.repositories.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class DadosTesteService {
    private static final String SENHA_PADRAO_DATASET = "SenhaLocalForte123";
    private final FuncionarioRepository funcionarios;
    private final FuncionarioService funcionarioService;
    private final PacienteRepository pacientes;
    private final LeitoRepository leitos;
    private final InternacaoRepository internacoes;
    private final AgendamentoRepository agendamentos;

    public DadosTesteService(FuncionarioRepository funcionarios, FuncionarioService funcionarioService,
                             PacienteRepository pacientes, LeitoRepository leitos,
                             InternacaoRepository internacoes, AgendamentoRepository agendamentos) {
        this.funcionarios = funcionarios;
        this.funcionarioService = funcionarioService;
        this.pacientes = pacientes;
        this.leitos = leitos;
        this.internacoes = internacoes;
        this.agendamentos = agendamentos;
    }

    @Transactional
    public DadosTesteResponse inserir(DadosTesteRequest request) {
        List<DadosTesteResponse.ContaResultado> contas = new ArrayList<>();
        Map<String, Funcionario> funcionariosPorEmail = new HashMap<>();
        int funcionariosCriados = 0;

        for (DadosTesteRequest.Usuario usuario : request.usuarios()) {
            String email = usuario.email().trim().toLowerCase(Locale.ROOT);
            Funcionario existente = funcionarios.findByEmailIgnoreCase(email).orElse(null);
            if (existente != null) {
                if (existente.getRole() != usuario.role())
                    throw new DuplicateResourceException("O e-mail " + email + " já existe com outro perfil");
                funcionariosPorEmail.put(email, existente);
                contas.add(new DadosTesteResponse.ContaResultado(usuario.nome(), email, usuario.role().name(), "JÁ_EXISTENTE", null));
                continue;
            }

            String senha = usuario.senha() == null || usuario.senha().isBlank()
                    ? SENHA_PADRAO_DATASET : usuario.senha();
            CriarFuncionarioRequest criar = new CriarFuncionarioRequest(usuario.nome(), usuario.cpf(), usuario.dataNascimento(),
                    usuario.telefone(), usuario.endereco(), usuario.matricula(), usuario.dataAdmissao(), email, senha,
                    usuario.role(), usuario.crm(), usuario.especialidade(), usuario.coren(), usuario.setor());
            var criado = funcionarioService.criar(criar);
            Funcionario salvo = funcionarios.findById(criado.id()).orElseThrow();
            funcionariosPorEmail.put(email, salvo);
            funcionariosCriados++;
            contas.add(new DadosTesteResponse.ContaResultado(usuario.nome(), email, usuario.role().name(), "CRIADO",
                    usuario.senha() == null || usuario.senha().isBlank() ? senha : null));
        }

        int pacientesCriados = 0;
        for (DadosTesteRequest.Paciente dados : request.pacientes()) {
            if (pacientes.findByNumeroProntuario(dados.numeroProntuario()).isPresent()) continue;
            if (pacientes.existsByCpf(dados.cpf())) throw new DuplicateResourceException("CPF de paciente já cadastrado: " + dados.cpf());
            Paciente paciente = Paciente.builder().nome(dados.nome()).cpf(dados.cpf()).dataNascimento(dados.dataNascimento())
                    .telefone(dados.telefone()).endereco(dados.endereco()).numeroProntuario(dados.numeroProntuario())
                    .convenio(dados.convenio()).sexo(dados.sexo()).build();
            if (!paciente.validarCpf(dados.cpf())) throw new BusinessException("CPF inválido para paciente " + dados.numeroProntuario());
            pacientes.save(paciente);
            pacientesCriados++;
        }

        int leitosCriados = 0;
        for (DadosTesteRequest.Leito dados : request.leitos()) {
            if (leitos.findByAndarAndQuartoAndNumero(dados.andar(), dados.quarto(), dados.numero()).isPresent()) continue;
            leitos.save(Leito.builder().numero(dados.numero()).andar(dados.andar()).quarto(dados.quarto()).tipo(dados.tipo())
                    .status(dados.status()).observacao(dados.observacao()).setor(dados.setor()).build());
            leitosCriados++;
        }

        int internacoesCriadas = 0;
        for (DadosTesteRequest.Internacao dados : request.internacoes()) {
            Paciente paciente = pacientes.findByNumeroProntuario(dados.numeroProntuario())
                    .orElseThrow(() -> new BusinessException("Paciente não encontrado no dataset: " + dados.numeroProntuario()));
            Leito leito = leitos.findAll().stream().filter(item -> item.getNumero().equals(dados.numeroLeito())).findFirst()
                    .orElseThrow(() -> new BusinessException("Leito não encontrado no dataset: " + dados.numeroLeito()));
            Funcionario medicoFuncionario = funcionariosPorEmail.get(dados.emailMedico().trim().toLowerCase(Locale.ROOT));
            if (!(medicoFuncionario instanceof Medico medico))
                throw new BusinessException("O profissional informado para internação não é um médico: " + dados.emailMedico());

            var ativaPorPaciente = internacoes.findByPacienteIdAndDataAltaIsNull(paciente.getId()).orElse(null);
            var ativaPorLeito = internacoes.findByLeitoIdAndDataAltaIsNull(leito.getId()).orElse(null);
            if (ativaPorPaciente != null || ativaPorLeito != null) {
                if (ativaPorPaciente != null && ativaPorLeito != null
                        && ativaPorPaciente.getId().equals(ativaPorLeito.getId())) continue;
                throw new BusinessException("Paciente ou leito já possui uma internação ativa: " + dados.numeroProntuario() + " / " + dados.numeroLeito());
            }
            internacoes.save(Internacao.builder().pacienteId(paciente.getId()).leitoId(leito.getId()).medicoId(medico.getId())
                    .dataInternacao(LocalDate.now().minusDays(dados.diasDesdeInternacao()))
                    .dataPrevistaAlta(LocalDate.now().plusDays(dados.diasAteAltaPrevista())).dataAlta(null)
                    .motivo(dados.motivo()).status("ATIVA").observacoes(dados.observacoes()).build());
            internacoesCriadas++;
        }

        int agendamentosCriados = 0;
        if (request.agendamentos() != null) for (DadosTesteRequest.Agendamento dados : request.agendamentos()) {
            Paciente paciente = pacientes.findByNumeroProntuario(dados.numeroProntuario())
                    .orElseThrow(() -> new BusinessException("Paciente não encontrado no dataset: " + dados.numeroProntuario()));
            Funcionario medicoFuncionario = funcionariosPorEmail.get(dados.emailMedico().trim().toLowerCase(Locale.ROOT));
            if (!(medicoFuncionario instanceof Medico medico))
                throw new BusinessException("O profissional informado para agendamento não é um médico: " + dados.emailMedico());
            LocalDate data = LocalDate.now().plusDays(dados.diasAteAgendamento());
            String marker = "[dataset-demo:" + dados.chave() + "]";
            boolean existe = agendamentos.findAll().stream()
                    .anyMatch(item -> item.getPacienteId().equals(paciente.getId()) && item.getMedicoId().equals(medico.getId())
                            && item.getObservacoes() != null && item.getObservacoes().startsWith(marker));
            if (existe) continue;
            String observacoes = marker + " " + (dados.observacoes() == null ? "" : dados.observacoes());
            agendamentos.save(Agendamento.builder().pacienteId(paciente.getId()).medicoId(medico.getId()).data(data)
                    .horario(dados.horario()).duracao(dados.duracao()).status(dados.status()).tipo(dados.tipo()).observacoes(observacoes).build());
            agendamentosCriados++;
        }

        return new DadosTesteResponse(funcionariosCriados, pacientesCriados, leitosCriados, internacoesCriadas, agendamentosCriados, contas);
    }
}
