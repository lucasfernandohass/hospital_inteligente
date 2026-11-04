import { useEffect, useMemo, useState } from "react"
import type { Screen } from "../App"
import DashboardSidebar from "./DashboardSidebar"
import { Avatar, ShowMoreButton, summaryLimit, DashboardHeader, EmptyState, FormSection, HeroHeader, HeroStat, InlineNotice, KeyValue, MetaItem, PageTitle, ProgressBar, QuickAction, SectionCard, SectionContext, SelectField, StatusBadge, TextField, TimelineItem, UiIcon, shiftLabel, toneStyles, type Tone } from "./ui"
import { greeting } from "./dateUtils"
import logo from "./logo.webp?no-inline"
import type { Theme } from "./ThemeToggle"
import useLocalStorageState from "./useLocalStorageState"
import ActivityLog from "./ActivityLog"
import { logActivity } from "./activityStore"
import { formatLongLocalDate, localDateInputValue, type ReceptionAppointment } from "./appointmentStore"
import { initialHospitalSectors, type RegisteredBed, type RegisteredPatient } from "./patientStore"
import type { Hospitalization } from "./hospitalizationStore"
import type { SharedExamRequest } from "./examStore"
import { usePanelRoute } from "../hooks/usePanelRoute"
import { api, ApiError, type DoctorDto, type InternmentDto } from "../services/api"
import { mapAppointment, mapBed, mapInternment, mapPatient } from "../services/mappers"

interface Props {
  onNavigate: (screen: Screen) => void
  token: string
  userName: string
  theme: Theme
  onToggleTheme: () => void
}

type Tab = "recepcao" | "cadastro-paciente" | "consulta-paciente" | "atividades" | "cadastro-leito" | "mapa-leitos" | "internacao" | "agendamento" | "ficha"


// ---------------------------------------------------------------------------
// Dados base
// ---------------------------------------------------------------------------

const historicoAtendimentos: Record<string, {
  data: string
  tipo: string
  medico: string
  local: string
}[]> = {
  "PAC-001": [
    {
      data: "15 Set 2026",
      tipo: "Consulta",
      medico: "Dr. Rafael Oliveira",
      local: "Consultório 12",
    },
    {
      data: "10 Set 2026",
      tipo: "Exame",
      medico: "Dr. Rafael Oliveira",
      local: "Laboratório",
    },
  ],
  "PAC-002": [
    {
      data: "12 Set 2026",
      tipo: "Retorno",
      medico: "Dra. Fernanda Lima",
      local: "Consultório 08",
    },
  ],
  "PAC-003": [
    {
      data: "14 Set 2026",
      tipo: "Internação",
      medico: "Dra. Fernanda Lima",
      local: "Leito 14B",
    },
  ],
  "PAC-004": [
    {
      data: "13 Set 2026",
      tipo: "Consulta",
      medico: "Dr. Rafael Oliveira",
      local: "Consultório 12",
    },
  ],
  "PAC-005": [
    {
      data: "11 Set 2026",
      tipo: "Internação",
      medico: "Dr. Rafael Oliveira",
      local: "Leito 22A",
    },
  ],
}

// Leitos
type Leito = RegisteredBed

// Agenda de médicos
const horariosDisponiveis = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
]


// Agendamentos já ocupados
const tiposExame = [
  "Hemograma",
  "Raio-X",
  "ECG",
  "Ultrassom",
  "Tomografia",
  "Ressonância",
]

const examesAgendados: { id: string; paciente: string; exame: string; data: string; hora: string; setor: string }[] = []

// ---------------------------------------------------------------------------
// Validação de CPF (algoritmo oficial)
// ---------------------------------------------------------------------------
function validarCPF(cpf: string): boolean {
  const numeros = cpf.replace(/\D/g, "")
  if (numeros.length !== 11) return false
  if (/^(\d)\1+$/.test(numeros)) return false

  let soma = 0
  for (let i = 0; i < 9; i++) soma += parseInt(numeros[i]) * (10 - i)
  let resto = (soma * 10) % 11
  if (resto === 10) resto = 0
  if (resto !== parseInt(numeros[9])) return false

  soma = 0
  for (let i = 0; i < 10; i++) soma += parseInt(numeros[i]) * (11 - i)
  resto = (soma * 10) % 11
  if (resto === 10) resto = 0
  if (resto !== parseInt(numeros[10])) return false

  return true
}

function formatarCPF(valor: string): string {
  const nums = valor.replace(/\D/g, "").slice(0, 11)
  return nums
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
}

function formatarTelefone(valor: string): string {
  const nums = valor.replace(/\D/g, "").slice(0, 11)
  if (nums.length <= 10)
    return nums
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
  return nums.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2")
}

