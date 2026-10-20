import { useMemo, useState } from "react"
import type { Screen } from "../App"
import DashboardSidebar from "./DashboardSidebar"
import ThemeToggle, { type Theme } from "./ThemeToggle"

interface Props {
  onNavigate: (screen: Screen) => void
  theme: Theme
  onToggleTheme: () => void
}

type Tab = "internados" | "prescricao" | "administracao" | "evolucao" | "alertas"

type IconName = "users" | "clipboard" | "flask" | "bed" | "bell" | "alert" | "activity" | "image" | "ecg" | "chevron" | "arrow" | "search" | "check" | "x" | "pill" | "clock" | "send"

// ---------------------------------------------------------------------------
// Perfil fixo da enfermeira responsável
// ---------------------------------------------------------------------------
const ENFERMEIRA = {
  nome: "Ana Dias",
  iniciais: "AD",
  cargo: "Enfermeira Chefe",
  coren: "COREN 234.567",
  assinatura: "Enf. Ana Dias · COREN 234.567",
}

// ---------------------------------------------------------------------------
// Pacientes internados — nomes brasileiros realistas
// ---------------------------------------------------------------------------
const pacientes = [
  {
    id: "PAC-001",
    nome: "João Batista Ferreira",
    idade: 68,
    sexo: "M",
    condicao: "Hipertensão Arterial Sistêmica",
    status: "estável",
    avatar: "JF",
    leito: "12A",
    ala: "Clínica Médica",
    risco: "low",
    prescricaoAtiva: true,
    medico: "Dr. Rafael Oliveira",
    entrada: "10 Set 2026",
  },
  {
    id: "PAC-002",
    nome: "Marta Regina Souza",
    idade: 62,
    sexo: "F",
    condicao: "Diabetes Mellitus Tipo 2",
    status: "atenção",
    avatar: "MS",
    leito: "08B",
    ala: "Endocrinologia",
    risco: "medium",
    prescricaoAtiva: true,
    medico: "Dr. Rafael Oliveira",
    entrada: "12 Set 2026",
  },
  {
    id: "PAC-003",
    nome: "Antônio Carlos Mendes",
    idade: 54,
    sexo: "M",
    condicao: "Pneumonia Bacteriana",
    status: "crítico",
    avatar: "AM",
    leito: "14B",
    ala: "Pneumologia",
    risco: "high",
    prescricaoAtiva: true,
    medico: "Dra. Fernanda Lima",
    entrada: "14 Set 2026",
  },
  {
    id: "PAC-004",
    nome: "Larissa Andrade Pinto",
    idade: 31,
    sexo: "F",
    condicao: "Enxaqueca Crônica",
    status: "estável",
    avatar: "LP",
    leito: "05A",
    ala: "Clínica Médica",
    risco: "low",
    prescricaoAtiva: false,
    medico: "Dr. Rafael Oliveira",
    entrada: "13 Set 2026",
  },
  {
    id: "PAC-005",
    nome: "Roberto Nogueira Alves",
    idade: 71,
    sexo: "M",
    condicao: "Insuficiência Cardíaca Congestiva",
    status: "atenção",
    avatar: "RA",
    leito: "22A",
    ala: "Cardiologia",
    risco: "medium",
    prescricaoAtiva: true,
    medico: "Dr. Rafael Oliveira",
    entrada: "11 Set 2026",
  },
  {
    id: "PAC-006",
    nome: "Cláudia Ribeiro Martins",
    idade: 45,
    sexo: "F",
    condicao: "Pós-operatório de Colecistectomia",
    status: "estável",
    avatar: "CM",
    leito: "09C",
    ala: "Cirurgia Geral",
    risco: "low",
    prescricaoAtiva: true,
    medico: "Dr. Bruno Tavares",
    entrada: "14 Set 2026",
  },
  {
    id: "PAC-007",
    nome: "Sebastião Rocha Lima",
    idade: 79,
    sexo: "M",
    condicao: "Acidente Vascular Cerebral Isquêmico",
    status: "atenção",
    avatar: "SL",
    leito: "17A",
    ala: "Neurologia",
    risco: "medium",
    prescricaoAtiva: true,
    medico: "Dra. Fernanda Lima",
    entrada: "09 Set 2026",
  },
  {
    id: "PAC-008",
    nome: "Patrícia Gomes Barbosa",
    idade: 38,
    sexo: "F",
    condicao: "Pielonefrite Aguda",
    status: "atenção",
    avatar: "PB",
    leito: "11B",
    ala: "Nefrologia",
    risco: "medium",
    prescricaoAtiva: true,
    medico: "Dr. Bruno Tavares",
    entrada: "13 Set 2026",
  },
]

