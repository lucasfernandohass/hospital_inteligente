import { useEffect, useMemo, useState } from "react"
import type { Screen } from "../App"
import DashboardSidebar from "./DashboardSidebar"
import ThemeToggle, { type Theme } from "./ThemeToggle"
import useLocalStorageState from "./useLocalStorageState"
import StaffManagement from "./StaffManagement"
import ActivityLog from "./ActivityLog"
import { logActivity } from "./activityStore"
import { addLocalDaysToDateInput, APPOINTMENT_STORAGE_KEY, DOCTOR_DEMO_ID, formatLongLocalDate, includeDoctorDemoAppointments, initialReceptionAppointments, localDateInputValue, type ReceptionAppointment } from "./appointmentStore"
import { BED_STORAGE_KEY, initialHospitalSectors, initialRegisteredBeds, initialRegisteredPatients, normalizeRegisteredBeds, PATIENT_STORAGE_KEY, type RegisteredBed, type RegisteredPatient } from "./patientStore"
import { initialProfessionals, PROFESSIONAL_STORAGE_KEY, type Professional } from "./professionalStore"
import { HOSPITALIZATION_STORAGE_KEY, type Hospitalization } from "./hospitalizationStore"
import { EXAM_STORAGE_KEY, type SharedExamRequest } from "./examStore"

interface Props {
  onNavigate: (screen: Screen) => void
  theme: Theme
  onToggleTheme: () => void
}

type Tab = "recepcao" | "cadastro-paciente" | "consulta-paciente" | "equipe" | "atividades" | "cadastro-leito" | "mapa-leitos" | "internacao" | "agendamento" | "ficha"

type IconName = "users" | "user-plus" | "search" | "bed" | "bed-plus" | "calendar" | "calendar-plus" | "file-text" | "clipboard" | "check" | "x" | "alert" | "arrow" | "chevron" | "clock" | "printer" | "send"

const RECEPCIONISTA = {
  nome: "Mônica Rodrigues",
  iniciais: "MR",
  cargo: "Recepcionista",
  registro: "Mat. 88.421",
}

// ---------------------------------------------------------------------------
// Dados base
// ---------------------------------------------------------------------------
const pacientesIniciais = initialRegisteredPatients

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
const medicos = [
  { id: DOCTOR_DEMO_ID, nome: "Dr. Pedro Campos", especialidade: "Clínica Médica" },
  { id: "MED-1", nome: "Dr. Rafael Oliveira", especialidade: "Cardiologia" },
  { id: "MED-2", nome: "Dra. Fernanda Lima", especialidade: "Pneumologia" },
  { id: "MED-3", nome: "Dr. Bruno Tavares", especialidade: "Clínica Geral" },
]

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

const demoToday = localDateInputValue()
const demoTomorrow = addLocalDaysToDateInput(1)

// Agendamentos já ocupados
const tiposExame = [
  "Hemograma",
  "Raio-X",
  "ECG",
  "Ultrassom",
  "Tomografia",
  "Ressonância",
]

const examesAgendados = [
  {
    id: "EX-001",
    paciente: "João da Silva",
    exame: "Hemograma Completo",
    data: demoToday,
    hora: "08:30",
    setor: "Laboratório",
  },
  {
    id: "EX-002",
    paciente: "Maria Fernanda Souza",
    exame: "Ultrassom Abdominal",
    data: demoToday,
    hora: "11:00",
    setor: "Imagem",
  },
  {
    id: "EX-003",
    paciente: "Carlos Alberto Mendes",
    exame: "Raio-X de Tórax",
    data: demoToday,
    hora: "13:30",
    setor: "Imagem",
  },
  {
    id: "EX-004",
    paciente: "Ana Beatriz Lima",
    exame: "ECG",
    data: demoTomorrow,
    hora: "09:00",
    setor: "Cardiologia",
  },
]

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

// ---------------------------------------------------------------------------
// Ícones
// ---------------------------------------------------------------------------
const Icon = ({
  name,
  size = 18,
  strokeWidth = 1.8,
}: {
  name: IconName
  size?: number
  strokeWidth?: number
}) => {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  }
  switch (name) {
    case "users":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case "user-plus":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M19 8v6M22 11h-6" />
        </svg>
      )
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
      )
    case "bed":
      return (
        <svg {...common}>
          <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 15h18M6 10V7a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3M3 18v2M21 18v2" />
        </svg>
      )
    case "bed-plus":
      return (
        <svg {...common}>
          <path d="M3 18v-6a2 2 0 0 1 2-2h8M3 15h18M6 10V7a2 2 0 0 1 2-2h3" />
          <path d="M19 3v6M22 6h-6M3 18v2M21 18v2" />
        </svg>
      )
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      )
    case "calendar-plus":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4M12 13v4M10 15h4" />
        </svg>
      )
    case "file-text":
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M9 13h6M9 17h6M9 9h2" />
        </svg>
      )
    case "clipboard":
      return (
        <svg {...common}>
          <rect x="5" y="4" width="14" height="17" rx="2" />
          <path d="M9 4.5V3h6v1.5M9 10h6M9 14h6M9 18h3" />
        </svg>
      )
    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      )
    case "x":
      return (
        <svg {...common}>
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      )
    case "alert":
      return (
        <svg {...common}>
          <path d="M10.3 3.6 2.4 17a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      )
    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      )
    case "chevron":
      return (
        <svg {...common}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      )
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      )
    case "printer":
      return (
        <svg {...common}>
          <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
      )
    case "send":
      return (
        <svg {...common}>
          <path d="m22 2-7 20-4-9-9-4Z" />
          <path d="M22 2 11 13" />
        </svg>
      )
  }
}

// ---------------------------------------------------------------------------
// Cores de status de leito
// ---------------------------------------------------------------------------
const leitoStatusColor = {
  Disponível: { bg: "#E8F8F5", text: "#007F72", dot: "#00A896" },
  Ocupado: { bg: "#FDEDEC", text: "#B8322A", dot: "#E74C3C" },
  Higienização: { bg: "#FFF8E6", text: "#A96800", dot: "#F5A623" },
  Manutenção: { bg: "#F4F6F8", text: "#5A6472", dot: "#8A94A6" },
}

const leitoTipoColor = {
  Enfermaria: "#4A90D9",
  UTI: "#C0392B",
  Isolamento: "#8E44AD",
}