export default function ReceptionistDashboard({
  onNavigate,
  token,
  userName,
  theme,
  onToggleTheme,
}: Props) {
  const [activeTab, setActiveTab] = usePanelRoute("recepcao", ["recepcao", "cadastro-paciente", "consulta-paciente", "atividades", "cadastro-leito", "mapa-leitos", "internacao", "agendamento", "ficha"] as const, "recepcao")
  const [pacientesCadastrados, setPacientesCadastrados] = useState<RegisteredPatient[]>([])
  const [medicosDisponiveis, setMedicosDisponiveis] = useState<DoctorDto[]>([])
  const [apiLoading, setApiLoading] = useState(true)
  const [apiError, setApiError] = useState("")
  const receptionistInitials = userName.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase()

  // ----------------------------------------------------------
  // Cadastro de paciente
  // ----------------------------------------------------------
  const [formPaciente, setFormPaciente] = useState({
    nome: "",
    cpf: "",
    dataNasc: "",
    telefone: "",
    convenio: "",
    sexo: "",
  })
  const [cadastroSucesso, setCadastroSucesso] = useState(false)
  // CPF do paciente recém-cadastrado: só ele deixa de exibir o aviso de duplicidade durante a mensagem de sucesso
  const [cpfRecemCadastrado, setCpfRecemCadastrado] = useState("")

  // ----------------------------------------------------------
  // Consulta de paciente
  // ----------------------------------------------------------
  const [buscaPaciente, setBuscaPaciente] = useState("")
  const [pacienteEncontrado, setPacienteEncontrado] =
    useState<typeof pacientesCadastrados[0] | null>(null)
  const [editForm, setEditForm] = useState<Pick<RegisteredPatient, "nome" | "dataNasc" | "telefone" | "convenio" | "sexo"> | null>(null)

  // ----------------------------------------------------------
  // Cadastro de leito
  // ----------------------------------------------------------
  const [leitos, setLeitos] = useState<Leito[]>([])
  const [formLeito, setFormLeito] = useState({
    numero: "",
    andar: "1º andar",
    setor: "Clínica Médica",
    tipo: "Enfermaria" as Leito["tipo"],
  })
  const [leitoSucesso, setLeitoSucesso] = useState(false)
  const [leitoError, setLeitoError] = useState("")

  // ----------------------------------------------------------
  // Mapa de leitos — filtros
  // ----------------------------------------------------------
  const [filtroStatus, setFiltroStatus] = useState<string>("Todos")
  const [filtroAndar, setFiltroAndar] = useState<string>("Todos")
  const [filtroSetor, setFiltroSetor] = useState<string>("Todos")
  const [filtroTipo, setFiltroTipo] = useState<string>("Todos")
  const [leitoMapaSelecionadoId, setLeitoMapaSelecionadoId] = useState<string | null>(null)

  // ----------------------------------------------------------
  // Internação
  // ----------------------------------------------------------
  const [formInternacao, setFormInternacao] = useState({
    pacienteId: "",
    leitoId: "",
    motivo: "",
    medicoId: "",
  })
  const [internacaoSucesso, setInternacaoSucesso] = useState(false)
  const [internacaoError, setInternacaoError] = useState("")
  const [internacoesLocais, setInternacoesLocais] = useState<Hospitalization[]>([])
  const [altaEmConfirmacaoId, setAltaEmConfirmacaoId] = useState<string | null>(null)

  // ----------------------------------------------------------
  // Agendamento
  // ----------------------------------------------------------
  const [agendamentos, setAgendamentos] = useState<ReceptionAppointment[]>([])
  const [formAgendamento, setFormAgendamento] = useState({
    medicoId: "",
    data: localDateInputValue(),
    hora: "",
    pacienteId: "",
  })
  const [agendamentoSucesso, setAgendamentoSucesso] = useState(false)
  const [examesSolicitados, setExamesSolicitados] = useState<SharedExamRequest[]>([])

  const loadReceptionData = async () => {
    setApiLoading(true)
    try {
      const [patientsDto, bedsDto, internmentsDto, appointmentsDto, doctors] = await Promise.all([
        api.listPatients(token), api.listBeds(token), api.listInternments(token), api.listAppointments(token), api.listDoctors(token),
      ])
      const patients = patientsDto.map(mapPatient)
      setPacientesCadastrados(patients)
      setLeitos(bedsDto.map((bed) => mapBed(bed, internmentsDto)))
      setInternacoesLocais(internmentsDto.map((internment) => mapInternment(internment, bedsDto, doctors)))
      setAgendamentos(appointmentsDto.map((appointment) => mapAppointment(appointment, patients)))
      setMedicosDisponiveis(doctors)
      setFormAgendamento((current) => ({ ...current, medicoId: current.medicoId || String(doctors[0]?.id ?? "") }))
      setApiError("")
    } catch (error) {
      setApiError(error instanceof ApiError ? error.message : "Não foi possível carregar os dados da recepção.")
    } finally { setApiLoading(false) }
  }
  useEffect(() => { void loadReceptionData() }, [token])

  // ----------------------------------------------------------
  // Ficha de atendimento
  // ----------------------------------------------------------
  const [fichaPacienteId, setFichaPacienteId] = useState("")
  const [fichaEnviadaId, setFichaEnviadaId] = useState<string | null>(null)
  // Listas resumidas no celular (central da recepção)
  const [listasExpandidas, setListasExpandidas] = useState<Record<string, boolean>>({})
  const alternarLista = (key: string) => setListasExpandidas((current) => ({ ...current, [key]: !current[key] }))

  // ----------------------------------------------------------
  // Validações e derivados
  // ----------------------------------------------------------
  const cpfValido =
    formPaciente.cpf.length === 14 && validarCPF(formPaciente.cpf)
  const cpfDuplicado = pacientesCadastrados.some(
    (p) => p.cpf === formPaciente.cpf,
  )
  // A validação (podeCadastrar) continua usando cpfDuplicado; isto controla só a exibição do aviso
  const exibirAvisoDuplicidade = cpfDuplicado && !(cadastroSucesso && formPaciente.cpf === cpfRecemCadastrado)
  const camposObrigatoriosPreenchidos =
    formPaciente.nome.trim().length > 2 &&
    formPaciente.cpf.length === 14 &&
    formPaciente.dataNasc.length === 10 &&
    formPaciente.telefone.length >= 14 &&
    formPaciente.convenio.trim().length > 0 &&
    formPaciente.sexo.length > 0

  const podeCadastrar =
    cpfValido && !cpfDuplicado && camposObrigatoriosPreenchidos

  const leitosFiltrados = useMemo(() => {
    return leitos.filter((l) => {
      if (filtroStatus !== "Todos" && l.status !== filtroStatus) return false
      if (filtroAndar !== "Todos" && l.andar !== filtroAndar) return false
      if (filtroSetor !== "Todos" && (l.setor || l.tipo) !== filtroSetor) return false
      if (filtroTipo !== "Todos" && l.tipo !== filtroTipo) return false
      return true
    })
  }, [leitos, filtroStatus, filtroAndar, filtroSetor, filtroTipo])
  const setoresDisponiveis = [...new Set([...initialHospitalSectors, ...leitos.map((bed) => bed.setor).filter(Boolean)])].sort((a, b) => a.localeCompare(b, "pt-BR"))
  const leitoMapaSelecionado = leitos.find((bed) => bed.id === leitoMapaSelecionadoId)

  const leitosDisponiveis = leitos.filter((l) => l.status === "Disponível")
  const leitosOcupados = leitos.filter((l) => l.status === "Ocupado")

  const horariosOcupados = useMemo(() => {
    return agendamentos
      .filter(
        (a) =>
          a.medicoId === formAgendamento.medicoId &&
          a.data === formAgendamento.data,
      )
      .map((a) => a.hora)
  }, [agendamentos, formAgendamento.medicoId, formAgendamento.data])

  const examesDaRecepcao = useMemo(() => examesSolicitados.map((exam) => {
    const patient = pacientesCadastrados.find((item) => item.id === exam.pacienteId)
    const setor = exam.tipo === "ExameLaboratorial" ? "Laboratório" : exam.tipo === "ExameImagem" ? "Imagem" : "Cardiologia"
    return {
      ...exam,
      paciente: patient?.nome ?? "Paciente não encontrado",
      setor,
      hora: exam.hora ?? "A definir",
    }
  }), [examesSolicitados, pacientesCadastrados])

  const pacientesInternados = leitos
    .filter((l) => l.status === "Ocupado" && l.pacienteId)
    .flatMap((l) => {
      const paciente = pacientesCadastrados.find((p) => p.id === l.pacienteId)
      if (!paciente) return []
      const internacao = internacoesLocais.find((item) => item.pacienteId === l.pacienteId && item.status === "Ativa")
      return [{
      leito: l,
      paciente,
      internacao,
      }]
    })
  const pacientesDisponiveisParaInternacao = pacientesCadastrados.filter((patient) => !leitos.some((bed) => bed.status === "Ocupado" && bed.pacienteId === patient.id))

  // ----------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------
  const handleCadastroPaciente = async () => {
    if (!podeCadastrar) return
    setApiError("")
    try {
      const created = await api.createPatient({
        nome: formPaciente.nome.trim(), cpf: formPaciente.cpf.replace(/\D/g, ""),
        dataNascimento: formPaciente.dataNasc, telefone: formPaciente.telefone,
        endereco: "", numeroProntuario: `PR-${Date.now()}`, convenio: formPaciente.convenio.trim(), sexo: formPaciente.sexo,
      }, token)
      const novoPaciente = mapPatient(created)
    setPacientesCadastrados((current) => [...current, novoPaciente])
    setPacienteEncontrado(novoPaciente)
    logActivity("Recepção", "Cadastro concluído", "Paciente", novoPaciente.id)
    setCpfRecemCadastrado(novoPaciente.cpf)
    setCadastroSucesso(true)
    setTimeout(() => {
      setCadastroSucesso(false)
      setCpfRecemCadastrado("")
      setFormPaciente({
        nome: "",
        cpf: "",
        dataNasc: "",
        telefone: "",
        convenio: "",
        sexo: "",
      })
    }, 2500)
    } catch (error) { setApiError(error instanceof ApiError ? error.message : "Não foi possível cadastrar o paciente.") }
  }

  const handleBuscarPaciente = () => {
    const termo = buscaPaciente.trim().toLowerCase()
    if (!termo) return
    const digitos = termo.replace(/\D/g, "")
    const encontrado = pacientesCadastrados.find(
      (p) =>
        (digitos.length > 0 && p.cpf.replace(/\D/g, "").includes(digitos)) ||
        p.nome.toLowerCase().includes(termo),
    )
    setPacienteEncontrado(encontrado ?? null)
    setEditForm(null)
  }

  const handleSalvarEdicaoPaciente = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!pacienteEncontrado || !editForm) return
    setApiError("")
    try {
    const current = await api.getPatient(Number(pacienteEncontrado.id), token)
    const atualizadoDto = await api.updatePatient(current.id, {
      nome: editForm.nome.trim(), cpf: current.cpf, dataNascimento: editForm.dataNasc.split("/").reverse().join("-"),
      endereco: current.endereco ?? "", numeroProntuario: current.numeroProntuario, convenio: editForm.convenio, sexo: editForm.sexo,
      telefone: editForm.telefone,
    }, token)
    const atualizado = mapPatient(atualizadoDto)
    setPacientesCadastrados((current) => current.map((patient) => patient.id === atualizado.id ? atualizado : patient))
    setPacienteEncontrado(atualizado)
    setEditForm(null)
    logActivity("Recepção", "Cadastro atualizado", "Paciente", atualizado.id)
    } catch (error) { setApiError(error instanceof ApiError ? error.message : "Não foi possível atualizar o paciente.") }
  }

  const handleCadastroLeito = async () => {
    const numero = formLeito.numero.trim().toLocaleUpperCase("pt-BR")
    if (!numero) return
    if (leitos.some((bed) => bed.numero.toLocaleUpperCase("pt-BR") === numero)) {
      setLeitoError("Já existe um leito com esse número.")
      return
    }
    setApiError("")
    try {
    const created = await api.createBed({ numero, andar: Number(formLeito.andar.match(/\d+/)?.[0] ?? 1), quarto: numero, setor: formLeito.setor, tipo: formLeito.tipo, status: "Disponível", observacao: null }, token)
    const novo = mapBed(created)
    setLeitos((current) => [...current, novo])
    logActivity("Recepção", "Cadastro concluído", "Leito", `${novo.id} · ${novo.numero} · ${novo.setor} · ${novo.andar}`)
    setLeitoError("")
    setLeitoSucesso(true)
    setTimeout(() => {
      setLeitoSucesso(false)
      setFormLeito({ numero: "", andar: "1º andar", setor: "Clínica Médica", tipo: "Enfermaria" })
    }, 2500)
    } catch (error) { setApiError(error instanceof ApiError ? error.message : "Não foi possível cadastrar o leito.") }
  }

  const handleLiberarLeito = async (leitoId: string) => {
    const leito = leitos.find((item) => item.id === leitoId)
    if (!leito || leito.status !== "Higienização") return
    try {
      const current = await api.getBed(Number(leitoId), token)
      const updated = await api.updateBed(current.id, { ...current, status: "Disponível" }, token)
      setLeitos((items) => items.map((item) => item.id === leitoId ? mapBed(updated) : item))
    } catch (error) { setApiError(error instanceof ApiError ? error.message : "Não foi possível atualizar o leito."); return }
    logActivity("Recepção", "Leito liberado após higienização", "Leito", `${leito.numero} · ${leito.andar}`)
  }

  const handleCadastroInternacao = async () => {
    if (
      !formInternacao.pacienteId ||
      !formInternacao.leitoId ||
      !formInternacao.motivo.trim()
    )
      return
    const paciente = pacientesCadastrados.find((item) => item.id === formInternacao.pacienteId)
    const leitoSelecionado = leitos.find((item) => item.id === formInternacao.leitoId)
    if (!paciente || !leitoSelecionado || leitoSelecionado.status !== "Disponível") {
      setInternacaoError("O paciente ou leito selecionado não está mais disponível.")
      return
    }
    if (leitos.some((item) => item.status === "Ocupado" && item.pacienteId === paciente.id)) {
      setInternacaoError("Este paciente já possui um leito ocupado.")
      return
    }
    setApiError("")
    try {
    if (!formInternacao.medicoId) { setInternacaoError("Selecione o médico responsável."); return }
    const created = await api.createInternment({ pacienteId: Number(paciente.id), leitoId: Number(leitoSelecionado.id), medicoId: Number(formInternacao.medicoId), dataInternacao: localDateInputValue(), dataPrevistaAlta: null, dataAlta: null, motivo: formInternacao.motivo.trim(), status: "ATIVA", observacoes: null }, token)
    const admission = mapInternment(created, await api.listBeds(token), medicosDisponiveis)
    setInternacoesLocais((current) => [admission, ...current])
    setLeitos((current) => current.map((bed) => bed.id === leitoSelecionado.id ? { ...bed, status: "Ocupado", pacienteId: paciente.id } : bed))
    logActivity("Recepção", "Internação registrada", paciente.id, `${admission.id} · Leito ${admission.leito} · ${admission.motivo}`)
    setInternacaoError("")
    setInternacaoSucesso(true)
    setTimeout(() => {
      setInternacaoSucesso(false)
      setFormInternacao({
        pacienteId: "",
        leitoId: "",
        motivo: "",
        medicoId: "",
      })
    }, 2500)
    } catch (error) { setApiError(error instanceof ApiError ? error.message : "Não foi possível registrar a internação.") }
  }

  const handleConfirmarAlta = async (leitoId: string) => {
    const leito = leitos.find((item) => item.id === leitoId)
    if (!leito || leito.status !== "Ocupado") return
    const pacienteId = leito.pacienteId ?? ""
    const dataAlta = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date())
    const admission = internacoesLocais.find((item) => item.leitoId === leitoId && item.status === "Ativa")
    if (!admission) return
    try {
      const current = await api.listInternments(token)
      const dto = current.find((item) => String(item.id) === admission.id)
      if (!dto) throw new Error("Internação não encontrada na API.")
      await api.updateInternment(dto.id, { ...dto, dataAlta: localDateInputValue(), status: "ALTA" }, token)
      setInternacoesLocais((items) => items.map((item) => item.id === admission.id ? { ...item, status: "Alta", dataAlta } : item))
      setLeitos((items) => items.map((item) => item.id === leitoId ? { ...item, status: "Higienização", pacienteId: undefined } : item))
    } catch (error) { setApiError(error instanceof ApiError ? error.message : "Não foi possível registrar a alta."); return }
    logActivity("Recepção", "Alta registrada", pacienteId, `Leito ${leito.numero} · ${dataAlta}`)
    setAltaEmConfirmacaoId(null)
  }

  const handleAgendamento = async () => {
    if (
      !formAgendamento.hora ||
      !formAgendamento.pacienteId ||
      horariosOcupados.includes(formAgendamento.hora)
    )
      return
    const paciente = pacientesCadastrados.find(
      (p) => p.id === formAgendamento.pacienteId,
    )
    if (!formAgendamento.medicoId || !paciente) { setApiError("Cadastre um médico antes de criar agendamentos."); return }
    try {
    const created = await api.createAppointment({ pacienteId: Number(formAgendamento.pacienteId), medicoId: Number(formAgendamento.medicoId), data: formAgendamento.data, horario: formAgendamento.hora, duracao: 30, status: "AGENDADA", tipo: "Consulta", observacoes: null }, token)
    const novo = mapAppointment(created, pacientesCadastrados)
    setAgendamentos((current) => [...current, novo])
    logActivity("Recepção", "Agendamento criado", "Consulta", `${novo.id} · ${formAgendamento.pacienteId} · ${novo.data} ${novo.hora}`)
    setAgendamentoSucesso(true)
    setTimeout(() => {
      setAgendamentoSucesso(false)
      setFormAgendamento({
        medicoId: String(medicosDisponiveis[0]?.id ?? ""),
        data: localDateInputValue(),
        hora: "",
        pacienteId: "",
      })
    }, 2500)
    } catch (error) { setApiError(error instanceof ApiError ? error.message : "Não foi possível criar o agendamento.") }
  }

  const handleIniciarExame = (examId: string) => {
    const exam = examesSolicitados.find((item) => item.id === examId)
    if (!exam || exam.status !== "agendado") return
    setExamesSolicitados((current) => current.map((item) => item.id === examId ? { ...item, status: "em andamento" } : item))
    logActivity("Recepção", "Exame encaminhado para execução", exam.pacienteId, `${exam.nome} · ${exam.id}`)
  }

  // Navegação agrupada por assunto
  const tabs: { key: Tab; label: string; group: string }[] = [
    { key: "recepcao", label: "Central da Recepção", group: "Atendimento" },
    { key: "agendamento", label: "Agendamento", group: "Atendimento" },
    { key: "ficha", label: "Ficha de Atendimento", group: "Atendimento" },
    { key: "cadastro-paciente", label: "Cadastrar Paciente", group: "Pacientes" },
    { key: "consulta-paciente", label: "Consultar Paciente", group: "Pacientes" },
    { key: "mapa-leitos", label: "Mapa de Leitos", group: "Leitos" },
    { key: "internacao", label: "Internação", group: "Leitos" },
    { key: "cadastro-leito", label: "Cadastrar Leito", group: "Leitos" },
    { key: "atividades", label: "Registro de Atividades", group: "Administração" },
  ]
  const activeTabInfo = tabs.find((tab) => tab.key === activeTab)

  // ---- Apresentação (somente leitura dos dados já calculados acima) ----
  const hoje = localDateInputValue()
  const consultasHoje = agendamentos.filter((item) => item.data === hoje).sort((a, b) => a.hora.localeCompare(b.hora))
  const limiteAtendimentosCelular = summaryLimit(consultasHoje.length, 3)
  const limiteMedicosCelular = summaryLimit(medicosDisponiveis.length, 2)
  const limiteExamesCelular = summaryLimit(examesAgendados.length + examesDaRecepcao.length, 3)
  const medicoPorId = (id: string) => medicosDisponiveis.find((doctor) => String(doctor.id) === id)
  const iniciais = (nome: string) => nome.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase()
  const ocupacaoPercentual = leitos.length ? Math.round((leitosOcupados.length / leitos.length) * 100) : 0
  const contarLeitos = (status: Leito["status"]) => leitos.filter((bed) => bed.status === status).length
  const bedTone = (status: Leito["status"]): Tone => (status === "Disponível" ? "success" : status === "Ocupado" ? "danger" : status === "Higienização" ? "warning" : "neutral")
  const bedIcon = (status: Leito["status"]) => (status === "Disponível" ? "checkCircle" : status === "Ocupado" ? "user" : status === "Higienização" ? "clock" : "shield")
  const tipoTone = (tipo: Leito["tipo"]): Tone => (tipo === "UTI" ? "violet" : tipo === "Isolamento" ? "warning" : "info")
  const appointmentTone = (status: string): Tone => (status === "Concluída" ? "success" : status === "Em atendimento" ? "warning" : "info")
  const internacaoDoPaciente = (id: string) => pacientesInternados.find((item) => item.paciente.id === id)
  const leitosAgrupados = leitosFiltrados.reduce<{ setor: string; leitos: Leito[] }[]>((groups, bed) => {
    const setor = bed.setor || bed.tipo
    const group = groups.find((item) => item.setor === setor)
    if (group) group.leitos.push(bed)
    else groups.push({ setor, leitos: [bed] })
    return groups
  }, []).sort((a, b) => a.setor.localeCompare(b.setor, "pt-BR"))
  const filtrosAtivos = [filtroStatus, filtroSetor, filtroAndar, filtroTipo].filter((value) => value !== "Todos").length
  const limparFiltrosLeitos = () => {
    setFiltroStatus("Todos")
    setFiltroSetor("Todos")
    setFiltroAndar("Todos")
    setFiltroTipo("Todos")
  }
  const limparCadastroPaciente = () => setFormPaciente({ nome: "", cpf: "", dataNasc: "", telefone: "", convenio: "", sexo: "" })
  const checklistCadastro = [
    { label: "Nome completo", ok: formPaciente.nome.trim().length >= 3 },
    { label: "CPF válido", ok: cpfValido },
    { label: "CPF ainda não cadastrado", ok: formPaciente.cpf.length > 0 && !cpfDuplicado },
    { label: "Data de nascimento", ok: formPaciente.dataNasc.length === 10 },
    { label: "Telefone", ok: formPaciente.telefone.length >= 14 },
    { label: "Convênio", ok: formPaciente.convenio.length > 0 },
    { label: "Sexo", ok: formPaciente.sexo.length > 0 },
  ]
  const avisos = [
    contarLeitos("Higienização") > 0 && { tone: "warning" as Tone, icon: "clock", text: `${contarLeitos("Higienização")} leito(s) aguardando liberação após higienização`, action: () => { setFiltroStatus("Higienização"); setActiveTab("mapa-leitos") } },
    contarLeitos("Manutenção") > 0 && { tone: "neutral" as Tone, icon: "shield", text: `${contarLeitos("Manutenção")} leito(s) em manutenção`, action: () => { setFiltroStatus("Manutenção"); setActiveTab("mapa-leitos") } },
    examesDaRecepcao.filter((exam) => exam.status === "agendado").length > 0 && { tone: "info" as Tone, icon: "exames", text: `${examesDaRecepcao.filter((exam) => exam.status === "agendado").length} exame(s) solicitado(s) pelos médicos aguardando execução`, action: undefined },
    leitosDisponiveis.length === 0 && { tone: "danger" as Tone, icon: "alert", text: "Nenhum leito disponível para novas internações", action: () => setActiveTab("mapa-leitos") },
  ].filter((item): item is { tone: Tone; icon: string; text: string; action: (() => void) | undefined } => Boolean(item))
  const enviarFicha = (pacienteId: string, leitoNumero: string) => {
    logActivity("Recepção", "Ficha enviada ao setor", pacienteId, `Ficha de atendimento · Leito ${leitoNumero}`)
    setFichaEnviadaId(pacienteId)
  }

  return (
    <div className="role-recepcao min-h-screen" style={{ background: "var(--background)" }}>
      <DashboardSidebar
        role="Recepção"
        initials={receptionistInitials}
        name={userName}
        detail="Recepcionista"
        tabs={tabs}
        activeTab={activeTab}
        onSelect={(key) => setActiveTab(key as Tab)}
        onLogout={() => onNavigate("login")}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
      <div className="min-w-0 xl:ml-64">
        <DashboardHeader
          role="Recepção"
          section={activeTabInfo?.label ?? ""}
          name={userName}
          detail="Recepcionista"
          initials={receptionistInitials}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />

        <SectionContext.Provider value={{ key: activeTab, label: activeTabInfo?.label ?? "", group: activeTabInfo?.group, role: "Recepção" }}>
        <main className="dashboard-main mx-auto w-full min-w-0 max-w-[1400px] flex-1 px-4 pb-36 pt-20 sm:px-6 sm:pb-24 xl:p-8">
          {apiLoading && <p role="status" className="mb-4 rounded-xl border px-4 py-3 text-sm" style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--muted-foreground)" }}>Carregando dados da API…</p>}
          {apiError && <p role="alert" className="mb-4 rounded-xl border px-4 py-3 text-sm" style={{ background: "var(--danger-surface)", borderColor: "var(--border)", color: "var(--danger-foreground)" }}>{apiError}</p>}
          {activeTab === "atividades" && <ActivityLog />}
          {/* ============ CENTRAL DA RECEPÇÃO ============ */}
          {activeTab === "recepcao" && (
            <div className="fade-in">
              <HeroHeader
                eyebrow={`Central da recepção · ${shiftLabel()}`}
                title={`${greeting()}, ${userName.split(" ")[0]}`}
                subtitle={`${formatLongLocalDate()} · Visão operacional de atendimentos, exames e leitos`}
                aside={
                  <div className="hero-actions grid grid-cols-3 gap-2 lg:flex lg:flex-wrap">
                    <QuickAction variant="hero" icon="cadastro-paciente" label="Cadastrar paciente" onClick={() => setActiveTab("cadastro-paciente")} />
                    <QuickAction variant="hero" icon="agendamento" label="Novo agendamento" onClick={() => setActiveTab("agendamento")} />
                    <QuickAction variant="hero" icon="internacao" label="Internar" onClick={() => setActiveTab("internacao")} />
                  </div>
                }
              >
                <div className="keep-2-cols grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                  <HeroStat label="Consultas hoje" value={consultasHoje.length} hint={`${consultasHoje.filter((item) => (item.status ?? "Agendada") === "Agendada").length} aguardando`} />
                  <HeroStat label="Exames marcados" value={examesAgendados.length + examesDaRecepcao.length} hint="Hoje e próximos dias" />
                  <HeroStat label="Leitos disponíveis" value={leitosDisponiveis.length} hint={`de ${leitos.length} leitos`} alert={leitosDisponiveis.length === 0} />
                  <HeroStat label="Pacientes internados" value={leitosOcupados.length} hint={`Ocupação de ${ocupacaoPercentual}%`} />
                </div>
              </HeroHeader>

              <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
                <SectionCard
                  className="lg:col-span-2"
                  title="Próximos atendimentos"
                  description="Consultas de hoje de todos os profissionais"
                  icon="agenda"
                  action={<button type="button" onClick={() => setActiveTab("agendamento")} className="min-h-9 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--secondary)", color: "var(--primary)" }}>Agendar</button>}
                  bodyClassName="p-2 sm:p-3"
                >
                  {consultasHoje.length ? (
                    <ul className="space-y-1" id="lista-atendimentos">
                      {consultasHoje.map((item, index) => {
                        const medico = medicoPorId(item.medicoId)
                        const status = item.status ?? "Agendada"
                        return (
                          <li key={item.id} className={"grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl p-2.5" + (index >= limiteAtendimentosCelular && !listasExpandidas.atendimentos ? " max-sm:hidden" : "")}>
                            <span className="text-center font-mono text-base font-semibold tabular-nums" style={{ color: "var(--role-strong)" }}>{item.hora}</span>
                            <span className="flex min-w-0 items-center gap-3">
                              <Avatar initials={iniciais(item.paciente)} size="sm" tone="neutral" />
                              <span className="min-w-0">
                                <span className="block break-words text-sm font-semibold" style={{ color: "var(--foreground)" }}>{item.paciente}</span>
                                <span className="block break-words text-xs" style={{ color: "var(--muted-foreground)" }}>{medico ? `${medico.nome} · ${medico.especialidade}` : "Profissional não identificado"}</span>
                              </span>
                            </span>
                            <StatusBadge tone={appointmentTone(status)} size="sm">{status}</StatusBadge>
                          </li>
                        )
                      })}
                    </ul>
                  ) : null}
                  <ShowMoreButton expanded={!!listasExpandidas.atendimentos} onToggle={() => alternarLista("atendimentos")} hiddenCount={consultasHoje.length - limiteAtendimentosCelular} controls="lista-atendimentos" label={["atendimento", "atendimentos"]} />
                  {consultasHoje.length ? null : (
                    <EmptyState icon="agenda" title="Nenhuma consulta para hoje" action={<button type="button" onClick={() => setActiveTab("agendamento")} className="min-h-10 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Novo agendamento</button>} />
                  )}
                </SectionCard>

                <SectionCard
                  title="Ocupação de leitos"
                  description={`${leitosOcupados.length} de ${leitos.length} ocupados`}
                  icon="mapa-leitos"
                  action={<button type="button" onClick={() => setActiveTab("mapa-leitos")} className="min-h-9 rounded-lg px-2 text-xs font-semibold" style={{ color: "var(--primary)" }}>Ver mapa</button>}
                >
                  <div className="flex items-end justify-between gap-3">
                    <p className="text-4xl font-bold leading-none tabular-nums" style={{ color: "var(--foreground)" }}>{ocupacaoPercentual}<span className="text-lg">%</span></p>
                    <StatusBadge tone={ocupacaoPercentual >= 85 ? "danger" : ocupacaoPercentual >= 65 ? "warning" : "success"} size="sm">{ocupacaoPercentual >= 85 ? "Ocupação crítica" : ocupacaoPercentual >= 65 ? "Ocupação alta" : "Capacidade disponível"}</StatusBadge>
                  </div>
                  <ProgressBar value={ocupacaoPercentual} tone={ocupacaoPercentual >= 85 ? "danger" : ocupacaoPercentual >= 65 ? "warning" : "role"} className="mt-3 h-2" label="Ocupação dos leitos" />
                  <ul className="mt-4 space-y-2.5">
                    {(["Enfermaria", "UTI", "Isolamento"] as Leito["tipo"][]).map((tipo) => {
                      const total = leitos.filter((bed) => bed.tipo === tipo).length
                      const livres = leitos.filter((bed) => bed.tipo === tipo && bed.status === "Disponível").length
                      return (
                        <li key={tipo} className="flex items-center gap-3 text-sm">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: toneStyles[tipoTone(tipo)].solid }} aria-hidden="true" />
                          <span className="flex-1" style={{ color: "var(--foreground)" }}>{tipo}</span>
                          <span className="text-xs tabular-nums" style={{ color: "var(--muted-foreground)" }}><strong style={{ color: "var(--foreground)" }}>{livres}</strong> livre{livres === 1 ? "" : "s"} de {total}</span>
                        </li>
                      )
                    })}
                  </ul>
                  <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-4" style={{ borderColor: "var(--border)" }}>
                    {(["Disponível", "Ocupado", "Higienização", "Manutenção"] as Leito["status"][]).map((status) => (
                      <button key={status} type="button" onClick={() => { setFiltroStatus(status); setActiveTab("mapa-leitos") }} className="list-row flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-left text-xs" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                        <span className="flex items-center gap-1.5" style={{ color: "var(--muted-foreground)" }}><span className="h-2 w-2 rounded-full" style={{ background: toneStyles[bedTone(status)].solid }} />{status}</span>
                        <strong className="tabular-nums" style={{ color: "var(--foreground)" }}>{contarLeitos(status)}</strong>
                      </button>
                    ))}
                  </div>
                </SectionCard>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <SectionCard className="lg:col-span-2" title="Exames marcados" description="Agenda de exames e solicitações dos médicos" icon="exames" bodyClassName="p-2 sm:p-3">
                  <ul className="space-y-1" id="lista-exames-recepcao">
                    {examesAgendados.map((exam, index) => (
                      <li key={exam.id} className={"grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl p-2.5" + (index >= limiteExamesCelular && !listasExpandidas.exames ? " max-sm:hidden" : "")}>
                        <span className="text-center font-mono text-sm font-semibold tabular-nums" style={{ color: "var(--role-strong)" }}>{exam.hora}</span>
                        <span className="min-w-0">
                          <span className="block break-words text-sm font-semibold" style={{ color: "var(--foreground)" }}>{exam.exame}</span>
                          <span className="block break-words text-xs" style={{ color: "var(--muted-foreground)" }}>{exam.paciente} · {exam.setor}</span>
                        </span>
                        <span className="text-xs font-medium tabular-nums" style={{ color: exam.data === hoje ? "var(--role-strong)" : "var(--muted-foreground)" }}>{exam.data === hoje ? "Hoje" : exam.data.split("-").reverse().join("/")}</span>
                      </li>
                    ))}
                    {examesDaRecepcao.map((exam, index) => (
                      <li key={exam.id} className={"grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3 rounded-xl border p-2.5 sm:grid-cols-[3.5rem_minmax(0,1fr)_auto]" + (examesAgendados.length + index >= limiteExamesCelular && !listasExpandidas.exames ? " max-sm:hidden" : "")} style={{ borderColor: "var(--border)" }}>
                        <span className="text-center font-mono text-sm font-semibold tabular-nums" style={{ color: "var(--role-strong)" }}>{exam.hora === "A definir" ? "—" : exam.hora}</span>
                        <span className="min-w-0">
                          <span className="block break-words text-sm font-semibold" style={{ color: "var(--foreground)" }}>{exam.nome}</span>
                          <span className="block break-words text-xs" style={{ color: "var(--muted-foreground)" }}>{exam.paciente} · {exam.setor} · {exam.data} · por {exam.solicitante}</span>
                        </span>
                        <span className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-1">
                          <StatusBadge tone={exam.status === "agendado" ? "neutral" : exam.status === "em andamento" ? "warning" : "success"} size="sm">{exam.status === "agendado" ? "Solicitado" : exam.status === "em andamento" ? "Em andamento" : "Resultado disponível"}</StatusBadge>
                          {exam.status === "agendado" && <button type="button" onClick={() => handleIniciarExame(exam.id)} className="min-h-9 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Iniciar exame</button>}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <ShowMoreButton expanded={!!listasExpandidas.exames} onToggle={() => alternarLista("exames")} hiddenCount={examesAgendados.length + examesDaRecepcao.length - limiteExamesCelular} controls="lista-exames-recepcao" label={["exame", "exames"]} />
                </SectionCard>

                <div className="flex flex-col gap-5">
                  <SectionCard title="Médicos hoje" description="Agenda por profissional" icon="stethoscope" bodyClassName="p-3">
                    <ul className="space-y-1.5" id="lista-medicos-hoje">
                      {medicosDisponiveis.map((medico, index) => {
                        const consultas = consultasHoje.filter((item) => item.medicoId === String(medico.id))
                        const proxima = consultas.find((item) => (item.status ?? "Agendada") !== "Concluída")
                        return (
                          <li key={medico.id} className={"flex items-center gap-3 rounded-xl p-2" + (index >= limiteMedicosCelular && !listasExpandidas.medicos ? " max-sm:hidden" : "")}>
                            <Avatar initials={iniciais(medico.nome.replace(/^(Dr\.|Dra\.)\s*/i, ""))} size="sm" />
                            <span className="min-w-0 flex-1">
                              <span className="block break-words text-sm font-semibold" style={{ color: "var(--foreground)" }}>{medico.nome}</span>
                              <span className="block break-words text-xs" style={{ color: "var(--muted-foreground)" }}>{medico.especialidade}{proxima ? ` · próxima ${proxima.hora}` : ""}</span>
                            </span>
                            {consultas.length ? <StatusBadge tone="info" size="sm">{consultas.length} consulta{consultas.length === 1 ? "" : "s"}</StatusBadge> : <StatusBadge tone="success" size="sm">Agenda livre</StatusBadge>}
                          </li>
                        )
                      })}
                    </ul>
                    <ShowMoreButton expanded={!!listasExpandidas.medicos} onToggle={() => alternarLista("medicos")} hiddenCount={medicosDisponiveis.length - limiteMedicosCelular} controls="lista-medicos-hoje" label={["médico", "médicos"]} />
                  </SectionCard>

                  <SectionCard title="Avisos administrativos" icon="info" tone={avisos.length ? "warning" : "success"} bodyClassName="p-3">
                    {avisos.length ? (
                      <ul className="space-y-2">
                        {avisos.map((aviso) => (
                          <li key={aviso.text}>
                            {aviso.action ? (
                              <button type="button" onClick={aviso.action} className="list-row flex w-full items-start gap-2.5 rounded-xl border p-3 text-left text-xs" style={{ background: toneStyles[aviso.tone].bg, borderColor: toneStyles[aviso.tone].border, color: toneStyles[aviso.tone].fg }}>
                                <UiIcon name={aviso.icon} size={16} /><span className="flex-1 font-medium">{aviso.text}</span><UiIcon name="chevronRight" size={15} />
                              </button>
                            ) : (
                              <p className="flex items-start gap-2.5 rounded-xl border p-3 text-xs font-medium" style={{ background: toneStyles[aviso.tone].bg, borderColor: toneStyles[aviso.tone].border, color: toneStyles[aviso.tone].fg }}>
                                <UiIcon name={aviso.icon} size={16} />{aviso.text}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <EmptyState icon="checkCircle" title="Nenhum aviso no momento" />
                    )}
                  </SectionCard>
                </div>
              </div>
            </div>
          )}

          {/* ============ CADASTRO DE PACIENTE ============ */}
          {activeTab === "cadastro-paciente" && (
            <div className="fade-in">
              <PageTitle
                title="Cadastrar paciente"
                subtitle="Preencha os dados com atenção — campos com * são obrigatórios"
                meta={
                  <>
                    <MetaItem icon="atendimento" label="Pacientes cadastrados" value={pacientesCadastrados.length} tone="info" />
                    <MetaItem icon="checkCircle" label="Itens validados" value={`${checklistCadastro.filter((item) => item.ok).length}/${checklistCadastro.length}`} tone={podeCadastrar ? "success" : "neutral"} />
                  </>
                }
              />
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                <SectionCard title="Ficha cadastral" description="Os dados ficam disponíveis para médicos e enfermagem" icon="cadastro-paciente">
                  <form
                    className="flex flex-col gap-6"
                    onSubmit={(event) => {
                      event.preventDefault()
                      handleCadastroPaciente()
                    }}
                  >
                    <FormSection step={1} title="Dados pessoais" description="Identificação do paciente">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <TextField
                          className="md:col-span-2"
                          label="Nome completo"
                          value={formPaciente.nome}
                          onChange={(v) => setFormPaciente({ ...formPaciente, nome: v })}
                          placeholder="Ex.: João da Silva"
                          autoComplete="name"
                          required
                          error={formPaciente.nome.length > 0 && formPaciente.nome.trim().length < 3 ? "Informe ao menos 3 caracteres" : undefined}
                        />
                        <TextField
                          label="CPF"
                          value={formPaciente.cpf}
                          onChange={(v) => setFormPaciente({ ...formPaciente, cpf: formatarCPF(v) })}
                          placeholder="000.000.000-00"
                          inputMode="numeric"
                          required
                          error={formPaciente.cpf.length === 14 && !cpfValido ? "CPF inválido" : exibirAvisoDuplicidade ? "CPF já cadastrado no sistema" : undefined}
                          hint={formPaciente.cpf.length === 14 && cpfValido && !cpfDuplicado ? "CPF válido" : "Somente números; a máscara é aplicada automaticamente"}
                          hintTone={formPaciente.cpf.length === 14 && cpfValido && !cpfDuplicado ? "success" : "neutral"}
                        />
                        <TextField
                          label="Data de nascimento"
                          value={formPaciente.dataNasc}
                          onChange={(v) => {
                            const nums = v.replace(/\D/g, "").slice(0, 8)
                            const fmt = nums.replace(/(\d{2})(\d)/, "$1/$2").replace(/(\d{2})(\d)/, "$1/$2")
                            setFormPaciente({ ...formPaciente, dataNasc: fmt })
                          }}
                          placeholder="DD/MM/AAAA"
                          inputMode="numeric"
                          required
                        />
                        <SelectField label="Sexo" value={formPaciente.sexo} onChange={(v) => setFormPaciente({ ...formPaciente, sexo: v })} required>
                          <option value="">Selecione...</option>
                          <option value="M">Masculino</option>
                          <option value="F">Feminino</option>
                          <option value="O">Outro</option>
                        </SelectField>
                      </div>
                    </FormSection>
                    <FormSection step={2} title="Contato" description="Usado para confirmações de consulta">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <TextField
                          label="Telefone"
                          value={formPaciente.telefone}
                          onChange={(v) => setFormPaciente({ ...formPaciente, telefone: formatarTelefone(v) })}
                          placeholder="(11) 90000-0000"
                          inputMode="tel"
                          autoComplete="tel"
                          required
                        />
                      </div>
                    </FormSection>
                    <FormSection step={3} title="Dados hospitalares" description="Cobertura do atendimento">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <SelectField label="Convênio" value={formPaciente.convenio} onChange={(v) => setFormPaciente({ ...formPaciente, convenio: v })} required>
                          <option value="">Selecione...</option>
                          <option value="Amil Gold">Amil Gold</option>
                          <option value="Unimed">Unimed</option>
                          <option value="SulAmérica">SulAmérica</option>
                          <option value="SUS">SUS</option>
                          <option value="Particular">Particular</option>
                        </SelectField>
                      </div>
                    </FormSection>
                    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border)" }}>
                      <div>{cadastroSucesso ? <InlineNotice tone="success">Paciente cadastrado</InlineNotice> : <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Campos obrigatórios são validados automaticamente</span>}</div>
                      <div className="flex gap-2">
                        <button type="button" onClick={limparCadastroPaciente} className="min-h-11 flex-1 rounded-lg border px-4 text-sm font-semibold sm:flex-none" style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }}>Limpar</button>
                        <button type="submit" disabled={!podeCadastrar} className="min-h-11 flex-1 rounded-lg px-5 text-sm font-semibold sm:flex-none" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Cadastrar paciente</button>
                      </div>
                    </div>
                  </form>
                </SectionCard>

                <div className="flex flex-col gap-5">
                  <SectionCard title="Verificação em tempo real" description={`${checklistCadastro.filter((item) => item.ok).length} de ${checklistCadastro.length} itens`} icon="checkCircle" tone={podeCadastrar ? "success" : "role"}>
                    <ProgressBar value={(checklistCadastro.filter((item) => item.ok).length / checklistCadastro.length) * 100} tone={podeCadastrar ? "success" : "role"} className="mb-4" label="Itens validados" />
                    <ul className="space-y-2">
                      {checklistCadastro.map((item) => (
                        <li key={item.label} className="flex items-center gap-2.5 text-sm">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: item.ok ? "var(--success)" : "var(--muted)", color: item.ok ? "#FFFFFF" : "var(--muted-foreground)" }} aria-hidden="true">
                            <UiIcon name={item.ok ? "check" : "close"} size={11} strokeWidth={3} />
                          </span>
                          <span style={{ color: item.ok ? "var(--foreground)" : "var(--muted-foreground)" }}>{item.label}</span>
                          <span className="sr-only">{item.ok ? "(ok)" : "(pendente)"}</span>
                        </li>
                      ))}
                    </ul>
                  </SectionCard>
                  {exibirAvisoDuplicidade && (
                    <div role="alert" className="flex gap-3 rounded-2xl border p-4" style={{ background: "var(--danger-surface)", borderColor: toneStyles.danger.border, color: "var(--danger-foreground)" }}>
                      <UiIcon name="alert" size={18} />
                      <div className="text-sm">
                        <p className="font-bold">CPF já cadastrado</p>
                        <p className="mt-0.5 text-xs">Já existe um paciente com este CPF no sistema.</p>
                        <button type="button" onClick={() => { setBuscaPaciente(formPaciente.cpf); setPacienteEncontrado(pacientesCadastrados.find((patient) => patient.cpf === formPaciente.cpf) ?? null); setEditForm(null); setActiveTab("consulta-paciente") }} className="mt-2 min-h-9 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--card)", color: "var(--danger-foreground)" }}>Abrir cadastro existente</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============ CONSULTA DE PACIENTE ============ */}
          {activeTab === "consulta-paciente" && (
            <div className="fade-in">
              <PageTitle title="Consultar paciente" subtitle="Busque por CPF ou nome para visualizar dados cadastrais, situação e histórico" />

              <section className="mb-5 rounded-2xl border p-4 sm:p-5" style={{ background: "linear-gradient(120deg, var(--role-soft), var(--card) 65%)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }} aria-label="Busca de paciente">
                <form
                  className="flex flex-col gap-3 md:flex-row"
                  role="search"
                  onSubmit={(event) => {
                    event.preventDefault()
                    handleBuscarPaciente()
                  }}
                >
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }}>
                      <UiIcon name="search" size={19} />
                    </span>
                    <input
                      value={buscaPaciente}
                      onChange={(e) => setBuscaPaciente(e.target.value)}
                      aria-label="CPF ou nome do paciente"
                      placeholder="Digite o CPF ou nome do paciente..."
                      className="h-12 w-full rounded-xl border pl-12 pr-3 text-base outline-none"
                      style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
                    />
                  </div>
                  <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                    <UiIcon name="search" size={16} /> Buscar
                  </button>
                </form>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Recentes:</span>
                  {pacientesCadastrados.slice(-6).reverse().map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => {
                        setBuscaPaciente(patient.nome)
                        setPacienteEncontrado(patient)
                        setEditForm(null)
                      }}
                      className="inline-flex min-h-9 items-center gap-2 rounded-full border px-2.5 text-xs font-medium"
                      style={{ background: pacienteEncontrado?.id === patient.id ? "var(--role-soft)" : "var(--card)", borderColor: pacienteEncontrado?.id === patient.id ? "var(--role)" : "var(--border)", color: "var(--foreground)" }}
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold" style={{ background: "var(--secondary)", color: "var(--control-foreground)" }}>{iniciais(patient.nome)}</span>
                      {patient.nome}
                    </button>
                  ))}
                </div>
              </section>

              {pacienteEncontrado ? (
                <div className="slide-up grid grid-cols-1 gap-5 lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
                  <section className="overflow-hidden rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }} aria-label="Dados cadastrais">
                    <div className="flex items-center gap-3 border-b p-5" style={{ borderColor: "var(--border)" }}>
                      <Avatar initials={iniciais(pacienteEncontrado.nome)} size="lg" solid />
                      <div className="min-w-0">
                        <h2 className="break-words text-lg font-bold" style={{ color: "var(--foreground)" }}>{pacienteEncontrado.nome}</h2>
                        <p className="font-mono text-xs" style={{ color: "var(--muted-foreground)" }}>{pacienteEncontrado.id}</p>
                        <div className="mt-1.5">
                          {internacaoDoPaciente(pacienteEncontrado.id) ? <StatusBadge tone="danger" icon="internacao" size="sm">Internado · Leito {internacaoDoPaciente(pacienteEncontrado.id)?.leito.numero}</StatusBadge> : <StatusBadge tone="success" size="sm">Sem internação ativa</StatusBadge>}
                        </div>
                      </div>
                    </div>
                    {editForm ? (
                      <form onSubmit={handleSalvarEdicaoPaciente} className="space-y-3 p-5">
                        <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Editar dados cadastrais</h3>
                        <TextField label="Nome completo" value={editForm.nome} onChange={(v) => setEditForm({ ...editForm, nome: v })} required />
                        <TextField label="Nascimento" value={editForm.dataNasc} onChange={(v) => setEditForm({ ...editForm, dataNasc: v })} placeholder="DD/MM/AAAA" required />
                        <TextField label="Telefone" value={editForm.telefone} onChange={(v) => setEditForm({ ...editForm, telefone: v })} required />
                        <TextField label="Convênio" value={editForm.convenio} onChange={(v) => setEditForm({ ...editForm, convenio: v })} required />
                        <SelectField label="Sexo" value={editForm.sexo} onChange={(v) => setEditForm({ ...editForm, sexo: v })} required>
                          <option value="">Selecione</option><option value="M">Masculino</option><option value="F">Feminino</option><option value="Outro">Outro</option>
                        </SelectField>
                        <div className="flex flex-col gap-2 pt-1 min-[420px]:flex-row">
                          <button type="button" onClick={() => setEditForm(null)} className="min-h-11 rounded-lg border px-4 text-sm font-semibold" style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }}>Cancelar</button>
                          <button type="submit" disabled={editForm.nome.trim().length < 3} className="min-h-11 flex-1 rounded-lg px-4 text-sm font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Salvar alterações</button>
                        </div>
                      </form>
                    ) : (
                      <div className="p-5">
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
                          <KeyValue label="CPF" value={pacienteEncontrado.cpf} mono />
                          <KeyValue label="Nascimento" value={pacienteEncontrado.dataNasc} />
                          <KeyValue label="Telefone" value={pacienteEncontrado.telefone} />
                          <KeyValue label="Convênio" value={pacienteEncontrado.convenio} />
                          <KeyValue label="Sexo" value={pacienteEncontrado.sexo === "M" ? "Masculino" : pacienteEncontrado.sexo === "F" ? "Feminino" : "Outro"} />
                        </dl>
                        <button type="button" onClick={() => setEditForm({ nome: pacienteEncontrado.nome, dataNasc: pacienteEncontrado.dataNasc, telefone: pacienteEncontrado.telefone, convenio: pacienteEncontrado.convenio, sexo: pacienteEncontrado.sexo })} className="mt-5 min-h-10 w-full rounded-lg border px-3 text-sm font-semibold" style={{ background: "var(--card)", color: "var(--primary)", borderColor: "var(--border)" }}>
                          Editar cadastro
                        </button>
                      </div>
                    )}
                  </section>

                  <div className="flex min-w-0 flex-col gap-5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <QuickAction icon="agendamento" label="Agendar consulta" hint="Abrir agenda com o paciente" onClick={() => { setFormAgendamento({ ...formAgendamento, pacienteId: pacienteEncontrado.id }); setActiveTab("agendamento") }} />
                      {internacaoDoPaciente(pacienteEncontrado.id) ? (
                        <QuickAction icon="ficha" label="Emitir ficha" hint="Ficha de atendimento" onClick={() => { setFichaPacienteId(pacienteEncontrado.id); setActiveTab("ficha") }} />
                      ) : (
                        <QuickAction icon="internacao" label="Internar" hint="Associar a um leito" onClick={() => { setFormInternacao({ ...formInternacao, pacienteId: pacienteEncontrado.id }); setActiveTab("internacao") }} />
                      )}
                      <QuickAction icon="mapa-leitos" label="Mapa de leitos" hint="Ver ocupação" onClick={() => setActiveTab("mapa-leitos")} />
                    </div>

                    <SectionCard title="Situação atual" icon="info">
                      {(() => {
                        const internacao = internacaoDoPaciente(pacienteEncontrado.id)
                        const proximas = agendamentos.filter((item) => item.pacienteId === pacienteEncontrado.id && item.data >= hoje).sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora))
                        return (
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--background)" }}>
                              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>Internação</p>
                              {internacao ? (
                                <>
                                  <p className="mt-1 text-sm font-semibold" style={{ color: "var(--foreground)" }}>Leito {internacao.leito.numero} · {internacao.leito.setor || internacao.leito.tipo}</p>
                                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{internacao.leito.andar}{internacao.internacao ? ` · ${internacao.internacao.motivo} · ${internacao.internacao.medico}` : ""}</p>
                                </>
                              ) : (
                                <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhuma internação ativa.</p>
                              )}
                            </div>
                            <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--background)" }}>
                              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>Próximas consultas</p>
                              {proximas.length ? (
                                <ul className="mt-1 space-y-1">
                                  {proximas.slice(0, 3).map((item) => (
                                    <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
                                      <span style={{ color: "var(--foreground)" }}>{item.data === hoje ? "Hoje" : item.data.split("-").reverse().join("/")} · {item.hora}</span>
                                      <span className="break-words text-xs" style={{ color: "var(--muted-foreground)" }}>{medicoPorId(item.medicoId)?.nome}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhuma consulta futura.</p>
                              )}
                            </div>
                          </div>
                        )
                      })()}
                    </SectionCard>

                    <SectionCard title="Histórico de atendimentos" icon="atividades">
                      {(historicoAtendimentos[pacienteEncontrado.id] ?? []).length ? (
                        <ol>
                          {(historicoAtendimentos[pacienteEncontrado.id] ?? []).map((h, i, list) => (
                            <TimelineItem key={i} last={i === list.length - 1} title={h.tipo} meta={h.data} tone={h.tipo === "Internação" ? "danger" : h.tipo === "Exame" ? "violet" : "role"}>
                              {h.medico} · {h.local}
                            </TimelineItem>
                          ))}
                        </ol>
                      ) : (
                        <EmptyState icon="atividades" title="Nenhum atendimento registrado" />
                      )}
                    </SectionCard>
                  </div>
                </div>
              ) : buscaPaciente.trim() ? (
                <EmptyState icon="search" title="Nenhum paciente encontrado" description="Verifique o CPF ou nome informado e pressione Buscar." action={<button type="button" onClick={() => setActiveTab("cadastro-paciente")} className="min-h-10 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Cadastrar novo paciente</button>} />
              ) : (
                <EmptyState icon="consulta-paciente" title="Pesquise um paciente para ver a ficha cadastral" description="Use o CPF (com ou sem pontuação) ou parte do nome, ou escolha um paciente recente acima." />
              )}
            </div>
          )}

          {/* ============ CADASTRO DE LEITO ============ */}
          {activeTab === "cadastro-leito" && (
            <div className="fade-in">
              <PageTitle
                title="Cadastrar leito"
                subtitle="Informe número, localização e tipo do leito a ser adicionado"
                meta={
                  <>
                    <MetaItem icon="mapa-leitos" label="Leitos cadastrados" value={leitos.length} tone="info" />
                    <MetaItem icon="checkCircle" label="Disponíveis" value={leitosDisponiveis.length} tone="success" />
                    <MetaItem icon="building" label="Setores" value={setoresDisponiveis.length} tone="neutral" />
                  </>
                }
              />
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                <SectionCard title="Novo leito" description="Leitos cadastrados entram como “Disponível” automaticamente" icon="cadastro-leito">
                  <form
                    className="flex flex-col gap-6"
                    onSubmit={(event) => {
                      event.preventDefault()
                      handleCadastroLeito()
                    }}
                  >
                    <FormSection step={1} title="Identificação">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <TextField
                          label="Número do leito"
                          value={formLeito.numero}
                          onChange={(value) => {
                            setLeitoError("")
                            setFormLeito({ ...formLeito, numero: value.toUpperCase() })
                          }}
                          placeholder="Ex.: 12A"
                          required
                          error={leitoError || undefined}
                        />
                        <SelectField label="Tipo" value={formLeito.tipo} onChange={(v) => setFormLeito({ ...formLeito, tipo: v as Leito["tipo"] })} required>
                          <option value="Enfermaria">Enfermaria</option>
                          <option value="UTI">UTI</option>
                          <option value="Isolamento">Isolamento</option>
                        </SelectField>
                      </div>
                    </FormSection>
                    <FormSection step={2} title="Localização" description="Andar e setor hospitalar">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <SelectField label="Andar" value={formLeito.andar} onChange={(v) => setFormLeito({ ...formLeito, andar: v })} required>
                          <option value="1º andar">1º andar</option>
                          <option value="2º andar">2º andar</option>
                          <option value="3º andar">3º andar</option>
                        </SelectField>
                        <div className="flex min-w-0 flex-col gap-1.5">
                          <SelectField label="Setor" value={formLeito.setor || "__outro__"} onChange={(v) => setFormLeito({ ...formLeito, setor: v === "__outro__" ? "" : v })} required>
                            {setoresDisponiveis.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
                            {formLeito.setor && !setoresDisponiveis.includes(formLeito.setor) && <option value={formLeito.setor}>{formLeito.setor}</option>}
                            <option value="__outro__">Cadastrar outro setor…</option>
                          </SelectField>
                          {!formLeito.setor && <input autoFocus required aria-label="Nome do novo setor" value={formLeito.setor} onChange={(event) => setFormLeito({ ...formLeito, setor: event.target.value })} placeholder="Nome do novo setor" className="h-11 rounded-lg border px-3 text-sm" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }} />}
                        </div>
                      </div>
                    </FormSection>
                    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border)" }}>
                      <div>{leitoSucesso ? <InlineNotice tone="success">Leito cadastrado</InlineNotice> : <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Número do leito deve ser único</span>}</div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => { setLeitoError(""); setFormLeito({ numero: "", andar: "1º andar", setor: "Clínica Médica", tipo: "Enfermaria" }) }} className="min-h-11 flex-1 rounded-lg border px-4 text-sm font-semibold sm:flex-none" style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }}>Limpar</button>
                        <button type="submit" disabled={!formLeito.numero.trim() || !formLeito.setor.trim()} className="min-h-11 flex-1 rounded-lg px-5 text-sm font-semibold sm:flex-none" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Cadastrar leito</button>
                      </div>
                    </div>
                  </form>
                </SectionCard>

                <SectionCard title="Últimos cadastrados" icon="mapa-leitos" bodyClassName="p-3">
                  <ul className="space-y-1.5">
                    {[...leitos].reverse().slice(0, 7).map((l) => (
                      <li key={l.id} className="flex items-center gap-3 rounded-xl border p-2.5" style={{ borderColor: "var(--border)" }}>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold" style={{ background: toneStyles[tipoTone(l.tipo)].bg, color: toneStyles[tipoTone(l.tipo)].fg }}>{l.numero}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block break-words text-sm font-semibold" style={{ color: "var(--foreground)" }}>{l.setor || l.tipo}</span>
                          <span className="block break-words text-xs" style={{ color: "var(--muted-foreground)" }}>{l.andar} · {l.tipo}</span>
                        </span>
                        <StatusBadge tone={bedTone(l.status)} size="sm">{l.status}</StatusBadge>
                      </li>
                    ))}
                  </ul>
                  <button type="button" onClick={() => setActiveTab("mapa-leitos")} className="mt-3 min-h-10 w-full rounded-lg text-xs font-semibold" style={{ background: "var(--secondary)", color: "var(--primary)" }}>Abrir mapa de leitos</button>
                </SectionCard>
              </div>
            </div>
          )}

          {/* ============ MAPA DE LEITOS ============ */}
          {activeTab === "mapa-leitos" && (
            <div className="fade-in">
              <PageTitle
                title="Mapa de leitos"
                subtitle="Ocupação em tempo real, agrupada por setor, com filtros por status, andar e tipo"
                meta={
                  <>
                    <MetaItem icon="gauge" label="Ocupação" value={`${ocupacaoPercentual}%`} tone={ocupacaoPercentual >= 85 ? "danger" : ocupacaoPercentual >= 65 ? "warning" : "success"} />
                    <MetaItem icon="mapa-leitos" label="Total" value={leitos.length} tone="info" />
                  </>
                }
              />

              <div className="keep-2-cols mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                {(["Disponível", "Ocupado", "Higienização", "Manutenção"] as Leito["status"][]).map((status) => {
                  const active = filtroStatus === status
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFiltroStatus(active ? "Todos" : status)}
                      aria-pressed={active}
                      className="stat-card stat-card-interactive relative overflow-hidden rounded-2xl border p-4 text-left"
                      style={{ background: active ? toneStyles[bedTone(status)].bg : "var(--card)", borderColor: active ? toneStyles[bedTone(status)].solid : "var(--border)", "--stat-accent": toneStyles[bedTone(status)].solid } as React.CSSProperties}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold" style={{ color: toneStyles[bedTone(status)].fg }}>{status}</span>
                        <UiIcon name={bedIcon(status)} size={16} />
                      </span>
                      <span className="mt-2 block text-2xl font-bold tabular-nums" style={{ color: "var(--foreground)" }}>{contarLeitos(status)}</span>
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{leitos.length ? Math.round((contarLeitos(status) / leitos.length) * 100) : 0}% dos leitos{active ? " · filtrando" : ""}</span>
                    </button>
                  )
                })}
              </div>

              <div className="mb-5 flex flex-col gap-3 rounded-2xl border p-4 lg:flex-row lg:items-end" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }} role="group" aria-label="Filtros do mapa de leitos">
                <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-4">
                  <SelectField label="Status" value={filtroStatus} onChange={setFiltroStatus}>
                    <option value="Todos">Todos</option>
                    <option value="Disponível">Disponível</option>
                    <option value="Ocupado">Ocupado</option>
                    <option value="Higienização">Higienização</option>
                    <option value="Manutenção">Manutenção</option>
                  </SelectField>
                  <SelectField label="Setor" value={filtroSetor} onChange={setFiltroSetor}>
                    <option value="Todos">Todos</option>
                    {[...new Set(leitos.map((bed) => bed.setor || bed.tipo))].sort((a, b) => a.localeCompare(b, "pt-BR")).map((sector) => <option key={sector} value={sector}>{sector}</option>)}
                  </SelectField>
                  <SelectField label="Andar" value={filtroAndar} onChange={setFiltroAndar}>
                    <option value="Todos">Todos</option>
                    <option value="1º andar">1º andar</option>
                    <option value="2º andar">2º andar</option>
                    <option value="3º andar">3º andar</option>
                  </SelectField>
                  <SelectField label="Tipo" value={filtroTipo} onChange={setFiltroTipo}>
                    <option value="Todos">Todos</option>
                    <option value="Enfermaria">Enfermaria</option>
                    <option value="UTI">UTI</option>
                    <option value="Isolamento">Isolamento</option>
                  </SelectField>
                </div>
                <button type="button" onClick={limparFiltrosLeitos} disabled={filtrosAtivos === 0} className="min-h-11 rounded-lg border px-4 text-sm font-semibold" style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }}>
                  Limpar filtros{filtrosAtivos ? ` (${filtrosAtivos})` : ""}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="grid min-w-0 grid-cols-1 content-start gap-4 md:grid-cols-2">
                  {leitosFiltrados.length === 0 && <div className="md:col-span-2"><EmptyState icon="mapa-leitos" title="Nenhum leito encontrado" description="Ajuste os filtros para ver outros resultados." action={<button type="button" onClick={limparFiltrosLeitos} className="min-h-10 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--secondary)", color: "var(--primary)" }}>Limpar filtros</button>} /></div>}
                  {leitosAgrupados.map((grupo) => {
                    const ocupados = grupo.leitos.filter((bed) => bed.status === "Ocupado").length
                    return (
                      <section key={grupo.setor} aria-label={`Setor ${grupo.setor}`} className="rounded-2xl border p-3.5" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-xs)" }}>
                        <div className="mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{grupo.setor}</h2>
                          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{grupo.leitos.length} leito{grupo.leitos.length === 1 ? "" : "s"} · {ocupados} ocupado{ocupados === 1 ? "" : "s"}</span>
                          <span className="h-px flex-1" style={{ background: "var(--border)" }} aria-hidden="true" />
                        </div>
                        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-2 2xl:grid-cols-3">
                          {grupo.leitos.map((l) => {
                            const tone = bedTone(l.status)
                            const pac = l.pacienteId ? pacientesCadastrados.find((p) => p.id === l.pacienteId) : null
                            const selected = leitoMapaSelecionadoId === l.id
                            return (
                              <li key={l.id}>
                                <button
                                  type="button"
                                  aria-label={`Leito ${l.numero}, ${l.status}${pac ? `, ocupado por ${pac.nome}` : ""}`}
                                  aria-pressed={selected}
                                  onClick={() => {
                                    setLeitoMapaSelecionadoId(l.id)
                                    if (window.innerWidth < 1280) window.requestAnimationFrame(() => document.getElementById("leito-detalhe")?.scrollIntoView({ block: "start" }))
                                  }}
                                  className="list-row relative flex h-full w-full flex-col overflow-hidden rounded-xl border p-3 pt-3.5 text-left"
                                  style={{ background: selected ? toneStyles[tone].bg : "var(--card)", borderColor: selected ? toneStyles[tone].solid : "var(--border)" }}
                                >
                                  <span className="absolute inset-x-0 top-0 h-1" style={{ background: toneStyles[tone].solid }} aria-hidden="true" />
                                  <span className="flex items-start justify-between gap-2">
                                    <span className="text-base font-bold leading-tight" style={{ color: "var(--foreground)" }}>{l.numero}</span>
                                    <span style={{ color: toneStyles[tone].fg }}><UiIcon name={bedIcon(l.status)} size={16} /></span>
                                  </span>
                                  <span className="mt-0.5 text-[11px]" style={{ color: "var(--muted-foreground)" }}>{l.andar} · <span style={{ color: toneStyles[tipoTone(l.tipo)].fg }}>{l.tipo}</span></span>
                                  <span className="mt-2 break-words text-xs font-semibold" style={{ color: pac ? "var(--foreground)" : toneStyles[tone].fg }}>{pac ? pac.nome : l.status}</span>
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      </section>
                    )
                  })}
                </div>

                <aside id="leito-detalhe" className="scroll-mt-20 xl:sticky xl:top-24 xl:self-start" aria-live="polite">
                  {leitoMapaSelecionado ? (
                    <section className="overflow-hidden rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-md)" }} aria-labelledby="leito-selecionado-titulo">
                      <div className="p-5" style={{ background: toneStyles[bedTone(leitoMapaSelecionado.status)].bg }}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: toneStyles[bedTone(leitoMapaSelecionado.status)].fg }}>Leito selecionado</p>
                            <h3 id="leito-selecionado-titulo" className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{leitoMapaSelecionado.numero}</h3>
                          </div>
                          <StatusBadge tone={bedTone(leitoMapaSelecionado.status)} icon={bedIcon(leitoMapaSelecionado.status)} size="sm">{leitoMapaSelecionado.status}</StatusBadge>
                        </div>
                        <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>{leitoMapaSelecionado.setor || leitoMapaSelecionado.tipo} · {leitoMapaSelecionado.andar} · {leitoMapaSelecionado.tipo}</p>
                      </div>
                      <div className="p-5">
                        {leitoMapaSelecionado.pacienteId ? (
                          (() => {
                            const patient = pacientesCadastrados.find((item) => item.id === leitoMapaSelecionado.pacienteId)
                            const admission = internacoesLocais.find((item) => item.leitoId === leitoMapaSelecionado.id && item.status === "Ativa")
                            return (
                              <div className="flex items-start gap-3">
                                <Avatar initials={iniciais(patient?.nome ?? "--")} />
                                <div className="min-w-0 text-sm">
                                  <p className="font-semibold" style={{ color: "var(--foreground)" }}>{patient?.nome ?? "Paciente não encontrado"}</p>
                                  <p className="font-mono text-xs" style={{ color: "var(--muted-foreground)" }}>{patient?.id}</p>
                                  {admission && <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>{admission.motivo} · {admission.medico} · entrada {admission.dataEntrada}</p>}
                                </div>
                              </div>
                            )
                          })()
                        ) : (
                          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{leitoMapaSelecionado.status === "Disponível" ? "Este leito pode receber uma internação." : "Este leito não está disponível para internação."}</p>
                        )}
                        <div className="mt-4 flex flex-col gap-2">
                          {leitoMapaSelecionado.status === "Disponível" && pacientesDisponiveisParaInternacao.length > 0 && (
                            <button type="button" onClick={() => {
                              setFormInternacao((current) => ({ ...current, leitoId: leitoMapaSelecionado.id }))
                              setActiveTab("internacao")
                            }} className="min-h-10 rounded-lg px-3 text-sm font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Internar paciente neste leito</button>
                          )}
                          {leitoMapaSelecionado.status === "Ocupado" && (
                            <button type="button" onClick={() => setActiveTab("internacao")} className="min-h-10 rounded-lg px-3 text-sm font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Gerenciar internação e alta</button>
                          )}
                          {leitoMapaSelecionado.status === "Higienização" && (
                            <button type="button" onClick={() => handleLiberarLeito(leitoMapaSelecionado.id)} className="min-h-10 rounded-lg px-3 text-sm font-semibold" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>Marcar como disponível</button>
                          )}
                          <button type="button" onClick={() => setLeitoMapaSelecionadoId(null)} className="min-h-10 rounded-lg border px-3 text-sm font-semibold" style={{ background: "var(--card)", color: "var(--muted-foreground)", borderColor: "var(--border)" }}>Fechar detalhes</button>
                        </div>
                      </div>
                    </section>
                  ) : (
                    <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                      <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Legenda</p>
                      <ul className="mt-3 space-y-2.5">
                        {(["Disponível", "Ocupado", "Higienização", "Manutenção"] as Leito["status"][]).map((status) => (
                          <li key={status} className="flex items-center gap-2.5 text-sm" style={{ color: "var(--foreground)" }}>
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: toneStyles[bedTone(status)].bg, color: toneStyles[bedTone(status)].fg }}><UiIcon name={bedIcon(status)} size={15} /></span>
                            {status}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-4 text-xs" style={{ color: "var(--muted-foreground)" }}>Selecione um leito para ver o paciente associado e as ações disponíveis.</p>
                    </div>
                  )}
                </aside>
              </div>
            </div>
          )}

          {/* ============ INTERNAÇÃO ============ */}
          {activeTab === "internacao" && (
            <div className="fade-in">
              <PageTitle
                title="Internação"
                subtitle="Associe um paciente a um leito disponível e acompanhe as altas"
                meta={
                  <>
                    <MetaItem icon="internacao" label="Internados" value={pacientesInternados.length} tone="info" />
                    <MetaItem icon="checkCircle" label="Leitos disponíveis" value={leitosDisponiveis.length} tone={leitosDisponiveis.length ? "success" : "danger"} />
                    <MetaItem icon="atendimento" label="Pacientes sem leito" value={pacientesDisponiveisParaInternacao.length} tone="neutral" />
                  </>
                }
              />
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                <SectionCard title="Nova internação" description="Ao confirmar, o leito passa automaticamente para “Ocupado”" icon="internacao">
                  <form
                    className="flex flex-col gap-6"
                    onSubmit={(event) => {
                      event.preventDefault()
                      handleCadastroInternacao()
                    }}
                  >
                    <FormSection step={1} title="Paciente e leito">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <SelectField label="Paciente" value={formInternacao.pacienteId} onChange={(v) => setFormInternacao({ ...formInternacao, pacienteId: v })} required hint={pacientesDisponiveisParaInternacao.length ? undefined : "Todos os pacientes já possuem leito"}>
                          <option value="">Selecione o paciente...</option>
                          {pacientesDisponiveisParaInternacao.map((p) => <option key={p.id} value={p.id}>{p.nome} — {p.id}</option>)}
                        </SelectField>
                        <SelectField label="Leito disponível" value={formInternacao.leitoId} onChange={(v) => setFormInternacao({ ...formInternacao, leitoId: v })} required hint={leitosDisponiveis.length ? `${leitosDisponiveis.length} leito(s) disponível(is)` : "Nenhum leito disponível"}>
                          <option value="">Selecione o leito...</option>
                          {leitosDisponiveis.map((l) => <option key={l.id} value={l.id}>Leito {l.numero} · {l.setor || l.tipo} · {l.andar} · {l.tipo}</option>)}
                        </SelectField>
                      </div>
                    </FormSection>
                    <FormSection step={2} title="Responsável e motivo">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <SelectField label="Médico responsável" value={formInternacao.medicoId} onChange={(v) => setFormInternacao({ ...formInternacao, medicoId: v })}>
                          <option value="">Selecione...</option>
                          {medicosDisponiveis.map((m) => <option key={m.id} value={m.id}>{m.nome} — {m.especialidade}</option>)}
                        </SelectField>
                        <TextField label="Motivo da internação" value={formInternacao.motivo} onChange={(v) => setFormInternacao({ ...formInternacao, motivo: v })} placeholder="Ex.: Pneumonia bacteriana" required />
                      </div>
                    </FormSection>
                    {(formInternacao.pacienteId || formInternacao.leitoId) && (
                      <div className="rounded-xl border p-4" style={{ background: "var(--role-soft)", borderColor: "var(--border)" }} aria-label="Resumo da internação">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--role-strong)" }}>Resumo</p>
                        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <KeyValue label="Paciente" value={pacientesCadastrados.find((p) => p.id === formInternacao.pacienteId)?.nome ?? "—"} />
                          <KeyValue label="Leito" value={(() => { const bed = leitos.find((l) => l.id === formInternacao.leitoId); return bed ? `${bed.numero} · ${bed.setor || bed.tipo}` : "—" })()} />
                          <KeyValue label="Médico" value={medicoPorId(formInternacao.medicoId)?.nome ?? "Equipe médica"} />
                        </dl>
                      </div>
                    )}
                    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border)" }}>
                      <div className="flex flex-wrap gap-2">
                        {internacaoSucesso && <InlineNotice tone="success">Internação registrada</InlineNotice>}
                        {internacaoError && <InlineNotice tone="danger">{internacaoError}</InlineNotice>}
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => { setInternacaoError(""); setFormInternacao({ pacienteId: "", leitoId: "", motivo: "", medicoId: "" }) }} className="min-h-11 flex-1 rounded-lg border px-4 text-sm font-semibold sm:flex-none" style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }}>Limpar</button>
                        <button
                          type="submit"
                          disabled={!formInternacao.pacienteId || !formInternacao.leitoId || !formInternacao.motivo.trim() || pacientesDisponiveisParaInternacao.length === 0 || leitosDisponiveis.length === 0}
                          className="min-h-11 flex-1 rounded-lg px-5 text-sm font-semibold sm:flex-none"
                          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                        >
                          Confirmar internação
                        </button>
                      </div>
                    </div>
                  </form>
                </SectionCard>

                <SectionCard title="Internados no momento" description={`${pacientesInternados.length} paciente(s)`} icon="internados" bodyClassName="p-3">
                  {pacientesInternados.length === 0 && <EmptyState icon="internacao" title="Nenhum paciente internado no momento" />}
                  <ul className="space-y-2">
                    {pacientesInternados.map((pi) => (
                      <li key={pi.leito.id} className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                        <div className="flex items-start gap-3">
                          <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg" style={{ background: "var(--role-soft)", color: "var(--role-strong)" }}>
                            <span className="text-[10px] font-semibold uppercase leading-none">Leito</span>
                            <span className="text-sm font-bold leading-tight">{pi.leito.numero}</span>
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="break-words text-sm font-semibold" style={{ color: "var(--foreground)" }}>{pi.paciente.nome}</p>
                            <p className="break-words text-xs" style={{ color: "var(--muted-foreground)" }}>{pi.leito.setor || pi.leito.tipo} · {pi.leito.andar} · {pi.leito.tipo}</p>
                            {pi.internacao && <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>{pi.internacao.motivo} · {pi.internacao.medico} · entrada {pi.internacao.dataEntrada}</p>}
                          </div>
                        </div>
                        {altaEmConfirmacaoId === pi.leito.id ? (
                          <div role="alertdialog" aria-label={`Confirmar alta de ${pi.paciente.nome}`} className="mt-3 rounded-lg border p-2.5" style={{ background: "var(--warning-surface)", borderColor: toneStyles.warning.border }}>
                            <p className="text-xs font-semibold" style={{ color: "var(--warning-foreground)" }}>Confirmar alta? O leito {pi.leito.numero} irá para higienização.</p>
                            <div className="mt-2 flex gap-2">
                              <button type="button" onClick={() => setAltaEmConfirmacaoId(null)} className="min-h-9 flex-1 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--card)", color: "var(--foreground)" }}>Cancelar</button>
                              <button type="button" onClick={() => handleConfirmarAlta(pi.leito.id)} className="min-h-9 flex-1 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Confirmar alta</button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 flex gap-2">
                            <button type="button" onClick={() => { setFichaPacienteId(pi.paciente.id); setActiveTab("ficha") }} className="min-h-9 flex-1 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--secondary)", color: "var(--primary)" }}>Ficha</button>
                            <button type="button" onClick={() => setAltaEmConfirmacaoId(pi.leito.id)} className="min-h-9 flex-1 rounded-lg border px-3 text-xs font-semibold" style={{ background: "var(--card)", color: "var(--primary)", borderColor: "var(--border)" }}>Dar alta</button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              </div>
            </div>
          )}

          {/* ============ AGENDAMENTO ============ */}
          {activeTab === "agendamento" && (
            <div className="fade-in">
              <PageTitle
                title="Agendamento de consulta"
                subtitle="Escolha o profissional, o paciente, a data e um horário livre"
                meta={
                  <>
                    <MetaItem icon="agenda" label="Consultas hoje" value={consultasHoje.length} tone="info" />
                    <MetaItem icon="clock" label="Horários livres nesta data" value={horariosDisponiveis.filter((h) => !horariosOcupados.includes(h)).length} tone="success" />
                  </>
                }
              />
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                <SectionCard title="Nova consulta" description="Horários riscados já estão ocupados" icon="agendamento">
                  <form
                    className="flex flex-col gap-6"
                    onSubmit={(event) => {
                      event.preventDefault()
                      handleAgendamento()
                    }}
                  >
                    <FormSection step={1} title="Profissional e paciente">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <SelectField label="Médico" value={formAgendamento.medicoId} onChange={(v) => setFormAgendamento({ ...formAgendamento, medicoId: v, hora: "" })} required hint={`Especialidade: ${medicoPorId(formAgendamento.medicoId)?.especialidade ?? "—"}`}>
                          {medicosDisponiveis.map((m) => <option key={m.id} value={m.id}>{m.nome} — {m.especialidade}</option>)}
                        </SelectField>
                        <SelectField label="Paciente" value={formAgendamento.pacienteId} onChange={(v) => setFormAgendamento({ ...formAgendamento, pacienteId: v })} required>
                          <option value="">Selecione o paciente...</option>
                          {pacientesCadastrados.map((p) => <option key={p.id} value={p.id}>{p.nome} — {p.cpf}</option>)}
                        </SelectField>
                      </div>
                    </FormSection>
                    <FormSection step={2} title="Data e horário">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <TextField label="Data" type="date" value={formAgendamento.data} onChange={(v) => setFormAgendamento({ ...formAgendamento, data: v, hora: "" })} required />
                      </div>
                      <div className="mt-4">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }} id="horarios-label">Horários · {formAgendamento.data.split("-").reverse().join("/")}</p>
                          <div className="flex flex-wrap gap-3 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm border" style={{ borderColor: "var(--border-strong)", background: "var(--card)" }} />Livre</span>
                            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--primary)" }} />Selecionado</span>
                            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--neutral-surface)" }} />Ocupado</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 min-[420px]:grid-cols-4 md:grid-cols-6 xl:grid-cols-8" role="group" aria-labelledby="horarios-label">
                          {horariosDisponiveis.map((h) => {
                            const ocupado = horariosOcupados.includes(h)
                            const selecionado = formAgendamento.hora === h
                            return (
                              <button
                                key={h}
                                type="button"
                                disabled={ocupado}
                                aria-pressed={selecionado}
                                aria-label={`${h}${ocupado ? " (ocupado)" : ""}`}
                                onClick={() => setFormAgendamento({ ...formAgendamento, hora: h })}
                                className="h-11 rounded-lg border font-mono text-sm font-semibold"
                                style={{
                                  background: ocupado ? "var(--neutral-surface)" : selecionado ? "var(--primary)" : "var(--card)",
                                  color: ocupado ? "var(--neutral-foreground)" : selecionado ? "var(--primary-foreground)" : "var(--foreground)",
                                  borderColor: selecionado ? "var(--primary)" : "var(--border)",
                                  textDecoration: ocupado ? "line-through" : "none",
                                }}
                              >
                                {h}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </FormSection>
                    <div className="rounded-xl border p-4" style={{ background: "var(--role-soft)", borderColor: "var(--border)" }} aria-label="Resumo do agendamento">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--role-strong)" }}>Resumo antes de confirmar</p>
                      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <KeyValue label="Paciente" value={pacientesCadastrados.find((p) => p.id === formAgendamento.pacienteId)?.nome ?? "—"} />
                        <KeyValue label="Médico" value={medicoPorId(formAgendamento.medicoId)?.nome ?? "—"} />
                        <KeyValue label="Data" value={formAgendamento.data.split("-").reverse().join("/")} />
                        <KeyValue label="Horário" value={formAgendamento.hora || "—"} />
                      </dl>
                    </div>
                    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border)" }}>
                      <div>{agendamentoSucesso ? <InlineNotice tone="success">Consulta agendada</InlineNotice> : <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>A consulta aparece na agenda do médico imediatamente</span>}</div>
                      <button
                        type="submit"
                        disabled={!formAgendamento.hora || !formAgendamento.pacienteId || horariosOcupados.includes(formAgendamento.hora)}
                        className="min-h-11 rounded-lg px-5 text-sm font-semibold"
                        style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                      >
                        Confirmar agendamento
                      </button>
                    </div>
                  </form>
                </SectionCard>

                <SectionCard
                  title="Agenda do dia"
                  description={`${medicoPorId(formAgendamento.medicoId)?.nome ?? ""} · ${formAgendamento.data.split("-").reverse().join("/")}`}
                  icon="agenda"
                  bodyClassName="p-3"
                >
                  {(() => {
                    const lista = agendamentos.filter((a) => a.data === formAgendamento.data && a.medicoId === formAgendamento.medicoId).sort((a, b) => a.hora.localeCompare(b.hora))
                    return lista.length ? (
                      <ol>
                        {lista.map((a, index) => (
                          <TimelineItem key={a.id} last={index === lista.length - 1} tone={appointmentTone(a.status ?? "Agendada")} title={<span className="flex items-center gap-2"><span className="font-mono tabular-nums" style={{ color: "var(--role-strong)" }}>{a.hora}</span><span className="break-words">{a.paciente}</span></span>} meta={<StatusBadge tone={appointmentTone(a.status ?? "Agendada")} size="sm">{a.status ?? "Agendada"}</StatusBadge>} />
                        ))}
                      </ol>
                    ) : (
                      <EmptyState icon="agenda" title="Agenda livre" description="Nenhuma consulta agendada para este dia e médico." />
                    )
                  })()}
                </SectionCard>
              </div>
            </div>
          )}

          {/* ============ FICHA DE ATENDIMENTO ============ */}
          {activeTab === "ficha" && (
            <div className="fade-in">
              <PageTitle
                title="Ficha de atendimento"
                subtitle="Selecione um paciente internado para gerar a ficha pronta para impressão"
                meta={<MetaItem icon="internacao" label="Pacientes internados" value={pacientesInternados.length} tone="info" />}
              />

              <div className="no-print mb-5 rounded-2xl border p-4 sm:p-5" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
                <SelectField label="Paciente internado" value={fichaPacienteId} onChange={(v) => { setFichaPacienteId(v); setFichaEnviadaId(null) }}>
                  <option value="">Selecione o paciente...</option>
                  {pacientesInternados.map((pi) => (
                    <option key={pi.paciente.id} value={pi.paciente.id}>{pi.paciente.nome} — Leito {pi.leito.numero}</option>
                  ))}
                </SelectField>
              </div>

              {fichaPacienteId && (() => {
                const pac = pacientesCadastrados.find((p) => p.id === fichaPacienteId)
                const leito = leitos.find((l) => l.pacienteId === fichaPacienteId)
                if (!pac || !leito) return <EmptyState icon="ficha" title="Paciente sem internação ativa" description="Selecione outro paciente internado." />
                const internacao = internacoesLocais.find((item) => item.pacienteId === fichaPacienteId && item.status === "Ativa")
                const hist = historicoAtendimentos[fichaPacienteId] ?? []
                const ultimo = hist[0]
                const medico = ultimo ? medicosDisponiveis.find((m) => m.nome === ultimo.medico) : null
                const numeroFicha = `FA-${pac.id.replace("PAC-", "")}-${String(new Date().getFullYear()).slice(2)}`
                const linhas = (rows: [string, string][]) => (
                  <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                    {rows.map(([label, value]) => (
                      <div key={label} className="doc-rule flex justify-between gap-4 border-b py-2">
                        <dt className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</dt>
                        <dd className="text-right text-sm font-semibold" style={{ color: "var(--foreground)" }}>{value}</dd>
                      </div>
                    ))}
                  </dl>
                )
                return (
                  <article className="doc-sheet ficha-printable slide-up mx-auto max-w-4xl rounded-2xl p-6 sm:p-10" aria-label={`Ficha de atendimento ${numeroFicha}`}>
                    <header className="flex flex-col gap-4 border-b-2 pb-5 sm:flex-row sm:items-start sm:justify-between" style={{ borderColor: "var(--role)" }}>
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg, #1E4F86, #00A6A6)" }}>
                          <img src={logo} alt="" className="app-logo-on-dark h-8 w-8 object-contain" />
                        </span>
                        <div>
                          <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Hospital Inteligente</p>
                          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Ficha de atendimento · Recepção</p>
                        </div>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>Nº da ficha</p>
                        <p className="font-mono text-lg font-bold" style={{ color: "var(--foreground)" }}>{numeroFicha}</p>
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Emitida em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date())}</p>
                      </div>
                    </header>

                    <section className="mt-6">
                      <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "var(--role-strong)" }}>1. Identificação do paciente</h2>
                      {linhas([
                        ["Nome completo", pac.nome],
                        ["ID do paciente", pac.id],
                        ["CPF", pac.cpf],
                        ["Data de nascimento", pac.dataNasc],
                        ["Sexo", pac.sexo === "M" ? "Masculino" : pac.sexo === "F" ? "Feminino" : "Outro"],
                        ["Telefone", pac.telefone],
                        ["Convênio", pac.convenio],
                      ])}
                    </section>

                    <section className="mt-6">
                      <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: "var(--role-strong)" }}>2. Dados da internação</h2>
                      {linhas([
                        ["Leito", leito.numero],
                        ["Setor", leito.setor || leito.tipo],
                        ["Andar", leito.andar],
                        ["Tipo de leito", leito.tipo],
                        ["Situação do leito", leito.status],
                        ["Médico responsável", internacao?.medico ?? medico?.nome ?? ultimo?.medico ?? "—"],
                        ["Motivo", internacao?.motivo ?? ultimo?.tipo ?? "—"],
                        ["Entrada", internacao?.dataEntrada ?? ultimo?.data ?? "—"],
                      ])}
                    </section>

                    <section className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
                      {["Responsável pela recepção", "Recebido pelo setor de destino"].map((label) => (
                        <div key={label}>
                          <div className="h-12 border-b" style={{ borderColor: "var(--foreground)" }} />
                          <p className="mt-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</p>
                        </div>
                      ))}
                    </section>

                    <footer className="no-print mt-8 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border)" }}>
                      <div>{fichaEnviadaId === pac.id && <InlineNotice tone="success">Ficha enviada ao setor {leito.setor || leito.tipo}</InlineNotice>}</div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button type="button" onClick={() => enviarFicha(pac.id, leito.numero)} disabled={fichaEnviadaId === pac.id} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold" style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }}>
                          <UiIcon name="send" size={15} /> Enviar ao setor
                        </button>
                        <button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                          <UiIcon name="printer" size={15} /> Imprimir ficha
                        </button>
                      </div>
                    </footer>
                  </article>
                )
              })()}

              {!fichaPacienteId && (
                <EmptyState icon="ficha" title="Selecione um paciente internado" description="A ficha é gerada automaticamente com os dados do cadastro e da internação." />
              )}
            </div>
          )}

        </main>
        </SectionContext.Provider>
      </div>
    </div>
  )
}
