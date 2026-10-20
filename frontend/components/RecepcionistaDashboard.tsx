import { useMemo, useState } from "react"
import type { Screen } from "../App"
import DashboardSidebar from "./DashboardSidebar"
import ThemeToggle, { type Theme } from "./ThemeToggle"

interface Props {
  onNavigate: (screen: Screen) => void
  theme: Theme
  onToggleTheme: () => void
}

type Tab = "recepcao" | "cadastro-paciente" | "consulta-paciente" | "cadastro-leito" | "mapa-leitos" | "internacao" | "agendamento" | "ficha"

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
const pacientesCadastrados = [
  {
    id: "PAC-001",
    nome: "João da Silva",
    cpf: "123.456.789-00",
    dataNasc: "15/03/1979",
    telefone: "(11) 98765-4321",
    convenio: "Amil Gold",
    sexo: "M",
  },
  {
    id: "PAC-002",
    nome: "Maria Fernanda Souza",
    cpf: "987.654.321-11",
    dataNasc: "02/07/1964",
    telefone: "(11) 91234-5678",
    convenio: "Unimed",
    sexo: "F",
  },
  {
    id: "PAC-003",
    nome: "Carlos Alberto Mendes",
    cpf: "456.123.789-22",
    dataNasc: "20/11/1991",
    telefone: "(11) 92345-6789",
    convenio: "Unimed",
    sexo: "M",
  },
  {
    id: "PAC-004",
    nome: "Ana Beatriz Lima",
    cpf: "321.789.456-33",
    dataNasc: "08/06/1997",
    telefone: "(11) 93456-7890",
    convenio: "SulAmérica",
    sexo: "F",
  },
  {
    id: "PAC-005",
    nome: "Roberto Nogueira Alves",
    cpf: "741.852.963-44",
    dataNasc: "14/09/1972",
    telefone: "(11) 94567-8901",
    convenio: "Amil Gold",
    sexo: "M",
  },
]

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
type Leito = {
  id: string
  numero: string
  andar: string
  tipo: "Enfermaria" | "UTI" | "Isolamento"
  status: "Disponível" | "Ocupado" | "Higienização" | "Manutenção"
  pacienteId?: string
}

const leitosIniciais: Leito[] = [
  {
    id: "L-001",
    numero: "12A",
    andar: "1º andar",
    tipo: "Enfermaria",
    status: "Ocupado",
    pacienteId: "PAC-001",
  },
  {
    id: "L-002",
    numero: "12B",
    andar: "1º andar",
    tipo: "Enfermaria",
    status: "Disponível",
  },
  {
    id: "L-003",
    numero: "08A",
    andar: "1º andar",
    tipo: "Enfermaria",
    status: "Disponível",
  },
  {
    id: "L-004",
    numero: "08B",
    andar: "1º andar",
    tipo: "Enfermaria",
    status: "Higienização",
  },
  {
    id: "L-005",
    numero: "14B",
    andar: "2º andar",
    tipo: "Isolamento",
    status: "Ocupado",
    pacienteId: "PAC-003",
  },
  {
    id: "L-006",
    numero: "22A",
    andar: "3º andar",
    tipo: "UTI",
    status: "Ocupado",
    pacienteId: "PAC-005",
  },
  {
    id: "L-007",
    numero: "22B",
    andar: "3º andar",
    tipo: "UTI",
    status: "Disponível",
  },
  {
    id: "L-008",
    numero: "23A",
    andar: "3º andar",
    tipo: "UTI",
    status: "Manutenção",
  },
  {
    id: "L-009",
    numero: "05A",
    andar: "1º andar",
    tipo: "Enfermaria",
    status: "Disponível",
  },
  {
    id: "L-010",
    numero: "05B",
    andar: "1º andar",
    tipo: "Enfermaria",
    status: "Disponível",
  },
]

