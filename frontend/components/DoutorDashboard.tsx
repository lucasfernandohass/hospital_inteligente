import { useMemo, useState } from "react"
import type { Screen } from "../App"
import DashboardSidebar from "./DashboardSidebar"
import ThemeToggle, { type Theme } from "./ThemeToggle"

interface Props {
  onNavigate: (screen: Screen) => void
  theme: Theme
  onToggleTheme: () => void
}

type Tab = "overview" | "atendimento" | "prescricao" | "exames" | "agenda" | "internacao" | "alertas"

type IconName = "users" | "clipboard" | "flask" | "bed" | "bell" | "alert" | "activity" | "image" | "ecg" | "chevron" | "arrow" | "search" | "check" | "x"

const pacientes = [
  {
    id: "PAC-001",
    nome: "João da Silva",
    cpf: "123.456.789-00",
    dataNasc: "15/03/1979",
    idade: 47,
    sexo: "M",
    telefone: "(11) 98765-4321",
    condicao: "Hipertensão",
    status: "estável",
    avatar: "JS",
    ultimo: "Hoje, 09:20",
    risco: "low",
    convenio: "Amil Gold",
    tipoSanguineo: "O+",
  },
  {
    id: "PAC-002",
    nome: "Maria Fernanda",
    cpf: "987.654.321-11",
    dataNasc: "02/07/1964",
    idade: 62,
    sexo: "F",
    telefone: "(11) 91234-5678",
    condicao: "Diabetes Tipo 2",
    status: "atenção",
    avatar: "MF",
    ultimo: "Hoje, 10:45",
    risco: "medium",
    convenio: "Unimed",
    tipoSanguineo: "A+",
  },
  {
    id: "PAC-003",
    nome: "Carlos Alberto",
    cpf: "456.123.789-22",
    dataNasc: "20/11/1991",
    idade: 35,
    sexo: "M",
    telefone: "(11) 92345-6789",
    condicao: "Pneumonia",
    status: "crítico",
    avatar: "CA",
    ultimo: "Agora",
    risco: "high",
    convenio: "Unimed",
    tipoSanguineo: "B-",
  },
  {
    id: "PAC-004",
    nome: "Ana Beatriz",
    cpf: "321.789.456-33",
    dataNasc: "08/06/1997",
    idade: 29,
    sexo: "F",
    telefone: "(11) 93456-7890",
    condicao: "Enxaqueca",
    status: "estável",
    avatar: "AB",
    ultimo: "Ontem",
    risco: "low",
    convenio: "SulAmérica",
    tipoSanguineo: "AB+",
  },
  {
    id: "PAC-005",
    nome: "Roberto Lima",
    cpf: "741.852.963-44",
    dataNasc: "14/09/1972",
    idade: 54,
    sexo: "M",
    telefone: "(11) 94567-8901",
    condicao: "Insuf. Cardíaca",
    status: "atenção",
    avatar: "RL",
    ultimo: "Hoje, 07:30",
    risco: "medium",
    convenio: "Amil Gold",
    tipoSanguineo: "O-",
  },
]

const registrosClinicos: Record<string, {
  data: string
  descricao: string
  pressao: string
  fc: number
  temp: number
  spo2: number
}[]> = {
  "PAC-001": [
    {
      data: "15 Set 2026",
      descricao:
        "Paciente refere cefaleia leve. PA controlada. Mantida medicação atual.",
      pressao: "128/82",
      fc: 74,
      temp: 36.8,
      spo2: 98,
    },
    {
      data: "10 Set 2026",
      descricao:
        "Revisão cardiovascular. ECG sem alterações. Colesterol em queda.",
      pressao: "132/85",
      fc: 76,
      temp: 36.9,
      spo2: 97,
    },
  ],
  "PAC-002": [
    {
      data: "15 Set 2026",
      descricao:
        "Glicemia de jejum 280 mg/dL. Ajuste de insulina. Encaminhada para nutricionista.",
      pressao: "142/90",
      fc: 82,
      temp: 37.0,
      spo2: 96,
    },
  ],
  "PAC-003": [
    {
      data: "14 Set 2026",
      descricao:
        "Internação por pneumonia severa. SpO₂ 88%. Iniciada antibioticoterapia IV.",
      pressao: "110/70",
      fc: 108,
      temp: 38.9,
      spo2: 88,
    },
  ],
  "PAC-004": [
    {
      data: "14 Set 2026",
      descricao:
        "Enxaqueca com aura. Sem déficit neurológico. Prescrito Sumatriptano.",
      pressao: "118/75",
      fc: 68,
      temp: 36.5,
      spo2: 99,
    },
  ],
  "PAC-005": [
    {
      data: "12 Set 2026",
      descricao:
        "Edema MMII +++. Crepitação bilateral. Internado para ajuste diurético.",
      pressao: "165/105",
      fc: 96,
      temp: 37.2,
      spo2: 93,
    },
  ],
}

