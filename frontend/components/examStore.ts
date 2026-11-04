export type ExamType = "ExameLaboratorial" | "ExameImagem" | "ECG"

export interface SharedExamRequest {
  id: string
  tipo: ExamType
  nome: string
  pacienteId: string
  data: string
  status: "agendado" | "em andamento" | "resultado"
  resultado: string | null
  solicitante: string
  hora?: string
}

export const EXAM_STORAGE_KEY = "inteliHosp-exames-demonstrativos"
