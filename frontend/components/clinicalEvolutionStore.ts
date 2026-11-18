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