const prescricoes = [
  {
    id: "RX-2026-0091",
    pacienteId: "PAC-001",
    data: "15 Set 2026",
    medico: "Dr. Rafael Oliveira",
    itens: [
      {
        id: "IP-001",
        medicamento: "Losartana",
        dosagem: "50mg",
        via: "Oral",
        frequencia: "1x ao dia",
        duracao: "30 dias",
        quantidade: 30,
      },
      {
        id: "IP-002",
        medicamento: "Amlodipina",
        dosagem: "5mg",
        via: "Oral",
        frequencia: "1x ao dia",
        duracao: "30 dias",
        quantidade: 30,
      },
    ],
  },
  {
    id: "RX-2026-0092",
    pacienteId: "PAC-002",
    data: "15 Set 2026",
    medico: "Dr. Pedro Campos",
    itens: [
      {
        id: "IP-003",
        medicamento: "Insulina NPH",
        dosagem: "20UI",
        via: "SC",
        frequencia: "2x ao dia",
        duracao: "30 dias",
        quantidade: 2,
      },
      {
        id: "IP-004",
        medicamento: "Metformina",
        dosagem: "850mg",
        via: "Oral",
        frequencia: "2x ao dia",
        duracao: "30 dias",
        quantidade: 60,
      },
    ],
  },
  {
    id: "RX-2026-0093",
    pacienteId: "PAC-003",
    data: "14 Set 2026",
    medico: "Dra. Fernanda Lima",
    itens: [
      {
        id: "IP-005",
        medicamento: "Amoxicilina",
        dosagem: "500mg",
        via: "IV",
        frequencia: "8/8h",
        duracao: "7 dias",
        quantidade: 21,
      },
      {
        id: "IP-006",
        medicamento: "Dexametasona",
        dosagem: "4mg",
        via: "IV",
        frequencia: "12/12h",
        duracao: "3 dias",
        quantidade: 6,
      },
    ],
  },
]

const exames = [
  {
    id: "EX-001",
    tipo: "ExameLaboratorial",
    nome: "Hemograma Completo",
    pacienteId: "PAC-001",
    data: "10 Set 2026",
    status: "resultado",
    resultado:
      "Hemoglobina 13.8 g/dL, Leucócitos 7.200/mm³, Plaquetas 220.000/mm³. Normal.",
    solicitante: "Dr. Pedro Campos",
  },
  {
    id: "EX-002",
    tipo: "ECG",
    nome: "Eletrocardiograma 12 derivações",
    pacienteId: "PAC-001",
    data: "05 Set 2026",
    status: "resultado",
    resultado:
      "Ritmo sinusal. FC 72 bpm. PR 160ms. QRS 90ms. Sem alterações isquêmicas.",
    solicitante: "Dr. Rafael Oliveira",
  },
  {
    id: "EX-003",
    tipo: "ExameImagem",
    nome: "Raio-X de Tórax PA",
    pacienteId: "PAC-003",
    data: "14 Set 2026",
    status: "resultado",
    resultado:
      "Opacidade no lobo inferior direito compatível com consolidação pneumônica.",
    solicitante: "Dra. Fernanda Lima",
  },
  {
    id: "EX-004",
    tipo: "ExameLaboratorial",
    nome: "Glicemia de Jejum",
    pacienteId: "PAC-002",
    data: "15 Set 2026",
    status: "resultado",
    resultado:
      "Glicemia: 280 mg/dL. Valor de referência: 70–99 mg/dL. AUMENTADO.",
    solicitante: "Dr. Rafael Oliveira",
  },
  {
    id: "EX-005",
    tipo: "ExameImagem",
    nome: "Ecocardiograma",
    pacienteId: "PAC-005",
    data: "20 Out 2026",
    status: "agendado",
    resultado: null,
    solicitante: "Dr. Rafael Oliveira",
  },
  {
    id: "EX-006",
    tipo: "ECG",
    nome: "Holter 24h",
    pacienteId: "PAC-005",
    data: "18 Set 2026",
    status: "agendado",
    resultado: null,
    solicitante: "Dr. Rafael Oliveira",
  },
]

const agendaMedica = [
  {
    hora: "08:00",
    paciente: "Ana Beatriz",
    tipo: "Retorno",
    local: "Consultório 12",
    concluido: true,
  },
  {
    hora: "09:20",
    paciente: "João da Silva",
    tipo: "Consulta",
    local: "Consultório 12",
    concluido: true,
  },
  {
    hora: "10:45",
    paciente: "Maria Fernanda",
    tipo: "Exames",
    local: "Consultório 12",
    concluido: true,
  },
  {
    hora: "13:00",
    paciente: "Luiz Henrique",
    tipo: "1ª Consulta",
    local: "Consultório 12",
    concluido: false,
  },
  {
    hora: "14:30",
    paciente: "Carlos Alberto",
    tipo: "Revisão",
    local: "Consultório 12",
    concluido: false,
  },
  {
    hora: "16:00",
    paciente: "Patrícia Rocha",
    tipo: "Retorno",
    local: "Consultório 12",
    concluido: false,
  },
]

const internacoes = [
  {
    id: "INT-2024-018",
    pacienteId: "PAC-005",
    leito: "22A",
    ala: "Clínica Geral",
    motivo: "Insuf. Cardíaca Descompensada",
    entrada: "12 Set 2026",
    altaPrevista: "20 Set 2026",
  },
  {
    id: "INT-2024-021",
    pacienteId: "PAC-003",
    leito: "14B",
    ala: "Pneumologia",
    motivo: "Pneumonia Bacteriana Severa",
    entrada: "14 Set 2026",
    altaPrevista: "22 Set 2026",
  },
]

const vitalsData = [
  { label: "Seg", bp: 128 },
  { label: "Ter", bp: 135 },
  { label: "Qua", bp: 122 },
  { label: "Qui", bp: 140 },
  { label: "Sex", bp: 118 },
  { label: "Sáb", bp: 130 },
  { label: "Dom", bp: 125 },
]

