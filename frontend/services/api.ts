const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "")
const API_TIMEOUT_MS = 12_000
const CONNECTION_ERROR = "Não foi possível conectar à API. Confira se o backend está em execução."

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
export type StaffUpdatePayload = Omit<StaffPayload, "senha"> & { senha: string | null }

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
export interface VitalThresholdValues {
  fcAlertaMin: number
  fcAlertaMax: number
  fcCriticoMin: number
  fcCriticoMax: number
  spo2AlertaMin: number
  spo2CriticoMin: number
  frAlertaMax: number
  frCriticoMax: number
  temperaturaAlertaMax: number
  temperaturaCriticoMax: number
  paSistolicaAlertaMax: number
  paSistolicaCriticoMax: number
}
export interface VitalThresholdsDto extends VitalThresholdValues {
  pacienteId: number | null
  personalizado: boolean
  atualizadoPorId: number | null
  atualizadoEm: string | null
}
export interface AttendanceDto { id: number; data: string; tipo: string; descricao: string; status: string; leitoId: number | null; pacienteId: number; funcionarioResponsavelId: number; medicoResponsavelId: number }
export interface ClinicalRecordDto { id: number; data: string; descricao: string; anamnese: string | null; exameFisico: string | null; diagnostico: string | null; conduta: string | null; observacao: string | null; medicoId: number; atendimentoId: number }
export interface AlertDto { id: number; tipo: string; mensagem: string; dataHora: string; nivel: string; ativo: boolean; pacienteId: number }
export interface ImageExamDto { id: number; dataSolicitacao: string; status: string; observacoes: string | null; modalidade: string; regiaoCorpo: string; arquivoDigital: string | null; pacienteId: number | null; medicoId: number | null; atendimentoId: number | null }
export interface LabExamDto { id: number; dataSolicitacao: string; status: string; observacoes: string | null; tipoAnalise: string; amostra: string; metodo: string; pacienteId: number | null; medicoId: number | null; atendimentoId: number | null }
export interface ECGDto { id: number; dataHora: string; frequenciaCardiaca: number; ritmo: string; intervaloPR: number; duracaoQRS: number; eixo: string | null; observacao: string | null; pacienteId: number; atendimentoId: number }
export interface ActivityDto { id: number; dataHora: string; funcionarioId: number | null; funcionarioNome: string; funcionarioRole: ApiRole; acao: string; entidade: string; detalhes: string | null }

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

  const timeout = new AbortController()
  const timer = setTimeout(() => timeout.abort(), API_TIMEOUT_MS)
  try {
    const signal = options.signal ? AbortSignal.any([options.signal, timeout.signal]) : timeout.signal
    let response: Response
    try {
      response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, signal })
    } catch {
      throw new ApiError(CONNECTION_ERROR, 0)
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
    return await response.json() as T
  } catch (cause) {
    if (timeout.signal.aborted) throw new ApiError(CONNECTION_ERROR, 0)
    throw cause
  } finally {
    clearTimeout(timer)
  }
}

