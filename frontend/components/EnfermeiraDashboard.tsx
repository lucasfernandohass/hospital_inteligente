import { useEffect, useMemo, useState } from "react"
import type { Screen } from "../App"
import DashboardSidebar from "./DashboardSidebar"
import { Avatar, ShowMoreButton, summaryLimit, DashboardHeader, EmptyState, HeroHeader, HeroStat, MetaItem, PageTitle, ProgressBar, QuickAction, SectionCard, SectionContext, StatusBadge, TimelineItem, UiIcon, VitalTile, shiftLabel, toneStyles, type Tone } from "./ui"
import { greeting } from "./dateUtils"
import type { Theme } from "./ThemeToggle"
import VitalMonitoring from "./VitalMonitoring"
import MonitoringAlertsPanel from "./MonitoringAlertsPanel"
import ActivityLog from "./ActivityLog"
import AlertNotifications from "./AlertNotifications"
import type { MonitoringAlert } from "./VitalMonitoring"
import { logActivity } from "./activityStore"
import { CLINICAL_ALERT_ACK_STORAGE_KEY, clinicalAlertRecords, readLegacyClinicalAlertAcknowledgements } from "./clinicalAlertStore"
import { CLINICAL_EVOLUTION_STORAGE_KEY, mergeClinicalEvolutions, readLegacyClinicalEvolutions, type ClinicalEvolutionMap } from "./clinicalEvolutionStore"
import { PRESCRIPTION_STORAGE_KEY, type SharedPrescription } from "./prescriptionStore"
import { MEDICATION_ADMINISTRATION_STORAGE_KEY, readMedicationAdministrations } from "./medicationAdministrationStore"
import { HOSPITALIZATION_STORAGE_KEY, type Hospitalization } from "./hospitalizationStore"
import useLocalStorageState from "./useLocalStorageState"
import { formatLongLocalDate } from "./appointmentStore"
import { BED_STORAGE_KEY, initialRegisteredBeds, initialRegisteredPatients, normalizeRegisteredBeds, PATIENT_STORAGE_KEY, type RegisteredBed, type RegisteredPatient } from "./patientStore"
import { usePanelRoute } from "../hooks/usePanelRoute"
import { api, ApiError } from "../services/api"
import { mapBed, mapInternment, mapPatient } from "../services/mappers"
import { mapPrescriptions } from "../services/mappers"
import { useVitalFeed } from "../hooks/useVitalFeed"

interface Props {
  onNavigate: (screen: Screen) => void
  token: string
  userName: string
  userId: number
  theme: Theme
  onToggleTheme: () => void
}

type Tab = "internados" | "monitoramento" | "prescricao" | "administracao" | "evolucao" | "atividades" | "alertas"


// ---------------------------------------------------------------------------
// Perfil fixo da enfermeira responsável
// ---------------------------------------------------------------------------
const ENFERMEIRA = {
  cargo: "Enfermagem",
}

