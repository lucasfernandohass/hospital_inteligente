export interface ClinicalAlertRecord {
  id: string
  pacienteId: string
  severity: "high" | "medium"
  titulo: string
  detalhe: string
  data: string
  horario: string
  local: string
  valor: string
  label: string
}

export const CLINICAL_ALERT_ACK_STORAGE_KEY = "inteliHosp-alertas-clinicos-reconhecidos"
const LEGACY_ACK_KEYS = ["inteliHosp-medico-alertas-vistos", "inteliHosp-enfermagem-alertas-atendidos"]

export const clinicalAlertRecords: ClinicalAlertRecord[] = [
  {
    id: "ALT-001",
    pacienteId: "PAC-003",
    severity: "high",
    titulo: "Saturação de oxigênio abaixo do limite",
    detalhe: "SpO₂ 88% — Pneumonia severa",
    data: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date()),
    horario: "Agora",
    local: "Leito 14B",
    valor: "88%",
    label: "SpO₂",
  },
  {
    id: "ALT-002",
    pacienteId: "PAC-002",
    severity: "medium",
    titulo: "Glicemia acima do limite",
    detalhe: "Glicemia de jejum 280 mg/dL",
    data: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date()),
    horario: "Hoje, 10:45",
    local: "Ambulatório",
    valor: "280",
    label: "mg/dL",
  },
  {
    id: "ALT-003",
    pacienteId: "PAC-005",
    severity: "medium",
    titulo: "Pressão arterial elevada",
    detalhe: "PA 165/105 mmHg",
    data: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date()),
    horario: "Hoje, 07:30",
    local: "Leito 22A",
    valor: "165/105",
    label: "mmHg",
  },
]

export function readLegacyClinicalAlertAcknowledgements(): string[] {
  if (typeof window === "undefined") return []

  try {
    return [...new Set(LEGACY_ACK_KEYS.flatMap((key) => {
      const saved: unknown = JSON.parse(window.localStorage.getItem(key) ?? "[]")
      return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === "string") : []
    }))]
  } catch {
    return []
  }
}