export const api = {
  login: (email: string, senha: string) => request<AuthSession>("/api/auth/login", {
    method: "POST", body: JSON.stringify({ email, senha }),
  }),
  listStaff: (token: string) => request<StaffMember[]>("/api/funcionarios", {}, token),
  createStaff: (payload: StaffPayload, token: string) => request<StaffMember>("/api/funcionarios", {
    method: "POST", body: JSON.stringify(payload),
  }, token),
  updateStaff: (id: number, payload: StaffUpdatePayload, token: string) => request<StaffMember>(`/api/funcionarios/${id}`, {
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
  updateAppointment: (id: number, payload: Omit<AppointmentDto, "id">, token: string) => request<AppointmentDto>(`/api/agendamentos/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token),
  listDoctors: (token: string) => request<DoctorDto[]>("/api/medicos", {}, token),
  listAttendances: (token: string) => request<AttendanceDto[]>("/api/atendimentos", {}, token),
  createAttendance: (payload: Omit<AttendanceDto, "id">, token: string) => request<AttendanceDto>("/api/atendimentos", { method: "POST", body: JSON.stringify(payload) }, token),
  listClinicalRecords: (token: string) => request<ClinicalRecordDto[]>("/api/registros-clinicos", {}, token),
  createClinicalRecord: (payload: Omit<ClinicalRecordDto, "id">, token: string) => request<ClinicalRecordDto>("/api/registros-clinicos", { method: "POST", body: JSON.stringify(payload) }, token),
  listAlerts: (token: string) => request<AlertDto[]>("/api/alertas", {}, token),
  updateAlert: (id: number, payload: Omit<AlertDto, "id">, token: string) => request<AlertDto>(`/api/alertas/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token),
  listImageExams: (token: string) => request<ImageExamDto[]>("/api/exames-imagem", {}, token),
  createImageExam: (payload: Omit<ImageExamDto, "id">, token: string) => request<ImageExamDto>("/api/exames-imagem", { method: "POST", body: JSON.stringify(payload) }, token),
  updateImageExam: (id: number, payload: Omit<ImageExamDto, "id">, token: string) => request<ImageExamDto>(`/api/exames-imagem/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token),
  listLabExams: (token: string) => request<LabExamDto[]>("/api/exames-laboratoriais", {}, token),
  createLabExam: (payload: Omit<LabExamDto, "id">, token: string) => request<LabExamDto>("/api/exames-laboratoriais", { method: "POST", body: JSON.stringify(payload) }, token),
  updateLabExam: (id: number, payload: Omit<LabExamDto, "id">, token: string) => request<LabExamDto>(`/api/exames-laboratoriais/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token),
  listECGs: (token: string) => request<ECGDto[]>("/api/ecgs", {}, token),
  listPrescriptions: (token: string) => request<PrescriptionDto[]>("/api/prescricoes", {}, token),
  createPrescription: (payload: Omit<PrescriptionDto, "id">, token: string) => request<PrescriptionDto>("/api/prescricoes", { method: "POST", body: JSON.stringify(payload) }, token),
  listPrescriptionItems: (token: string) => request<PrescriptionItemDto[]>("/api/itens-prescricao", {}, token),
  createPrescriptionItem: (payload: Omit<PrescriptionItemDto, "id">, token: string) => request<PrescriptionItemDto>("/api/itens-prescricao", { method: "POST", body: JSON.stringify(payload) }, token),
  listMedications: (token: string) => request<MedicationDto[]>("/api/medicamentos", {}, token),
  createMedication: (payload: Omit<MedicationDto, "id">, token: string) => request<MedicationDto>("/api/medicamentos", { method: "POST", body: JSON.stringify(payload) }, token),
  listMedicationAdministrations: (token: string) => request<MedicationAdministrationDto[]>("/api/administracoes-medicamento", {}, token),
  createMedicationAdministration: (payload: Omit<MedicationAdministrationDto, "id">, token: string) => request<MedicationAdministrationDto>("/api/administracoes-medicamento", { method: "POST", body: JSON.stringify(payload) }, token),
  getCurrentVitals: (patientId: string, token: string) => request<VitalDto[]>(`/api/pacientes/${patientId}/sinais-vitais/atuais`, {}, token),
  getDefaultVitalThresholds: (token: string) => request<VitalThresholdsDto>("/api/configuracoes/limites-sinais-vitais", {}, token),
  updateDefaultVitalThresholds: (payload: VitalThresholdValues, token: string) => request<VitalThresholdsDto>("/api/configuracoes/limites-sinais-vitais", { method: "PUT", body: JSON.stringify(payload) }, token),
  getPatientVitalThresholds: (patientId: number, token: string) => request<VitalThresholdsDto>(`/api/pacientes/${patientId}/limites-sinais-vitais`, {}, token),
  updatePatientVitalThresholds: (patientId: number, payload: VitalThresholdValues, token: string) => request<VitalThresholdsDto>(`/api/pacientes/${patientId}/limites-sinais-vitais`, { method: "PUT", body: JSON.stringify(payload) }, token),
  resetPatientVitalThresholds: (patientId: number, token: string) => request<VitalThresholdsDto>(`/api/pacientes/${patientId}/limites-sinais-vitais`, { method: "DELETE" }, token),
  listActivities: (token: string) => request<ActivityDto[]>("/api/atividades", {}, token),
  createActivity: (payload: Pick<ActivityDto, "acao" | "entidade" | "detalhes">, token: string) => request<ActivityDto>("/api/atividades", { method: "POST", body: JSON.stringify(payload) }, token),
}

export function screenForRole(role: ApiRole) {
  return ({ ADMINISTRADOR: "administrador", MEDICO: "doutor", ENFERMEIRA: "enfermeira", RECEPCIONISTA: "recepcionista" } as const)[role]
}

export function roleForScreen(screen: string): ApiRole | null {
  return ({ administrador: "ADMINISTRADOR", doutor: "MEDICO", enfermeira: "ENFERMEIRA", recepcionista: "RECEPCIONISTA" } as Record<string, ApiRole>)[screen] ?? null
}
