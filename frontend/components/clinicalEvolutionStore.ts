export interface ClinicalEvolution {
  data: string
  descricao: string
  pressao?: string
  fc?: number
  temp?: number
  spo2?: number
  perfil?: "Médico" | "Enfermagem"
  profissional?: string
}

export type ClinicalEvolutionMap = Record<string, ClinicalEvolution[]>

export const CLINICAL_EVOLUTION_STORAGE_KEY = "inteliHosp-evolucoes-clinicas"
const LEGACY_NURSING_EVOLUTION_KEY = "inteliHosp-enfermagem-evolucoes"

export function mergeClinicalEvolutions(primary: ClinicalEvolutionMap, additional: ClinicalEvolutionMap): ClinicalEvolutionMap {
  let changed = false
  const result = { ...primary }
  for (const [patientId, entries] of Object.entries(additional)) {
    const current = result[patientId] ?? []
    const known = new Set(current.map((entry) => `${entry.data}|${entry.descricao}`))
    const missing = entries.filter((entry) => !known.has(`${entry.data}|${entry.descricao}`))
    if (missing.length) {
      result[patientId] = [...current, ...missing]
      changed = true
    }
  }
  return changed ? result : primary
}

export function readLegacyClinicalEvolutions(fallback: ClinicalEvolutionMap): ClinicalEvolutionMap {
  try {
    const saved = JSON.parse(localStorage.getItem(LEGACY_NURSING_EVOLUTION_KEY) ?? "null") as ClinicalEvolutionMap | null
    return saved && typeof saved === "object" ? mergeClinicalEvolutions(fallback, saved) : fallback
  } catch {
    return fallback
  }
}