const riskColor = {
  low: { bg: "#E8F8F5", text: "#007F72", dot: "#00A896", label: "Estável" },
  medium: { bg: "#FFF8E6", text: "#A96800", dot: "#F5A623", label: "Atenção" },
  high: { bg: "#FDEDEC", text: "#B8322A", dot: "#E74C3C", label: "Crítico" },
}

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
    case "clipboard":
      return (
        <svg {...common}>
          <rect x="5" y="4" width="14" height="17" rx="2" />
          <path d="M9 4.5V3h6v1.5M9 10h6M9 14h6M9 18h3" />
        </svg>
      )
    case "flask":
      return (
        <svg {...common}>
          <path d="M9 3h6M10 3v6l-5.5 9.2A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.8L14 9V3" />
          <path d="M8 15h8" />
        </svg>
      )
    case "bed":
      return (
        <svg {...common}>
          <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 15h18M6 10V7a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3M3 18v2M21 18v2" />
        </svg>
      )
    case "bell":
      return (
        <svg {...common}>
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
      )
    case "alert":
      return (
        <svg {...common}>
          <path d="M10.3 3.6 2.4 17a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      )
    case "activity":
      return (
        <svg {...common}>
          <path d="M3 12h4l2-6 4 12 2-6h6" />
        </svg>
      )
    case "image":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8.5" cy="9" r="1.5" />
          <path d="m21 15-5-5L5 20" />
        </svg>
      )
    case "ecg":
      return (
        <svg {...common}>
          <path d="M3 12h4l2-7 4 14 2-7h6" />
        </svg>
      )
    case "chevron":
      return (
        <svg {...common}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      )
    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      )
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
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
  }
}

