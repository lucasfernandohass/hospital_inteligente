export interface ReceptionAppointment {
  id: string
  medicoId: string
  data: string
  hora: string
  paciente: string
  pacienteId?: string
  status?: "Agendada" | "Em atendimento" | "Concluída"
}

export const APPOINTMENT_STORAGE_KEY = "inteliHosp-recepcao-agendamentos"
export const DOCTOR_DEMO_ID = "MED-PEDRO"

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

export const initialReceptionAppointments: ReceptionAppointment[] = [
  { id: "AG-DEMO-PEDRO-01", medicoId: DOCTOR_DEMO_ID, data: localDateInputValue(), hora: "09:20", paciente: "João da Silva", pacienteId: "PAC-001", status: "Agendada" },
  { id: "AG-DEMO-PEDRO-02", medicoId: DOCTOR_DEMO_ID, data: localDateInputValue(), hora: "14:30", paciente: "Maria Fernanda Souza", pacienteId: "PAC-002", status: "Agendada" },
  { id: "AG-003", medicoId: "MED-1", data: localDateInputValue(), hora: "09:00", paciente: "João da Silva", pacienteId: "PAC-001", status: "Agendada" },
  { id: "AG-004", medicoId: "MED-2", data: localDateInputValue(), hora: "10:30", paciente: "Carlos Alberto Mendes", pacienteId: "PAC-003", status: "Agendada" },
  { id: "AG-005", medicoId: "MED-3", data: localDateInputValue(), hora: "14:00", paciente: "Ana Beatriz Lima", pacienteId: "PAC-004", status: "Agendada" },
  { id: "AG-006", medicoId: "MED-1", data: addLocalDaysToDateInput(1), hora: "08:00", paciente: "Roberto Nogueira Alves", pacienteId: "PAC-005", status: "Agendada" },
]

export function includeDoctorDemoAppointments(appointments: ReceptionAppointment[]) {
  const knownIds = new Set(appointments.map((appointment) => appointment.id))
  const missing = initialReceptionAppointments.filter((appointment) => appointment.medicoId === DOCTOR_DEMO_ID && !knownIds.has(appointment.id))
  return missing.length ? [...appointments, ...missing] : appointments
}
