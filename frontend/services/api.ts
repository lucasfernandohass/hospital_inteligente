const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "")

export type ApiRole = "RECEPCIONISTA" | "MEDICO" | "ENFERMEIRA" | "ADMINISTRADOR"

export interface AuthSession {
  token: string
  tipo: string
  expiraEmSegundos: number
  id: number
  nome: string
  email: string
  role: ApiRole
}

export interface StaffMember {
  id: number
  nome: string
  cpf: string
  dataNascimento: string
  telefone: string | null
  endereco: string | null
  matricula: string
  cargo: string
  dataAdmissao: string
  email: string
  role: ApiRole
  crm: string | null
  especialidade: string | null
  coren: string | null
  setor: string | null
}

export interface StaffPayload {
  nome: string
  cpf: string
  dataNascimento: string
  telefone: string
  endereco: string
  matricula: string
  dataAdmissao: string
  email: string
  senha: string
  role: Exclude<ApiRole, "ADMINISTRADOR">
  crm?: string
  especialidade?: string
  coren?: string
  setor?: string
}

export interface PatientDto {
  id: number; nome: string; cpf: string; dataNascimento: string; telefone: string | null; endereco: string | null;
  numeroProntuario: string; convenio: string;
  sexo: string | null;
}
export interface BedDto { id: number; numero: string; andar: number; quarto: string; tipo: string; status: string; observacao: string | null; setor: string | null }
export interface InternmentDto {
  id: number; pacienteId: number; leitoId: number; dataInternacao: string; dataPrevistaAlta: string | null;
  dataAlta: string | null; medicoId?: number | null; motivo: string; status: string; observacoes: string | null;
}
export interface AppointmentDto {
  id: number; pacienteId: number; medicoId: number; data: string; horario: string; duracao: number;
  status: string; tipo: string; observacoes: string | null;
}
export interface DoctorDto { id: number; nome: string; crm: string; especialidade: string }
export interface PrescriptionDto { id: number; data: string; observacao: string | null; status: string; pacienteId: number; medicoId: number; atendimentoId: number }
export interface PrescriptionItemDto { id: number; prescricaoId: number; medicamentoId: number; dose: string; viaAdministracao: string; frequencia: string; duracao: string; observacoes: string | null }
export interface MedicationDto { id: number; nome: string; dosagem: string; ativo: boolean }
export interface MedicationAdministrationDto { id: number; dataHora: string; dose: string; via: string; observacao: string | null; itemPrescricaoId: number; pacienteId: number; administradoPor: number }
export interface VitalDto { pacienteId: number; leitoId: number; tipo: "TEMPERATURA" | "PRESSAO_SISTOLICA" | "PRESSAO_DIASTOLICA" | "FREQUENCIA_CARDIACA" | "FREQUENCIA_RESPIRATORIA" | "SATURACAO_OXIGENIO"; valor: number; unidade: string; capturadoEm: string }

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
    this.name = "ApiError"
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body) headers.set("Content-Type", "application/json")
  if (token) headers.set("Authorization", `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  } catch {
    throw new ApiError("Não foi possível conectar à API. Confira se o backend está em execução.", 0)
  }

  if (!response.ok) {
    let message = `Falha na requisição (${response.status}).`
    try {
      const body = await response.json() as { detail?: string; message?: string; title?: string }
      message = body.detail ?? body.message ?? body.title ?? message
    } catch { /* resposta sem corpo JSON */ }
    throw new ApiError(message, response.status)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  login: (email: string, senha: string) => request<AuthSession>("/api/auth/login", {
    method: "POST", body: JSON.stringify({ email, senha }),
  }),
  listStaff: (token: string) => request<StaffMember[]>("/api/funcionarios", {}, token),
  createStaff: (payload: StaffPayload, token: string) => request<StaffMember>("/api/funcionarios", {
    method: "POST", body: JSON.stringify(payload),
  }, token),
  updateStaff: (id: number, payload: StaffPayload, token: string) => request<StaffMember>(`/api/funcionarios/${id}`, {
    method: "PUT", body: JSON.stringify(payload),
  }, token),
  deleteStaff: (id: number, token: string) => request<void>(`/api/funcionarios/${id}`, { method: "DELETE" }, token),
  listPatients: (token: string) => request<PatientDto[]>("/api/pacientes", {}, token),
  getPatient: (id: number, token: string) => request<PatientDto>(`/api/pacientes/${id}`, {}, token),
  createPatient: (payload: Omit<PatientDto, "id">, token: string) => request<PatientDto>("/api/pacientes", { method: "POST", body: JSON.stringify(payload) }, token),
  updatePatient: (id: number, payload: Omit<PatientDto, "id">, token: string) => request<PatientDto>(`/api/pacientes/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token),
  listBeds: (token: string) => request<BedDto[]>("/api/leitos", {}, token),
  getBed: (id: number, token: string) => request<BedDto>(`/api/leitos/${id}`, {}, token),
  createBed: (payload: Omit<BedDto, "id">, token: string) => request<BedDto>("/api/leitos", { method: "POST", body: JSON.stringify(payload) }, token),
  updateBed: (id: number, payload: Omit<BedDto, "id">, token: string) => request<BedDto>(`/api/leitos/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token),
  listInternments: (token: string) => request<InternmentDto[]>("/api/internacoes", {}, token),
  createInternment: (payload: Omit<InternmentDto, "id">, token: string) => request<InternmentDto>("/api/internacoes", { method: "POST", body: JSON.stringify(payload) }, token),
  updateInternment: (id: number, payload: Omit<InternmentDto, "id">, token: string) => request<InternmentDto>(`/api/internacoes/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token),
  listAppointments: (token: string) => request<AppointmentDto[]>("/api/agendamentos", {}, token),
  createAppointment: (payload: Omit<AppointmentDto, "id">, token: string) => request<AppointmentDto>("/api/agendamentos", { method: "POST", body: JSON.stringify(payload) }, token),
  listDoctors: (token: string) => request<DoctorDto[]>("/api/medicos", {}, token),
  listPrescriptions: (token: string) => request<PrescriptionDto[]>("/api/prescricoes", {}, token),
  listPrescriptionItems: (token: string) => request<PrescriptionItemDto[]>("/api/itens-prescricao", {}, token),
  listMedications: (token: string) => request<MedicationDto[]>("/api/medicamentos", {}, token),
  listMedicationAdministrations: (token: string) => request<MedicationAdministrationDto[]>("/api/administracoes-medicamento", {}, token),
  createMedicationAdministration: (payload: Omit<MedicationAdministrationDto, "id">, token: string) => request<MedicationAdministrationDto>("/api/administracoes-medicamento", { method: "POST", body: JSON.stringify(payload) }, token),
  getCurrentVitals: (patientId: string, token: string) => request<VitalDto[]>(`/api/pacientes/${patientId}/sinais-vitais/atuais`, {}, token),
}

export function screenForRole(role: ApiRole) {
  return ({ ADMINISTRADOR: "administrador", MEDICO: "doutor", ENFERMEIRA: "enfermeira", RECEPCIONISTA: "recepcionista" } as const)[role]
}

export function roleForScreen(screen: string): ApiRole | null {
  return ({ administrador: "ADMINISTRADOR", doutor: "MEDICO", enfermeira: "ENFERMEIRA", recepcionista: "RECEPCIONISTA" } as Record<string, ApiRole>)[screen] ?? null
}