// ---------------------------------------------------------------------------
// Registros clínicos iniciais
// ---------------------------------------------------------------------------
const registrosClinicosIniciais: Record<string, {
  data: string
  descricao: string
  pressao: string
  fc: number
  temp: number
  spo2: number
}[]> = {
  "PAC-001": [
    {
      data: "Hoje, 08:00",
      descricao:
        "Paciente estável, PA controlada com medicação. Sem queixas álgicas.",
      pressao: "128/82",
      fc: 74,
      temp: 36.8,
      spo2: 98,
    },
  ],
  "PAC-002": [
    {
      data: "Hoje, 08:30",
      descricao:
        "Glicemia capilar 210 mg/dL. Comunicado ao médico para ajuste de insulina.",
      pressao: "142/90",
      fc: 82,
      temp: 37.0,
      spo2: 96,
    },
  ],
  "PAC-003": [
    {
      data: "Hoje, 07:45",
      descricao:
        "SpO₂ 88% em ar ambiente. Iniciado O₂ suplementar 3L/min. Médico notificado.",
      pressao: "110/70",
      fc: 108,
      temp: 38.9,
      spo2: 88,
    },
  ],
  "PAC-004": [
    {
      data: "Hoje, 09:00",
      descricao:
        "Refere melhora da cefaleia após analgesia. Sem novos episódios.",
      pressao: "118/76",
      fc: 70,
      temp: 36.5,
      spo2: 99,
    },
  ],
  "PAC-005": [
    {
      data: "Hoje, 07:30",
      descricao:
        "Edema de MMII +/4+. PA elevada. Comunicado ao médico plantonista.",
      pressao: "165/105",
      fc: 96,
      temp: 37.2,
      spo2: 93,
    },
  ],
  "PAC-006": [
    {
      data: "Hoje, 08:15",
      descricao:
        "Pós-operatório imediato. Ferida operatória limpa, sem sinais de infecção.",
      pressao: "122/80",
      fc: 78,
      temp: 36.7,
      spo2: 98,
    },
  ],
  "PAC-007": [
    {
      data: "Hoje, 07:50",
      descricao:
        "Déficit motor em dimídio direito. Fisioterapia acionada. Estável hemodinamicamente.",
      pressao: "148/92",
      fc: 84,
      temp: 36.6,
      spo2: 97,
    },
  ],
  "PAC-008": [
    {
      data: "Hoje, 08:40",
      descricao:
        "Dor lombar intensa. Analgesia administrada. Aguardando resultado de urocultura.",
      pressao: "130/85",
      fc: 88,
      temp: 38.2,
      spo2: 97,
    },
  ],
}

type PrescricaoItem = {
  id: string
  medicamento: string
  dosagem: string
  via: string
  horario: string
  status: "pendente" | "administrado" | "atrasado"
}

