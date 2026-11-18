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
  medicoId?: string
  atendimentoId?: string
  amostra?: string
  metodo?: string
  modalidade?: string
  regiaoCorpo?: string
  hora?: string
}