// Agenda de médicos
const medicos = [
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

// Agendamentos já ocupados
const agendamentosIniciais = [
  {
    id: "AG-001",
    medicoId: "MED-1",
    data: "2026-09-15",
    hora: "09:00",
    paciente: "João da Silva",
  },
  {
    id: "AG-002",
    medicoId: "MED-1",
    data: "2026-09-15",
    hora: "10:00",
    paciente: "Maria Fernanda Souza",
  },
  {
    id: "AG-003",
    medicoId: "MED-2",
    data: "2026-09-15",
    hora: "09:30",
    paciente: "Carlos Alberto Mendes",
  },
  {
    id: "AG-004",
    medicoId: "MED-3",
    data: "2026-09-15",
    hora: "14:00",
    paciente: "Ana Beatriz Lima",
  },
  {
    id: "AG-005",
    medicoId: "MED-1",
    data: "2026-09-16",
    hora: "08:00",
    paciente: "Roberto Nogueira Alves",
  },
]

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
    data: "2026-09-15",
    hora: "08:30",
    setor: "Laboratório",
  },
  {
    id: "EX-002",
    paciente: "Maria Fernanda Souza",
    exame: "Ultrassom Abdominal",
    data: "2026-09-15",
    hora: "11:00",
    setor: "Imagem",
  },
  {
    id: "EX-003",
    paciente: "Carlos Alberto Mendes",
    exame: "Raio-X de Tórax",
    data: "2026-09-15",
    hora: "13:30",
    setor: "Imagem",
  },
  {
    id: "EX-004",
    paciente: "Ana Beatriz Lima",
    exame: "ECG",
    data: "2026-09-16",
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

  // ----------------------------------------------------------
  // Cadastro de leito
  // ----------------------------------------------------------
  const [leitos, setLeitos] = useState<Leito[]>(leitosIniciais)
  const [formLeito, setFormLeito] = useState({
    numero: "",
    andar: "1º andar",
    tipo: "Enfermaria" as Leito["tipo"],
  })
  const [leitoSucesso, setLeitoSucesso] = useState(false)

  // ----------------------------------------------------------
  // Mapa de leitos — filtros
  // ----------------------------------------------------------
  const [filtroStatus, setFiltroStatus] = useState<string>("Todos")
  const [filtroAndar, setFiltroAndar] = useState<string>("Todos")
  const [filtroTipo, setFiltroTipo] = useState<string>("Todos")

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

  // ----------------------------------------------------------
  // Agendamento
  // ----------------------------------------------------------
  const [agendamentos, setAgendamentos] = useState(agendamentosIniciais)
  const [formAgendamento, setFormAgendamento] = useState({
    medicoId: "MED-1",
    data: "2026-09-15",
    hora: "",
    pacienteId: "",
  })
  const [agendamentoSucesso, setAgendamentoSucesso] = useState(false)

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
      if (filtroTipo !== "Todos" && l.tipo !== filtroTipo) return false
      return true
    })
  }, [leitos, filtroStatus, filtroAndar, filtroTipo])

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

  const pacientesInternados = leitos
    .filter((l) => l.status === "Ocupado" && l.pacienteId)
    .map((l) => ({
      leito: l,
      paciente: pacientesCadastrados.find((p) => p.id === l.pacienteId)!,
    }))

  // ----------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------
  const handleCadastroPaciente = () => {
    if (!podeCadastrar) return
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
  }

  const handleCadastroLeito = () => {
    if (!formLeito.numero.trim()) return
    const novo: Leito = {
      id: `L-${String(leitos.length + 1).padStart(3, "0")}`,
      numero: formLeito.numero,
      andar: formLeito.andar,
      tipo: formLeito.tipo,
      status: "Disponível",
    }
    setLeitos((current) => [...current, novo])
    setLeitoSucesso(true)
    setTimeout(() => {
      setLeitoSucesso(false)
      setFormLeito({ numero: "", andar: "1º andar", tipo: "Enfermaria" })
    }, 2500)
  }

  const handleCadastroInternacao = () => {
    if (
      !formInternacao.pacienteId ||
      !formInternacao.leitoId ||
      !formInternacao.motivo.trim()
    )
      return
    setLeitos((current) =>
      current.map((l) =>
        l.id === formInternacao.leitoId
          ? { ...l, status: "Ocupado", pacienteId: formInternacao.pacienteId }
          : l,
      ),
    )
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
    }
    setAgendamentos((current) => [...current, novo])
    setAgendamentoSucesso(true)
    setTimeout(() => {
      setAgendamentoSucesso(false)
      setFormAgendamento({
        medicoId: "MED-1",
        data: "2026-09-15",
        hora: "",
        pacienteId: "",
      })
    }, 2500)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "recepcao", label: "Central da Recepção" },
    { key: "cadastro-paciente", label: "Cadastrar Paciente" },
    { key: "consulta-paciente", label: "Consultar Paciente" },
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
    <div className="flex items-start justify-between gap-4 mb-6">
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
          {/* ============ CENTRAL DA RECEPÇÃO ============ */}
          {activeTab === "recepcao" && (
            <div className="fade-in">
              <PageTitle
                title={`Bom dia, ${RECEPCIONISTA.nome.split(" ")[0]}`}
                subtitle="Segunda-feira, 15 de setembro de 2026 · Visão unificada da recepção"
              />

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  {
                    label: "Consultas hoje",
                    value: String(
                      agendamentos.filter((a) => a.data === "2026-09-15")
                        .length,
                    ),
                    icon: "calendar" as IconName,
                    detail: "Agendadas",
                  },
                  {
                    label: "Exames marcados",
                    value: String(examesAgendados.length),
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
                    {medicos.map((m) => {
                      const consultas = agendamentos.filter(
                        (a) => a.medicoId === m.id && a.data === "2026-09-15",
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
                    <div className="flex gap-2">
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Número do leito"
                      value={formLeito.numero}
                      onChange={(v) =>
                        setFormLeito({ ...formLeito, numero: v.toUpperCase() })
                      }
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
                    <div className="flex gap-2">
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
                        disabled={!formLeito.numero.trim()}
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
                              {l.andar} · {l.tipo}
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

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="text-sm font-bold"
                          style={{ color: "var(--foreground)" }}
                        >
                          Leito {l.numero}
                        </span>
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: sc.dot }}
                        />
                      </div>
                      <div
                        className="text-[10px]"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {l.andar}
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
                    </div>
                  )
                })}
              </div>

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
                        {pacientesCadastrados.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nome} — {p.cpf}
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
                            Leito {l.numero} · {l.andar} · {l.tipo}
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
                        {medicos.map((m) => (
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
                    <div className="flex gap-2">
                      {internacaoSucesso && (
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
                          style={{ background: "#E8F8F5", color: "#007F72" }}
                        >
                          <Icon name="check" size={14} />
                          Internação registrada
                        </span>
                      )}
                      <button
                        onClick={handleCadastroInternacao}
                        disabled={
                          !formInternacao.pacienteId ||
                          !formInternacao.leitoId ||
                          !formInternacao.motivo.trim()
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
                          Leito {pi.leito.numero} · {pi.leito.andar} ·{" "}
                          {pi.leito.tipo}
                        </div>
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
                        {medicos.map((m) => (
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
                    <div className="flex gap-2">
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
                          className="p-2.5 rounded-lg flex items-center gap-3"
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
                            Ficha de Atendimento · Emitida em 15/09/2026 14:32
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