const prescricoesPorPaciente: Record<string, PrescricaoItem[]> = {
  "PAC-001": [
    {
      id: "IP-001",
      medicamento: "Losartana",
      dosagem: "50mg",
      via: "Oral",
      horario: "08:00",
      status: "pendente",
    },
    {
      id: "IP-002",
      medicamento: "Amlodipina",
      dosagem: "5mg",
      via: "Oral",
      horario: "12:00",
      status: "pendente",
    },
    {
      id: "IP-003",
      medicamento: "AAS",
      dosagem: "100mg",
      via: "Oral",
      horario: "20:00",
      status: "pendente",
    },
  ],
  "PAC-002": [
    {
      id: "IP-004",
      medicamento: "Insulina NPH",
      dosagem: "20UI",
      via: "SC",
      horario: "07:00",
      status: "pendente",
    },
    {
      id: "IP-005",
      medicamento: "Metformina",
      dosagem: "850mg",
      via: "Oral",
      horario: "12:00",
      status: "pendente",
    },
    {
      id: "IP-006",
      medicamento: "Insulina NPH",
      dosagem: "20UI",
      via: "SC",
      horario: "19:00",
      status: "pendente",
    },
  ],
  "PAC-003": [
    {
      id: "IP-007",
      medicamento: "Amoxicilina",
      dosagem: "500mg",
      via: "IV",
      horario: "06:00",
      status: "pendente",
    },
    {
      id: "IP-008",
      medicamento: "Amoxicilina",
      dosagem: "500mg",
      via: "IV",
      horario: "14:00",
      status: "pendente",
    },
    {
      id: "IP-009",
      medicamento: "Dexametasona",
      dosagem: "4mg",
      via: "IV",
      horario: "10:00",
      status: "pendente",
    },
    {
      id: "IP-010",
      medicamento: "Amoxicilina",
      dosagem: "500mg",
      via: "IV",
      horario: "22:00",
      status: "pendente",
    },
  ],
  "PAC-005": [
    {
      id: "IP-011",
      medicamento: "Furosemida",
      dosagem: "40mg",
      via: "IV",
      horario: "08:00",
      status: "pendente",
    },
    {
      id: "IP-012",
      medicamento: "Espironolactona",
      dosagem: "25mg",
      via: "Oral",
      horario: "12:00",
      status: "pendente",
    },
    {
      id: "IP-013",
      medicamento: "Carvedilol",
      dosagem: "6,25mg",
      via: "Oral",
      horario: "20:00",
      status: "pendente",
    },
  ],
  "PAC-006": [
    {
      id: "IP-014",
      medicamento: "Dipirona",
      dosagem: "1g",
      via: "IV",
      horario: "06:00",
      status: "pendente",
    },
    {
      id: "IP-015",
      medicamento: "Cefazolina",
      dosagem: "1g",
      via: "IV",
      horario: "08:00",
      status: "pendente",
    },
    {
      id: "IP-016",
      medicamento: "Ondansetrona",
      dosagem: "4mg",
      via: "IV",
      horario: "14:00",
      status: "pendente",
    },
  ],
  "PAC-007": [
    {
      id: "IP-017",
      medicamento: "AAS",
      dosagem: "100mg",
      via: "Oral",
      horario: "08:00",
      status: "pendente",
    },
    {
      id: "IP-018",
      medicamento: "Atorvastatina",
      dosagem: "40mg",
      via: "Oral",
      horario: "20:00",
      status: "pendente",
    },
    {
      id: "IP-019",
      medicamento: "Enoxaparina",
      dosagem: "40mg",
      via: "SC",
      horario: "10:00",
      status: "pendente",
    },
  ],
  "PAC-008": [
    {
      id: "IP-020",
      medicamento: "Ceftriaxona",
      dosagem: "1g",
      via: "IV",
      horario: "08:00",
      status: "pendente",
    },
    {
      id: "IP-021",
      medicamento: "Dipirona",
      dosagem: "1g",
      via: "IV",
      horario: "14:00",
      status: "pendente",
    },
    {
      id: "IP-022",
      medicamento: "Hidratação SF 0,9%",
      dosagem: "500ml",
      via: "IV",
      horario: "12:00",
      status: "pendente",
    },
  ],
}