export default function DoctorDashboard({
  onNavigate,
  theme,
  onToggleTheme,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview")
  const [selectedPaciente, setSelectedPaciente] =
    useState<typeof pacientes[0] | null>(null)
  const [expandedPrescricao, setExpandedPrescricao] = useState<string | null>(
    null,
  )
  const [alertasVistos, setAlertasVistos] = useState<string[]>([])
  const [patientSearch, setPatientSearch] = useState("")

  const alertas = useMemo(
    () => [
      {
        id: "ALT-001",
        pacienteId: "PAC-003",
        severity: "high" as const,
        titulo: "Saturação de oxigênio abaixo do limite",
        detalhe: "SpO₂ 88% — Pneumonia severa",
        horario: "Agora",
        local: "Leito 14B",
        valor: "88%",
        label: "SpO₂",
      },
      {
        id: "ALT-002",
        pacienteId: "PAC-002",
        severity: "medium" as const,
        titulo: "Glicemia acima do limite",
        detalhe: "Glicemia de jejum 280 mg/dL",
        horario: "Hoje, 10:45",
        local: "Ambulatório",
        valor: "280",
        label: "mg/dL",
      },
      {
        id: "ALT-003",
        pacienteId: "PAC-005",
        severity: "medium" as const,
        titulo: "Pressão arterial elevada",
        detalhe: "PA 165/105 mmHg",
        horario: "Hoje, 07:30",
        local: "Leito 22A",
        valor: "165/105",
        label: "mmHg",
      },
    ],
    [],
  )

  const alertasPendentes = alertas.filter((a) => !alertasVistos.includes(a.id))
  const maxBP = Math.max(...vitalsData.map((d) => d.bp))
  const filteredPatients = pacientes.filter((p) =>
    `${p.nome} ${p.id} ${p.condicao}`
      .toLowerCase()
      .includes(patientSearch.toLowerCase()),
  )

  const goToPatient = (id: string) => {
    const patient = pacientes.find((p) => p.id === id)
    if (patient) {
      setSelectedPaciente(patient)
      setActiveTab("atendimento")
    }
  }

  const markAlertSeen = (id: string) => {
    setAlertasVistos((current) =>
      current.includes(id) ? current : [...current, id],
    )
  }

  const markAllAlertsSeen = () => setAlertasVistos(alertas.map((a) => a.id))

  // Alerta é o último item da navbar
  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Visão Geral" },
    { key: "atendimento", label: "Pacientes" },
    { key: "prescricao", label: "Prescrições" },
    { key: "exames", label: "Exames" },
    { key: "agenda", label: "Agenda Médica" },
    { key: "internacao", label: "Internações" },
    { key: "alertas", label: "Alertas" },
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

  const PatientCard = ({
    p,
    compact = false,
  }: {
    p: typeof pacientes[0]
    compact?: boolean
  }) => {
    const c = riskColor[(p.risco as keyof typeof riskColor)]
    const rc = registrosClinicos[p.id]?.[0]

    return (
      <button
        onClick={() => goToPatient(p.id)}
        className={`w-full text-left rounded-[var(--radius)] transition-all cursor-pointer hover:-translate-y-0.5 ${
          compact ? "p-4" : "p-4"
        }`}
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: "var(--secondary)", color: "var(--primary)" }}
          >
            {p.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="font-semibold text-sm truncate"
                style={{ color: "var(--foreground)" }}
              >
                {p.nome}
              </span>
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: c.dot }}
              />
            </div>
            <div
              className="text-[11px] mt-0.5"
              style={{ color: "var(--muted-foreground)" }}
            >
              {p.id} · {p.condicao}
            </div>
          </div>
          <span
            className="text-[10px] font-semibold px-2 py-1 rounded-full shrink-0"
            style={{ background: c.bg, color: c.text }}
          >
            {c.label}
          </span>
        </div>

        {!compact && rc && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div
              className="p-2 rounded-lg"
              style={{ background: "var(--secondary)" }}
            >
              <div
                className="text-[9px]"
                style={{ color: "var(--muted-foreground)" }}
              >
                Pressão
              </div>
              <div
                className="text-xs font-semibold mt-0.5"
                style={{ color: "var(--foreground)" }}
              >
                {rc.pressao}
              </div>
            </div>
            <div
              className="p-2 rounded-lg"
              style={{ background: "var(--secondary)" }}
            >
              <div
                className="text-[9px]"
                style={{ color: "var(--muted-foreground)" }}
              >
                FC
              </div>
              <div
                className="text-xs font-semibold mt-0.5"
                style={{ color: "var(--foreground)" }}
              >
                {rc.fc} bpm
              </div>
            </div>
            <div
              className="p-2 rounded-lg"
              style={{ background: "var(--secondary)" }}
            >
              <div
                className="text-[9px]"
                style={{ color: "var(--muted-foreground)" }}
              >
                SpO₂
              </div>
              <div
                className="text-xs font-semibold mt-0.5"
                style={{
                  color: rc.spo2 < 94 ? "#C0392B" : "var(--foreground)",
                }}
              >
                {rc.spo2}%
              </div>
            </div>
          </div>
        )}

        {!compact && (
          <div
            className="flex items-center justify-between mt-3 pt-3"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <span
              className="text-[10px]"
              style={{ color: "var(--muted-foreground)" }}
            >
              Último atendimento: {p.ultimo}
            </span>
            <Icon name="arrow" size={14} />
          </div>
        )}
      </button>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <DashboardSidebar
        role="Médico"
        initials="RO"
        name="Dr. Pedro Campos"
        detail="Cardiologista · CRM 45.231"
        tabs={tabs}
        activeTab={activeTab}
        onSelect={(key) => setActiveTab(key as Tab)}
        onLogout={() => onNavigate("login")}
        alertCount={alertasPendentes.length}
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
                Dr. Pedro Campos
              </div>
              <div
                className="hidden text-[10px] sm:block"
                style={{ color: "var(--muted-foreground)" }}
              >
                Cardiologista · CRM 45.231
              </div>
            </div>
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: "var(--accent)" }}
            >
              RO
            </div>
          </div>
        </header>

        <main className="dashboard-main mx-auto w-full min-w-0 max-w-7xl flex-1 px-4 pb-24 pt-20 sm:px-6 xl:p-6">
          {activeTab === "overview" && (
            <div className="fade-in">
              <PageTitle
                title="Bom dia, Dr. Pedro"
                subtitle="Segunda-feira, 15 de setembro de 2026"
              />

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  {
                    label: "Atendimentos hoje",
                    value: "06",
                    icon: "users" as IconName,
                    detail: "2 restantes",
                  },
                  {
                    label: "Prescrições emitidas",
                    value: "03",
                    icon: "clipboard" as IconName,
                    detail: "Hoje",
                  },
                  {
                    label: "Exames pendentes",
                    value: "04",
                    icon: "flask" as IconName,
                    detail: "2 resultados",
                  },
                  {
                    label: "Pacientes internados",
                    value: "02",
                    icon: "bed" as IconName,
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

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
                <div
                  className="lg:col-span-2 rounded-[var(--radius)] p-6"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h3
                        className="font-semibold text-sm"
                        style={{ color: "var(--foreground)" }}
                      >
                        Pressão arterial
                      </h3>
                      <p
                        className="text-xs mt-1"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Média semanal dos pacientes monitorados · mmHg
                      </p>
                    </div>
                    <div
                      className="flex items-center gap-1.5 text-[10px]"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: "var(--primary)" }}
                      />{" "}
                      Média
                    </div>
                  </div>
                  <div className="flex items-end gap-3 h-40">
                    {vitalsData.map((d) => (
                      <div
                        key={d.label}
                        className="flex-1 flex flex-col items-center gap-1.5"
                      >
                        <div
                          className="text-[10px] font-mono"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {d.bp}
                        </div>
                        <div
                          className="w-full rounded-t-sm relative"
                          style={{
                            height: `${(d.bp / maxBP) * 112}px`,
                            background:
                              d.bp > 135 ? "#E74C3C" : "var(--primary)",
                            opacity: d.bp > 135 ? 0.75 : 0.9,
                          }}
                        />
                        <div
                          className="text-[10px]"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {d.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

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
                        Alertas do sistema
                      </h3>
                      <p
                        className="text-[11px] mt-1"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Requerem avaliação
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("alertas")}
                      className="text-[10px] font-semibold cursor-pointer"
                      style={{ color: "var(--primary)" }}
                    >
                      Ver todos
                    </button>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {alertasPendentes.map((a) => {
                      const c = riskColor[a.severity]
                      const p = pacientes.find((x) => x.id === a.pacienteId)!
                      return (
                        <button
                          key={a.id}
                          onClick={() => goToPatient(p.id)}
                          className="text-left p-3 rounded-lg flex gap-3 cursor-pointer hover:opacity-80"
                          style={{
                            background: c.bg,
                            border: `1px solid ${c.dot}33`,
                          }}
                        >
                          <span
                            className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                            style={{ background: c.dot }}
                          />
                          <div className="min-w-0">
                            <div
                              className="text-xs font-semibold truncate"
                              style={{ color: c.text }}
                            >
                              {p.nome}
                            </div>
                            <div
                              className="text-[10px] mt-0.5 truncate"
                              style={{ color: c.text }}
                            >
                              {a.detalhe}
                            </div>
                            <div
                              className="text-[9px] mt-1"
                              style={{ color: c.text }}
                            >
                              {a.horario} · {a.local}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                    {alertasPendentes.length === 0 && (
                      <div className="py-8 text-center">
                        <div
                          className="w-9 h-9 mx-auto rounded-full flex items-center justify-center mb-2"
                          style={{
                            background: "var(--secondary)",
                            color: "var(--accent)",
                          }}
                        >
                          <Icon name="check" size={18} />
                        </div>
                        <p
                          className="text-xs font-medium"
                          style={{ color: "var(--foreground)" }}
                        >
                          Nenhum alerta pendente
                        </p>
                      </div>
                    )}
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
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3
                      className="font-semibold text-sm"
                      style={{ color: "var(--foreground)" }}
                    >
                      Pacientes que requerem atenção
                    </h3>
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Acesso rápido ao prontuário
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("atendimento")}
                    className="text-xs font-semibold cursor-pointer"
                    style={{ color: "var(--primary)" }}
                  >
                    Ver pacientes
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {pacientes
                    .filter((p) => p.risco !== "low")
                    .map((p) => (
                      <PatientCard key={p.id} p={p} />
                    ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "atendimento" && (
            <div className="fade-in">
              <PageTitle
                title="Pacientes"
                subtitle="Prontuário eletrônico, sinais vitais e evolução clínica"
              />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      <Icon name="search" size={16} />
                    </span>
                    <input
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      placeholder="Buscar paciente..."
                      className="w-full h-10 pl-9 pr-3 rounded-lg text-xs outline-none"
                      style={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        color: "var(--foreground)",
                      }}
                    />
                  </div>
                  {filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPaciente(p)}
                      className="w-full text-left p-4 rounded-[var(--radius)] flex items-center gap-3 transition-all cursor-pointer"
                      style={{
                        background:
                          selectedPaciente?.id === p.id
                            ? "var(--primary)"
                            : "var(--card)",
                        border: `1px solid ${
                          selectedPaciente?.id === p.id
                            ? "var(--primary)"
                            : "var(--border)"
                        }`,
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          background:
                            selectedPaciente?.id === p.id
                              ? "rgba(255,255,255,.16)"
                              : "var(--secondary)",
                          color:
                            selectedPaciente?.id === p.id
                              ? "white"
                              : "var(--primary)",
                        }}
                      >
                        {p.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-semibold text-sm truncate"
                          style={{
                            color:
                              selectedPaciente?.id === p.id
                                ? "white"
                                : "var(--foreground)",
                          }}
                        >
                          {p.nome}
                        </div>
                        <div
                          className="text-xs truncate mt-0.5"
                          style={{
                            color:
                              selectedPaciente?.id === p.id
                                ? "rgba(255,255,255,.7)"
                                : "var(--muted-foreground)",
                          }}
                        >
                          {p.id} · {p.condicao}
                        </div>
                      </div>
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          background:
                            riskColor[(p.risco as keyof typeof riskColor)].dot,
                        }}
                      />
                    </button>
                  ))}
                </div>

                <div className="lg:col-span-2">
                  {selectedPaciente ? (
                    <div className="slide-up flex flex-col gap-4">
                      <div
                        className="rounded-[var(--radius)] p-5"
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div className="flex items-start gap-4 mb-5">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                            style={{ background: "var(--primary)" }}
                          >
                            {selectedPaciente.avatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2
                                className="text-lg font-semibold"
                                style={{ color: "var(--foreground)" }}
                              >
                                {selectedPaciente.nome}
                              </h2>
                              <span
                                className="text-[10px] font-semibold px-2 py-1 rounded-full"
                                style={{
                                  background:
                                    riskColor[
                                      (selectedPaciente.risco as keyof typeof riskColor)
                                    ].bg,
                                  color:
                                    riskColor[
                                      (selectedPaciente.risco as keyof typeof riskColor)
                                    ].text,
                                }}
                              >
                                {
                                  riskColor[
                                    (selectedPaciente.risco as keyof typeof riskColor)
                                  ].label
                                }
                              </span>
                            </div>
                            <div
                              className="text-[11px] mt-1"
                              style={{ color: "var(--muted-foreground)" }}
                            >
                              {selectedPaciente.id} · {selectedPaciente.idade}{" "}
                              anos · {selectedPaciente.condicao}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                          {[
                            {
                              label: "Pressão arterial",
                              value:
                                registrosClinicos[selectedPaciente.id]?.[0]
                                  ?.pressao ?? "—",
                              unit: "mmHg",
                            },
                            {
                              label: "Frequência cardíaca",
                              value: String(
                                registrosClinicos[selectedPaciente.id]?.[0]
                                  ?.fc ?? "—",
                              ),
                              unit: "bpm",
                            },
                            {
                              label: "Temperatura",
                              value: String(
                                registrosClinicos[selectedPaciente.id]?.[0]
                                  ?.temp ?? "—",
                              ),
                              unit: "°C",
                            },
                            {
                              label: "SpO₂",
                              value: String(
                                registrosClinicos[selectedPaciente.id]?.[0]
                                  ?.spo2 ?? "—",
                              ),
                              unit: "%",
                            },
                          ].map((v) => (
                            <div
                              key={v.label}
                              className="p-3 rounded-lg"
                              style={{ background: "var(--secondary)" }}
                            >
                              <div
                                className="text-[9px]"
                                style={{ color: "var(--muted-foreground)" }}
                              >
                                {v.label}
                              </div>
                              <div
                                className="text-base font-bold mt-1"
                                style={{
                                  color:
                                    v.label === "SpO₂" && Number(v.value) < 94
                                      ? "#C0392B"
                                      : "var(--primary)",
                                }}
                              >
                                {v.value}
                                <span
                                  className="text-[9px] ml-1 font-normal"
                                  style={{ color: "var(--muted-foreground)" }}
                                >
                                  {v.unit}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div
                          className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-3 pt-4"
                          style={{ borderTop: "1px solid var(--border)" }}
                        >
                          {[
                            ["Nascimento", selectedPaciente.dataNasc],
                            [
                              "Sexo",
                              selectedPaciente.sexo === "M"
                                ? "Masculino"
                                : "Feminino",
                            ],
                            ["Tipo sanguíneo", selectedPaciente.tipoSanguineo],
                            ["Convênio", selectedPaciente.convenio],
                            ["Telefone", selectedPaciente.telefone],
                            ["CPF", selectedPaciente.cpf],
                          ].map(([label, value]) => (
                            <div key={label}>
                              <div
                                className="text-[9px] uppercase tracking-wide"
                                style={{ color: "var(--muted-foreground)" }}
                              >
                                {label}
                              </div>
                              <div
                                className="text-xs font-medium mt-1"
                                style={{ color: "var(--foreground)" }}
                              >
                                {value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

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
                              Evolução clínica
                            </h3>
                            <p
                              className="text-[11px] mt-1"
                              style={{ color: "var(--muted-foreground)" }}
                            >
                              Histórico de atendimentos
                            </p>
                          </div>
                          <button
                            className="h-8 px-3 rounded-lg text-xs font-semibold text-white cursor-pointer"
                            style={{ background: "var(--primary)" }}
                          >
                            Nova evolução
                          </button>
                        </div>
                        <div className="flex flex-col gap-3">
                          {(registrosClinicos[selectedPaciente.id] ?? []).map(
                            (rc, i) => (
                              <div
                                key={i}
                                className="p-4 rounded-lg"
                                style={{ background: "var(--secondary)" }}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span
                                    className="text-xs font-semibold"
                                    style={{ color: "var(--foreground)" }}
                                  >
                                    Atendimento clínico
                                  </span>
                                  <span
                                    className="text-[10px] font-mono"
                                    style={{ color: "var(--muted-foreground)" }}
                                  >
                                    {rc.data}
                                  </span>
                                </div>
                                <p
                                  className="text-xs leading-relaxed"
                                  style={{ color: "var(--muted-foreground)" }}
                                >
                                  {rc.descricao}
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="rounded-[var(--radius)] p-10 flex flex-col items-center justify-center h-64"
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
                        <Icon name="users" size={19} />
                      </div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: "var(--foreground)" }}
                      >
                        Selecione um paciente
                      </p>
                      <p
                        className="text-xs mt-1"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        O prontuário clínico será exibido aqui
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "prescricao" && (
            <div className="fade-in">
              <PageTitle
                title="Prescrições"
                subtitle="Prescrições médicas e itens emitidos"
                action={
                  <button
                    className="h-9 px-4 rounded-lg text-xs font-semibold text-white cursor-pointer"
                    style={{ background: "var(--primary)" }}
                  >
                    Nova prescrição
                  </button>
                }
              />
              <div className="flex flex-col gap-3">
                {prescricoes.map((rx) => {
                  const pac = pacientes.find((p) => p.id === rx.pacienteId)
                  const open = expandedPrescricao === rx.id
                  return (
                    <div
                      key={rx.id}
                      className="rounded-[var(--radius)] overflow-hidden"
                      style={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <button
                        className="w-full flex items-center gap-4 px-5 py-4 cursor-pointer text-left"
                        style={{
                          background: open ? "var(--secondary)" : "var(--card)",
                        }}
                        onClick={() =>
                          setExpandedPrescricao(open ? null : rx.id)
                        }
                      >
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: "var(--primary)" }}
                        >
                          {pac?.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className="font-semibold text-sm"
                            style={{ color: "var(--foreground)" }}
                          >
                            {pac?.nome}
                          </div>
                          <div
                            className="text-xs mt-0.5"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            {rx.itens.length} item(ns) · Emitida em {rx.data} ·{" "}
                            {rx.medico}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className="text-[10px] font-mono"
                            style={{ color: "var(--primary)" }}
                          >
                            {rx.id}
                          </span>
                          <Icon name="chevron" size={14} />
                        </div>
                      </button>
                      {open && (
                        <div className="px-5 pb-4 slide-up">
                          <div
                            className="text-[10px] font-semibold mb-2 mt-1 tracking-widest uppercase"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            Itens de prescrição
                          </div>
                          <div
                            className="overflow-x-auto rounded-lg"
                            style={{ border: "1px solid var(--border)" }}
                          >
                            <table className="w-full min-w-[640px] text-xs">
                              <thead>
                                <tr style={{ background: "var(--secondary)" }}>
                                  {[
                                    "ID Item",
                                    "Medicamento",
                                    "Dosagem",
                                    "Via",
                                    "Frequência",
                                    "Duração",
                                    "Qtd",
                                  ].map((h) => (
                                    <th
                                      key={h}
                                      className="text-left px-3 py-2 font-semibold"
                                      style={{
                                        color: "var(--muted-foreground)",
                                      }}
                                    >
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {rx.itens.map((item, i) => (
                                  <tr
                                    key={item.id}
                                    style={{
                                      borderTop:
                                        i > 0
                                          ? "1px solid var(--border)"
                                          : "none",
                                    }}
                                  >
                                    <td
                                      className="px-3 py-2.5 font-mono"
                                      style={{
                                        color: "var(--muted-foreground)",
                                      }}
                                    >
                                      {item.id}
                                    </td>
                                    <td
                                      className="px-3 py-2.5 font-semibold"
                                      style={{ color: "var(--foreground)" }}
                                    >
                                      {item.medicamento}
                                    </td>
                                    <td className="px-3 py-2.5">
                                      {item.dosagem}
                                    </td>
                                    <td className="px-3 py-2.5">{item.via}</td>
                                    <td className="px-3 py-2.5">
                                      {item.frequencia}
                                    </td>
                                    <td className="px-3 py-2.5">
                                      {item.duracao}
                                    </td>
                                    <td
                                      className="px-3 py-2.5 font-mono"
                                      style={{ color: "var(--primary)" }}
                                    >
                                      {item.quantidade}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === "exames" && (
            <div className="fade-in">
              <PageTitle
                title="Exames e resultados"
                subtitle="Exames laboratoriais, exames de imagem e ECG"
                action={
                  <button
                    className="h-9 px-4 rounded-lg text-xs font-semibold text-white cursor-pointer"
                    style={{ background: "var(--primary)" }}
                  >
                    Solicitar exame
                  </button>
                }
              />
              <div className="flex flex-col gap-3">
                {exames.map((ex) => {
                  const pac = pacientes.find((p) => p.id === ex.pacienteId)
                  const icon: IconName =
                    ex.tipo === "ExameLaboratorial"
                      ? "flask"
                      : ex.tipo === "ExameImagem"
                        ? "image"
                        : "ecg"
                  return (
                    <div
                      key={ex.id}
                      className="rounded-[var(--radius)] p-5"
                      style={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            background: "var(--secondary)",
                            color: "var(--primary)",
                          }}
                        >
                          <Icon name={icon} size={19} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span
                              className="font-semibold text-sm"
                              style={{ color: "var(--foreground)" }}
                            >
                              {ex.nome}
                            </span>
                            <span
                              className="text-[10px] font-semibold px-2 py-1 rounded-full"
                              style={{
                                background: "var(--secondary)",
                                color: "var(--primary)",
                              }}
                            >
                              {ex.tipo}
                            </span>
                            <span
                              className="text-[10px] font-semibold px-2 py-1 rounded-full"
                              style={{
                                background:
                                  ex.status === "resultado"
                                    ? "#E8F8F5"
                                    : "#FFF8E6",
                                color:
                                  ex.status === "resultado"
                                    ? "var(--accent)"
                                    : "#D4860A",
                              }}
                            >
                              {ex.status === "resultado"
                                ? "Resultado disponível"
                                : "Agendado"}
                            </span>
                          </div>
                          <div
                            className="flex flex-wrap gap-x-4 text-[11px]"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            <span>
                              Paciente:{" "}
                              <strong style={{ color: "var(--foreground)" }}>
                                {pac?.nome}
                              </strong>
                            </span>
                            <span>
                              Data:{" "}
                              <strong style={{ color: "var(--foreground)" }}>
                                {ex.data}
                              </strong>
                            </span>
                            <span>
                              Solicitante:{" "}
                              <strong style={{ color: "var(--foreground)" }}>
                                {ex.solicitante}
                              </strong>
                            </span>
                            <span
                              className="font-mono"
                              style={{ color: "var(--primary)" }}
                            >
                              {ex.id}
                            </span>
                          </div>
                          {ex.resultado && (
                            <div
                              className="mt-3 p-3 rounded-lg text-xs leading-relaxed"
                              style={{
                                background: "var(--secondary)",
                                color: "var(--foreground)",
                              }}
                            >
                              <span
                                className="font-semibold block mb-1 text-[9px] tracking-wide"
                                style={{ color: "var(--muted-foreground)" }}
                              >
                                RESULTADO DO EXAME
                              </span>
                              {ex.resultado}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === "agenda" && (
            <div className="fade-in">
              <PageTitle
                title="Agenda médica"
                subtitle="Segunda-feira, 15 de setembro de 2026 · Consultório 12"
              />
              <div
                className="rounded-[var(--radius)] overflow-hidden"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                {agendaMedica.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-5 px-6 py-4"
                    style={{
                      borderBottom:
                        i < agendaMedica.length - 1
                          ? "1px solid var(--border)"
                          : "none",
                      background: a.concluido
                        ? "var(--secondary)"
                        : "var(--card)",
                      opacity: a.concluido ? 0.65 : 1,
                    }}
                  >
                    <div
                      className="w-14 text-center shrink-0 font-mono text-xs"
                      style={{
                        color: a.concluido
                          ? "var(--muted-foreground)"
                          : "var(--primary)",
                      }}
                    >
                      {a.hora}
                    </div>
                    <div
                      className="w-0.5 h-10 rounded-full shrink-0"
                      style={{
                        background: a.concluido
                          ? "var(--border)"
                          : "var(--accent)",
                      }}
                    />
                    <div className="flex-1">
                      <div
                        className="font-semibold text-sm"
                        style={{
                          color: "var(--foreground)",
                          textDecoration: a.concluido ? "line-through" : "none",
                        }}
                      >
                        {a.paciente}
                      </div>
                      <div
                        className="text-xs mt-0.5"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {a.tipo} · {a.local}
                      </div>
                    </div>
                    {a.concluido ? (
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded-full"
                        style={{
                          background: "#E8F8F5",
                          color: "var(--accent)",
                        }}
                      >
                        Concluído
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          className="text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                          style={{
                            background: "var(--secondary)",
                            color: "var(--foreground)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          Reagendar
                        </button>
                        <button
                          className="text-xs px-3 py-1.5 rounded-lg cursor-pointer text-white"
                          style={{ background: "var(--primary)" }}
                        >
                          Iniciar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "internacao" && (
            <div className="fade-in">
              <PageTitle
                title="Internações"
                subtitle="Pacientes internados sob sua responsabilidade"
              />
              <div className="flex flex-col gap-4">
                {internacoes.map((int) => {
                  const pac = pacientes.find((p) => p.id === int.pacienteId)
                  const rc = registrosClinicos[int.pacienteId]?.[0]
                  return (
                    <div
                      key={int.id}
                      className="rounded-[var(--radius)] p-5"
                      style={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                          style={{ background: "var(--primary)" }}
                        >
                          {pac?.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3
                              className="font-semibold text-sm"
                              style={{ color: "var(--foreground)" }}
                            >
                              {pac?.nome}
                            </h3>
                            <span
                              className="text-[10px] font-semibold px-2 py-1 rounded-full"
                              style={{
                                background: "#FDEDEC",
                                color: "#C0392B",
                              }}
                            >
                              Internado
                            </span>
                            <span
                              className="text-[10px] font-mono"
                              style={{ color: "var(--primary)" }}
                            >
                              {int.id}
                            </span>
                          </div>
                          <p
                            className="text-xs mt-1"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            {int.motivo}
                          </p>
                          <div
                            className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] mt-2"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            <span>
                              Leito{" "}
                              <strong style={{ color: "var(--foreground)" }}>
                                {int.leito}
                              </strong>
                            </span>
                            <span>
                              Ala{" "}
                              <strong style={{ color: "var(--foreground)" }}>
                                {int.ala}
                              </strong>
                            </span>
                            <span>
                              Entrada{" "}
                              <strong style={{ color: "var(--foreground)" }}>
                                {int.entrada}
                              </strong>
                            </span>
                            <span>
                              Alta prevista{" "}
                              <strong style={{ color: "var(--foreground)" }}>
                                {int.altaPrevista}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>
                      {rc && (
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {[
                            { label: "PA", value: rc.pressao, unit: "mmHg" },
                            { label: "FC", value: String(rc.fc), unit: "bpm" },
                            {
                              label: "Temp",
                              value: String(rc.temp),
                              unit: "°C",
                            },
                            {
                              label: "SpO₂",
                              value: String(rc.spo2),
                              unit: "%",
                            },
                          ].map((v) => (
                            <div
                              key={v.label}
                              className="p-2.5 rounded-lg text-center"
                              style={{ background: "var(--secondary)" }}
                            >
                              <div
                                className="text-sm font-bold font-mono"
                                style={{
                                  color:
                                    v.label === "SpO₂" && Number(v.value) < 94
                                      ? "#E74C3C"
                                      : "var(--primary)",
                                }}
                              >
                                {v.value}
                                <span
                                  className="text-[9px] ml-0.5 font-normal"
                                  style={{ color: "var(--muted-foreground)" }}
                                >
                                  {v.unit}
                                </span>
                              </div>
                              <div
                                className="text-[9px]"
                                style={{ color: "var(--muted-foreground)" }}
                              >
                                {v.label}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => goToPatient(int.pacienteId)}
                          className="h-8 px-4 rounded-lg text-xs font-semibold text-white cursor-pointer"
                          style={{ background: "var(--primary)" }}
                        >
                          Evoluir prontuário
                        </button>
                        <button
                          className="h-8 px-4 rounded-lg text-xs font-semibold cursor-pointer"
                          style={{
                            background: "var(--secondary)",
                            color: "var(--foreground)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          Nova prescrição
                        </button>
                        <button
                          className="h-8 px-4 rounded-lg text-xs font-semibold cursor-pointer"
                          style={{
                            background: "#E8F8F5",
                            color: "var(--accent)",
                          }}
                        >
                          Dar alta
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === "alertas" && (
            <div className="fade-in">
              <PageTitle
                title="Alertas do sistema"
                subtitle={`${alertasPendentes.length} alerta${
                  alertasPendentes.length === 1 ? "" : "s"
                } pendente${
                  alertasPendentes.length === 1 ? "" : "s"
                } de avaliação`}
                action={
                  alertasPendentes.length > 0 ? (
                    <button
                      onClick={markAllAlertsSeen}
                      className="h-9 px-4 rounded-lg text-xs font-semibold cursor-pointer"
                      style={{
                        background: "var(--secondary)",
                        color: "var(--primary)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      Marcar todos como vistos
                    </button>
                  ) : undefined
                }
              />

              <div className="grid grid-cols-1 gap-3">
                {alertas.map((a) => {
                  const p = pacientes.find((x) => x.id === a.pacienteId)!
                  const c = riskColor[a.severity]
                  const visto = alertasVistos.includes(a.id)
                  return (
                    <div
                      key={a.id}
                      className="rounded-[var(--radius)] p-5 transition-all"
                      style={{
                        background: "var(--card)",
                        border: `1px solid ${
                          visto ? "var(--border)" : c.dot + "55"
                        }`,
                        opacity: visto ? 0.62 : 1,
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: c.bg, color: c.text }}
                        >
                          <Icon name="alert" size={19} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full"
                              style={{ background: c.bg, color: c.text }}
                            >
                              {c.label}
                            </span>
                            <span
                              className="text-[10px] font-mono"
                              style={{ color: "var(--muted-foreground)" }}
                            >
                              {a.id}
                            </span>
                          </div>
                          <h3
                            className="text-sm font-semibold mt-2"
                            style={{ color: "var(--foreground)" }}
                          >
                            {a.titulo}
                          </h3>
                          <p
                            className="text-xs mt-1"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            {a.detalhe}
                          </p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                            <div>
                              <div
                                className="text-[9px]"
                                style={{ color: "var(--muted-foreground)" }}
                              >
                                Paciente
                              </div>
                              <div
                                className="text-xs font-semibold mt-1"
                                style={{ color: "var(--foreground)" }}
                              >
                                {p.nome}
                              </div>
                            </div>
                            <div>
                              <div
                                className="text-[9px]"
                                style={{ color: "var(--muted-foreground)" }}
                              >
                                Valor
                              </div>
                              <div
                                className="text-xs font-semibold mt-1"
                                style={{ color: c.text }}
                              >
                                {a.valor} {a.label}
                              </div>
                            </div>
                            <div>
                              <div
                                className="text-[9px]"
                                style={{ color: "var(--muted-foreground)" }}
                              >
                                Atualização
                              </div>
                              <div
                                className="text-xs font-medium mt-1"
                                style={{ color: "var(--foreground)" }}
                              >
                                {a.horario}
                              </div>
                            </div>
                            <div>
                              <div
                                className="text-[9px]"
                                style={{ color: "var(--muted-foreground)" }}
                              >
                                Local
                              </div>
                              <div
                                className="text-xs font-medium mt-1"
                                style={{ color: "var(--foreground)" }}
                              >
                                {a.local}
                              </div>
                            </div>
                          </div>

                          <div
                            className="flex flex-wrap gap-2 mt-4 pt-4"
                            style={{ borderTop: "1px solid var(--border)" }}
                          >
                            <button
                              onClick={() => goToPatient(p.id)}
                              className="h-8 px-3 rounded-lg text-xs font-semibold text-white cursor-pointer"
                              style={{ background: "var(--primary)" }}
                            >
                              Visualizar prontuário
                            </button>
                            {!visto && (
                              <button
                                onClick={() => markAlertSeen(a.id)}
                                className="h-8 px-3 rounded-lg text-xs font-semibold cursor-pointer"
                                style={{
                                  background: "var(--secondary)",
                                  color: "var(--foreground)",
                                  border: "1px solid var(--border)",
                                }}
                              >
                                Marcar como visto
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
