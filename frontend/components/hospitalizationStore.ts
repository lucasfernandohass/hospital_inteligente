export interface Hospitalization {
  id: string
  pacienteId: string
  leitoId: string
  leito: string
  setor: string
  motivo: string
  medicoId: string
  medico: string
  dataEntrada: string
  dataAltaPrevista: string
  status: "Ativa" | "Alta"
  dataAlta?: string
}

export const HOSPITALIZATION_STORAGE_KEY = "inteliHosp-internacoes"