export default function ReceptionistDashboard({
  onNavigate,
  theme,
  onToggleTheme,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("recepcao")
  const [pacientesCadastrados, setPacientesCadastrados] = useLocalStorageState(PATIENT_STORAGE_KEY, pacientesIniciais)
  const [profissionais, setProfissionais] = useLocalStorageState<Professional[]>(PROFESSIONAL_STORAGE_KEY, initialProfessionals)
  const medicosDisponiveis = useMemo(() => {
    const knownNames = new Set(
      medicos.map((doctor) =>
        doctor.nome.replace(/^(Dr\.|Dra\.)\s*/i, "").toLocaleLowerCase("pt-BR"),
      ),
    )
    const novosMedicos = profissionais
      .filter((professional) => professional.active && professional.role === "Médico")
      .filter(
        (professional) =>
          !knownNames.has(
            professional.name.replace(/^(Dr\.|Dra\.)\s*/i, "").toLocaleLowerCase("pt-BR"),
          ),
      )
      .map((professional) => ({
        id: professional.id,
        nome: professional.name,
        especialidade: professional.specialty || "Especialidade não informada",
      }))
    return [...medicos, ...novosMedicos]
  }, [profissionais])

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
  const [leitos, setLeitos] = useLocalStorageState<Leito[]>(BED_STORAGE_KEY, initialRegisteredBeds)
  useEffect(() => setLeitos((current) => normalizeRegisteredBeds(current)), [setLeitos])
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
  const [internacoesLocais, setInternacoesLocais] = useLocalStorageState<Hospitalization[]>(HOSPITALIZATION_STORAGE_KEY, [])
  const [altaEmConfirmacaoId, setAltaEmConfirmacaoId] = useState<string | null>(null)

  // ----------------------------------------------------------
  // Agendamento
  // ----------------------------------------------------------
  const [agendamentos, setAgendamentos] = useLocalStorageState<ReceptionAppointment[]>(APPOINTMENT_STORAGE_KEY, initialReceptionAppointments)
  useEffect(() => setAgendamentos((current) => includeDoctorDemoAppointments(current)), [setAgendamentos])
  const [formAgendamento, setFormAgendamento] = useState({
    medicoId: DOCTOR_DEMO_ID,
    data: localDateInputValue(),
    hora: "",
    pacienteId: "",
  })
  const [agendamentoSucesso, setAgendamentoSucesso] = useState(false)
  const [examesSolicitados, setExamesSolicitados] = useLocalStorageState<SharedExamRequest[]>(EXAM_STORAGE_KEY, [])

  // ----------------------------------------------------------
  // Ficha de atendimento
  // ----------------------------------------------------------
  const [fichaPacienteId, setFichaPacienteId] = useState("")

  // ----------------------------------------------------------
  // Validações e derivados
  // ----------------------------------------------------------
  const cpfValido =
    formPaciente.cpf.length === 14 && validarCPF(formPaciente.cpf)
  const cpfDuplicado = pacientesCadastrados.some(
    (p) => p.cpf === formPaciente.cpf,
  )
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
  const handleCadastroPaciente = () => {
    if (!podeCadastrar) return
    const novoPaciente = {
      id: "PAC-" + String(Math.max(0, ...pacientesCadastrados.map((patient) => Number(patient.id.replace(/\D/g, "")))) + 1).padStart(3, "0"),
      ...formPaciente,
    }
    setPacientesCadastrados((current) => [...current, novoPaciente])
    setPacienteEncontrado(novoPaciente)
    logActivity("Recepção", "Cadastro concluído", "Paciente", novoPaciente.id)
    setCadastroSucesso(true)
    setTimeout(() => {
      setCadastroSucesso(false)
      setFormPaciente({
        nome: "",
        cpf: "",
        dataNasc: "",
        telefone: "",
        convenio: "",
        sexo: "",
      })
    }, 2500)
  }

  const handleBuscarPaciente = () => {
    const termo = buscaPaciente.trim().toLowerCase()
    if (!termo) return
    const encontrado = pacientesCadastrados.find(
      (p) =>
        p.cpf.replace(/\D/g, "").includes(termo.replace(/\D/g, "")) ||
        p.nome.toLowerCase().includes(termo),
    )
    setPacienteEncontrado(encontrado ?? null)
    setEditForm(null)
  }

  const handleSalvarEdicaoPaciente = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!pacienteEncontrado || !editForm) return
    const atualizado = { ...pacienteEncontrado, ...editForm }
    setPacientesCadastrados((current) => current.map((patient) => patient.id === atualizado.id ? atualizado : patient))
    setPacienteEncontrado(atualizado)
    setEditForm(null)
    logActivity("Recepção", "Cadastro atualizado", "Paciente", atualizado.id)
  }

  const handleCadastroLeito = () => {
    const numero = formLeito.numero.trim().toLocaleUpperCase("pt-BR")
    if (!numero) return
    if (leitos.some((bed) => bed.numero.toLocaleUpperCase("pt-BR") === numero)) {
      setLeitoError("Já existe um leito com esse número.")
      return
    }
    const novo: Leito = {
      id: `L-${String(leitos.length + 1).padStart(3, "0")}`,
      numero,
      andar: formLeito.andar,
      setor: formLeito.setor,
      tipo: formLeito.tipo,
      status: "Disponível",
    }
    setLeitos((current) => [...current, novo])
    logActivity("Recepção", "Cadastro concluído", "Leito", `${novo.id} · ${novo.numero} · ${novo.setor} · ${novo.andar}`)
    setLeitoError("")
    setLeitoSucesso(true)
    setTimeout(() => {
      setLeitoSucesso(false)
      setFormLeito({ numero: "", andar: "1º andar", setor: "Clínica Médica", tipo: "Enfermaria" })
    }, 2500)
  }

  const handleLiberarLeito = (leitoId: string) => {
    const leito = leitos.find((item) => item.id === leitoId)
    if (!leito || leito.status !== "Higienização") return
    setLeitos((current) => current.map((item) => item.id === leitoId ? { ...item, status: "Disponível" } : item))
    logActivity("Recepção", "Leito liberado após higienização", "Leito", `${leito.numero} · ${leito.andar}`)
  }

  const handleCadastroInternacao = () => {
    if (
      !formInternacao.pacienteId ||
      !formInternacao.leitoId ||
      !formInternacao.motivo.trim()
    )
      return
    const paciente = pacientesCadastrados.find((item) => item.id === formInternacao.pacienteId)
    const leitoSelecionado = leitos.find((item) => item.id === formInternacao.leitoId)
    const medico = medicosDisponiveis.find((item) => item.id === formInternacao.medicoId)
    if (!paciente || !leitoSelecionado || leitoSelecionado.status !== "Disponível") {
      setInternacaoError("O paciente ou leito selecionado não está mais disponível.")
      return
    }
    if (leitos.some((item) => item.status === "Ocupado" && item.pacienteId === paciente.id)) {
      setInternacaoError("Este paciente já possui um leito ocupado.")
      return
    }
    const admission: Hospitalization = {
      id: "INT-LOCAL-" + Date.now(),
      pacienteId: paciente.id,
      leitoId: leitoSelecionado.id,
      leito: leitoSelecionado.numero,
      setor: leitoSelecionado.setor || leitoSelecionado.tipo,
      motivo: formInternacao.motivo.trim(),
      medicoId: formInternacao.medicoId,
      medico: medico?.nome ?? "Equipe médica",
      dataEntrada: new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date()),
      dataAltaPrevista: "A definir",
      status: "Ativa",
    }
    setInternacoesLocais((current) => [admission, ...current])
    setLeitos((current) =>
      current.map((l) =>
        l.id === formInternacao.leitoId
          ? { ...l, status: "Ocupado", pacienteId: formInternacao.pacienteId }
          : l,
      ),
    )
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
  }

  const handleConfirmarAlta = (leitoId: string) => {
    const leito = leitos.find((item) => item.id === leitoId)
    if (!leito || leito.status !== "Ocupado") return
    const pacienteId = leito.pacienteId ?? ""
    const dataAlta = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date())
    setInternacoesLocais((current) => current.map((item) => item.leitoId === leitoId && item.status === "Ativa" ? { ...item, status: "Alta", dataAlta } : item))
    setLeitos((current) => current.map((item) => item.id === leitoId ? { ...item, status: "Higienização", pacienteId: undefined } : item))
    logActivity("Recepção", "Alta registrada", pacienteId, `Leito ${leito.numero} · ${dataAlta}`)
    setAltaEmConfirmacaoId(null)
  }

  const handleAgendamento = () => {
    if (
      !formAgendamento.hora ||
      !formAgendamento.pacienteId ||
      horariosOcupados.includes(formAgendamento.hora)
    )
      return
    const paciente = pacientesCadastrados.find(
      (p) => p.id === formAgendamento.pacienteId,
    )
    const novo = {
      id: `AG-${String(agendamentos.length + 1).padStart(3, "0")}`,
      medicoId: formAgendamento.medicoId,
      data: formAgendamento.data,
      hora: formAgendamento.hora,
      paciente: paciente?.nome ?? "",
      pacienteId: formAgendamento.pacienteId,
      status: "Agendada" as const,
    }
    setAgendamentos((current) => [...current, novo])
    logActivity("Recepção", "Agendamento criado", "Consulta", `${novo.id} · ${formAgendamento.pacienteId} · ${novo.data} ${novo.hora}`)
    setAgendamentoSucesso(true)
    setTimeout(() => {
      setAgendamentoSucesso(false)
      setFormAgendamento({
        medicoId: DOCTOR_DEMO_ID,
        data: localDateInputValue(),
        hora: "",
        pacienteId: "",
      })
    }, 2500)
  }

  const handleIniciarExame = (examId: string) => {
    const exam = examesSolicitados.find((item) => item.id === examId)
    if (!exam || exam.status !== "agendado") return
    setExamesSolicitados((current) => current.map((item) => item.id === examId ? { ...item, status: "em andamento" } : item))
    logActivity("Recepção", "Exame encaminhado para execução", exam.pacienteId, `${exam.nome} · ${exam.id}`)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "recepcao", label: "Central da Recepção" },
    { key: "cadastro-paciente", label: "Cadastrar Paciente" },
    { key: "consulta-paciente", label: "Consultar Paciente" },
    { key: "equipe", label: "Equipe e Profissionais" },
    { key: "atividades", label: "Registro de Atividades" },
    { key: "cadastro-leito", label: "Cadastrar Leito" },
    { key: "mapa-leitos", label: "Mapa de Leitos" },
    { key: "internacao", label: "Internação" },
    { key: "agendamento", label: "Agendamento" },
    { key: "ficha", label: "Ficha de Atendimento" },
  ]

  const PageTitle = ({
    title,
    subtitle,
    action,
  }: {
    title: string
    subtitle: string
    action?: React.ReactNode
  }) => (
    <div className="flex flex-col items-stretch justify-between gap-3 mb-6 sm:flex-row sm:items-start sm:gap-4">
      <div>
        <h1
          className="text-2xl md:text-3xl font-semibold tracking-tight"
          style={{ color: "var(--foreground)" }}
        >
          {title}
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: "var(--muted-foreground)" }}
        >
          {subtitle}
        </p>
      </div>
      {action}
    </div>
  )

  const Input = ({
    label,
    value,
    onChange,
    placeholder,
    required,
    error,
    hint,
    type = "text",
  }: {
    label: string
    value: string
    onChange: (v: string) => void
    placeholder?: string
    required?: boolean
    error?: string
    hint?: string
    type?: string
  }) => (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-[11px] font-semibold"
        style={{ color: "var(--foreground)" }}
      >
        {label}
        {required && <span style={{ color: "#C0392B" }}> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 px-3 rounded-lg text-xs outline-none"
        style={{
          background: "var(--card)",
          border: `1px solid ${error ? "#E74C3C" : "var(--border)"}`,
          color: "var(--foreground)",
        }}
      />
      {error && (
        <span className="text-[10px]" style={{ color: "#C0392B" }}>
          {error}
        </span>
      )}
      {!error && hint && (
        <span
          className="text-[10px]"
          style={{ color: "var(--muted-foreground)" }}
        >
          {hint}
        </span>
      )}
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <DashboardSidebar
        role="Recepção"
        initials={RECEPCIONISTA.iniciais}
        name={RECEPCIONISTA.nome}
        detail={`${RECEPCIONISTA.cargo} · ${RECEPCIONISTA.registro}`}
        tabs={tabs}
        activeTab={activeTab}
        onSelect={(key) => setActiveTab(key as Tab)}
        onLogout={() => onNavigate("login")}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
      <div className="min-w-0 xl:ml-64">
        <header
          className="sticky top-0 z-20 hidden min-h-16 items-center justify-end border-b px-3 py-3 sm:px-6 xl:flex"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <div className="min-w-0 max-w-[110px] text-right sm:max-w-[220px]">
              <div
                className="truncate text-xs font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                {RECEPCIONISTA.nome}
              </div>
              <div
                className="hidden text-[10px] sm:block"
                style={{ color: "var(--muted-foreground)" }}
              >
                {RECEPCIONISTA.cargo} · {RECEPCIONISTA.registro}
              </div>
            </div>
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: "var(--accent)" }}
            >
              {RECEPCIONISTA.iniciais}
            </div>
          </div>
        </header>

        <main className="dashboard-main mx-auto w-full min-w-0 max-w-7xl flex-1 px-4 pb-24 pt-20 sm:px-6 xl:p-6">
          {activeTab === "equipe" && <StaffManagement professionals={profissionais} setProfessionals={setProfissionais} />}
          {activeTab === "atividades" && <ActivityLog />}
          {/* ============ CENTRAL DA RECEPÇÃO ============ */}
          {activeTab === "recepcao" && (
            <div className="fade-in">
              <PageTitle
                title={`Bom dia, ${RECEPCIONISTA.nome.split(" ")[0]}`}
                subtitle={`${formatLongLocalDate()} · Visão unificada da recepção`}
              />

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  {
                    label: "Consultas hoje",
                    value: String(
                      agendamentos.filter((a) => a.data === localDateInputValue())
                        .length,
                    ),
                    icon: "calendar" as IconName,
                    detail: "Agendadas",
                  },
                  {
                    label: "Exames marcados",
                    value: String(examesAgendados.length + examesDaRecepcao.length),
                    icon: "clipboard" as IconName,
                    detail: "Hoje e amanhã",
                  },
                  {
                    label: "Leitos disponíveis",
                    value: String(leitosDisponiveis.length),
                    icon: "bed" as IconName,
                    detail: `de ${leitos.length}`,
                  },
                  {
                    label: "Pacientes internados",
                    value: String(leitosOcupados.length),
                    icon: "users" as IconName,
                    detail: "Ativos",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-[var(--radius)] p-5"
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{
                          background: "var(--secondary)",
                          color: "var(--primary)",
                        }}
                      >
                        <Icon name={s.icon} size={18} />
                      </div>
                      <span
                        className="text-[10px] font-medium"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {s.detail}
                      </span>
                    </div>
                    <div
                      className="text-2xl font-bold tracking-tight"
                      style={{ color: "var(--foreground)" }}
                    >
                      {s.value}
                    </div>
                    <div
                      className="text-xs mt-1"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                {/* Agenda dos médicos */}
                <div
                  className="rounded-[var(--radius)] p-5"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3
                        className="font-semibold text-sm"
                        style={{ color: "var(--foreground)" }}
                      >
                        Agenda dos médicos — hoje
                      </h3>
                      <p
                        className="text-[11px] mt-0.5"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Consultas agendadas por profissional
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("agendamento")}
                      className="text-[10px] font-semibold cursor-pointer"
                      style={{ color: "var(--primary)" }}
                    >
                      Novo agendamento
                    </button>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {medicosDisponiveis.map((m) => {
                      const consultas = agendamentos.filter(
                        (a) => a.medicoId === m.id && a.data === localDateInputValue(),
                      )
                      return (
                        <div
                          key={m.id}
                          className="p-3 rounded-lg"
                          style={{ background: "var(--secondary)" }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div
                                className="text-xs font-semibold"
                                style={{ color: "var(--foreground)" }}
                              >
                                {m.nome}
                              </div>
                              <div
                                className="text-[10px]"
                                style={{ color: "var(--muted-foreground)" }}
                              >
                                {m.especialidade}
                              </div>
                            </div>
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{
                                background: "var(--card)",
                                color: "var(--primary)",
                              }}
                            >
                              {consultas.length} consulta
                              {consultas.length === 1 ? "" : "s"}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {consultas.length === 0 && (
                              <span
                                className="text-[10px]"
                                style={{ color: "var(--muted-foreground)" }}
                              >
                                Nenhuma consulta agendada hoje.
                              </span>
                            )}
                            {consultas
                              .sort((a, b) => a.hora.localeCompare(b.hora))
                              .map((c) => (
                                <span
                                  key={c.id}
                                  className="text-[10px] font-mono px-2 py-0.5 rounded"
                                  style={{
                                    background: "var(--card)",
                                    color: "var(--foreground)",
                                    border: "1px solid var(--border)",
                                  }}
                                >
                                  {c.hora} · {c.paciente.split(" ")[0]}
                                </span>
                              ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Exames marcados */}
                <div
                  className="rounded-[var(--radius)] p-5"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3
                        className="font-semibold text-sm"
                        style={{ color: "var(--foreground)" }}
                      >
                        Exames marcados
                      </h3>
                      <p
                        className="text-[11px] mt-0.5"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Próximos exames da agenda
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {examesAgendados.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center gap-3 p-3 rounded-lg"
                        style={{ background: "var(--secondary)" }}
                      >
                        <div
                          className="w-10 text-center font-mono text-xs font-bold shrink-0"
                          style={{ color: "var(--primary)" }}
                        >
                          {e.hora}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className="text-xs font-semibold truncate"
                            style={{ color: "var(--foreground)" }}
                          >
                            {e.exame}
                          </div>
                          <div
                            className="text-[10px] truncate"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            {e.paciente} · {e.setor}
                          </div>
                        </div>
                        <span
                          className="text-[10px] font-mono shrink-0"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {e.data.split("-").reverse().join("/")}
                        </span>
                      </div>
                    ))}
                    {examesDaRecepcao.map((exam) => (
                      <div key={exam.id} className="flex flex-wrap items-center gap-3 rounded-lg p-3" style={{ background: "var(--secondary)" }}>
                        <div className="w-10 shrink-0 text-center font-mono text-xs font-bold" style={{ color: "var(--primary)" }}>{exam.hora}</div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-semibold" style={{ color: "var(--foreground)" }}>{exam.nome}</div>
                          <div className="truncate text-[10px]" style={{ color: "var(--muted-foreground)" }}>{exam.paciente} · {exam.setor} · Solicitado por {exam.solicitante}</div>
                        </div>
                        <span className="shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold" style={{ background: "var(--card)", color: "var(--primary)" }}>{exam.status === "agendado" ? "Solicitado" : exam.status === "em andamento" ? "Em andamento" : "Resultado disponível"}</span>
                        {exam.status === "agendado" && <button type="button" onClick={() => handleIniciarExame(exam.id)} className="min-h-8 rounded-lg px-2.5 text-[10px] font-semibold" style={{ background: "var(--card)", color: "var(--primary)" }}>Iniciar exame</button>}
                        <span className="shrink-0 text-[10px] font-mono" style={{ color: "var(--muted-foreground)" }}>{exam.data}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Disponibilidade de leitos — resumo */}
              <div
                className="rounded-[var(--radius)] p-5"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3
                      className="font-semibold text-sm"
                      style={{ color: "var(--foreground)" }}
                    >
                      Disponibilidade de leitos
                    </h3>
                    <p
                      className="text-[11px] mt-0.5"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Resumo por tipo e status
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("mapa-leitos")}
                    className="text-[10px] font-semibold cursor-pointer"
                    style={{ color: "var(--primary)" }}
                  >
                    Ver mapa completo
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(["Enfermaria", "UTI", "Isolamento"] as Leito["tipo"][]).map(
                    (tipo) => {
                      const total = leitos.filter((l) => l.tipo === tipo).length
                      const livres = leitos.filter(
                        (l) => l.tipo === tipo && l.status === "Disponível",
                      ).length
                      return (
                        <div
                          key={tipo}
                          className="p-4 rounded-lg"
                          style={{ background: "var(--secondary)" }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ background: leitoTipoColor[tipo] }}
                            />
                            <span
                              className="text-[11px] font-semibold"
                              style={{ color: "var(--foreground)" }}
                            >
                              {tipo}
                            </span>
                          </div>
                          <div
                            className="text-lg font-bold"
                            style={{ color: "var(--primary)" }}
                          >
                            {livres}
                            <span
                              className="text-[11px] ml-1 font-normal"
                              style={{ color: "var(--muted-foreground)" }}
                            >
                              / {total} livres
                            </span>
                          </div>
                        </div>
                      )
                    },
                  )}
                  <div
                    className="p-4 rounded-lg"
                    style={{ background: "#FDEDEC" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: "#E74C3C" }}
                      />
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: "#B8322A" }}
                      >
                        Ocupados
                      </span>
                    </div>
                    <div
                      className="text-lg font-bold"
                      style={{ color: "#B8322A" }}
                    >
                      {leitosOcupados.length}
                      <span
                        className="text-[11px] ml-1 font-normal"
                        style={{ color: "#B8322A", opacity: 0.7 }}
                      >
                        / {leitos.length}
                      </span>
                    </div>
                  </div>
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
              />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div
                  className="lg:col-span-2 rounded-[var(--radius)] p-6 flex flex-col gap-4"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Nome completo"
                      value={formPaciente.nome}
                      onChange={(v) =>
                        setFormPaciente({ ...formPaciente, nome: v })
                      }
                      placeholder="Ex.: João da Silva"
                      required
                      error={
                        formPaciente.nome.length > 0 &&
                        formPaciente.nome.trim().length < 3
                          ? "Informe ao menos 3 caracteres"
                          : undefined
                      }
                    />
                    <Input
                      label="CPF"
                      value={formPaciente.cpf}
                      onChange={(v) =>
                        setFormPaciente({
                          ...formPaciente,
                          cpf: formatarCPF(v),
                        })
                      }
                      placeholder="000.000.000-00"
                      required
                      error={
                        formPaciente.cpf.length === 14 && !cpfValido
                          ? "CPF inválido"
                          : cpfDuplicado
                            ? "CPF já cadastrado no sistema"
                            : undefined
                      }
                      hint={
                        formPaciente.cpf.length === 14 &&
                        cpfValido &&
                        !cpfDuplicado
                          ? "CPF válido"
                          : undefined
                      }
                    />
                    <Input
                      label="Data de nascimento"
                      value={formPaciente.dataNasc}
                      onChange={(v) => {
                        const nums = v.replace(/\D/g, "").slice(0, 8)
                        const fmt = nums
                          .replace(/(\d{2})(\d)/, "$1/$2")
                          .replace(/(\d{2})(\d)/, "$1/$2")
                        setFormPaciente({ ...formPaciente, dataNasc: fmt })
                      }}
                      placeholder="DD/MM/AAAA"
                      required
                    />
                    <Input
                      label="Telefone"
                      value={formPaciente.telefone}
                      onChange={(v) =>
                        setFormPaciente({
                          ...formPaciente,
                          telefone: formatarTelefone(v),
                        })
                      }
                      placeholder="(11) 90000-0000"
                      required
                    />
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-[11px] font-semibold"
                        style={{ color: "var(--foreground)" }}
                      >
                        Convênio<span style={{ color: "#C0392B" }}> *</span>
                      </label>
                      <select
                        value={formPaciente.convenio}
                        onChange={(e) =>
                          setFormPaciente({
                            ...formPaciente,
                            convenio: e.target.value,
                          })
                        }
                        className="h-10 px-3 rounded-lg text-xs outline-none"
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          color: "var(--foreground)",
                        }}
                      >
                        <option value="">Selecione...</option>
                        <option value="Amil Gold">Amil Gold</option>
                        <option value="Unimed">Unimed</option>
                        <option value="SulAmérica">SulAmérica</option>
                        <option value="SUS">SUS</option>
                        <option value="Particular">Particular</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-[11px] font-semibold"
                        style={{ color: "var(--foreground)" }}
                      >
                        Sexo<span style={{ color: "#C0392B" }}> *</span>
                      </label>
                      <select
                        value={formPaciente.sexo}
                        onChange={(e) =>
                          setFormPaciente({
                            ...formPaciente,
                            sexo: e.target.value,
                          })
                        }
                        className="h-10 px-3 rounded-lg text-xs outline-none"
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          color: "var(--foreground)",
                        }}
                      >
                        <option value="">Selecione...</option>
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                        <option value="O">Outro</option>
                      </select>
                    </div>
                  </div>

                  <div
                    className="flex items-center justify-between pt-4"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <span
                      className="text-[10px]"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Campos obrigatórios são validados automaticamente
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {cadastroSucesso && (
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
                          style={{ background: "#E8F8F5", color: "#007F72" }}
                        >
                          <Icon name="check" size={14} />
                          Paciente cadastrado
                        </span>
                      )}
                      <button
                        onClick={handleCadastroPaciente}
                        disabled={!podeCadastrar}
                        className="h-9 px-4 rounded-lg text-xs font-semibold text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: "var(--primary)" }}
                      >
                        Cadastrar paciente
                      </button>
                    </div>
                  </div>
                </div>

                {/* Verificações laterais */}
                <div
                  className="rounded-[var(--radius)] p-5 flex flex-col gap-3"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <h3
                    className="font-semibold text-sm"
                    style={{ color: "var(--foreground)" }}
                  >
                    Verificação em tempo real
                  </h3>

                  <div className="flex flex-col gap-2">
                    {[
                      {
                        label: "Nome",
                        ok: formPaciente.nome.trim().length >= 3,
                      },
                      { label: "CPF válido", ok: cpfValido },
                      { label: "CPF único", ok: !cpfDuplicado },
                      {
                        label: "Data de nascimento",
                        ok: formPaciente.dataNasc.length === 10,
                      },
                      {
                        label: "Telefone",
                        ok: formPaciente.telefone.length >= 14,
                      },
                      {
                        label: "Convênio",
                        ok: formPaciente.convenio.length > 0,
                      },
                      { label: "Sexo", ok: formPaciente.sexo.length > 0 },
                    ].map((c) => (
                      <div
                        key={c.label}
                        className="flex items-center gap-2 p-2.5 rounded-lg"
                        style={{
                          background: c.ok ? "#E8F8F5" : "var(--secondary)",
                        }}
                      >
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            background: c.ok ? "#00A896" : "var(--border)",
                            color: "white",
                          }}
                        >
                          <Icon name={c.ok ? "check" : "x"} size={12} />
                        </span>
                        <span
                          className="text-[11px] font-medium"
                          style={{
                            color: c.ok ? "#007F72" : "var(--muted-foreground)",
                          }}
                        >
                          {c.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {cpfDuplicado && (
                    <div
                      className="p-3 rounded-lg flex gap-2"
                      style={{
                        background: "#FDEDEC",
                        border: "1px solid #E74C3C55",
                      }}
                    >
                      <Icon name="alert" size={16} />
                      <div>
                        <div
                          className="text-[11px] font-bold"
                          style={{ color: "#B8322A" }}
                        >
                          CPF já cadastrado
                        </div>
                        <div
                          className="text-[10px] mt-0.5"
                          style={{ color: "#B8322A" }}
                        >
                          Já existe um paciente com este CPF no sistema. Utilize
                          a consulta para localizar o cadastro existente.
                        </div>
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
              <PageTitle
                title="Consultar paciente"
                subtitle="Busque por CPF ou nome para visualizar dados cadastrais e histórico"
              />

              <div
                className="rounded-[var(--radius)] p-5 mb-5"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      <Icon name="search" size={16} />
                    </span>
                    <input
                      value={buscaPaciente}
                      onChange={(e) => setBuscaPaciente(e.target.value)}
                      placeholder="Digite o CPF ou nome do paciente..."
                      className="w-full h-10 pl-9 pr-3 rounded-lg text-xs outline-none"
                      style={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        color: "var(--foreground)",
                      }}
                    />
                  </div>
                  <button
                    onClick={handleBuscarPaciente}
                    className="h-10 px-5 rounded-lg text-xs font-semibold text-white cursor-pointer"
                    style={{ background: "var(--primary)" }}
                  >
                    Buscar
                  </button>
                </div>
              </div>

              {pacienteEncontrado ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 slide-up">
                  <div
                    className="rounded-[var(--radius)] p-5"
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ background: "var(--primary)" }}
                      >
                        {pacienteEncontrado.nome
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div className="min-w-0">
                        <h2
                          className="text-base font-semibold truncate"
                          style={{ color: "var(--foreground)" }}
                        >
                          {pacienteEncontrado.nome}
                        </h2>
                        <div
                          className="text-[11px] mt-0.5"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {pacienteEncontrado.id}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      {[
                        ["CPF", pacienteEncontrado.cpf],
                        ["Nascimento", pacienteEncontrado.dataNasc],
                        ["Telefone", pacienteEncontrado.telefone],
                        ["Convênio", pacienteEncontrado.convenio],
                        [
                          "Sexo",
                          pacienteEncontrado.sexo === "M"
                            ? "Masculino"
                            : pacienteEncontrado.sexo === "F"
                              ? "Feminino"
                              : "Outro",
                        ],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <div
                            className="text-[9px] uppercase tracking-wide"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            {label}
                          </div>
                          <div
                            className="text-xs font-medium mt-0.5"
                            style={{ color: "var(--foreground)" }}
                          >
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                    {editForm ? (
                      <form onSubmit={handleSalvarEdicaoPaciente} className="mt-5 space-y-3 border-t pt-4" style={{ borderColor: "var(--border)" }}>
                        <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Editar dados cadastrais</h3>
                        <label className="block text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>Nome completo
                          <input required minLength={3} value={editForm.nome} onChange={(event) => setEditForm({ ...editForm, nome: event.target.value })} className="mt-1 min-h-11 w-full rounded-lg border px-3 text-sm" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }} />
                        </label>
                        <label className="block text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>Nascimento
                          <input required value={editForm.dataNasc} onChange={(event) => setEditForm({ ...editForm, dataNasc: event.target.value })} placeholder="DD/MM/AAAA" className="mt-1 min-h-11 w-full rounded-lg border px-3 text-sm" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }} />
                        </label>
                        <label className="block text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>Telefone
                          <input required value={editForm.telefone} onChange={(event) => setEditForm({ ...editForm, telefone: event.target.value })} className="mt-1 min-h-11 w-full rounded-lg border px-3 text-sm" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }} />
                        </label>
                        <label className="block text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>Convênio
                          <input required value={editForm.convenio} onChange={(event) => setEditForm({ ...editForm, convenio: event.target.value })} className="mt-1 min-h-11 w-full rounded-lg border px-3 text-sm" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }} />
                        </label>
                        <label className="block text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>Sexo
                          <select required value={editForm.sexo} onChange={(event) => setEditForm({ ...editForm, sexo: event.target.value })} className="mt-1 min-h-11 w-full rounded-lg border px-3 text-sm" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
                            <option value="">Selecione</option><option value="M">Masculino</option><option value="F">Feminino</option><option value="Outro">Outro</option>
                          </select>
                        </label>
                        <div className="flex flex-col gap-2 min-[420px]:flex-row">
                          <button type="submit" className="min-h-10 flex-1 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Salvar alterações</button>
                          <button type="button" onClick={() => setEditForm(null)} className="min-h-10 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--secondary)", color: "var(--primary)" }}>Cancelar</button>
                        </div>
                      </form>
                    ) : (
                      <button type="button" onClick={() => setEditForm({ nome: pacienteEncontrado.nome, dataNasc: pacienteEncontrado.dataNasc, telefone: pacienteEncontrado.telefone, convenio: pacienteEncontrado.convenio, sexo: pacienteEncontrado.sexo })} className="mt-5 min-h-10 w-full rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--secondary)", color: "var(--primary)" }}>
                        Editar cadastro
                      </button>
                    )}
                  </div>

                  <div className="lg:col-span-2">
                    <div
                      className="rounded-[var(--radius)] p-5"
                      style={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <h3
                        className="font-semibold text-sm mb-3"
                        style={{ color: "var(--foreground)" }}
                      >
                        Histórico de atendimentos
                      </h3>
                      <div className="flex flex-col gap-2.5">
                        {(
                          historicoAtendimentos[pacienteEncontrado.id] ?? []
                        ).map((h, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-lg flex items-center gap-4"
                            style={{ background: "var(--secondary)" }}
                          >
                            <div
                              className="w-24 text-xs font-mono shrink-0"
                              style={{ color: "var(--muted-foreground)" }}
                            >
                              {h.data}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div
                                className="text-xs font-semibold"
                                style={{ color: "var(--foreground)" }}
                              >
                                {h.tipo}
                              </div>
                              <div
                                className="text-[10px] mt-0.5"
                                style={{ color: "var(--muted-foreground)" }}
                              >
                                {h.medico} · {h.local}
                              </div>
                            </div>
                          </div>
                        ))}
                        {(historicoAtendimentos[pacienteEncontrado.id] ?? [])
                          .length === 0 && (
                          <p
                            className="text-xs text-center py-6"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            Nenhum atendimento registrado.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                buscaPaciente && (
                  <div
                    className="rounded-[var(--radius)] p-10 flex flex-col items-center justify-center h-48"
                    style={{
                      background: "var(--card)",
                      border: "1px dashed var(--border)",
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                      style={{
                        background: "var(--secondary)",
                        color: "var(--primary)",
                      }}
                    >
                      <Icon name="search" size={19} />
                    </div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--foreground)" }}
                    >
                      Nenhum paciente encontrado
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Verifique o CPF ou nome informado.
                    </p>
                  </div>
                )
              )}
            </div>
          )}

          {/* ============ CADASTRO DE LEITO ============ */}
          {activeTab === "cadastro-leito" && (
            <div className="fade-in">
              <PageTitle
                title="Cadastrar leito"
                subtitle="Informe número, andar e tipo do leito a ser adicionado"
              />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div
                  className="lg:col-span-2 rounded-[var(--radius)] p-6 flex flex-col gap-4"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <Input
                      label="Número do leito"
                      value={formLeito.numero}
                      onChange={(value) => {
                        setLeitoError("")
                        setFormLeito({ ...formLeito, numero: value.toUpperCase() })
                      }}
                      placeholder="Ex.: 12A"
                      required
                    />
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-[11px] font-semibold"
                        style={{ color: "var(--foreground)" }}
                      >
                        Andar<span style={{ color: "#C0392B" }}> *</span>
                      </label>
                      <select
                        value={formLeito.andar}
                        onChange={(e) =>
                          setFormLeito({ ...formLeito, andar: e.target.value })
                        }
                        className="h-10 px-3 rounded-lg text-xs outline-none"
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          color: "var(--foreground)",
                        }}
                      >
                        <option value="1º andar">1º andar</option>
                        <option value="2º andar">2º andar</option>
                        <option value="3º andar">3º andar</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold" style={{ color: "var(--foreground)" }}>Setor<span style={{ color: "#C0392B" }}> *</span></label>
                      <select value={formLeito.setor || "__outro__"} onChange={(event) => setFormLeito({ ...formLeito, setor: event.target.value === "__outro__" ? "" : event.target.value })} className="h-10 rounded-lg px-3 text-xs outline-none" style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                        {setoresDisponiveis.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
                        {formLeito.setor && !setoresDisponiveis.includes(formLeito.setor) && <option value={formLeito.setor}>{formLeito.setor}</option>}
                        <option value="__outro__">Cadastrar outro setor…</option>
                      </select>
                      {!formLeito.setor && <input autoFocus required value={formLeito.setor} onChange={(event) => setFormLeito({ ...formLeito, setor: event.target.value })} placeholder="Nome do novo setor" className="min-h-10 rounded-lg border px-3 text-xs" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }} />}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-[11px] font-semibold"
                        style={{ color: "var(--foreground)" }}
                      >
                        Tipo<span style={{ color: "#C0392B" }}> *</span>
                      </label>
                      <select
                        value={formLeito.tipo}
                        onChange={(e) =>
                          setFormLeito({
                            ...formLeito,
                            tipo: e.target.value as Leito["tipo"],
                          })
                        }
                        className="h-10 px-3 rounded-lg text-xs outline-none"
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          color: "var(--foreground)",
                        }}
                      >
                        <option value="Enfermaria">Enfermaria</option>
                        <option value="UTI">UTI</option>
                        <option value="Isolamento">Isolamento</option>
                      </select>
                    </div>
                  </div>

                  {leitoError && <p role="alert" className="text-xs font-semibold text-red-600">{leitoError}</p>}

                  <div
                    className="flex items-center justify-between pt-4"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <span
                      className="text-[10px]"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Leitos cadastrados entram como "Disponível"
                      automaticamente.
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {leitoSucesso && (
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
                          style={{ background: "#E8F8F5", color: "#007F72" }}
                        >
                          <Icon name="check" size={14} />
                          Leito cadastrado
                        </span>
                      )}
                      <button
                        onClick={handleCadastroLeito}
                        disabled={!formLeito.numero.trim() || !formLeito.setor.trim()}
                        className="h-9 px-4 rounded-lg text-xs font-semibold text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: "var(--primary)" }}
                      >
                        Cadastrar leito
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-[var(--radius)] p-5"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <h3
                    className="font-semibold text-sm mb-3"
                    style={{ color: "var(--foreground)" }}
                  >
                    Últimos cadastrados
                  </h3>
                  <div className="flex flex-col gap-2">
                    {[...leitos]
                      .reverse()
                      .slice(0, 6)
                      .map((l) => (
                        <div
                          key={l.id}
                          className="p-2.5 rounded-lg flex items-center justify-between"
                          style={{ background: "var(--secondary)" }}
                        >
                          <div>
                            <div
                              className="text-xs font-semibold"
                              style={{ color: "var(--foreground)" }}
                            >
                              Leito {l.numero}
                            </div>
                            <div
                              className="text-[10px]"
                              style={{ color: "var(--muted-foreground)" }}
                            >
                              {l.setor || l.tipo} · {l.andar} · {l.tipo}
                            </div>
                          </div>
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{
                              background: leitoStatusColor[l.status].dot,
                            }}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============ MAPA DE LEITOS ============ */}
          {activeTab === "mapa-leitos" && (
            <div className="fade-in">
              <PageTitle
                title="Mapa de leitos"
                subtitle="Ocupação em tempo real com filtros por status, setor e tipo"
              />

              <div
                className="rounded-[var(--radius)] p-4 mb-5 flex flex-wrap gap-3"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex flex-col gap-1">
                  <span
                    className="text-[9px] uppercase tracking-wide"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Status
                  </span>
                  <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                    className="h-9 px-3 rounded-lg text-xs outline-none"
                    style={{
                      background: "var(--secondary)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                  >
                    <option value="Todos">Todos</option>
                    <option value="Disponível">Disponível</option>
                    <option value="Ocupado">Ocupado</option>
                    <option value="Higienização">Higienização</option>
                    <option value="Manutenção">Manutenção</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>Setor</span>
                  <select value={filtroSetor} onChange={(event) => setFiltroSetor(event.target.value)} aria-label="Filtrar leitos por setor" className="h-9 rounded-lg px-3 text-xs outline-none" style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                    <option value="Todos">Todos</option>
                    {[...new Set(leitos.map((bed) => bed.setor || bed.tipo))].sort((a, b) => a.localeCompare(b, "pt-BR")).map((sector) => <option key={sector} value={sector}>{sector}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <span
                    className="text-[9px] uppercase tracking-wide"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Andar
                  </span>
                  <select
                    value={filtroAndar}
                    onChange={(e) => setFiltroAndar(e.target.value)}
                    className="h-9 px-3 rounded-lg text-xs outline-none"
                    style={{
                      background: "var(--secondary)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                  >
                    <option value="Todos">Todos</option>
                    <option value="1º andar">1º andar</option>
                    <option value="2º andar">2º andar</option>
                    <option value="3º andar">3º andar</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <span
                    className="text-[9px] uppercase tracking-wide"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Tipo
                  </span>
                  <select
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className="h-9 px-3 rounded-lg text-xs outline-none"
                    style={{
                      background: "var(--secondary)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                  >
                    <option value="Todos">Todos</option>
                    <option value="Enfermaria">Enfermaria</option>
                    <option value="UTI">UTI</option>
                    <option value="Isolamento">Isolamento</option>
                  </select>
                </div>

                <div className="ml-auto flex items-center gap-4">
                  {Object.entries(leitoStatusColor).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: v.dot }}
                      />
                      <span
                        className="text-[10px]"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {k}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {leitosFiltrados.map((l) => {
                  const sc = leitoStatusColor[l.status]
                  const pac = l.pacienteId
                    ? pacientesCadastrados.find((p) => p.id === l.pacienteId)
                    : null
                  return (
                    <div
                      key={l.id}
                      className="rounded-[var(--radius)] p-4"
                      style={{
                        background: "var(--card)",
                        border: `1px solid ${sc.dot}44`,
                        borderLeft: `4px solid ${sc.dot}`,
                      }}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          aria-label={`Ver detalhes do leito ${l.numero}`}
                          aria-pressed={leitoMapaSelecionadoId === l.id}
                          onClick={() => setLeitoMapaSelecionadoId(l.id)}
                          className="min-h-9 rounded-lg px-2 text-left text-sm font-bold underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                          style={{ color: "var(--foreground)" }}
                        >
                          Leito {l.numero}
                        </button>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: sc.dot }} />
                      </div>
                      <div
                        className="text-[10px]"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {l.setor || l.tipo} · {l.andar}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: leitoTipoColor[l.tipo] }}
                        />
                        <span
                          className="text-[10px] font-semibold"
                          style={{ color: leitoTipoColor[l.tipo] }}
                        >
                          {l.tipo}
                        </span>
                      </div>
                      <div
                        className="mt-3 pt-3"
                        style={{ borderTop: "1px solid var(--border)" }}
                      >
                        {pac ? (
                          <div>
                            <div
                              className="text-[10px]"
                              style={{ color: "var(--muted-foreground)" }}
                            >
                              Ocupado por
                            </div>
                            <div
                              className="text-[11px] font-semibold truncate mt-0.5"
                              style={{ color: "var(--foreground)" }}
                            >
                              {pac.nome}
                            </div>
                          </div>
                        ) : (
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block"
                            style={{ background: sc.bg, color: sc.text }}
                          >
                            {l.status}
                          </span>
                        )}
                      </div>
                      {l.status === "Higienização" && (
                        <button type="button" onClick={() => handleLiberarLeito(l.id)} className="mt-3 min-h-10 w-full rounded-lg px-2 text-[10px] font-semibold" style={{ background: "var(--secondary)", color: "var(--primary)" }}>
                          Marcar como disponível
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              {leitoMapaSelecionado && (
                <section className="mt-5 rounded-[var(--radius)] border p-4 sm:p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }} aria-labelledby="leito-selecionado-titulo">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 id="leito-selecionado-titulo" className="text-base font-bold" style={{ color: "var(--foreground)" }}>Leito {leitoMapaSelecionado.numero}</h3>
                      <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>{leitoMapaSelecionado.setor || leitoMapaSelecionado.tipo} · {leitoMapaSelecionado.andar} · {leitoMapaSelecionado.tipo}</p>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: leitoStatusColor[leitoMapaSelecionado.status].bg, color: leitoStatusColor[leitoMapaSelecionado.status].text }}>{leitoMapaSelecionado.status}</span>
                  </div>
                  {leitoMapaSelecionado.pacienteId ? (
                    <div className="mt-3 rounded-xl p-3 text-xs" style={{ background: "var(--background)", color: "var(--muted-foreground)" }}>
                      {(() => {
                        const patient = pacientesCadastrados.find((item) => item.id === leitoMapaSelecionado.pacienteId)
                        const admission = internacoesLocais.find((item) => item.leitoId === leitoMapaSelecionado.id && item.status === "Ativa")
                        return (
                          <>
                            <p className="font-semibold" style={{ color: "var(--foreground)" }}>{patient?.nome ?? "Paciente não encontrado"} · {patient?.id}</p>
                            {admission && <p className="mt-1">Motivo: {admission.motivo} · Responsável: {admission.medico} · Entrada: {admission.dataEntrada}</p>}
                          </>
                        )
                      })()}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{leitoMapaSelecionado.status === "Disponível" ? "Este leito pode receber uma internação." : "Este leito não está disponível para internação."}</p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {leitoMapaSelecionado.status === "Disponível" && pacientesDisponiveisParaInternacao.length > 0 && (
                      <button type="button" onClick={() => {
                        setFormInternacao((current) => ({ ...current, leitoId: leitoMapaSelecionado.id }))
                        setActiveTab("internacao")
                      }} className="min-h-10 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Internar paciente neste leito</button>
                    )}
                    {leitoMapaSelecionado.status === "Ocupado" && (
                      <button type="button" onClick={() => setActiveTab("internacao")} className="min-h-10 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Gerenciar internação e alta</button>
                    )}
                    {leitoMapaSelecionado.status === "Higienização" && (
                      <button type="button" onClick={() => handleLiberarLeito(leitoMapaSelecionado.id)} className="min-h-10 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--secondary)", color: "var(--primary)" }}>Marcar como disponível</button>
                    )}
                    <button type="button" onClick={() => setLeitoMapaSelecionadoId(null)} className="min-h-10 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>Fechar detalhes</button>
                  </div>
                </section>
              )}

              {leitosFiltrados.length === 0 && (
                <div
                  className="rounded-[var(--radius)] p-10 flex flex-col items-center justify-center h-48"
                  style={{
                    background: "var(--card)",
                    border: "1px dashed var(--border)",
                  }}
                >
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--foreground)" }}
                  >
                    Nenhum leito encontrado
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Ajuste os filtros para ver outros resultados.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ============ INTERNAÇÃO ============ */}
          {activeTab === "internacao" && (
            <div className="fade-in">
              <PageTitle
                title="Cadastro de internação"
                subtitle="Associe um paciente a um leito disponível"
              />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div
                  className="lg:col-span-2 rounded-[var(--radius)] p-6 flex flex-col gap-4"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-[11px] font-semibold"
                        style={{ color: "var(--foreground)" }}
                      >
                        Paciente<span style={{ color: "#C0392B" }}> *</span>
                      </label>
                      <select
                        value={formInternacao.pacienteId}
                        onChange={(e) =>
                          setFormInternacao({
                            ...formInternacao,
                            pacienteId: e.target.value,
                          })
                        }
                        className="h-10 px-3 rounded-lg text-xs outline-none"
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          color: "var(--foreground)",
                        }}
                      >
                        <option value="">Selecione o paciente...</option>
                        {pacientesDisponiveisParaInternacao.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome} — {p.id}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-[11px] font-semibold"
                        style={{ color: "var(--foreground)" }}
                      >
                        Leito disponível
                        <span style={{ color: "#C0392B" }}> *</span>
                      </label>
                      <select
                        value={formInternacao.leitoId}
                        onChange={(e) =>
                          setFormInternacao({
                            ...formInternacao,
                            leitoId: e.target.value,
                          })
                        }
                        className="h-10 px-3 rounded-lg text-xs outline-none"
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          color: "var(--foreground)",
                        }}
                      >
                        <option value="">Selecione o leito...</option>
                        {leitosDisponiveis.map((l) => (
                          <option key={l.id} value={l.id}>
                            Leito {l.numero} · {l.setor || l.tipo} · {l.andar} · {l.tipo}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-[11px] font-semibold"
                        style={{ color: "var(--foreground)" }}
                      >
                        Médico responsável
                      </label>
                      <select
                        value={formInternacao.medicoId}
                        onChange={(e) =>
                          setFormInternacao({
                            ...formInternacao,
                            medicoId: e.target.value,
                          })
                        }
                        className="h-10 px-3 rounded-lg text-xs outline-none"
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          color: "var(--foreground)",
                        }}
                      >
                        <option value="">Selecione...</option>
                        {medicosDisponiveis.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nome} — {m.especialidade}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Input
                      label="Motivo da internação"
                      value={formInternacao.motivo}
                      onChange={(v) =>
                        setFormInternacao({ ...formInternacao, motivo: v })
                      }
                      placeholder="Ex.: Pneumonia bacteriana"
                      required
                    />
                  </div>

                  <div
                    className="flex items-center justify-between pt-4"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <span
                      className="text-[10px]"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Ao confirmar, o leito passa automaticamente para
                      "Ocupado".
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {internacaoSucesso && (
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
                          style={{ background: "#E8F8F5", color: "#007F72" }}
                        >
                          <Icon name="check" size={14} />
                          Internação registrada
                        </span>
                      )}
                      {internacaoError && <span role="alert" className="text-xs font-semibold text-red-600">{internacaoError}</span>}
                      <button
                        onClick={handleCadastroInternacao}
                        disabled={
                          !formInternacao.pacienteId ||
                          !formInternacao.leitoId ||
                          !formInternacao.motivo.trim()
                          || pacientesDisponiveisParaInternacao.length === 0
                          || leitosDisponiveis.length === 0
                        }
                        className="h-9 px-4 rounded-lg text-xs font-semibold text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: "var(--primary)" }}
                      >
                        Confirmar internação
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-[var(--radius)] p-5"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <h3
                    className="font-semibold text-sm mb-3"
                    style={{ color: "var(--foreground)" }}
                  >
                    Internados no momento
                  </h3>
                  <div className="flex flex-col gap-2">
                    {pacientesInternados.map((pi) => (
                      <div
                        key={pi.leito.id}
                        className="p-3 rounded-lg"
                        style={{ background: "var(--secondary)" }}
                      >
                        <div
                          className="text-xs font-semibold truncate"
                          style={{ color: "var(--foreground)" }}
                        >
                          {pi.paciente.nome}
                        </div>
                        <div
                          className="text-[10px] mt-0.5"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          Leito {pi.leito.numero} · {pi.leito.setor || pi.leito.tipo} · {pi.leito.andar} ·{" "}
                          {pi.leito.tipo}
                        </div>
                        {pi.internacao && (
                          <div className="mt-2 space-y-1 text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                            <p>Motivo: {pi.internacao.motivo}</p>
                            <p>Responsável: {pi.internacao.medico} · Entrada: {pi.internacao.dataEntrada}</p>
                          </div>
                        )}
                        {altaEmConfirmacaoId === pi.leito.id ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button type="button" onClick={() => handleConfirmarAlta(pi.leito.id)} className="min-h-9 rounded-lg px-3 text-[10px] font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Confirmar alta</button>
                            <button type="button" onClick={() => setAltaEmConfirmacaoId(null)} className="min-h-9 rounded-lg px-3 text-[10px] font-semibold" style={{ background: "var(--card)", color: "var(--muted-foreground)" }}>Cancelar</button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setAltaEmConfirmacaoId(pi.leito.id)} className="mt-3 min-h-9 w-full rounded-lg px-3 text-[10px] font-semibold" style={{ background: "var(--card)", color: "var(--primary)", border: "1px solid var(--border)" }}>Dar alta</button>
                        )}
                      </div>
                    ))}
                    {pacientesInternados.length === 0 && (
                      <p
                        className="text-xs text-center py-6"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Nenhum paciente internado no momento.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============ AGENDAMENTO ============ */}
          {activeTab === "agendamento" && (
            <div className="fade-in">
              <PageTitle
                title="Agendamento de consulta"
                subtitle="Escolha o médico, data e horário disponível"
              />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div
                  className="lg:col-span-2 rounded-[var(--radius)] p-6 flex flex-col gap-4"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-[11px] font-semibold"
                        style={{ color: "var(--foreground)" }}
                      >
                        Médico<span style={{ color: "#C0392B" }}> *</span>
                      </label>
                      <select
                        value={formAgendamento.medicoId}
                        onChange={(e) =>
                          setFormAgendamento({
                            ...formAgendamento,
                            medicoId: e.target.value,
                            hora: "",
                          })
                        }
                        className="h-10 px-3 rounded-lg text-xs outline-none"
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          color: "var(--foreground)",
                        }}
                      >
                        {medicosDisponiveis.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nome} — {m.especialidade}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        className="text-[11px] font-semibold"
                        style={{ color: "var(--foreground)" }}
                      >
                        Data<span style={{ color: "#C0392B" }}> *</span>
                      </label>
                      <input
                        type="date"
                        value={formAgendamento.data}
                        onChange={(e) =>
                          setFormAgendamento({
                            ...formAgendamento,
                            data: e.target.value,
                            hora: "",
                          })
                        }
                        className="h-10 px-3 rounded-lg text-xs outline-none"
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          color: "var(--foreground)",
                        }}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label
                        className="text-[11px] font-semibold"
                        style={{ color: "var(--foreground)" }}
                      >
                        Paciente<span style={{ color: "#C0392B" }}> *</span>
                      </label>
                      <select
                        value={formAgendamento.pacienteId}
                        onChange={(e) =>
                          setFormAgendamento({
                            ...formAgendamento,
                            pacienteId: e.target.value,
                          })
                        }
                        className="h-10 px-3 rounded-lg text-xs outline-none"
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          color: "var(--foreground)",
                        }}
                      >
                        <option value="">Selecione o paciente...</option>
                        {pacientesCadastrados.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome} — {p.cpf}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <div
                      className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Horários disponíveis ·{" "}
                      {formAgendamento.data.split("-").reverse().join("/")}
                    </div>
                    <div className="grid grid-cols-3 min-[420px]:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                      {horariosDisponiveis.map((h) => {
                        const ocupado = horariosOcupados.includes(h)
                        const selecionado = formAgendamento.hora === h
                        return (
                          <button
                            key={h}
                            disabled={ocupado}
                            onClick={() =>
                              setFormAgendamento({
                                ...formAgendamento,
                                hora: h,
                              })
                            }
                            className="h-9 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer disabled:cursor-not-allowed"
                            style={{
                              background: ocupado
                                ? "#F4F6F8"
                                : selecionado
                                  ? "var(--primary)"
                                  : "var(--secondary)",
                              color: ocupado
                                ? "#8A94A6"
                                : selecionado
                                  ? "white"
                                  : "var(--foreground)",
                              border: `1px solid ${
                                selecionado ? "var(--primary)" : "var(--border)"
                              }`,
                              textDecoration: ocupado ? "line-through" : "none",
                              opacity: ocupado ? 0.7 : 1,
                            }}
                          >
                            {h}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div
                    className="flex items-center justify-between pt-4"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <span
                      className="text-[10px]"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Horários riscados já estão ocupados.
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {agendamentoSucesso && (
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
                          style={{ background: "#E8F8F5", color: "#007F72" }}
                        >
                          <Icon name="check" size={14} />
                          Consulta agendada
                        </span>
                      )}
                      <button
                        onClick={handleAgendamento}
                        disabled={
                          !formAgendamento.hora ||
                          !formAgendamento.pacienteId ||
                          horariosOcupados.includes(formAgendamento.hora)
                        }
                        className="h-9 px-4 rounded-lg text-xs font-semibold text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: "var(--primary)" }}
                      >
                        Confirmar agendamento
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-[var(--radius)] p-5"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <h3
                    className="font-semibold text-sm mb-3"
                    style={{ color: "var(--foreground)" }}
                  >
                    Consultas agendadas
                  </h3>
                  <div className="flex flex-col gap-2">
                    {agendamentos
                      .filter(
                        (a) =>
                          a.data === formAgendamento.data &&
                          a.medicoId === formAgendamento.medicoId,
                      )
                      .sort((a, b) => a.hora.localeCompare(b.hora))
                      .map((a) => (
                        <div
                          key={a.id}
                          className="p-2.5 rounded-lg flex flex-wrap items-center gap-3"
                          style={{ background: "var(--secondary)" }}
                        >
                          <span
                            className="text-xs font-mono font-bold shrink-0"
                            style={{ color: "var(--primary)" }}
                          >
                            {a.hora}
                          </span>
                          <span
                            className="text-[11px] truncate"
                            style={{ color: "var(--foreground)" }}
                          >
                            {a.paciente}
                          </span>
                          <span className="ml-auto shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold" style={{ background: "var(--card)", color: a.status === "Concluída" ? "var(--accent)" : a.status === "Em atendimento" ? "var(--primary)" : "var(--muted-foreground)" }}>{a.status ?? "Agendada"}</span>
                        </div>
                      ))}
                    {agendamentos.filter(
                      (a) =>
                        a.data === formAgendamento.data &&
                        a.medicoId === formAgendamento.medicoId,
                    ).length === 0 && (
                      <p
                        className="text-xs text-center py-6"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Nenhuma consulta agendada para este dia/médico.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============ FICHA DE ATENDIMENTO ============ */}
          {activeTab === "ficha" && (
            <div className="fade-in">
              <PageTitle
                title="Emissão de ficha de atendimento"
                subtitle="Selecione um paciente internado para gerar a ficha pronta para impressão"
              />

              <div
                className="rounded-[var(--radius)] p-5 mb-5"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex flex-col md:flex-row gap-3 items-end">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <label
                      className="text-[11px] font-semibold"
                      style={{ color: "var(--foreground)" }}
                    >
                      Paciente internado
                    </label>
                    <select
                      value={fichaPacienteId}
                      onChange={(e) => setFichaPacienteId(e.target.value)}
                      className="h-10 px-3 rounded-lg text-xs outline-none"
                      style={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        color: "var(--foreground)",
                      }}
                    >
                      <option value="">Selecione o paciente...</option>
                      {pacientesInternados.map((pi) => (
                        <option key={pi.paciente.id} value={pi.paciente.id}>
                          {pi.paciente.nome} — Leito {pi.leito.numero}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {fichaPacienteId &&
                (() => {
                  const pac = pacientesCadastrados.find(
                    (p) => p.id === fichaPacienteId,
                  )!
                  const leito = leitos.find(
                    (l) => l.pacienteId === fichaPacienteId,
                  )!
                  const hist = historicoAtendimentos[fichaPacienteId] ?? []
                  const ultimo = hist[0]
                  const medico = ultimo
                    ? medicos.find((m) => m.nome === ultimo.medico)
                    : null

                  return (
                    <div
                      className="rounded-[var(--radius)] p-8 slide-up"
                      style={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {/* Cabeçalho da ficha */}
                      <div
                        className="flex items-start justify-between pb-4 mb-5"
                        style={{ borderBottom: "2px solid var(--primary)" }}
                      >
                        <div>
                          <div
                            className="text-lg font-bold"
                            style={{ color: "var(--primary)" }}
                          >
                            Hospital Inteligente
                          </div>
                          <div
                            className="text-[11px] mt-0.5"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            Ficha de Atendimento · Emitida em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date())}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className="text-[10px] uppercase tracking-wide"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            Nº da ficha
                          </div>
                          <div
                            className="text-sm font-bold font-mono"
                            style={{ color: "var(--foreground)" }}
                          >
                            FA-{pac.id.replace("PAC-", "")}-
                            {String(new Date().getFullYear()).slice(2)}
                          </div>
                        </div>
                      </div>

                      {/* Dados cadastrais */}
                      <div className="mb-6">
                        <div
                          className="text-[11px] font-bold uppercase tracking-wide mb-3"
                          style={{ color: "var(--primary)" }}
                        >
                          Dados cadastrais
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                          {[
                            ["Nome completo", pac.nome],
                            ["CPF", pac.cpf],
                            ["Data de nascimento", pac.dataNasc],
                            [
                              "Sexo",
                              pac.sexo === "M" ? "Masculino" : "Feminino",
                            ],
                            ["Telefone", pac.telefone],
                            ["Convênio", pac.convenio],
                            ["ID do paciente", pac.id],
                          ].map(([label, value]) => (
                            <div
                              key={label}
                              className="flex justify-between py-1.5"
                              style={{
                                borderBottom: "1px solid var(--border)",
                              }}
                            >
                              <span
                                className="text-[11px]"
                                style={{ color: "var(--muted-foreground)" }}
                              >
                                {label}
                              </span>
                              <span
                                className="text-xs font-semibold"
                                style={{ color: "var(--foreground)" }}
                              >
                                {value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Dados da internação */}
                      <div className="mb-6">
                        <div
                          className="text-[11px] font-bold uppercase tracking-wide mb-3"
                          style={{ color: "var(--primary)" }}
                        >
                          Dados da internação
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                          {[
                            ["Leito", leito.numero],
                            ["Setor", leito.setor || leito.tipo],
                            ["Andar", leito.andar],
                            ["Tipo de leito", leito.tipo],
                            ["Status", leito.status],
                            [
                              "Médico responsável",
                              medico?.nome ?? ultimo?.medico ?? "—",
                            ],
                            ["Motivo", ultimo?.tipo ?? "—"],
                          ].map(([label, value]) => (
                            <div
                              key={label}
                              className="flex justify-between py-1.5"
                              style={{
                                borderBottom: "1px solid var(--border)",
                              }}
                            >
                              <span
                                className="text-[11px]"
                                style={{ color: "var(--muted-foreground)" }}
                              >
                                {label}
                              </span>
                              <span
                                className="text-xs font-semibold"
                                style={{ color: "var(--foreground)" }}
                              >
                                {value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Assinatura */}
                      <div
                        className="mt-8 pt-6 flex justify-between gap-8"
                        style={{ borderTop: "1px solid var(--border)" }}
                      >
                        <div className="flex-1">
                          <div
                            className="h-10"
                            style={{
                              borderBottom: "1px solid var(--foreground)",
                            }}
                          />
                          <div
                            className="text-[10px] mt-1"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            Assinatura do responsável pela recepção
                          </div>
                        </div>
                        <div className="flex-1">
                          <div
                            className="h-10"
                            style={{
                              borderBottom: "1px solid var(--foreground)",
                            }}
                          />
                          <div
                            className="text-[10px] mt-1"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            Recebido pelo setor de destino
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex justify-end gap-2 mt-6">
                        <button
                          className="h-9 px-4 rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center gap-2"
                          style={{
                            background: "var(--secondary)",
                            color: "var(--foreground)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <Icon name="send" size={14} />
                          Enviar ao setor
                        </button>
                        <button
                          className="h-9 px-4 rounded-lg text-xs font-semibold text-white cursor-pointer inline-flex items-center gap-2"
                          style={{ background: "var(--primary)" }}
                        >
                          <Icon name="printer" size={14} />
                          Imprimir ficha
                        </button>
                      </div>
                    </div>
                  )
                })()}

              {!fichaPacienteId && (
                <div
                  className="rounded-[var(--radius)] p-10 flex flex-col items-center justify-center h-48"
                  style={{
                    background: "var(--card)",
                    border: "1px dashed var(--border)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                    style={{
                      background: "var(--secondary)",
                      color: "var(--primary)",
                    }}
                  >
                    <Icon name="file-text" size={19} />
                  </div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--foreground)" }}
                  >
                    Selecione um paciente internado
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    A ficha será gerada automaticamente com os dados do cadastro
                    e da internação.
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