const alertas = [
  {
    id: "ALT-001",
    pacienteId: "PAC-003",
    severity: "high" as const,
    titulo: "Saturação de oxigênio abaixo do limite",
    detalhe: "SpO₂ 88% — Pneumonia bacteriana",
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
    detalhe: "Glicemia capilar 210 mg/dL",
    horario: "Hoje, 08:30",
    local: "Leito 08B",
    valor: "210",
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
  {
    id: "ALT-004",
    pacienteId: "PAC-008",
    severity: "medium" as const,
    titulo: "Febre persistente",
    detalhe: "Tax 38,2 °C — Pielonefrite aguda",
    horario: "Hoje, 08:40",
    local: "Leito 11B",
    valor: "38,2",
    label: "°C",
  },
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
    case "pill":
      return (
        <svg {...common}>
          <rect x="3" y="9" width="18" height="7" rx="3.5" />
          <path d="M12 9v7" />
        </svg>
      )
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
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

const statusPrescricaoColor = {
  pendente: {
    bg: "#FFF8E6",
    text: "#A96800",
    dot: "#F5A623",
    label: "Pendente",
  },
  administrado: {
    bg: "#E8F8F5",
    text: "#007F72",
    dot: "#00A896",
    label: "Administrado",
  },
  atrasado: {
    bg: "#FDEDEC",
    text: "#B8322A",
    dot: "#E74C3C",
    label: "Atrasado",
  },
}

export default function NurseDashboard({
  onNavigate,
  theme,
  onToggleTheme,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("internados")
  const [selectedPaciente, setSelectedPaciente] =
    useState<typeof pacientes[0] | null>(pacientes[0])
  const [alertasAtendidos, setAlertasAtendidos] = useState<string[]>([])
  const [patientSearch, setPatientSearch] = useState("")
  const [administrados, setAdministrados] = useState<string[]>([])
  const [evolucaoTexto, setEvolucaoTexto] = useState("")
  const [evolucaoEnviada, setEvolucaoEnviada] = useState(false)

  const [evolucoesPorPaciente, setEvolucoesPorPaciente] =
    useState<typeof registrosClinicosIniciais>(registrosClinicosIniciais)

  const agora = "14:32"

  const alertasPendentes = alertas.filter(
    (a) => !alertasAtendidos.includes(a.id),
  )

  const filteredPatients = pacientes.filter((p) =>
    `${p.nome} ${p.id} ${p.condicao} ${p.leito}`
      .toLowerCase()
      .includes(patientSearch.toLowerCase()),
  )

  const prescricaoAtual = useMemo(() => {
    if (!selectedPaciente) return []
    return [...(prescricoesPorPaciente[selectedPaciente.id] ?? [])].sort(
      (a, b) => a.horario.localeCompare(b.horario),
    )
  }, [selectedPaciente])

  const goToPatient = (id: string, tab: Tab = "prescricao") => {
    const patient = pacientes.find((p) => p.id === id)
    if (patient) {
      setSelectedPaciente(patient)
      setActiveTab(tab)
    }
  }

  const markAlertAtendido = (id: string) => {
    setAlertasAtendidos((current) =>
      current.includes(id) ? current : [...current, id],
    )
  }

  const markAllAlertasAtendidos = () =>
    setAlertasAtendidos(alertas.map((a) => a.id))

  const confirmarAdministracao = (itemId: string) => {
    setAdministrados((current) =>
      current.includes(itemId) ? current : [...current, itemId],
    )
  }

  const enviarEvolucao = () => {
    if (!evolucaoTexto.trim() || !selectedPaciente) return

    const novaEvolucao = {
      data: `Hoje, ${agora}`,
      descricao: evolucaoTexto.trim(),
      pressao: "—",
      fc: 0,
      temp: 0,
      spo2: 0,
    }

    setEvolucoesPorPaciente((current) => ({
      ...current,
      [selectedPaciente.id]: [
        novaEvolucao,
        ...(current[selectedPaciente.id] ?? []),
      ],
    }))

    setEvolucaoEnviada(true)
    setEvolucaoTexto("")
    setTimeout(() => setEvolucaoEnviada(false), 2500)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "internados", label: "Pacientes Internados" },
    { key: "prescricao", label: "Prescrições" },
    { key: "administracao", label: "Administração" },
    { key: "evolucao", label: "Evolução Clínica" },
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

  const PacienteInternadoCard = ({ p }: { p: typeof pacientes[0] }) => {
    const c = riskColor[(p.risco as keyof typeof riskColor)]
    const rc = evolucoesPorPaciente[p.id]?.[0]
    const presc = prescricoesPorPaciente[p.id] ?? []
    const pendentes = presc.filter(
      (i) => i.status !== "administrado" && !administrados.includes(i.id),
    ).length

    return (
      <button
        onClick={() => goToPatient(p.id, "prescricao")}
        className="w-full text-left rounded-[var(--radius)] p-4 transition-all cursor-pointer hover:-translate-y-0.5"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
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
              {p.leito} · {p.ala} · {p.condicao}
            </div>
          </div>
          <span
            className="text-[10px] font-semibold px-2 py-1 rounded-full shrink-0"
            style={{ background: c.bg, color: c.text }}
          >
            {c.label}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-3">
          {p.prescricaoAtiva ? (
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full"
              style={{ background: "#E8F8F5", color: "#007F72" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#00A896" }}
              />
              Prescrição Ativa
              {pendentes > 0 && (
                <span
                  className="ml-1 px-1.5 rounded-full text-[9px]"
                  style={{ background: "#00A896", color: "white" }}
                >
                  {pendentes}
                </span>
              )}
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full"
              style={{ background: "#F4F6F8", color: "#8A94A6" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#8A94A6" }}
              />
              Sem prescrição ativa
            </span>
          )}
        </div>

        {rc && rc.fc > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[
              { label: "PA", value: rc.pressao, unit: "" },
              { label: "FC", value: String(rc.fc), unit: "bpm" },
              { label: "Temp", value: String(rc.temp), unit: "°C" },
              { label: "SpO₂", value: String(rc.spo2), unit: "%" },
            ].map((v) => (
              <div
                key={v.label}
                className="p-2 rounded-lg text-center"
                style={{ background: "var(--secondary)" }}
              >
                <div
                  className="text-xs font-bold font-mono"
                  style={{
                    color:
                      v.label === "SpO₂" && Number(v.value) < 94
                        ? "#C0392B"
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

        <div
          className="flex items-center justify-between mt-3 pt-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <span
            className="text-[10px]"
            style={{ color: "var(--muted-foreground)" }}
          >
            {p.medico} · desde {p.entrada}
          </span>
          <Icon name="arrow" size={14} />
        </div>
      </button>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <DashboardSidebar
        role="Enfermagem"
        initials={ENFERMEIRA.iniciais}
        name={ENFERMEIRA.nome}
        detail={`${ENFERMEIRA.cargo} · ${ENFERMEIRA.coren}`}
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
                {ENFERMEIRA.nome}
              </div>
              <div
                className="hidden text-[10px] sm:block"
                style={{ color: "var(--muted-foreground)" }}
              >
                {ENFERMEIRA.cargo} · {ENFERMEIRA.coren}
              </div>
            </div>
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: "var(--accent)" }}
            >
              {ENFERMEIRA.iniciais}
            </div>
          </div>
        </header>

        <main className="dashboard-main mx-auto w-full min-w-0 max-w-7xl flex-1 px-4 pb-24 pt-20 sm:px-6 xl:p-6">
          {/* ============ INTERNADOS ============ */}
          {activeTab === "internados" && (
            <div className="fade-in">
              <PageTitle
                title={`Bom dia, ${ENFERMEIRA.nome.split(" ")[0]}`}
                subtitle="Segunda-feira, 15 de setembro de 2026 · Plantão diurno"
              />

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  {
                    label: "Pacientes internados",
                    value: String(pacientes.length),
                    icon: "bed" as IconName,
                    detail: "Ativos",
                  },
                  {
                    label: "Prescrições ativas",
                    value: String(
                      pacientes.filter((p) => p.prescricaoAtiva).length,
                    ),
                    icon: "pill" as IconName,
                    detail: "Em curso",
                  },
                  {
                    label: "Medicações pendentes",
                    value: String(
                      Object.values(prescricoesPorPaciente)
                        .flat()
                        .filter(
                          (i) =>
                            i.status !== "administrado" &&
                            !administrados.includes(i.id),
                        ).length,
                    ),
                    icon: "clock" as IconName,
                    detail: "Hoje",
                  },
                  {
                    label: "Alertas pendentes",
                    value: String(alertasPendentes.length),
                    icon: "alert" as IconName,
                    detail: "Requer ação",
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

              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-md">
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    <Icon name="search" size={16} />
                  </span>
                  <input
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Buscar por nome, leito ou condição..."
                    className="w-full h-10 pl-9 pr-3 rounded-lg text-xs outline-none"
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPatients.map((p) => (
                  <PacienteInternadoCard key={p.id} p={p} />
                ))}
              </div>
            </div>
          )}

          {/* ============ PRESCRIÇÃO DETALHE ============ */}
          {activeTab === "prescricao" && (
            <div className="fade-in">
              <PageTitle
                title="Detalhe da prescrição"
                subtitle="Medicamentos, doses, horários e vias de administração"
              />
              {selectedPaciente ? (
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
                            {p.leito} · {p.condicao}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="lg:col-span-2 flex flex-col gap-4">
                    <div
                      className="rounded-[var(--radius)] p-5"
                      style={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                          style={{ background: "var(--primary)" }}
                        >
                          {selectedPaciente.avatar}
                        </div>
                        <div className="flex-1">
                          <h2
                            className="text-lg font-semibold"
                            style={{ color: "var(--foreground)" }}
                          >
                            {selectedPaciente.nome}
                          </h2>
                          <div
                            className="text-[11px] mt-0.5"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            {selectedPaciente.leito} · {selectedPaciente.ala} ·{" "}
                            {selectedPaciente.medico}
                          </div>
                        </div>
                        {selectedPaciente.prescricaoAtiva && (
                          <span
                            className="text-[10px] font-bold px-2 py-1 rounded-full"
                            style={{ background: "#E8F8F5", color: "#007F72" }}
                          >
                            Prescrição Ativa
                          </span>
                        )}
                      </div>

                      <div
                        className="text-[10px] font-semibold uppercase tracking-wider mb-3"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Cronograma de administração
                      </div>
                      <div className="flex flex-col gap-2">
                        {prescricaoAtual.map((item) => {
                          const adm = administrados.includes(item.id)
                          const status = adm ? "administrado" : item.status
                          const sc = statusPrescricaoColor[status]
                          return (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 p-3 rounded-lg"
                              style={{
                                background: "var(--secondary)",
                                borderLeft: `3px solid ${sc.dot}`,
                              }}
                            >
                              <div
                                className="w-14 text-center font-mono text-xs font-bold shrink-0"
                                style={{ color: "var(--primary)" }}
                              >
                                {item.horario}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <Icon name="pill" size={14} />
                                  <span
                                    className="font-semibold text-sm"
                                    style={{ color: "var(--foreground)" }}
                                  >
                                    {item.medicamento}
                                  </span>
                                </div>
                                <div
                                  className="text-[11px] mt-0.5"
                                  style={{ color: "var(--muted-foreground)" }}
                                >
                                  {item.dosagem} · Via {item.via}
                                </div>
                              </div>
                              <span
                                className="text-[10px] font-semibold px-2 py-1 rounded-full shrink-0"
                                style={{ background: sc.bg, color: sc.text }}
                              >
                                {sc.label}
                              </span>
                            </div>
                          )
                        })}
                        {prescricaoAtual.length === 0 && (
                          <p
                            className="text-xs text-center py-6"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            Nenhum medicamento prescrito.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* ============ ADMINISTRAÇÃO ============ */}
          {activeTab === "administracao" && (
            <div className="fade-in">
              <PageTitle
                title="Registro de administração"
                subtitle="Confirmação em poucos cliques · horário e profissional automáticos"
              />
              {selectedPaciente ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="flex flex-col gap-3">
                    {pacientes
                      .filter((p) => p.prescricaoAtiva)
                      .map((p) => (
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
                              {p.leito} · {p.condicao}
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>

                  <div className="lg:col-span-2 flex flex-col gap-3">
                    <div
                      className="rounded-[var(--radius)] p-4 flex flex-wrap gap-4"
                      style={{
                        background: "var(--secondary)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div>
                        <div
                          className="text-[9px] uppercase tracking-wide"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          Horário
                        </div>
                        <div
                          className="text-sm font-bold font-mono mt-0.5"
                          style={{ color: "var(--primary)" }}
                        >
                          {agora}
                        </div>
                      </div>
                      <div>
                        <div
                          className="text-[9px] uppercase tracking-wide"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          Profissional
                        </div>
                        <div
                          className="text-sm font-semibold mt-0.5"
                          style={{ color: "var(--foreground)" }}
                        >
                          {ENFERMEIRA.assinatura}
                        </div>
                      </div>
                      <div>
                        <div
                          className="text-[9px] uppercase tracking-wide"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          Paciente
                        </div>
                        <div
                          className="text-sm font-semibold mt-0.5"
                          style={{ color: "var(--foreground)" }}
                        >
                          {selectedPaciente.nome} · {selectedPaciente.leito}
                        </div>
                      </div>
                    </div>

                    {prescricaoAtual.map((item) => {
                      const adm = administrados.includes(item.id)
                      const status = adm ? "administrado" : item.status
                      const sc = statusPrescricaoColor[status]
                      return (
                        <div
                          key={item.id}
                          className="rounded-[var(--radius)] p-4 flex items-center gap-4"
                          style={{
                            background: "var(--card)",
                            border: `1px solid ${
                              adm ? "var(--border)" : sc.dot + "55"
                            }`,
                            opacity: adm ? 0.75 : 1,
                          }}
                        >
                          <div
                            className="w-12 text-center font-mono text-sm font-bold shrink-0"
                            style={{ color: "var(--primary)" }}
                          >
                            {item.horario}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Icon name="pill" size={15} />
                              <span
                                className="font-semibold text-sm"
                                style={{ color: "var(--foreground)" }}
                              >
                                {item.medicamento}
                              </span>
                              <span
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                style={{ background: sc.bg, color: sc.text }}
                              >
                                {sc.label}
                              </span>
                            </div>
                            <div
                              className="text-[11px] mt-1"
                              style={{ color: "var(--muted-foreground)" }}
                            >
                              Dose: {item.dosagem} · Via: {item.via}
                            </div>
                          </div>
                          {adm ? (
                            <span
                              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg shrink-0"
                              style={{
                                background: "#E8F8F5",
                                color: "#007F72",
                              }}
                            >
                              <Icon name="check" size={14} />
                              Administrado
                            </span>
                          ) : (
                            <button
                              onClick={() => confirmarAdministracao(item.id)}
                              className="h-9 px-4 rounded-lg text-xs font-semibold text-white cursor-pointer shrink-0"
                              style={{ background: "var(--primary)" }}
                            >
                              Confirmar
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* ============ EVOLUÇÃO / OBSERVAÇÃO ============ */}
          {activeTab === "evolucao" && (
            <div className="fade-in">
              <PageTitle
                title="Evolução e observação clínica"
                subtitle="Registro enviado diretamente ao médico responsável"
              />
              {selectedPaciente ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="flex flex-col gap-3">
                    {pacientes.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedPaciente(p)
                          setEvolucaoTexto("")
                          setEvolucaoEnviada(false)
                        }}
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
                            {p.leito} · {p.medico}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="lg:col-span-2 flex flex-col gap-4">
                    <div
                      className="rounded-[var(--radius)] p-5"
                      style={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3
                            className="font-semibold text-sm"
                            style={{ color: "var(--foreground)" }}
                          >
                            Nova observação
                          </h3>
                          <p
                            className="text-[11px] mt-0.5"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            Para: {selectedPaciente.medico} ·{" "}
                            {selectedPaciente.nome}
                          </p>
                        </div>
                        <span
                          className="text-[10px] font-mono"
                          style={{ color: "var(--primary)" }}
                        >
                          {agora}
                        </span>
                      </div>

                      <textarea
                        value={evolucaoTexto}
                        onChange={(e) => setEvolucaoTexto(e.target.value)}
                        rows={6}
                        placeholder="Descreva a evolução clínica, queixas, intercorrências, sinais vitais ou observações relevantes..."
                        className="w-full p-3 rounded-lg text-xs outline-none resize-none"
                        style={{
                          background: "var(--secondary)",
                          border: "1px solid var(--border)",
                          color: "var(--foreground)",
                        }}
                      />

                      <div className="flex items-center justify-between mt-3">
                        <span
                          className="text-[10px]"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          Profissional: {ENFERMEIRA.assinatura}
                        </span>
                        <div className="flex gap-2">
                          {evolucaoEnviada && (
                            <span
                              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg"
                              style={{
                                background: "#E8F8F5",
                                color: "#007F72",
                              }}
                            >
                              <Icon name="check" size={14} />
                              Enviado ao médico
                            </span>
                          )}
                          <button
                            onClick={enviarEvolucao}
                            disabled={!evolucaoTexto.trim()}
                            className="h-9 px-4 rounded-lg text-xs font-semibold text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                            style={{ background: "var(--primary)" }}
                          >
                            <Icon name="send" size={14} />
                            Enviar evolução
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
                        Últimos registros
                      </h3>
                      <div className="flex flex-col gap-3">
                        {(evolucoesPorPaciente[selectedPaciente.id] ?? []).map(
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
                                  Evolução de enfermagem
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
                              <div
                                className="text-[10px] mt-2"
                                style={{ color: "var(--muted-foreground)" }}
                              >
                                {ENFERMEIRA.assinatura}
                              </div>
                            </div>
                          ),
                        )}
                        {(evolucoesPorPaciente[selectedPaciente.id] ?? [])
                          .length === 0 && (
                          <p
                            className="text-xs text-center py-6"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            Nenhum registro ainda.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* ============ ALERTAS ============ */}
          {activeTab === "alertas" && (
            <div className="fade-in">
              <PageTitle
                title="Central de alertas"
                subtitle={`${alertasPendentes.length} alerta${
                  alertasPendentes.length === 1 ? "" : "s"
                } pendente${
                  alertasPendentes.length === 1 ? "" : "s"
                } de atendimento`}
                action={
                  alertasPendentes.length > 0 ? (
                    <button
                      onClick={markAllAlertasAtendidos}
                      className="h-9 px-4 rounded-lg text-xs font-semibold cursor-pointer"
                      style={{
                        background: "var(--secondary)",
                        color: "var(--primary)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      Marcar todos como atendidos
                    </button>
                  ) : undefined
                }
              />

              <div className="grid grid-cols-1 gap-3">
                {alertas.map((a) => {
                  const p = pacientes.find((x) => x.id === a.pacienteId)!
                  const c = riskColor[a.severity]
                  const atendido = alertasAtendidos.includes(a.id)
                  return (
                    <div
                      key={a.id}
                      className="rounded-[var(--radius)] p-5 transition-all"
                      style={{
                        background: "var(--card)",
                        border: `1px solid ${
                          atendido ? "var(--border)" : c.dot + "55"
                        }`,
                        opacity: atendido ? 0.62 : 1,
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
                              onClick={() => goToPatient(p.id, "prescricao")}
                              className="h-8 px-3 rounded-lg text-xs font-semibold text-white cursor-pointer"
                              style={{ background: "var(--primary)" }}
                            >
                              Ver prescrição
                            </button>
                            {!atendido && (
                              <button
                                onClick={() => markAlertAtendido(a.id)}
                                className="h-8 px-3 rounded-lg text-xs font-semibold cursor-pointer"
                                style={{
                                  background: "#E8F8F5",
                                  color: "#007F72",
                                  border: "1px solid #00A89633",
                                }}
                              >
                                Marcar como atendido
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
