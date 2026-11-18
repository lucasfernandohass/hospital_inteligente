export interface ReceptionAppointment {
  id: string
  medicoId: string
  data: string
  hora: string
  paciente: string
  pacienteId?: string
  status?: "Agendada" | "Em atendimento" | "Concluída"
}

export function localDateInputValue(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-")
}

export function addLocalDaysToDateInput(days: number, date = new Date()) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return localDateInputValue(next)
}

export function formatLongLocalDate(date = new Date()) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date)
}

