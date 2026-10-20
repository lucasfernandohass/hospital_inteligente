export type ProfessionalRole = "Médico" | "Enfermagem" | "Recepção"

export interface Professional {
  id: string
  name: string
  email: string
  role: ProfessionalRole
  registration: string
  specialty: string
  active: boolean
}

export const PROFESSIONAL_STORAGE_KEY = "inteliHosp-recepcao-profissionais"

export const initialProfessionals: Professional[] = [
  { id: "PRO-001", name: "Rafael Oliveira", email: "rafael.oliveira@hospital.local", role: "Médico", registration: "CRM 45.231", specialty: "Cardiologia", active: true },
  { id: "PRO-002", name: "Ana Dias", email: "ana.dias@hospital.local", role: "Enfermagem", registration: "COREN 234.567", specialty: "Clínica Médica", active: true },
  { id: "PRO-003", name: "Mônica Rodrigues", email: "monica.rodrigues@hospital.local", role: "Recepção", registration: "Mat. 88.421", specialty: "", active: true },
]