// ---------------------------------------------------------------------------
// Pacientes internados — nomes brasileiros realistas
// ---------------------------------------------------------------------------
const pacientesBase = [
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

const riskColor = {
  low: { bg: "var(--success-surface)", text: "var(--success-foreground)", dot: "var(--success)", label: "Estável" },
  medium: { bg: "var(--warning-surface)", text: "var(--warning-foreground)", dot: "var(--warning)", label: "Atenção" },
  high: { bg: "var(--danger-surface)", text: "var(--danger-foreground)", dot: "var(--danger)", label: "Crítico" },
}

const statusPrescricaoColor = {
  pendente: {
    bg: "var(--warning-surface)",
    text: "var(--warning-foreground)",
    dot: "var(--warning)",
    label: "Pendente",
  },
  administrado: {
    bg: "var(--success-surface)",
    text: "var(--success-foreground)",
    dot: "var(--success)",
    label: "Administrado",
  },
  atrasado: {
    bg: "var(--danger-surface)",
    text: "var(--danger-foreground)",
    dot: "var(--danger)",
    label: "Atrasado",
  },
}

export default function NurseDashboard({
  onNavigate,
  token,
  userName,
  userId,
  theme,
  onToggleTheme,
}: Props) {
  const [registeredPatients, setRegisteredPatients] = useState<RegisteredPatient[]>([])
  const [registeredBeds, setRegisteredBeds] = useState<RegisteredBed[]>([])
  const [hospitalizations, setHospitalizations] = useState<Hospitalization[]>([])
  const [apiPrescriptions, setApiPrescriptions] = useState<SharedPrescription[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState("")
  useEffect(() => {
    let active = true
    setDataLoading(true)
    Promise.all([api.listPatients(token), api.listBeds(token), api.listInternments(token), api.listDoctors(token), api.listPrescriptions(token), api.listPrescriptionItems(token), api.listMedications(token), api.listMedicationAdministrations(token)])
      .then(([patientsDto, bedsDto, internmentsDto, doctors, prescriptions, items, medications, administrations]) => {
        if (!active) return
        setRegisteredPatients(patientsDto.map(mapPatient))
        setRegisteredBeds(bedsDto.map((bed) => mapBed(bed, internmentsDto)))
        setHospitalizations(internmentsDto.map((item) => mapInternment(item, bedsDto, doctors)))
        setApiPrescriptions(mapPrescriptions(prescriptions, items, medications, doctors))
        setAdministrados(administrations.map((item) => String(item.itemPrescricaoId)))
        setDataError("")
      })
      .catch((error) => { if (active) setDataError(error instanceof ApiError ? error.message : "Não foi possível carregar dados da API.") })
      .finally(() => { if (active) setDataLoading(false) })
    return () => { active = false }
  }, [token])
  const pacientes = useMemo(() => {
    const knownIds = new Set(pacientesBase.map((patient) => patient.id))
    const occupiedBeds = registeredBeds.filter((bed) => bed.status === "Ocupado" && bed.pacienteId)
    const activePatientIds = new Set(
      occupiedBeds.map((bed) => bed.pacienteId),
    )
    const synchronizedBase = pacientesBase.filter((patient) => activePatientIds.has(patient.id)).map((patient) => {
      const registered = registeredPatients.find((item) => item.id === patient.id)
      const bed = occupiedBeds.find((item) => item.pacienteId === patient.id)
      const admission = hospitalizations.find((item) => item.pacienteId === patient.id && item.status === "Ativa")
      const parts = registered?.dataNasc.split("/").map(Number) ?? []
      const birthDate = new Date(parts[2] ?? 2000, (parts[1] ?? 1) - 1, parts[0] ?? 1)
      const today = new Date()
      const age = Math.max(0, today.getFullYear() - birthDate.getFullYear() - (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate()) ? 1 : 0))
      const name = registered?.nome ?? patient.nome
      return {
        ...patient,
        nome: name,
        idade: registered ? age : patient.idade,
        sexo: registered?.sexo ?? patient.sexo,
        avatar: name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase(),
        leito: bed?.numero ?? patient.leito,
        ala: bed?.setor ?? bed?.tipo ?? patient.ala,
        condicao: admission?.motivo ?? patient.condicao,
        medico: admission?.medico ?? patient.medico,
        entrada: admission?.dataEntrada ?? patient.entrada,
      }
    })
    const additions = registeredPatients
      .filter((patient) => !knownIds.has(patient.id) && activePatientIds.has(patient.id))
      .map((patient) => {
        const bed = registeredBeds.find((item) => item.pacienteId === patient.id && item.status === "Ocupado")
        const admission = hospitalizations.find((item) => item.pacienteId === patient.id && item.status === "Ativa")
        const parts = patient.dataNasc.split("/").map(Number)
        const birthDate = new Date(parts[2] ?? 2000, (parts[1] ?? 1) - 1, parts[0] ?? 1)
        const today = new Date()
        const idade = Math.max(0, today.getFullYear() - birthDate.getFullYear() - (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate()) ? 1 : 0))
        return {
          id: patient.id,
          nome: patient.nome,
          idade,
          sexo: patient.sexo,
          condicao: admission?.motivo ?? "Aguardando avaliação",
          status: "estável",
          avatar: patient.nome.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase(),
          leito: bed?.numero ?? "—",
          ala: bed?.setor ?? bed?.tipo ?? "Setor a definir",
          risco: "low",
          prescricaoAtiva: false,
          medico: admission?.medico ?? "Equipe médica",
          entrada: admission?.dataEntrada ?? "Hoje",
        }
      })
    return [...synchronizedBase, ...additions]
  }, [hospitalizations, registeredBeds, registeredPatients])
  const monitorPatients = useMemo(() => pacientes.map((patient) => ({
    id: patient.id, name: patient.nome, bed: patient.leito, sector: patient.ala, condition: patient.condicao,
  })), [pacientes])
  const { readings: liveVitals } = useVitalFeed(monitorPatients.map((patient) => patient.id), token)
  const [activeTab, setActiveTab] = usePanelRoute("enfermagem", ["internados", "monitoramento", "prescricao", "administracao", "evolucao", "atividades", "alertas"] as const, "internados")
  const [selectedPaciente, setSelectedPaciente] =
    useState<typeof pacientes[0] | null>(pacientes[0])
  useEffect(() => {
    setSelectedPaciente((current) => current ? pacientes.find((patient) => patient.id === current.id) ?? pacientes[0] ?? null : null)
  }, [pacientes])
  const [alertasReconhecidos, setAlertasReconhecidos] = useLocalStorageState<string[]>(CLINICAL_ALERT_ACK_STORAGE_KEY, readLegacyClinicalAlertAcknowledgements)
  const [monitoringAlerts, setMonitoringAlerts] = useLocalStorageState<MonitoringAlert[]>("inteliHosp-enfermagem-monitoramento-alertas", [])
  const [monitoringAcknowledged, setMonitoringAcknowledged] = useLocalStorageState<string[]>("inteliHosp-monitoramento-reconhecidos", [])
  const monitoringPendingCount = monitoringAlerts.filter((alert) => !monitoringAcknowledged.includes(alert.key)).length
  const getPatientRisk = (patient: typeof pacientes[number]) => {
    const alerts = monitoringAlerts.filter((alert) => alert.patientId === patient.id)
    if (alerts.some((alert) => alert.severity === "Crítico")) return "high"
    if (alerts.some((alert) => alert.severity === "Moderado")) return patient.risco === "high" ? "high" : "medium"
    if (alerts.some((alert) => alert.severity === "Informativo")) return patient.risco === "low" ? "medium" : patient.risco
    return patient.risco
  }
  const [patientSearch, setPatientSearch] = useState("")
  const [administrados, setAdministrados] = useState<string[]>([])
  const [prescricoesCompartilhadas] = useLocalStorageState<SharedPrescription[]>(PRESCRIPTION_STORAGE_KEY, [])
  const [evolucaoTexto, setEvolucaoTexto] = useState("")
  const [evolucaoEnviada, setEvolucaoEnviada] = useState(false)
  // Listas resumidas no celular (central do plantão)
  const [listasExpandidas, setListasExpandidas] = useState<Record<string, boolean>>({})
  const alternarLista = (key: string) => setListasExpandidas((current) => ({ ...current, [key]: !current[key] }))

  const [evolucoesPorPaciente, setEvolucoesPorPaciente] =
    useLocalStorageState<ClinicalEvolutionMap>(CLINICAL_EVOLUTION_STORAGE_KEY, () => readLegacyClinicalEvolutions(registrosClinicosIniciais))
  useEffect(() => setEvolucoesPorPaciente((current) => mergeClinicalEvolutions(current, registrosClinicosIniciais)), [setEvolucoesPorPaciente])

  const prescricoesEquipe = useMemo(() => {
    const result: Record<string, PrescricaoItem[]> = Object.fromEntries(
      Object.entries(prescricoesPorPaciente).map(([patientId, items]) => [patientId, [...items]]),
    )
    for (const prescription of prescricoesCompartilhadas) {
      const item: PrescricaoItem = { ...prescription.item, status: "pendente" }
      result[prescription.pacienteId] = [item, ...(result[prescription.pacienteId] ?? [])]
    }
    for (const prescription of apiPrescriptions) {
      const item: PrescricaoItem = { ...prescription.item, status: "pendente" }
      result[prescription.pacienteId] = [item, ...(result[prescription.pacienteId] ?? [])]
    }
    return result
  }, [apiPrescriptions, prescricoesCompartilhadas])

  const agora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date())

  const alertas = clinicalAlertRecords
  const alertasAtivos = alertas.filter((alert) => pacientes.some((patient) => patient.id === alert.pacienteId))
  const alertasPendentes = alertasAtivos.filter((alert) => !alertasReconhecidos.includes(alert.id))

  const filteredPatients = useMemo(() => pacientes.filter((p) =>
    `${p.nome} ${p.id} ${p.condicao} ${p.leito}`
      .toLowerCase()
      .includes(patientSearch.toLowerCase()),
  ), [pacientes, patientSearch])
  useEffect(() => {
    setSelectedPaciente((current) => current && !filteredPatients.some((patient) => patient.id === current.id) ? null : current)
  }, [filteredPatients])

  const prescricaoAtual = useMemo(() => {
    if (!selectedPaciente) return []
    return [...(prescricoesEquipe[selectedPaciente.id] ?? [])].sort(
      (a, b) => a.horario.localeCompare(b.horario),
    )
  }, [prescricoesEquipe, selectedPaciente])

  const goToPatient = (id: string, tab: Tab = "prescricao") => {
    const patient = pacientes.find((p) => p.id === id)
    if (patient) {
      setSelectedPaciente(patient)
      setActiveTab(tab)
    }
  }

  const markAlertRecognized = (id: string) => {
    logActivity("Enfermagem", "Alerta reconhecido", "Alerta", id)
    setAlertasReconhecidos((current) =>
      current.includes(id) ? current : [...current, id],
    )
  }

  const markAllAlertasRecognized = () => {
    if (alertasPendentes.length) logActivity("Enfermagem", "Alertas reconhecidos", "Central de alertas", `${alertasPendentes.length} alertas`)
    setAlertasReconhecidos((current) => [...new Set([...current, ...alertasAtivos.map((alert) => alert.id)])])
  }

  const confirmarAdministracao = async (itemId: string) => {
    if (!selectedPaciente || administrados.includes(itemId)) return
    const item = prescricaoAtual.find((prescriptionItem) => prescriptionItem.id === itemId)
    if (!item) return
    try {
      const now = new Date()
      const dataHora = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
      await api.createMedicationAdministration({
        dataHora, dose: item.dosagem, via: item.via, observacao: null,
        itemPrescricaoId: Number(item.id), pacienteId: Number(selectedPaciente.id), administradoPor: userId,
      }, token)
      setAdministrados((current) => current.includes(itemId) ? current : [...current, itemId])
      logActivity("Enfermagem", "Administração registrada", "Medicação", itemId)
    } catch (error) {
      setDataError(error instanceof ApiError ? error.message : "Não foi possível registrar a administração.")
    }
  }

  const enviarEvolucao = () => {
    if (!evolucaoTexto.trim() || !selectedPaciente) return

    const now = new Date()
    const novaEvolucao = {
      data: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(now),
      descricao: evolucaoTexto.trim(),
      perfil: "Enfermagem" as const,
      profissional: userName,
    }

    setEvolucoesPorPaciente((current) => ({
      ...current,
      [selectedPaciente.id]: [
        novaEvolucao,
        ...(current[selectedPaciente.id] ?? []),
      ],
    }))
    logActivity("Enfermagem", "Evolução registrada", "Prontuário demonstrativo", selectedPaciente.id)

    setEvolucaoEnviada(true)
    setEvolucaoTexto("")
    setTimeout(() => setEvolucaoEnviada(false), 2500)
  }

  // Navegação agrupada por assunto
  const tabs: { key: Tab; label: string; group: string }[] = [
    { key: "internados", label: "Pacientes Internados", group: "Plantão" },
    { key: "monitoramento", label: "Monitoramento", group: "Plantão" },
    { key: "alertas", label: "Alertas", group: "Plantão" },
    { key: "prescricao", label: "Prescrições", group: "Cuidados" },
    { key: "administracao", label: "Administração", group: "Cuidados" },
    { key: "evolucao", label: "Evolução Clínica", group: "Cuidados" },
    { key: "atividades", label: "Registro de Atividades", group: "Registros" },
  ]
  const activeTabInfo = tabs.find((tab) => tab.key === activeTab)

  // ---- Apresentação (somente leitura dos dados já calculados acima) ----
  const riskTone = (risk: string): Tone => (risk === "high" ? "danger" : risk === "medium" ? "warning" : "success")
  const riskLabel = (risk: string) => riskColor[risk as keyof typeof riskColor]?.label ?? "Estável"
  const riskIcon = (risk: string) => (risk === "high" ? "alert" : risk === "medium" ? "info" : "checkCircle")
  const latestVitalsFor = (id: string) =>
    evolucoesPorPaciente[id]?.find((entry) => entry.fc !== undefined || entry.spo2 !== undefined || entry.pressao !== undefined)
  const pendingFor = (id: string) => (prescricoesEquipe[id] ?? []).filter((item) => item.status !== "administrado" && !administrados.includes(item.id))
  const doseStatus = (item: PrescricaoItem) => {
    const status = administrados.includes(item.id) ? "administrado" : item.status
    const tone: Tone = status === "administrado" ? "success" : status === "atrasado" ? "danger" : "info"
    const icon = status === "administrado" ? "check" : status === "atrasado" ? "alert" : "clock"
    return { status, tone, icon, label: statusPrescricaoColor[status].label }
  }
  const minutesNow = new Date().getHours() * 60 + new Date().getMinutes()
  const minutesOf = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    return (hours || 0) * 60 + (minutes || 0)
  }
  /** Distância informativa até o horário previsto (não altera o status registrado). */
  const timeHint = (time: string) => {
    const diff = minutesOf(time) - minutesNow
    if (Math.abs(diff) < 1) return "agora"
    const abs = Math.abs(diff)
    const text = abs >= 60 ? `${Math.floor(abs / 60)}h${abs % 60 ? String(abs % 60).padStart(2, "0") : ""}` : `${abs} min`
    return diff > 0 ? `em ${text}` : `há ${text}`
  }
  const isSoon = (time: string) => {
    const diff = minutesOf(time) - minutesNow
    return diff >= 0 && diff <= 60
  }
  const dosesPendentes = pacientes
    .flatMap((patient) => pendingFor(patient.id).map((item) => ({ item, patient })))
    .sort((a, b) => a.item.horario.localeCompare(b.item.horario))
  const dosesProximas = dosesPendentes.filter((dose) => isSoon(dose.item.horario))
  const dosesAtrasadas = dosesPendentes.filter((dose) => doseStatus(dose.item).status === "atrasado")
  const dosesPrioritarias = [
    ...dosesAtrasadas,
    ...dosesProximas.filter((dose) => doseStatus(dose.item).status !== "atrasado"),
    ...dosesPendentes.filter((dose) => doseStatus(dose.item).status !== "atrasado" && !isSoon(dose.item.horario)),
  ]
  // No celular as atrasadas nunca ficam escondidas
  const limiteDosesCelular = Math.max(summaryLimit(Math.min(7, dosesPrioritarias.length), 4), dosesAtrasadas.length)
  const limitePacientesCelular = summaryLimit(filteredPatients.length, 3)
  const totalDoses = pacientes.reduce((total, patient) => total + (prescricoesEquipe[patient.id] ?? []).length, 0)
  const dosesConfirmadas = totalDoses - dosesPendentes.length
  const hojeCurto = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date())
  const evoluiuHoje = (id: string) =>
    (evolucoesPorPaciente[id] ?? []).some((entry) => entry.perfil === "Enfermagem" && (entry.data.startsWith("Hoje") || entry.data.startsWith(hojeCurto)))
  const evolucoesPendentes = pacientes.filter((patient) => !evoluiuHoje(patient.id))
  const pacientesRisco = pacientes.filter((patient) => getPatientRisk(patient) !== "low").sort((a, b) => (getPatientRisk(a) === "high" ? -1 : 0) - (getPatientRisk(b) === "high" ? -1 : 0))
  const selectPatient = (patient: (typeof pacientes)[number]) => {
    setSelectedPaciente(patient)
    setEvolucaoTexto("")
    setEvolucaoEnviada(false)
  }
  const inputStyle = { background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }

  /** Lista lateral de pacientes reutilizada nas telas de cuidado. */
  const renderPatientPicker = (list: typeof pacientes, title: string, detail: (patient: (typeof pacientes)[number]) => string) => (
    <SectionCard title={title} description={`${list.length} paciente${list.length === 1 ? "" : "s"}`} icon="internados" bodyClassName="p-3">
      <div className="relative mb-3">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }}><UiIcon name="search" size={16} /></span>
        <input value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} placeholder="Buscar por nome ou leito" aria-label="Buscar paciente" className="h-11 w-full rounded-xl border pl-9 pr-3 text-sm outline-none" style={inputStyle} />
      </div>
      <ul className="space-y-1.5">
        {list.map((p) => {
          const active = selectedPaciente?.id === p.id
          const pending = pendingFor(p.id).length
          return (
            <li key={p.id}>
              <button type="button" onClick={() => selectPatient(p)} aria-pressed={active} className="list-row flex w-full items-center gap-3 rounded-xl border p-2.5 text-left" style={{ background: active ? "var(--role-soft)" : "var(--card)", borderColor: active ? "var(--role)" : "var(--border)" }}>
                <Avatar initials={p.avatar} tone={riskTone(getPatientRisk(p))} />
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-semibold" style={{ color: "var(--foreground)" }}>{p.nome}</span>
                  <span className="block break-words text-xs" style={{ color: "var(--muted-foreground)" }}>{detail(p)}</span>
                </span>
                {pending > 0 && <span className="rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums" style={{ background: "var(--warning-surface)", color: "var(--warning-foreground)" }} aria-label={`${pending} doses pendentes`}>{pending}</span>}
              </button>
            </li>
          )
        })}
      </ul>
      {list.length === 0 && <EmptyState icon="search" title="Nenhum paciente encontrado" />}
    </SectionCard>
  )

  return (
    <div className="role-enfermagem min-h-screen" style={{ background: "var(--background)" }}>
      <AlertNotifications alerts={monitoringAlerts} profile="Enfermagem" onOpenAlerts={() => setActiveTab("alertas")} />
      <DashboardSidebar
        role="Enfermagem"
        initials={userName.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
        name={userName}
        detail={ENFERMEIRA.cargo}
        tabs={tabs}
        activeTab={activeTab}
        onSelect={(key) => setActiveTab(key as Tab)}
        onLogout={() => onNavigate("login")}
        alertCount={alertasPendentes.length + monitoringPendingCount}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
      <div className="min-w-0 xl:ml-64">
        <DashboardHeader
          role="Enfermagem"
          section={activeTabInfo?.label ?? ""}
          name={userName}
          detail={ENFERMEIRA.cargo}
          initials={userName.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
          theme={theme}
          onToggleTheme={onToggleTheme}
          alertCount={alertasPendentes.length + monitoringPendingCount}
          onOpenAlerts={() => setActiveTab("alertas")}
        />

        <SectionContext.Provider value={{ key: activeTab, label: activeTabInfo?.label ?? "", group: activeTabInfo?.group, role: "Enfermagem" }}>
        <main className="dashboard-main mx-auto w-full min-w-0 max-w-[1400px] flex-1 px-4 pb-36 pt-20 sm:px-6 sm:pb-24 xl:p-8">
          {dataLoading && <p role="status" className="mb-4 rounded-xl border px-4 py-3 text-sm" style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--muted-foreground)" }}>Carregando dados da API…</p>}
          {dataError && <p role="alert" className="mb-4 rounded-xl border px-4 py-3 text-sm" style={{ background: "var(--danger-surface)", borderColor: "var(--border)", color: "var(--danger-foreground)" }}>{dataError}</p>}
          <div className={activeTab === "monitoramento" ? "block" : "hidden"} aria-hidden={activeTab !== "monitoramento"}>
            <VitalMonitoring
              profile="Enfermagem"
              storageKey="inteliHosp-monitoramento"
              onAlertsChange={setMonitoringAlerts}
              acknowledgedAlerts={monitoringAcknowledged}
              setAcknowledgedAlerts={setMonitoringAcknowledged}
              patients={monitorPatients}
              liveVitals={liveVitals}
            />
          </div>
          {/* ============ INTERNADOS ============ */}
          {activeTab === "internados" && (
            <div className="fade-in">
              <HeroHeader
                eyebrow={`Central do plantão · ${shiftLabel()}`}
                title={`${greeting()}, ${userName.split(" ")[0]}`}
                subtitle={`${formatLongLocalDate()} · ${ENFERMEIRA.cargo}`}
                aside={
                  <div className="hero-actions grid grid-cols-3 gap-2 lg:flex lg:flex-wrap">
                    <QuickAction variant="hero" icon="administracao" label="Administrar medicação" onClick={() => setActiveTab("administracao")} />
                    <QuickAction variant="hero" icon="evolucao" label="Registrar evolução" onClick={() => setActiveTab("evolucao")} />
                    <QuickAction variant="hero" icon="monitoramento" label="Monitoramento" onClick={() => setActiveTab("monitoramento")} />
                  </div>
                }
              >
                <div className="keep-2-cols grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                  <HeroStat label="Pacientes sob cuidado" value={pacientes.length} hint={`${pacientes.filter((p) => p.prescricaoAtiva).length} com prescrição ativa`} />
                  <HeroStat label="Medicações pendentes" value={dosesPendentes.length} hint={`${dosesConfirmadas} de ${totalDoses} confirmadas`} />
                  <HeroStat label="Próxima hora" value={dosesProximas.length} hint="Doses previstas em até 60 min" />
                  <HeroStat label="Alertas pendentes" value={alertasPendentes.length + monitoringPendingCount} hint="Clínicos e monitoramento" alert={alertasPendentes.length + monitoringPendingCount > 0} />
                </div>
              </HeroHeader>

              <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
                <SectionCard
                  className="lg:col-span-2"
                  title="Medicações do plantão"
                  description="Doses pendentes em ordem de horário"
                  icon="administracao"
                  action={<button type="button" onClick={() => setActiveTab("administracao")} className="min-h-9 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--secondary)", color: "var(--primary)" }}>Abrir administração</button>}
                  bodyClassName="p-2 sm:p-3"
                >
                  {dosesPendentes.length ? (
                    <ul className="space-y-1" id="lista-doses-plantao">
                      {dosesPrioritarias.slice(0, 7).map(({ item, patient }, index) => {
                        const status = doseStatus(item)
                        const soon = isSoon(item.horario)
                        return (
                          <li key={item.id} className={index >= limiteDosesCelular && !listasExpandidas.doses ? "max-sm:hidden" : undefined}>
                            <button type="button" onClick={() => goToPatient(patient.id, "administracao")} className="list-row grid w-full grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-transparent p-2.5 text-left">
                              <span className="text-center">
                                <span className="block font-mono text-base font-semibold tabular-nums" style={{ color: "var(--role-strong)" }}>{item.horario}</span>
                                <span className="block text-[11px]" style={{ color: soon ? "var(--warning-foreground)" : "var(--muted-foreground)" }}>{timeHint(item.horario)}</span>
                              </span>
                              <span className="min-w-0">
                                <span className="flex items-start gap-1.5 break-words text-sm font-semibold" style={{ color: "var(--foreground)" }}><UiIcon name="pill" size={14} className="mt-0.5 shrink-0" />{item.medicamento} · {item.dosagem}</span>
                                <span className="block break-words text-xs" style={{ color: "var(--muted-foreground)" }}>{patient.nome} · Leito {patient.leito} · Via {item.via}</span>
                              </span>
                              <StatusBadge tone={soon && status.status !== "atrasado" ? "warning" : status.tone} icon={status.icon} size="sm">{soon && status.status !== "atrasado" ? "Próxima" : status.label}</StatusBadge>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <EmptyState icon="checkCircle" title="Todas as medicações foram confirmadas" description="Nenhuma dose pendente para os pacientes sob cuidado." />
                  )}
                  <ShowMoreButton expanded={!!listasExpandidas.doses} onToggle={() => alternarLista("doses")} hiddenCount={Math.min(7, dosesPrioritarias.length) - limiteDosesCelular} controls="lista-doses-plantao" label={["dose", "doses"]} />
                  {dosesPendentes.length > 7 && <p className="px-2.5 pt-2 text-xs" style={{ color: "var(--muted-foreground)" }}>+ {dosesPendentes.length - 7} dose(s) na tela de administração</p>}
                </SectionCard>

                <div className="flex flex-col gap-5">
                  <SectionCard title="Maior risco" description="Prioridade de atenção" icon="alert" tone={pacientesRisco.length ? "danger" : "success"} bodyClassName="p-3">
                    {pacientesRisco.length ? (
                      <ul className="space-y-1.5">
                        {pacientesRisco.map((patient) => (
                          <li key={patient.id}>
                            <button type="button" onClick={() => goToPatient(patient.id, "prescricao")} className="list-row flex w-full items-center gap-3 rounded-xl border p-2.5 text-left" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                              <Avatar initials={patient.avatar} size="sm" tone={riskTone(getPatientRisk(patient))} />
                              <span className="min-w-0 flex-1">
                                <span className="block break-words text-sm font-semibold" style={{ color: "var(--foreground)" }}>{patient.nome}</span>
                                <span className="block break-words text-xs" style={{ color: "var(--muted-foreground)" }}>Leito {patient.leito} · {patient.condicao}</span>
                              </span>
                              <StatusBadge tone={riskTone(getPatientRisk(patient))} size="sm">{riskLabel(getPatientRisk(patient))}</StatusBadge>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <EmptyState icon="checkCircle" title="Nenhum paciente em risco" />
                    )}
                  </SectionCard>

                  <SectionCard title="Resumo do plantão" icon="checkCircle" tone="success">
                    <div className="space-y-4">
                      <div>
                        <div className="mb-1.5 flex justify-between text-xs"><span style={{ color: "var(--muted-foreground)" }}>Administrações confirmadas</span><strong className="tabular-nums" style={{ color: "var(--foreground)" }}>{dosesConfirmadas}/{totalDoses}</strong></div>
                        <ProgressBar value={totalDoses ? (dosesConfirmadas / totalDoses) * 100 : 0} tone="success" label="Administrações confirmadas" />
                      </div>
                      <div>
                        <div className="mb-1.5 flex justify-between text-xs"><span style={{ color: "var(--muted-foreground)" }}>Evoluções registradas hoje</span><strong className="tabular-nums" style={{ color: "var(--foreground)" }}>{pacientes.length - evolucoesPendentes.length}/{pacientes.length}</strong></div>
                        <ProgressBar value={pacientes.length ? ((pacientes.length - evolucoesPendentes.length) / pacientes.length) * 100 : 0} tone="role" label="Evoluções registradas hoje" />
                      </div>
                      {evolucoesPendentes.length > 0 && (
                        <div className="rounded-xl border p-3" style={{ background: "var(--background)", borderColor: "var(--border)" }}>
                          <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>Evoluções pendentes</p>
                          <ul className="mt-1.5 space-y-1">
                            {evolucoesPendentes.slice(0, 4).map((patient) => (
                              <li key={patient.id}>
                                <button type="button" onClick={() => { selectPatient(patient); setActiveTab("evolucao") }} className="flex min-h-8 w-full items-center justify-between gap-2 text-left text-xs" style={{ color: "var(--muted-foreground)" }}>
                                  <span className="break-words">{patient.nome} · {patient.leito}</span>
                                  <span className="shrink-0 font-semibold" style={{ color: "var(--primary)" }}>Evoluir</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </SectionCard>

                </div>
              </div>

              <SectionCard
                title="Pacientes sob cuidado"
                description="Leito, condição, prescrição e últimos sinais vitais"
                icon="internados"
                action={
                  <div className="relative hidden sm:block">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }}><UiIcon name="search" size={15} /></span>
                    <input value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} placeholder="Buscar nome, leito ou condição" aria-label="Buscar paciente internado" className="h-10 w-64 rounded-lg border pl-9 pr-3 text-sm outline-none" style={inputStyle} />
                  </div>
                }
              >
                <div className="relative mb-4 sm:hidden">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }}><UiIcon name="search" size={15} /></span>
                  <input value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} placeholder="Buscar nome, leito ou condição" aria-label="Buscar paciente internado" className="h-11 w-full rounded-lg border pl-9 pr-3 text-sm outline-none" style={inputStyle} />
                </div>
                {filteredPatients.length === 0 && <EmptyState icon="search" title="Nenhum paciente encontrado" description="Ajuste o termo de busca." />}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" id="lista-pacientes-plantao">
                  {filteredPatients.map((p, index) => {
                    const risk = getPatientRisk(p)
                    const vitals = latestVitalsFor(p.id)
                    const pending = pendingFor(p.id).length
                    return (
                      <article key={p.id} className={"flex min-w-0 flex-col overflow-hidden rounded-xl border" + (index >= limitePacientesCelular && !listasExpandidas.pacientes && !patientSearch.trim() ? " max-sm:hidden" : "")} style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                        <div className="flex items-start gap-3 p-4">
                          <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl" style={{ background: "var(--role-soft)", color: "var(--role-strong)" }}>
                            <span className="text-[10px] font-semibold uppercase leading-none">Leito</span>
                            <span className="text-sm font-bold leading-tight">{p.leito}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="break-words text-sm font-semibold" style={{ color: "var(--foreground)" }}>{p.nome}</h3>
                              <StatusBadge tone={riskTone(risk)} icon={riskIcon(risk)} size="sm">{riskLabel(risk)}</StatusBadge>
                            </div>
                            <p className="break-words text-xs" style={{ color: "var(--muted-foreground)" }}>{p.ala} · {p.idade} anos</p>
                            <p className="mt-1 line-clamp-2 text-xs" style={{ color: "var(--foreground)" }}>{p.condicao}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 px-4">
                          {p.prescricaoAtiva ? <StatusBadge tone="info" icon="prescricao" size="sm">Prescrição ativa</StatusBadge> : <StatusBadge tone="neutral" size="sm">Sem prescrição ativa</StatusBadge>}
                          {pending > 0 ? <StatusBadge tone="warning" icon="clock" size="sm">{pending} dose{pending === 1 ? "" : "s"} pendente{pending === 1 ? "" : "s"}</StatusBadge> : p.prescricaoAtiva && <StatusBadge tone="success" icon="check" size="sm">Doses em dia</StatusBadge>}
                        </div>
                        {vitals && (
                          <div className="keep-2-cols mt-3 grid grid-cols-2 gap-1 border-y px-2 py-2.5 text-center tabular-nums min-[390px]:grid-cols-4" style={{ borderColor: "var(--border)" }}>
                            {[
                              { label: "PA", value: vitals.pressao ?? "—", alert: false },
                              { label: "FC", value: vitals.fc ?? "—", alert: vitals.fc !== undefined && vitals.fc > 100 },
                              { label: "Temp", value: vitals.temp ?? "—", alert: vitals.temp !== undefined && vitals.temp >= 38 },
                              { label: "SpO₂", value: vitals.spo2 !== undefined ? vitals.spo2 + "%" : "—", alert: vitals.spo2 !== undefined && vitals.spo2 < 94 },
                            ].map((v) => (
                              <div key={v.label} className="min-w-0">
                                <p className="truncate text-sm font-bold" style={{ color: v.alert ? "var(--danger-foreground)" : "var(--foreground)" }}>{v.value}</p>
                                <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>{v.label}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="mt-auto flex items-center justify-between gap-2 p-3 pt-3">
                          <span className="min-w-0 break-words text-xs" style={{ color: "var(--muted-foreground)" }}>{p.medico} · desde {p.entrada}</span>
                          <div className="flex shrink-0 gap-1.5">
                            <button type="button" onClick={() => goToPatient(p.id, "prescricao")} className="min-h-9 rounded-lg px-2.5 text-xs font-semibold" style={{ background: "var(--secondary)", color: "var(--primary)" }}>Prescrição</button>
                            <button type="button" onClick={() => { goToPatient(p.id, "evolucao"); setEvolucaoTexto(""); setEvolucaoEnviada(false) }} className="min-h-9 rounded-lg px-2.5 text-xs font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Evoluir</button>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
                {!patientSearch.trim() && <ShowMoreButton expanded={!!listasExpandidas.pacientes} onToggle={() => alternarLista("pacientes")} hiddenCount={filteredPatients.length - limitePacientesCelular} controls="lista-pacientes-plantao" label={["paciente", "pacientes"]} />}
              </SectionCard>
            </div>
          )}

          {/* ============ PRESCRIÇÃO DETALHE ============ */}
          {activeTab === "prescricao" && (
            <div className="fade-in">
              <PageTitle
                title="Prescrições"
                subtitle="Medicamentos, doses, vias e cronograma de administração por paciente"
                meta={
                  <>
                    <MetaItem icon="prescricao" label="Com prescrição ativa" value={pacientes.filter((p) => p.prescricaoAtiva).length} tone="info" />
                    <MetaItem icon="clock" label="Doses pendentes" value={dosesPendentes.length} tone="warning" />
                    <MetaItem icon="checkCircle" label="Confirmadas" value={dosesConfirmadas} tone="success" />
                  </>
                }
              />
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
                {renderPatientPicker(filteredPatients, "Pacientes", (p) => `Leito ${p.leito} · ${p.condicao}`)}
                {selectedPaciente ? (
                  <section className="min-w-0 overflow-hidden rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }} aria-label={`Prescrição de ${selectedPaciente.nome}`}>
                    <header className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center" style={{ background: "linear-gradient(120deg, var(--role-soft), var(--card) 70%)" }}>
                      <Avatar initials={selectedPaciente.avatar} size="lg" tone={riskTone(getPatientRisk(selectedPaciente))} solid />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{selectedPaciente.nome}</h2>
                          {selectedPaciente.prescricaoAtiva ? <StatusBadge tone="info" icon="prescricao" size="sm">Prescrição ativa</StatusBadge> : <StatusBadge tone="neutral" size="sm">Sem prescrição ativa</StatusBadge>}
                        </div>
                        <p className="mt-0.5 text-sm" style={{ color: "var(--muted-foreground)" }}>Leito {selectedPaciente.leito} · {selectedPaciente.ala} · {selectedPaciente.condicao}</p>
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Prescritor: {selectedPaciente.medico}</p>
                      </div>
                      <button type="button" onClick={() => setActiveTab("administracao")} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                        <UiIcon name="administracao" size={15} /> Ir para administração
                      </button>
                    </header>
                    <div className="border-t p-5" style={{ borderColor: "var(--border)" }}>
                      <p className="mb-4 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>Cronograma de administração</p>
                      {prescricaoAtual.length ? (
                        <ol>
                          {prescricaoAtual.map((item, index) => {
                            const status = doseStatus(item)
                            return (
                              <TimelineItem
                                key={item.id}
                                last={index === prescricaoAtual.length - 1}
                                tone={status.tone}
                                title={<span className="flex items-center gap-2"><span className="font-mono tabular-nums" style={{ color: "var(--role-strong)" }}>{item.horario}</span>{item.medicamento}</span>}
                                meta={<StatusBadge tone={status.tone} icon={status.icon} size="sm">{status.label}</StatusBadge>}
                              >
                                <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                                  <span>Dose <strong style={{ color: "var(--foreground)" }}>{item.dosagem}</strong></span>
                                  <span>Via <strong style={{ color: "var(--foreground)" }}>{item.via}</strong></span>
                                  {status.status !== "administrado" && <span>{timeHint(item.horario)}</span>}
                                </span>
                              </TimelineItem>
                            )
                          })}
                        </ol>
                      ) : (
                        <EmptyState icon="prescricao" title="Nenhum medicamento prescrito" description="Quando o médico prescrever, os itens aparecerão aqui." />
                      )}
                    </div>
                  </section>
                ) : (
                  <EmptyState icon="prescricao" title="Selecione um paciente" description="Escolha um paciente na lista para ver a prescrição." />
                )}
              </div>
            </div>
          )}

          {/* ============ ADMINISTRAÇÃO ============ */}
          {activeTab === "administracao" && (
            <div className="fade-in">
              <PageTitle
                title="Administração de medicamentos"
                subtitle="Confirme cada dose após a checagem · horário e profissional são registrados automaticamente"
                meta={
                  <>
                    <MetaItem icon="clock" label="Agora" value={agora} tone="info" />
                    <MetaItem icon="user" label="Profissional" value={userName} tone="neutral" />
                    <MetaItem icon="administracao" label="Pendentes no plantão" value={dosesPendentes.length} tone="warning" />
                  </>
                }
              />
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
                {renderPatientPicker(pacientes.filter((p) => p.prescricaoAtiva && filteredPatients.some((item) => item.id === p.id)), "Com prescrição ativa", (p) => `Leito ${p.leito} · ${pendingFor(p.id).length} pendente(s)`)}
                {selectedPaciente ? (
                  <div className="flex min-w-0 flex-col gap-4">
                    <div className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
                      <Avatar initials={selectedPaciente.avatar} size="lg" tone={riskTone(getPatientRisk(selectedPaciente))} solid />
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{selectedPaciente.nome}</p>
                        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Leito {selectedPaciente.leito} · {selectedPaciente.ala} · {selectedPaciente.idade} anos</p>
                      </div>
                      <div className="min-w-[10rem]">
                        <div className="mb-1.5 flex justify-between text-xs" style={{ color: "var(--muted-foreground)" }}>
                          <span>Doses confirmadas</span>
                          <strong className="tabular-nums" style={{ color: "var(--foreground)" }}>{prescricaoAtual.length - pendingFor(selectedPaciente.id).length}/{prescricaoAtual.length}</strong>
                        </div>
                        <ProgressBar value={prescricaoAtual.length ? ((prescricaoAtual.length - pendingFor(selectedPaciente.id).length) / prescricaoAtual.length) * 100 : 0} tone="success" label="Doses confirmadas" />
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-xl border p-3.5 text-sm" style={{ background: "var(--warning-surface)", borderColor: toneStyles.warning.border, color: "var(--warning-foreground)" }} role="note">
                      <UiIcon name="shield" size={18} />
                      <p><strong>Antes de confirmar:</strong> confira paciente, medicamento, dose, via e horário. Registro demonstrativo — não substitui a checagem à beira do leito.</p>
                    </div>

                    {prescricaoAtual.length === 0 && <EmptyState icon="administracao" title="Sem medicamentos para este paciente" />}
                    <ul className="flex flex-col gap-3">
                      {prescricaoAtual.map((item) => {
                        const status = doseStatus(item)
                        const adm = status.status === "administrado"
                        const soon = !adm && isSoon(item.horario)
                        return (
                          <li key={item.id} className="relative overflow-hidden rounded-2xl border" style={{ background: adm ? "color-mix(in srgb, var(--success-surface) 45%, var(--card))" : "var(--card)", borderColor: soon ? toneStyles.warning.border : status.status === "atrasado" ? toneStyles.danger.border : "var(--border)", boxShadow: adm ? "none" : "var(--shadow-sm)" }}>
                            <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: soon ? "var(--warning)" : toneStyles[status.tone].solid }} aria-hidden="true" />
                            <div className="flex flex-col gap-4 p-4 pl-6 sm:flex-row sm:items-center">
                              <div className="flex items-center gap-4 sm:w-28 sm:flex-col sm:items-start sm:gap-0">
                                <p className="font-mono text-2xl font-bold leading-none tabular-nums" style={{ color: adm ? "var(--muted-foreground)" : "var(--foreground)" }}>{item.horario}</p>
                                {!adm && <p className="text-xs font-medium sm:mt-1" style={{ color: soon ? "var(--warning-foreground)" : "var(--muted-foreground)" }}>{timeHint(item.horario)}</p>}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-base font-semibold" style={{ color: "var(--foreground)" }}>{item.medicamento}</p>
                                  <StatusBadge tone={status.tone} icon={status.icon} size="sm">{status.label}</StatusBadge>
                                  {soon && <StatusBadge tone="warning" icon="clock" size="sm">Próximo horário</StatusBadge>}
                                </div>
                                <dl className="mt-2 flex flex-wrap gap-2 text-xs">
                                  <div className="rounded-lg border px-2.5 py-1" style={{ borderColor: "var(--border)" }}><dt className="inline" style={{ color: "var(--muted-foreground)" }}>Dose </dt><dd className="inline font-semibold" style={{ color: "var(--foreground)" }}>{item.dosagem}</dd></div>
                                  <div className="rounded-lg border px-2.5 py-1" style={{ borderColor: "var(--border)" }}><dt className="inline" style={{ color: "var(--muted-foreground)" }}>Via </dt><dd className="inline font-semibold" style={{ color: "var(--foreground)" }}>{item.via}</dd></div>
                                  <div className="rounded-lg border px-2.5 py-1" style={{ borderColor: "var(--border)" }}><dt className="inline" style={{ color: "var(--muted-foreground)" }}>Código </dt><dd className="inline font-mono" style={{ color: "var(--foreground)" }}>{item.id}</dd></div>
                                </dl>
                              </div>
                              {adm ? (
                                <p className="flex items-center gap-2 text-xs font-semibold sm:max-w-[12rem]" style={{ color: "var(--success-foreground)" }}>
                                  <UiIcon name="checkCircle" size={18} /> Administração registrada · {userName}
                                </p>
                              ) : (
                                <button type="button" onClick={() => confirmarAdministracao(item.id)} aria-label={`Confirmar administração de ${item.medicamento} ${item.dosagem} às ${item.horario}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                                  <UiIcon name="check" size={16} /> Confirmar
                                </button>
                              )}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ) : (
                  <EmptyState icon="administracao" title="Selecione um paciente" description="Escolha um paciente com prescrição ativa para registrar a administração." />
                )}
              </div>
            </div>
          )}

          {/* ============ EVOLUÇÃO / OBSERVAÇÃO ============ */}
          {activeTab === "evolucao" && (
            <div className="fade-in">
              <PageTitle
                title="Evolução e observação clínica"
                subtitle="Registro de enfermagem enviado diretamente ao médico responsável"
                meta={
                  <>
                    <MetaItem icon="evolucao" label="Evoluídos hoje" value={`${pacientes.length - evolucoesPendentes.length}/${pacientes.length}`} tone="success" />
                    <MetaItem icon="clock" label="Pendentes" value={evolucoesPendentes.length} tone="warning" />
                  </>
                }
              />
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
                {renderPatientPicker(filteredPatients, "Pacientes", (p) => `Leito ${p.leito} · ${evoluiuHoje(p.id) ? "evoluído hoje" : "evolução pendente"}`)}
                {selectedPaciente ? (
                  <div className="flex min-w-0 flex-col gap-5">
                    <section className="overflow-hidden rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }} aria-label="Paciente selecionado">
                      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center" style={{ background: "linear-gradient(120deg, var(--role-soft), var(--card) 70%)" }}>
                        <Avatar initials={selectedPaciente.avatar} size="lg" tone={riskTone(getPatientRisk(selectedPaciente))} solid />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{selectedPaciente.nome}</h2>
                            <StatusBadge tone={riskTone(getPatientRisk(selectedPaciente))} icon={riskIcon(getPatientRisk(selectedPaciente))} size="sm">{riskLabel(getPatientRisk(selectedPaciente))}</StatusBadge>
                          </div>
                          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Leito {selectedPaciente.leito} · {selectedPaciente.ala} · {selectedPaciente.idade} anos · {selectedPaciente.condicao}</p>
                          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Médico responsável: {selectedPaciente.medico}</p>
                        </div>
                      </div>
                      {latestVitalsFor(selectedPaciente.id) && (
                        <div className="grid grid-cols-2 gap-2 border-t p-4 sm:grid-cols-4" style={{ borderColor: "var(--border)" }}>
                          <VitalTile icon="gauge" label="PA" value={latestVitalsFor(selectedPaciente.id)?.pressao ?? "—"} unit="mmHg" />
                          <VitalTile icon="heart" label="FC" value={latestVitalsFor(selectedPaciente.id)?.fc ?? "—"} unit="bpm" alert={(latestVitalsFor(selectedPaciente.id)?.fc ?? 0) > 100} />
                          <VitalTile icon="thermometer" label="Temp." value={latestVitalsFor(selectedPaciente.id)?.temp ?? "—"} unit="°C" alert={(latestVitalsFor(selectedPaciente.id)?.temp ?? 0) >= 38} />
                          <VitalTile icon="droplet" label="SpO₂" value={latestVitalsFor(selectedPaciente.id)?.spo2 ?? "—"} unit="%" alert={(latestVitalsFor(selectedPaciente.id)?.spo2 ?? 100) < 94} />
                        </div>
                      )}
                    </section>

                    <SectionCard title="Nova observação" description={`Para: ${selectedPaciente.medico}`} icon="send" action={<span className="font-mono text-xs" style={{ color: "var(--muted-foreground)" }}>{agora}</span>}>
                      <label htmlFor="evolucao-texto" className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--foreground)" }}>Descrição da evolução</label>
                      <textarea
                        id="evolucao-texto"
                        value={evolucaoTexto}
                        onChange={(e) => setEvolucaoTexto(e.target.value)}
                        rows={6}
                        placeholder="Descreva a evolução clínica, queixas, intercorrências, sinais vitais ou observações relevantes..."
                        className="w-full resize-y rounded-xl border p-3 text-sm outline-none"
                        style={inputStyle}
                      />
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{evolucaoTexto.trim().length} caracteres · {userName}</span>
                        <div className="flex flex-wrap items-center gap-2">
                          {evolucaoEnviada && (
                            <span role="status" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--success-surface)", color: "var(--success-foreground)" }}>
                              <UiIcon name="checkCircle" size={15} /> Enviado ao médico
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={enviarEvolucao}
                            disabled={!evolucaoTexto.trim()}
                            className="inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold"
                            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                          >
                            <UiIcon name="send" size={15} /> Enviar evolução
                          </button>
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard title="Registros anteriores" description={`${(evolucoesPorPaciente[selectedPaciente.id] ?? []).length} registro(s)`} icon="atividades">
                      {(evolucoesPorPaciente[selectedPaciente.id] ?? []).length ? (
                        <ol>
                          {(evolucoesPorPaciente[selectedPaciente.id] ?? []).map((rc, i, list) => (
                            <TimelineItem
                              key={i}
                              last={i === list.length - 1}
                              tone={rc.perfil === "Médico" ? "primary" : "role"}
                              title={rc.perfil === "Médico" ? "Evolução médica" : "Evolução de enfermagem"}
                              meta={rc.data}
                            >
                              <p style={{ color: "var(--foreground)" }}>{rc.descricao}</p>
                              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                                <span>{rc.profissional ?? userName}</span>
                                {rc.perfil !== "Médico" && <StatusBadge tone="success" icon="check" size="sm">Enviado ao médico</StatusBadge>}
                              </p>
                            </TimelineItem>
                          ))}
                        </ol>
                      ) : (
                        <EmptyState icon="evolucao" title="Nenhum registro ainda" />
                      )}
                    </SectionCard>
                  </div>
                ) : (
                  <EmptyState icon="evolucao" title="Selecione um paciente" description="Escolha um paciente para registrar a evolução de enfermagem." />
                )}
              </div>
            </div>
          )}

          {activeTab === "atividades" && <ActivityLog />}

          {activeTab === "alertas" && (
            <div className="fade-in">
              <PageTitle
                title="Central de alertas"
                subtitle={`${alertasPendentes.length + monitoringPendingCount} alerta${alertasPendentes.length + monitoringPendingCount === 1 ? "" : "s"} pendente${alertasPendentes.length + monitoringPendingCount === 1 ? "" : "s"} de atendimento`}
                action={
                  alertasPendentes.length > 0 ? (
                    <button type="button" onClick={markAllAlertasRecognized} className="inline-flex h-11 items-center gap-1.5 rounded-xl border px-4 text-sm font-semibold" style={{ background: "var(--card)", color: "var(--primary)", borderColor: "var(--border)" }}>
                      <UiIcon name="check" size={16} /> Reconhecer todos os alertas
                    </button>
                  ) : undefined
                }
                meta={
                  <>
                    <MetaItem icon="alert" label="Críticos" value={alertasPendentes.filter((alert) => alert.severity === "high").length} tone="danger" />
                    <MetaItem icon="info" label="Atenção" value={alertasPendentes.filter((alert) => alert.severity === "medium").length} tone="warning" />
                    <MetaItem icon="monitoramento" label="Monitoramento" value={monitoringPendingCount} tone="info" />
                  </>
                }
              />

              <MonitoringAlertsPanel
                alerts={monitoringAlerts}
                profile="Enfermagem"
                acknowledgedKeys={monitoringAcknowledged}
                setAcknowledgedKeys={setMonitoringAcknowledged}
                onOpenMonitoring={() => setActiveTab("monitoramento")}
              />

              <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--foreground)" }}>Alertas clínicos</h2>
              <div className="grid grid-cols-1 gap-3">
                {alertasAtivos.map((a) => {
                  const p = pacientes.find((x) => x.id === a.pacienteId)
                  const tone = riskTone(a.severity)
                  const reconhecido = alertasReconhecidos.includes(a.id)
                  return (
                    <article
                      key={a.id}
                      className="relative overflow-hidden rounded-2xl border p-4 pl-5 sm:p-5 sm:pl-6"
                      style={{ background: "var(--card)", borderColor: reconhecido ? "var(--border)" : toneStyles[tone].border, opacity: reconhecido ? 0.7 : 1, boxShadow: "var(--shadow-sm)" }}
                    >
                      <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: reconhecido ? "var(--neutral)" : toneStyles[tone].solid }} aria-hidden="true" />
                      <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: toneStyles[tone].bg, color: toneStyles[tone].fg }} aria-hidden="true">
                            <UiIcon name="alert" size={19} />
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusBadge tone={tone} size="sm">{riskLabel(a.severity)}</StatusBadge>
                              <span className="font-mono text-xs" style={{ color: "var(--muted-foreground)" }}>{a.id}</span>
                              {reconhecido && <StatusBadge tone="neutral" icon="check" size="sm">Reconhecido pela equipe</StatusBadge>}
                            </div>
                            <h3 className="mt-1.5 text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>{a.titulo}</h3>
                            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{p?.nome} · {a.local} · {a.data} · {a.horario}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 md:flex-col md:items-end md:gap-1">
                          <p className="text-2xl font-bold leading-none tabular-nums" style={{ color: toneStyles[tone].fg }}>{a.valor}<span className="ml-1 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{a.label}</span></p>
                        </div>
                        <div className="flex flex-wrap gap-2 md:flex-col">
                          {p && <button type="button" onClick={() => goToPatient(p.id, "prescricao")} className="min-h-10 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Ver prescrição</button>}
                          {!reconhecido && (
                            <button type="button" onClick={() => markAlertRecognized(a.id)} className="min-h-10 rounded-lg border px-3 text-xs font-semibold" style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }}>Reconhecer alerta</button>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          )}

        </main>
        </SectionContext.Provider>
      </div>
    </div>
  )
}
