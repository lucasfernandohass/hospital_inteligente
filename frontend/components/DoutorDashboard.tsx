import { useEffect, useMemo, useState } from "react"
import type { Screen } from "../App"
import DashboardSidebar from "./DashboardSidebar"
import { Avatar, DashboardHeader, EmptyState, FormSection, HeroHeader, HeroStat, KeyValue, MetaItem, PageTitle, ProgressBar, QuickAction, SectionCard, SectionContext, SegmentedControl, StatusBadge, TimelineItem, UiIcon, VitalTile, shiftLabel, toneStyles, type Tone } from "./ui"
import { daysBetween, greeting, parseDisplayDate } from "./dateUtils"
import type { Theme } from "./ThemeToggle"
import VitalMonitoring from "./VitalMonitoring"
import MonitoringAlertsPanel from "./MonitoringAlertsPanel"
import ActivityLog from "./ActivityLog"
import AlertNotifications from "./AlertNotifications"
import type { MonitoringAlert } from "./VitalMonitoring"
import { logActivity } from "./activityStore"
import type { ClinicalEvolutionMap } from "./clinicalEvolutionStore"
import type { SharedPrescription } from "./prescriptionStore"
import type { ExamType, SharedExamRequest } from "./examStore"
import { formatLongLocalDate, localDateInputValue, type ReceptionAppointment } from "./appointmentStore"
import type { Hospitalization } from "./hospitalizationStore"
import type { RegisteredBed, RegisteredPatient } from "./patientStore"
import { usePanelRoute } from "../hooks/usePanelRoute"
import { api, ApiError, type DoctorDto } from "../services/api"
import { formatBedNumber, formatSpecialty, mapBed, mapClinicalEvolutions, mapInternment, mapPatient } from "../services/mappers"
import { mapPrescriptions } from "../services/mappers"
import { useVitalFeed } from "../hooks/useVitalFeed"

interface Props {
  onNavigate: (screen: Screen) => void
  token: string
  userName: string
  userId: number
  theme: Theme
  onToggleTheme: () => void
}

type Tab = "overview" | "atendimento" | "monitoramento" | "prescricao" | "exames" | "agenda" | "internacao" | "atividades" | "alertas"


const riskColor = {
  low: { bg: "var(--success-surface)", text: "var(--success-foreground)", dot: "var(--success)", label: "Estável" },
  medium: { bg: "var(--warning-surface)", text: "var(--warning-foreground)", dot: "var(--warning)", label: "Atenção" },
  high: { bg: "var(--danger-surface)", text: "var(--danger-foreground)", dot: "var(--danger)", label: "Crítico" },
  unknown: { bg: "var(--secondary)", text: "var(--muted-foreground)", dot: "var(--muted-foreground)", label: "Sem leitura" },
}

export default function DoctorDashboard({
  onNavigate,
  token,
  userName,
  userId,
  theme,
  onToggleTheme,
}: Props) {
  const [registeredPatients, setRegisteredPatients] = useState<RegisteredPatient[]>([])
  const [registeredBeds, setRegisteredBeds] = useState<RegisteredBed[]>([])
  const [hospitalizations, setHospitalizations] = useState<Hospitalization[]>([])
  const [receptionAppointments, setReceptionAppointments] = useState<ReceptionAppointment[]>([])
  const [doctorProfile, setDoctorProfile] = useState<DoctorDto | null>(null)
  const [apiPrescriptions, setApiPrescriptions] = useState<SharedPrescription[]>([])
  const [medications, setMedications] = useState<Awaited<ReturnType<typeof api.listMedications>>>([])
  const [administratedMedicationItems, setAdministratedMedicationItems] = useState<string[]>([])
  const [evolucoesClinicas, setEvolucoesClinicas] = useState<ClinicalEvolutionMap>({})
  const [apiAlerts, setApiAlerts] = useState<Awaited<ReturnType<typeof api.listAlerts>>>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState("")
  useEffect(() => {
    let active = true
    setDataLoading(true)
    Promise.all([api.listPatients(token), api.listBeds(token), api.listInternments(token), api.listAppointments(token), api.listDoctors(token), api.listPrescriptions(token), api.listPrescriptionItems(token), api.listMedications(token), api.listAttendances(token), api.listClinicalRecords(token), api.listAlerts(token), api.listMedicationAdministrations(token), api.listImageExams(token), api.listLabExams(token), api.listECGs(token)])
      .then(([patientsDto, bedsDto, internmentsDto, appointmentsDto, doctors, prescriptions, items, medicationsDto, attendances, clinicalRecords, alerts, administrations, imageExams, labExams, ecgs]) => {
        if (!active) return
        const patients = patientsDto.map(mapPatient)
        setRegisteredPatients(patients)
        const currentDoctor = doctors.find((doctor) => doctor.id === userId) ?? null
        setDoctorProfile(currentDoctor)
        setRegisteredBeds(bedsDto.map((bed) => mapBed(bed, internmentsDto)))
        setHospitalizations(internmentsDto.map((item) => mapInternment(item, bedsDto, doctors)))
        setReceptionAppointments(appointmentsDto.map((item) => ({
          id: String(item.id), medicoId: String(item.medicoId), data: item.data, hora: item.horario.slice(0, 5),
          paciente: patients.find((patient) => patient.id === String(item.pacienteId))?.nome ?? `Paciente ${item.pacienteId}`,
          pacienteId: String(item.pacienteId), status: item.status.toLowerCase().includes("conclu") ? "Concluída" : item.status.toLowerCase().includes("atendimento") ? "Em atendimento" : "Agendada",
        })))
        setApiPrescriptions(mapPrescriptions(prescriptions, items, medicationsDto, doctors))
        setMedications(medicationsDto)
        setAdministratedMedicationItems(administrations.map((item) => String(item.itemPrescricaoId)))
        const attendanceById = new Map(attendances.map((item) => [item.id, item]))
        setEvolucoesClinicas(mapClinicalEvolutions(attendances, clinicalRecords, doctors, { id: userId, nome: userName }))
        setApiAlerts(alerts)
        const statusOf = (value: string): SharedExamRequest["status"] => /result|conclu/i.test(value) ? "resultado" : /andamento/i.test(value) ? "em andamento" : "agendado"
        setExames([
          ...labExams.filter((exam) => exam.pacienteId !== null && exam.medicoId === userId).map((exam) => ({ id: String(exam.id), tipo: "ExameLaboratorial" as const, nome: exam.tipoAnalise, pacienteId: String(exam.pacienteId), data: exam.dataSolicitacao.slice(0, 10).split("-").reverse().join("/"), status: statusOf(exam.status), resultado: exam.observacoes, solicitante: currentDoctor?.nome ?? userName, medicoId: String(exam.medicoId), atendimentoId: String(exam.atendimentoId), amostra: exam.amostra, metodo: exam.metodo })),
          ...imageExams.filter((exam) => exam.pacienteId !== null && exam.medicoId === userId).map((exam) => ({ id: String(exam.id), tipo: "ExameImagem" as const, nome: `${exam.modalidade} · ${exam.regiaoCorpo}`, pacienteId: String(exam.pacienteId), data: exam.dataSolicitacao.slice(0, 10).split("-").reverse().join("/"), status: statusOf(exam.status), resultado: exam.observacoes, solicitante: currentDoctor?.nome ?? userName, medicoId: String(exam.medicoId), atendimentoId: String(exam.atendimentoId), modalidade: exam.modalidade, regiaoCorpo: exam.regiaoCorpo })),
          ...ecgs.filter((exam) => attendanceById.get(exam.atendimentoId)?.medicoResponsavelId === userId).map((exam) => ({ id: String(exam.id), tipo: "ECG" as const, nome: "Eletrocardiograma", pacienteId: String(exam.pacienteId), data: exam.dataHora.slice(0, 10).split("-").reverse().join("/"), status: "resultado" as const, resultado: exam.observacao ?? `${exam.ritmo} · FC ${exam.frequenciaCardiaca} bpm`, solicitante: currentDoctor?.nome ?? userName, medicoId: String(userId), atendimentoId: String(exam.atendimentoId) })),
        ])
        setDataError(currentDoctor ? "" : "A conta autenticada não foi encontrada entre os médicos cadastrados na API.")
      })
      .catch((error) => { if (active) setDataError(error instanceof ApiError ? error.message : "Não foi possível carregar dados da API.") })
      .finally(() => { if (active) setDataLoading(false) })
    return () => { active = false }
  }, [token, userId])
  const pacientes = useMemo(() => registeredPatients.map((patient) => {
    const occupiedBed = registeredBeds.find((bed) => bed.status === "Ocupado" && bed.pacienteId === patient.id)
    const admission = hospitalizations.find((item) => item.pacienteId === patient.id && item.status === "Ativa")
    const [day, month, year] = patient.dataNasc.split("/").map(Number)
    const birthDate = new Date(year, month - 1, day)
    const today = new Date()
    const idade = Math.max(0, today.getFullYear() - birthDate.getFullYear() - (today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate()) ? 1 : 0))
    const lastAppointment = receptionAppointments.filter((item) => item.pacienteId === patient.id).sort((a, b) => `${b.data}T${b.hora}`.localeCompare(`${a.data}T${a.hora}`))[0]
    return {
      id: patient.id, nome: patient.nome, cpf: patient.cpf, dataNasc: patient.dataNasc, idade, sexo: patient.sexo,
      telefone: patient.telefone, convenio: patient.convenio, leito: occupiedBed ? formatBedNumber(occupiedBed) : "—",
      setor: occupiedBed?.setor ?? occupiedBed?.tipo ?? (doctorProfile ? formatSpecialty(doctorProfile.especialidade) : "—"),
      condicao: admission?.motivo ?? (lastAppointment ? "Consulta agendada" : "Sem atendimento associado"),
      status: "sem avaliação", avatar: patient.nome.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase(),
      ultimo: lastAppointment ? `${new Date(`${lastAppointment.data}T${lastAppointment.hora}:00`).toLocaleDateString("pt-BR")} · ${lastAppointment.hora}` : "—",
      risco: "unknown", tipoSanguineo: "—",
    }
  }), [doctorProfile, hospitalizations, receptionAppointments, registeredBeds, registeredPatients])
  const doctorActiveHospitalizations = useMemo(() => hospitalizations.filter((admission) => admission.status === "Ativa" && admission.medicoId === String(userId)), [hospitalizations, userId])
  const monitorPatients = useMemo(() => pacientes.filter((patient) => doctorActiveHospitalizations.some((admission) => admission.pacienteId === patient.id)).map((patient) => {
    const bed = registeredBeds.find((item) => item.status === "Ocupado" && item.pacienteId === patient.id)
    return { id: patient.id, name: patient.nome, bed: bed ? formatBedNumber(bed) : patient.leito, sector: bed?.setor ?? bed?.tipo ?? patient.setor, condition: patient.condicao }
  }), [doctorActiveHospitalizations, pacientes, registeredBeds])
  const { readings: liveVitals } = useVitalFeed(monitorPatients.map((patient) => patient.id), token)
  const [activeTab, setActiveTab] = usePanelRoute("medico", ["overview", "atendimento", "monitoramento", "prescricao", "exames", "agenda", "internacao", "atividades", "alertas"] as const, "overview")
  const [selectedPaciente, setSelectedPaciente] =
    useState<typeof pacientes[0] | null>(null)
  useEffect(() => {
    setSelectedPaciente((current) => current ? pacientes.find((patient) => patient.id === current.id) ?? null : null)
  }, [pacientes])
  const [expandedPrescricao, setExpandedPrescricao] = useState<string | null>(
    null,
  )
  const medicacoesAdministradas = administratedMedicationItems
  const [clinicalActionError, setClinicalActionError] = useState("")
  const [showEvolutionForm, setShowEvolutionForm] = useState(false)
  const [evolutionDraft, setEvolutionDraft] = useState("")
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false)
  const [examesLocais, setExames] = useState<SharedExamRequest[]>([])
  const [showExamForm, setShowExamForm] = useState(false)
  const [examForm, setExamForm] = useState({ pacienteId: "", nome: "", tipo: "ExameLaboratorial" as ExamType, amostra: "", metodo: "", modalidade: "", regiaoCorpo: "" })
  const [resultExamId, setResultExamId] = useState<string | null>(null)
  const [examResultDraft, setExamResultDraft] = useState("")
  const [prescriptionForm, setPrescriptionForm] = useState({
    pacienteId: pacientes[0]?.id ?? "",
    medicamento: "",
    dosagem: "",
    via: "Oral",
    horario: "08:00",
    frequencia: "1x ao dia",
    duracao: "7 dias",
    quantidade: "7",
  })
  const [monitoringAlerts, setMonitoringAlerts] = useState<MonitoringAlert[]>([])
  const [monitoringAcknowledged, setMonitoringAcknowledged] = useState<string[]>([])
  const [patientSearch, setPatientSearch] = useState("")
  const [patientStatusFilter, setPatientStatusFilter] = useState("todos")
  const [patientRiskFilter, setPatientRiskFilter] = useState("todos")
  const [patientSectorFilter, setPatientSectorFilter] = useState("todos")
  const [patientBedFilter, setPatientBedFilter] = useState("todos")
  const [rescheduleAppointmentId, setRescheduleAppointmentId] = useState<string | null>(null)
  const [rescheduleForm, setRescheduleForm] = useState({ data: localDateInputValue(), hora: "09:00" })
  const [rescheduleError, setRescheduleError] = useState("")
  const [altaEmConfirmacaoId, setAltaEmConfirmacaoId] = useState<string | null>(null)
  const [examTypeFilter, setExamTypeFilter] = useState<"todos" | ExamType>("todos")

  const getPatientRisk = (patient: typeof pacientes[number]) => {
    const alerts = monitoringAlerts.filter((alert) => alert.patientId === patient.id && (receptionAppointments.some((appointment) => appointment.medicoId === String(userId) && appointment.pacienteId === patient.id) || doctorActiveHospitalizations.some((admission) => admission.pacienteId === patient.id)))
    if (alerts.some((alert) => alert.severity === "Crítico")) return "high"
    if (alerts.some((alert) => alert.severity === "Moderado")) return patient.risco === "high" ? "high" : "medium"
    if (alerts.some((alert) => alert.severity === "Informativo")) return patient.risco === "low" ? "medium" : patient.risco
    const reading = liveVitals[patient.id]
    if (!reading || [reading.heartRate, reading.temperature, reading.oxygen, reading.systolic].every((value) => value === undefined)) return "unknown"
    if ((reading.oxygen !== undefined && reading.oxygen < 90) || (reading.heartRate !== undefined && (reading.heartRate > 120 || reading.heartRate < 45)) || (reading.temperature !== undefined && reading.temperature >= 39) || (reading.systolic !== undefined && reading.systolic >= 180)) return "high"
    if ((reading.oxygen !== undefined && reading.oxygen < 94) || (reading.heartRate !== undefined && (reading.heartRate > 100 || reading.heartRate < 55)) || (reading.temperature !== undefined && reading.temperature >= 38) || (reading.systolic !== undefined && reading.systolic >= 140)) return "medium"
    return "low"
  }
  const getPatientStatus = (patient: typeof pacientes[number]) => {
    const risk = getPatientRisk(patient)
    if (risk === "high") return "crítico"
    if (risk === "medium") return "atenção"
    return risk === "unknown" ? "sem avaliação" : patient.status
  }

  const todasPrescricoes = apiPrescriptions.filter((prescription) => prescription.medicoId === String(userId)).map((prescription) => ({
      id: prescription.id, pacienteId: prescription.pacienteId, data: prescription.data, medico: prescription.medico, medicoId: prescription.medicoId,
      itens: [{ ...prescription.item, status: "pendente" as const }],
    }))
  const todosExames = examesLocais
  const selectedLatestVitals = selectedPaciente
    ? evolucoesClinicas[selectedPaciente.id]?.find((entry) => entry.fc !== undefined || entry.temp !== undefined || entry.spo2 !== undefined || entry.pressao !== undefined)
    : undefined
  const agendaExibida = receptionAppointments
      .filter((appointment) => appointment.medicoId === String(userId))
      .sort((a, b) => a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora))
      .map((appointment) => {
        const status = appointment.status ?? "Agendada"
        return {
        hora: appointment.hora,
        paciente: appointment.paciente,
        pacienteId: appointment.pacienteId ?? pacientes.find((patient) => patient.nome === appointment.paciente)?.id ?? "",
        tipo: "Consulta",
        local: doctorProfile ? formatSpecialty(doctorProfile.especialidade) : "Atendimento médico",
        status,
        concluido: status === "Concluída",
        data: appointment.data,
        id: appointment.id,
        key: appointment.id,
      }})
  const consultasHoje = agendaExibida.filter((appointment) => appointment.data === localDateInputValue())
  const consultasPendentesHoje = consultasHoje.filter((appointment) => appointment.status !== "Concluída").length
  const internacoesExibidas = doctorActiveHospitalizations.map((admission) => ({
        id: admission.id,
        pacienteId: admission.pacienteId,
        leito: admission.leito,
        ala: admission.setor,
        motivo: admission.motivo,
        entrada: admission.dataEntrada,
        altaPrevista: admission.dataAltaPrevista,
        key: admission.id,
      }))
  const pacientesDoMedico = pacientes.filter((patient) =>
    agendaExibida.some((appointment) => appointment.pacienteId === patient.id) ||
    doctorActiveHospitalizations.some((admission) => admission.pacienteId === patient.id),
  )
  const pacientesDoMedicoIds = new Set(pacientesDoMedico.map((patient) => patient.id))
  const monitoringAlertsDoMedico = monitoringAlerts.filter((alert) => pacientesDoMedicoIds.has(alert.patientId))
  const monitoringPendingCount = monitoringAlerts.filter((alert) => pacientesDoMedicoIds.has(alert.patientId) && !monitoringAcknowledged.includes(alert.key)).length
  const alertas = apiAlerts.filter((alert) => pacientesDoMedicoIds.has(String(alert.pacienteId))).map((alert) => {
    const patient = pacientes.find((item) => item.id === String(alert.pacienteId))
    const timestamp = new Date(alert.dataHora)
    return { id: String(alert.id), pacienteId: String(alert.pacienteId), severity: /crit|alto/i.test(alert.nivel) ? "high" as const : "medium" as const, titulo: alert.tipo, detalhe: alert.mensagem, data: timestamp.toLocaleDateString("pt-BR"), horario: timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), local: patient ? `Leito ${patient.leito}` : "", valor: alert.mensagem, label: "", ativo: alert.ativo }
  })
  const alertasPendentes = alertas.filter((alert) => alert.ativo)
  const patientSectors = [...new Set(pacientesDoMedico.map((patient) => patient.setor))]
  const patientBeds = [...new Set(pacientesDoMedico.map((patient) => patient.leito).filter((bed) => bed !== "—"))]
  const filteredPatients = useMemo(() => pacientesDoMedico.filter((patient) =>
    `${patient.nome} ${patient.id} ${patient.condicao}`.toLowerCase().includes(patientSearch.toLowerCase()) &&
    (patientStatusFilter === "todos" || getPatientStatus(patient) === patientStatusFilter) &&
    (patientRiskFilter === "todos" || getPatientRisk(patient) === patientRiskFilter) &&
    (patientSectorFilter === "todos" || patient.setor === patientSectorFilter) &&
    (patientBedFilter === "todos" || patient.leito === patientBedFilter),
  ), [pacientesDoMedico, patientSearch, patientStatusFilter, patientRiskFilter, patientSectorFilter, patientBedFilter, monitoringAlerts])
  useEffect(() => {
    setSelectedPaciente((current) => current && !filteredPatients.some((patient) => patient.id === current.id) ? null : current)
  }, [filteredPatients])

  const goToPatient = (id: string) => {
    const patient = pacientes.find((p) => p.id === id)
    if (patient) {
      setSelectedPaciente(patient)
      setActiveTab("atendimento")
    }
  }

  const markAlertRecognized = async (id: string) => {
    logActivity("Médico", "Alerta reconhecido", "Alerta", id)
    const current = apiAlerts.find((alert) => String(alert.id) === id)
    if (!current) return
    try {
      const updated = await api.updateAlert(current.id, { ...current, ativo: false }, token)
      setApiAlerts((items) => items.map((alert) => alert.id === updated.id ? updated : alert))
    } catch (error) { setDataError(error instanceof ApiError ? error.message : "Não foi possível atualizar o alerta.") }
  }

  const markAllAlertsRecognized = async () => {
    try {
      const updates = await Promise.all(alertasPendentes.map((alert) => {
        const current = apiAlerts.find((item) => String(item.id) === alert.id)
        return current ? api.updateAlert(current.id, { ...current, ativo: false }, token) : null
      }))
      const byId = new Map(updates.filter((item): item is NonNullable<typeof item> => item !== null).map((item) => [item.id, item]))
      setApiAlerts((items) => items.map((item) => byId.get(item.id) ?? item))
      if (updates.length) logActivity("Médico", "Alertas reconhecidos", "Central de alertas", `${updates.length} alertas`)
    } catch (error) { setDataError(error instanceof ApiError ? error.message : "Não foi possível atualizar os alertas.") }
  }

  const handleSalvarPrescricao = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const paciente = pacientes.find((patient) => patient.id === prescriptionForm.pacienteId)
    const quantidade = Number(prescriptionForm.quantidade)
    if (!paciente || !prescriptionForm.medicamento.trim() || !prescriptionForm.dosagem.trim() || !Number.isFinite(quantidade) || quantidade < 1) return
    try {
      let medication = medications.find((item) => item.nome.toLocaleLowerCase("pt-BR") === prescriptionForm.medicamento.trim().toLocaleLowerCase("pt-BR") && item.dosagem === prescriptionForm.dosagem.trim())
      if (!medication) medication = await api.createMedication({ nome: prescriptionForm.medicamento.trim(), dosagem: prescriptionForm.dosagem.trim(), ativo: true }, token)
      const now = new Date()
      const data = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
      const bed = registeredBeds.find((item) => item.status === "Ocupado" && item.pacienteId === paciente.id)
      const attendance = await api.createAttendance({ data, tipo: "CONSULTA_MEDICA", descricao: `Prescrição médica para ${paciente.nome}`, status: "CONCLUIDO", leitoId: bed ? Number(bed.id) : null, pacienteId: Number(paciente.id), funcionarioResponsavelId: userId, medicoResponsavelId: userId }, token)
      const prescription = await api.createPrescription({ data, observacao: null, status: "ATIVA", pacienteId: Number(paciente.id), medicoId: userId, atendimentoId: attendance.id }, token)
      const item = await api.createPrescriptionItem({ prescricaoId: prescription.id, medicamentoId: medication.id, dose: prescriptionForm.dosagem.trim(), viaAdministracao: prescriptionForm.via, frequencia: prescriptionForm.frequencia.trim(), duracao: prescriptionForm.duracao.trim(), observacoes: `Horário: ${prescriptionForm.horario}; quantidade: ${quantidade}` }, token)
      setApiPrescriptions((current) => [...mapPrescriptions([prescription], [item], [medication], doctorProfile ? [doctorProfile] : []), ...current])
      logActivity("Médico", "Prescrição registrada", paciente.id, `${medication.nome} · ${prescriptionForm.dosagem}`)
      setPrescriptionForm({ pacienteId: paciente.id, medicamento: "", dosagem: "", via: "Oral", horario: "08:00", frequencia: "1x ao dia", duracao: "7 dias", quantidade: "7" })
      setShowPrescriptionForm(false)
    } catch (error) { setDataError(error instanceof ApiError ? error.message : "Não foi possível registrar a prescrição na API.") }
  }

  const handleReagendarConsulta = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!rescheduleAppointmentId || !rescheduleForm.data || !rescheduleForm.hora) return
    const appointment = receptionAppointments.find((item) => item.id === rescheduleAppointmentId)
    if (!appointment || appointment.status === "Concluída" || appointment.status === "Em atendimento") return
    const conflict = receptionAppointments.some((item) => item.id !== rescheduleAppointmentId && item.medicoId === appointment.medicoId && item.data === rescheduleForm.data && item.hora === rescheduleForm.hora)
    if (conflict) {
      setRescheduleError("Este horário já está ocupado na agenda do médico.")
      return
    }
    try {
      const dto = (await api.listAppointments(token)).find((item) => String(item.id) === rescheduleAppointmentId)
      if (!dto) throw new Error("Consulta não encontrada na API.")
      await api.updateAppointment(dto.id, { ...dto, data: rescheduleForm.data, horario: rescheduleForm.hora }, token)
      setReceptionAppointments((current) => current.map((item) => item.id === rescheduleAppointmentId ? { ...item, ...rescheduleForm } : item))
      logActivity("Médico", "Consulta reagendada", appointment.pacienteId ?? appointment.paciente, `${rescheduleForm.data} · ${rescheduleForm.hora}`)
      setRescheduleAppointmentId(null); setRescheduleError("")
    } catch (error) { setRescheduleError(error instanceof ApiError ? error.message : "Não foi possível salvar o reagendamento.") }
  }

  const handleIniciarConsulta = async (appointmentId: string) => {
    const appointment = receptionAppointments.find((item) => item.id === appointmentId)
    if (!appointment || appointment.status === "Concluída") return
    try {
      const dto = (await api.listAppointments(token)).find((item) => String(item.id) === appointmentId)
      if (!dto) throw new Error("Consulta não encontrada na API.")
      await api.updateAppointment(dto.id, { ...dto, status: "EM_ATENDIMENTO" }, token)
      setReceptionAppointments((current) => current.map((item) => item.id === appointmentId ? { ...item, status: "Em atendimento" } : item))
      logActivity("Médico", "Atendimento iniciado", appointment.pacienteId ?? appointment.paciente, `${appointment.id} · ${appointment.hora}`)
      if (appointment.pacienteId) goToPatient(appointment.pacienteId)
    } catch (error) { setDataError(error instanceof ApiError ? error.message : "Não foi possível iniciar o atendimento.") }
  }

  const handleConcluirConsulta = async (appointmentId: string) => {
    const appointment = receptionAppointments.find((item) => item.id === appointmentId)
    if (!appointment || appointment.status !== "Em atendimento") return
    try {
      const dto = (await api.listAppointments(token)).find((item) => String(item.id) === appointmentId)
      if (!dto) throw new Error("Consulta não encontrada na API.")
      await api.updateAppointment(dto.id, { ...dto, status: "CONCLUIDA" }, token)
      setReceptionAppointments((current) => current.map((item) => item.id === appointmentId ? { ...item, status: "Concluída" } : item))
      logActivity("Médico", "Atendimento concluído", appointment.pacienteId ?? appointment.paciente, `${appointment.id} · ${appointment.hora}`)
    } catch (error) { setDataError(error instanceof ApiError ? error.message : "Não foi possível concluir o atendimento.") }
  }

  const handleDarAlta = async (patientId: string, admissionId: string, bedNumber: string) => {
    const bed = registeredBeds.find((item) => item.status === "Ocupado" && item.pacienteId === patientId && item.numero === bedNumber)
    if (!bed) return
    try {
      const date = localDateInputValue()
      const [internment, bedDto] = await Promise.all([api.listInternments(token).then((items) => items.find((item) => String(item.id) === admissionId)), api.getBed(Number(bed.id), token)])
      if (!internment) throw new Error("Internação não encontrada na API.")
      await api.updateInternment(internment.id, { ...internment, dataAlta: date, status: "ALTA" }, token)
      await api.updateBed(bedDto.id, { ...bedDto, status: "HIGIENIZACAO" }, token)
      setRegisteredBeds((current) => current.map((item) => item.id === bed.id ? { ...item, status: "Higienização", pacienteId: undefined } : item))
      setHospitalizations((current) => current.map((item) => item.id === admissionId ? { ...item, status: "Alta", dataAlta: date } : item))
      logActivity("Médico", "Alta registrada", patientId, `Leito ${bedNumber} · ${date}`)
      setAltaEmConfirmacaoId(null)
    } catch (error) { setDataError(error instanceof ApiError ? error.message : "Não foi possível registrar a alta.") }
  }

  const handleSolicitarExame = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const patient = pacientes.find((item) => item.id === examForm.pacienteId)
    if (!patient || !examForm.nome.trim()) return
    try {
      const now = new Date()
      const dataSolicitacao = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
      const bed = registeredBeds.find((item) => item.status === "Ocupado" && item.pacienteId === patient.id)
      const attendance = await api.createAttendance({ data: dataSolicitacao, tipo: "SOLICITACAO_EXAME", descricao: examForm.nome.trim(), status: "PENDENTE", leitoId: bed ? Number(bed.id) : null, pacienteId: Number(patient.id), funcionarioResponsavelId: userId, medicoResponsavelId: userId }, token)
      let saved: SharedExamRequest
      if (examForm.tipo === "ExameLaboratorial") {
        const result = await api.createLabExam({ dataSolicitacao, status: "SOLICITADO", observacoes: null, tipoAnalise: examForm.nome.trim(), amostra: examForm.amostra.trim(), metodo: examForm.metodo.trim(), pacienteId: Number(patient.id), medicoId: userId, atendimentoId: attendance.id }, token)
        saved = { id: String(result.id), tipo: "ExameLaboratorial", nome: result.tipoAnalise, pacienteId: patient.id, data: result.dataSolicitacao.slice(0, 10).split("-").reverse().join("/"), status: "agendado", resultado: result.observacoes, solicitante: doctorProfile?.nome ?? userName, medicoId: String(userId), atendimentoId: String(attendance.id), amostra: result.amostra, metodo: result.metodo }
      } else {
        const result = await api.createImageExam({ dataSolicitacao, status: "SOLICITADO", observacoes: null, modalidade: examForm.modalidade.trim(), regiaoCorpo: examForm.regiaoCorpo.trim(), arquivoDigital: null, pacienteId: Number(patient.id), medicoId: userId, atendimentoId: attendance.id }, token)
        saved = { id: String(result.id), tipo: "ExameImagem", nome: `${result.modalidade} · ${result.regiaoCorpo}`, pacienteId: patient.id, data: result.dataSolicitacao.slice(0, 10).split("-").reverse().join("/"), status: "agendado", resultado: result.observacoes, solicitante: doctorProfile?.nome ?? userName, medicoId: String(userId), atendimentoId: String(attendance.id), modalidade: result.modalidade, regiaoCorpo: result.regiaoCorpo }
      }
      setExames((current) => [saved, ...current])
      logActivity("Médico", "Exame solicitado", patient.id, `${saved.nome} · ${saved.id}`)
      setExamForm({ pacienteId: "", nome: "", tipo: "ExameLaboratorial", amostra: "", metodo: "", modalidade: "", regiaoCorpo: "" })
      setShowExamForm(false)
    } catch (error) { setDataError(error instanceof ApiError ? error.message : "Não foi possível registrar a solicitação de exame na API.") }
  }
  const handleSalvarResultadoExame = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const exam = examesLocais.find((item) => item.id === resultExamId)
    const resultText = examResultDraft.trim()
    if (!exam || !resultText || exam.tipo === "ECG") return
    try {
      if (exam.tipo === "ExameLaboratorial") {
        const dto = (await api.listLabExams(token)).find((item) => String(item.id) === exam.id)
        if (!dto) throw new Error("Exame laboratorial não encontrado na API.")
        await api.updateLabExam(dto.id, { ...dto, status: "RESULTADO", observacoes: resultText }, token)
      } else {
        const dto = (await api.listImageExams(token)).find((item) => String(item.id) === exam.id)
        if (!dto) throw new Error("Exame de imagem não encontrado na API.")
        await api.updateImageExam(dto.id, { ...dto, status: "RESULTADO", observacoes: resultText }, token)
      }
      setExames((current) => current.map((item) => item.id === exam.id ? { ...item, status: "resultado", resultado: resultText } : item))
      logActivity("Médico", "Resultado de exame registrado", exam.pacienteId, `${exam.nome} · ${exam.id}`)
      setResultExamId(null); setExamResultDraft("")
    } catch (error) { setDataError(error instanceof ApiError ? error.message : "Não foi possível registrar o resultado do exame.") }
  }
  const handleSalvarEvolucaoClinica = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const description = evolutionDraft.trim()
    if (!selectedPaciente || !description) return
    try {
      const now = new Date()
      const data = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
      const bed = registeredBeds.find((item) => item.status === "Ocupado" && item.pacienteId === selectedPaciente.id)
      const attendance = await api.createAttendance({ data, tipo: "CONSULTA_MEDICA", descricao: description, status: "CONCLUIDO", leitoId: bed ? Number(bed.id) : null, pacienteId: Number(selectedPaciente.id), funcionarioResponsavelId: userId, medicoResponsavelId: userId }, token)
      const saved = await api.createClinicalRecord({ data, descricao: description, anamnese: null, exameFisico: null, diagnostico: null, conduta: null, observacao: null, medicoId: userId, atendimentoId: attendance.id }, token)
      const entry = { data: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(saved.data)), descricao: saved.descricao, perfil: "Médico" as const, profissional: userName }
      setEvolucoesClinicas((current) => ({ ...current, [selectedPaciente.id]: [entry, ...(current[selectedPaciente.id] ?? [])] }))
      logActivity("Médico", "Evolução clínica registrada", selectedPaciente.id, description.slice(0, 120))
      setEvolutionDraft(""); setShowEvolutionForm(false)
    } catch (error) { setDataError(error instanceof ApiError ? error.message : "Não foi possível registrar a evolução clínica na API.") }
  }
  // Navegação agrupada por assunto
  const tabs: { key: Tab; label: string; group: string }[] = [
    { key: "overview", label: "Visão Geral", group: "Clínico" },
    { key: "atendimento", label: "Pacientes", group: "Clínico" },
    { key: "monitoramento", label: "Monitoramento", group: "Clínico" },
    { key: "alertas", label: "Alertas", group: "Clínico" },
    { key: "prescricao", label: "Prescrições", group: "Condutas" },
    { key: "exames", label: "Exames", group: "Condutas" },
    { key: "agenda", label: "Agenda Médica", group: "Gestão" },
    { key: "internacao", label: "Internações", group: "Gestão" },
    { key: "atividades", label: "Registro de Atividades", group: "Gestão" },
  ]
  const activeTabInfo = tabs.find((tab) => tab.key === activeTab)

  // ---- Apresentação (somente leitura dos dados já calculados acima) ----
  const riskTone = (risk: string): Tone => (risk === "high" ? "danger" : risk === "medium" ? "warning" : risk === "low" ? "success" : "neutral")
  const riskLabel = (risk: string) => riskColor[risk as keyof typeof riskColor]?.label ?? "Sem leitura"
  const riskIcon = (risk: string) => (risk === "high" ? "alert" : risk === "medium" ? "info" : risk === "low" ? "checkCircle" : "info")
  const latestVitalsFor = (id: string) => {
    const saved = evolucoesClinicas[id]?.find((entry) => entry.fc !== undefined || entry.temp !== undefined || entry.spo2 !== undefined || entry.pressao !== undefined)
    const live = liveVitals[id]
    if (!live) return saved
    return {
      ...saved,
      fc: live.heartRate ?? saved?.fc,
      temp: live.temperature ?? saved?.temp,
      spo2: live.oxygen ?? saved?.spo2,
      pressao: live.systolic !== undefined && live.diastolic !== undefined ? `${live.systolic}/${live.diastolic}` : saved?.pressao,
    }
  }
  const examTypeMeta = (tipo: string) =>
    tipo === "ExameLaboratorial"
      ? { label: "Laboratorial", icon: "exames", tone: "info" as Tone }
      : tipo === "ExameImagem"
        ? { label: "Imagem", icon: "image", tone: "violet" as Tone }
        : { label: "ECG", icon: "ecg", tone: "success" as Tone }
  const examStatusMeta = (exam: { status: string; hora?: string }) =>
    exam.status === "resultado"
      ? { label: "Resultado disponível", icon: "checkCircle", tone: "success" as Tone }
      : exam.status === "em andamento"
        ? { label: "Em andamento", icon: "clock", tone: "warning" as Tone }
        : exam.hora === "A definir"
          ? { label: "Solicitado", icon: "send", tone: "neutral" as Tone }
          : { label: "Agendado", icon: "agenda", tone: "info" as Tone }
  const appointmentTone = (status: string): Tone => (status === "Concluída" ? "success" : status === "Em atendimento" ? "warning" : "info")
  const formatAgendaDate = (value: string) => {
    if (value === localDateInputValue()) return "Hoje"
    const parsed = parseDisplayDate(value)
    return parsed ? new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(parsed) : value
  }
  const openPrescriptionFor = (patientId: string) => {
    setPrescriptionForm((current) => ({ ...current, pacienteId: patientId }))
    setShowPrescriptionForm(true)
    setActiveTab("prescricao")
  }
  const openExamFor = (patientId: string) => {
    setExamForm((current) => ({ ...current, pacienteId: patientId }))
    setShowExamForm(true)
    setActiveTab("exames")
  }
  const isPrescriptionActive = (rx: (typeof todasPrescricoes)[number]) => rx.itens.some((item) => !medicacoesAdministradas.includes(item.id))
  const prescricoesAtivas = todasPrescricoes.filter(isPrescriptionActive)
  const prescricoesHistorico = todasPrescricoes.filter((rx) => !isPrescriptionActive(rx))
  const itensPendentes = todasPrescricoes.reduce((total, rx) => total + rx.itens.filter((item) => !medicacoesAdministradas.includes(item.id)).length, 0)
  const pacientesAtencao = pacientesDoMedico.filter((patient) => getPatientRisk(patient) !== "low").sort((a, b) => (getPatientRisk(a) === "high" ? -1 : 0) - (getPatientRisk(b) === "high" ? -1 : 0))
  const examesVisiveis = examTypeFilter === "todos" ? todosExames : todosExames.filter((exam) => exam.tipo === examTypeFilter)
  const agendaPorData = agendaExibida.reduce<{ data: string; itens: typeof agendaExibida }[]>((groups, item) => {
    const group = groups.find((entry) => entry.data === item.data)
    if (group) group.itens.push(item)
    else groups.push({ data: item.data, itens: [item] })
    return groups
  }, [])
  const itemHorario = (item: object) => ("horario" in item && typeof item.horario === "string" ? item.horario : "")
  const selectedEvolutionCount = selectedPaciente ? (evolucoesClinicas[selectedPaciente.id] ?? []).length : 0
  const inputStyle = { background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }
  const labelClass = "flex min-w-0 flex-col gap-1.5 text-xs font-semibold"

  return (
    <div className="role-medico min-h-screen" style={{ background: "var(--background)" }}>
      <AlertNotifications alerts={monitoringAlertsDoMedico} profile="Médico" onOpenAlerts={() => setActiveTab("alertas")} />
      <DashboardSidebar
        role="Médico"
        initials={userName.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
        name={userName}
        detail={doctorProfile ? formatSpecialty(doctorProfile.especialidade) : "Médico"}
        tabs={tabs}
        activeTab={activeTab}
        onSelect={(key) => setActiveTab(key as Tab)}
        onLogout={() => onNavigate("login")}
        alertCount={alertasPendentes.length + monitoringPendingCount}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
      <div className="min-w-0 xl:ml-64">
        <DashboardHeader
          role="Médico"
          section={activeTabInfo?.label ?? ""}
          name={userName}
          detail={doctorProfile ? formatSpecialty(doctorProfile.especialidade) : "Médico"}
          initials={userName.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
          theme={theme}
          onToggleTheme={onToggleTheme}
          alertCount={alertasPendentes.length + monitoringPendingCount}
          onOpenAlerts={() => setActiveTab("alertas")}
        />

        <SectionContext.Provider value={{ key: activeTab, label: activeTabInfo?.label ?? "", group: activeTabInfo?.group, role: "Painel médico" }}>
        <main className="dashboard-main mx-auto w-full min-w-0 max-w-[1400px] flex-1 px-4 pb-36 pt-20 sm:px-6 sm:pb-24 xl:p-8">
          {dataLoading && <p role="status" className="mb-4 rounded-xl border px-4 py-3 text-sm" style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--muted-foreground)" }}>Carregando dados da API…</p>}
          {dataError && <p role="alert" className="mb-4 rounded-xl border px-4 py-3 text-sm" style={{ background: "var(--danger-surface)", borderColor: "var(--border)", color: "var(--danger-foreground)" }}>{dataError}</p>}
          <div className={activeTab === "monitoramento" ? "block" : "hidden"} aria-hidden={activeTab !== "monitoramento"}>
            <VitalMonitoring
              profile="Médico"
              onAlertsChange={setMonitoringAlerts}
              acknowledgedAlerts={monitoringAcknowledged}
              setAcknowledgedAlerts={setMonitoringAcknowledged}
              patients={monitorPatients}
              liveVitals={liveVitals}
            />
          </div>
          {activeTab === "overview" && (
            <div className="fade-in">
              <HeroHeader
                eyebrow={`Painel clínico · ${shiftLabel()}`}
                title={`${greeting()}, Dr. ${doctorProfile?.nome ?? userName}`}
                subtitle={`${formatLongLocalDate()} · ${doctorProfile ? formatSpecialty(doctorProfile.especialidade) : "Agenda clínica"}${doctorProfile?.crm ? ` · CRM ${doctorProfile.crm}` : ""}`}
                aside={
                  <div className="hero-actions grid grid-cols-3 gap-2 lg:flex lg:flex-wrap">
                    <QuickAction variant="hero" icon="prescricao" label="Nova prescrição" onClick={() => openPrescriptionFor(pacientesDoMedico[0]?.id ?? "")} />
                    <QuickAction variant="hero" icon="exames" label="Solicitar exame" onClick={() => openExamFor(pacientesDoMedico[0]?.id ?? "")} />
                    <QuickAction variant="hero" icon="monitoramento" label="Monitoramento" onClick={() => setActiveTab("monitoramento")} />
                  </div>
                }
              >
                <div className="keep-2-cols grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                  <HeroStat label="Atendimentos hoje" value={consultasHoje.length} hint={`${consultasPendentesHoje} pendente${consultasPendentesHoje === 1 ? "" : "s"}`} />
                  <HeroStat label="Prescrições emitidas" value={todasPrescricoes.length} hint={`${itensPendentes} ite${itensPendentes === 1 ? "m" : "ns"} a administrar`} />
                  <HeroStat label="Exames pendentes" value={todosExames.filter((exam) => exam.status !== "resultado").length} hint="Aguardando resultado" />
                  <HeroStat label="Pacientes internados" value={internacoesExibidas.length} hint={`${alertasPendentes.length + monitoringPendingCount} alerta${alertasPendentes.length + monitoringPendingCount === 1 ? "" : "s"} pendente${alertasPendentes.length + monitoringPendingCount === 1 ? "" : "s"}`} />
                </div>
              </HeroHeader>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <SectionCard
                  className="lg:col-span-2"
                  title="Agenda de hoje"
                  description={`${agendaExibida.length} consulta${agendaExibida.length === 1 ? "" : "s"} na agenda do médico`}
                  icon="agenda"
                  action={<button type="button" onClick={() => setActiveTab("agenda")} className="min-h-9 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--secondary)", color: "var(--primary)" }}>Abrir agenda</button>}
                >
                  {consultasHoje.length ? (
                    <ol>
                      {consultasHoje.map((appointment, index) => (
                        <TimelineItem
                          key={appointment.key}
                          last={index === consultasHoje.length - 1}
                          tone={appointmentTone(appointment.status)}
                          title={<span className="flex items-center gap-2"><span className="font-mono tabular-nums" style={{ color: "var(--role-strong)" }}>{appointment.hora}</span>{appointment.paciente}</span>}
                          meta={<StatusBadge tone={appointmentTone(appointment.status)} size="sm">{appointment.status}</StatusBadge>}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span>{appointment.tipo} · {appointment.local}</span>
                            {appointment.pacienteId && (
                              <button type="button" onClick={() => goToPatient(appointment.pacienteId)} className="inline-flex min-h-8 items-center gap-1 text-xs font-semibold" style={{ color: "var(--primary)" }}>
                                Prontuário <UiIcon name="arrowRight" size={14} />
                              </button>
                            )}
                          </div>
                        </TimelineItem>
                      ))}
                    </ol>
                  ) : (
                    <EmptyState icon="agenda" title="Nenhuma consulta para hoje" description="As consultas marcadas pela recepção aparecerão aqui." />
                  )}
                </SectionCard>

                <SectionCard
                  className="order-first lg:order-none"
                  title="Alertas prioritários"
                  description="Requerem avaliação médica"
                  icon="alert"
                  tone={alertasPendentes.length + monitoringPendingCount ? "danger" : "success"}
                  action={<button type="button" onClick={() => setActiveTab("alertas")} className="min-h-9 rounded-lg px-2 text-xs font-semibold" style={{ color: "var(--primary)" }}>Ver todos</button>}
                  bodyClassName="p-3"
                >
                  {alertasPendentes.length + monitoringPendingCount ? (
                    <ul className="space-y-2">
                      {alertasPendentes.map((alert) => {
                        const patient = pacientes.find((item) => item.id === alert.pacienteId)
                        const tone = riskTone(alert.severity)
                        return (
                          <li key={alert.id}>
                            <button
                              type="button"
                              onClick={() => patient && goToPatient(patient.id)}
                              className="list-row relative flex w-full items-start gap-3 overflow-hidden rounded-xl border p-3 pl-4 text-left"
                              style={{ background: "var(--card)", borderColor: "var(--border)" }}
                            >
                              <span className="absolute inset-y-0 left-0 w-1" style={{ background: toneStyles[tone].solid }} aria-hidden="true" />
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center justify-between gap-2">
                                  <span className="break-words text-sm font-semibold" style={{ color: "var(--foreground)" }}>{alert.titulo}</span>
                                  <StatusBadge tone={tone} size="sm">{riskLabel(alert.severity)}</StatusBadge>
                                </span>
                                <span className="mt-0.5 block break-words text-xs" style={{ color: "var(--muted-foreground)" }}>{patient?.nome} · {alert.local}</span>
                                <span className="mt-1 block text-xs font-semibold tabular-nums" style={{ color: toneStyles[tone].fg }}>{alert.valor} {alert.label} · {alert.horario}</span>
                              </span>
                            </button>
                          </li>
                        )
                      })}
                      {monitoringPendingCount > 0 && (
                        <li>
                          <button type="button" onClick={() => setActiveTab("alertas")} className="list-row flex w-full items-center gap-3 rounded-xl border p-3 text-left text-xs font-semibold" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
                            <UiIcon name="monitoramento" size={16} />
                            {monitoringPendingCount} alerta{monitoringPendingCount === 1 ? "" : "s"} do monitoramento
                          </button>
                        </li>
                      )}
                    </ul>
                  ) : (
                    <EmptyState icon="checkCircle" title="Nenhum alerta pendente" description="Todos os alertas clínicos foram reconhecidos." />
                  )}
                </SectionCard>

                <SectionCard
                  className="lg:col-span-3"
                  title="Pacientes que exigem atenção"
                  description="Ordenados por criticidade · últimos sinais vitais registrados"
                  icon="atendimento"
                  action={<button type="button" onClick={() => setActiveTab("atendimento")} className="min-h-9 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--secondary)", color: "var(--primary)" }}>Todos os pacientes</button>}
                  bodyClassName="p-2 sm:p-3"
                >
                  {pacientesAtencao.length ? (
                    <ul className="space-y-1">
                      {pacientesAtencao.map((patient) => {
                        const risk = getPatientRisk(patient)
                        const vitals = latestVitalsFor(patient.id)
                        return (
                          <li key={patient.id}>
                            <button type="button" onClick={() => goToPatient(patient.id)} className="list-row grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-transparent p-2.5 text-left sm:grid-cols-[auto_minmax(0,1.2fr)_minmax(0,1fr)_auto]">
                              <Avatar initials={patient.avatar} tone={riskTone(risk)} />
                              <span className="min-w-0">
                                <span className="block break-words text-sm font-semibold" style={{ color: "var(--foreground)" }}>{patient.nome}</span>
                                <span className="block break-words text-xs" style={{ color: "var(--muted-foreground)" }}>{patient.leito !== "—" ? `Leito ${patient.leito}` : "Sem leito"} · {patient.condicao}</span>
                              </span>
                              <span className="col-span-3 row-start-2 flex gap-3 pl-[52px] text-xs tabular-nums sm:col-span-1 sm:row-start-auto sm:pl-0" style={{ color: "var(--muted-foreground)" }}>
                                <span>PA <strong style={{ color: "var(--foreground)" }}>{vitals?.pressao ?? "—"}</strong></span>
                                <span>FC <strong style={{ color: "var(--foreground)" }}>{vitals?.fc ?? "—"}</strong></span>
                                <span>SpO₂ <strong style={{ color: vitals?.spo2 !== undefined && vitals.spo2 < 94 ? "var(--danger-foreground)" : "var(--foreground)" }}>{vitals?.spo2 !== undefined ? vitals.spo2 + "%" : "—"}</strong></span>
                              </span>
                              <StatusBadge tone={riskTone(risk)} icon={riskIcon(risk)} size="sm">{riskLabel(risk)}</StatusBadge>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <EmptyState icon="checkCircle" title="Nenhum paciente em atenção" description="Todos os pacientes estão estáveis." />
                  )}
                </SectionCard>

              </div>
            </div>
          )}

          {activeTab === "atendimento" && (
            <div className="fade-in">
              <PageTitle
                title="Pacientes"
                subtitle="Prontuário eletrônico, sinais vitais e evolução clínica"
                meta={
                  <>
                    <MetaItem icon="atendimento" label="Pacientes" value={pacientesDoMedico.length} />
                    <MetaItem icon="alert" label="Críticos" value={pacientesDoMedico.filter((patient) => getPatientRisk(patient) === "high").length} tone="danger" />
                    <MetaItem icon="info" label="Em atenção" value={pacientesDoMedico.filter((patient) => getPatientRisk(patient) === "medium").length} tone="warning" />
                    <MetaItem icon="internacao" label="Com leito" value={pacientesDoMedico.filter((patient) => patient.leito !== "—").length} tone="info" />
                  </>
                }
              />
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(300px,360px)_minmax(0,1fr)]">
                <SectionCard title="Lista de pacientes" description={`${filteredPatients.length} de ${pacientesDoMedico.length} exibidos`} icon="consulta-paciente" bodyClassName="p-3">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }}>
                      <UiIcon name="search" size={16} />
                    </span>
                    <input
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      placeholder="Nome, código ou condição"
                      aria-label="Buscar paciente"
                      className="h-11 w-full rounded-xl border pl-9 pr-3 text-sm outline-none"
                      style={inputStyle}
                    />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <select value={patientSectorFilter} onChange={(event) => setPatientSectorFilter(event.target.value)} aria-label="Filtrar pacientes por setor" className="h-10 min-w-0 rounded-lg border px-2 text-xs" style={inputStyle}>
                      <option value="todos">Todos os setores</option>
                      {patientSectors.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
                    </select>
                    <select value={patientBedFilter} onChange={(event) => setPatientBedFilter(event.target.value)} aria-label="Filtrar pacientes por leito" className="h-10 min-w-0 rounded-lg border px-2 text-xs" style={inputStyle}>
                      <option value="todos">Todos os leitos</option>
                      {patientBeds.map((bed) => <option key={bed} value={bed}>Leito {bed}</option>)}
                    </select>
                    <select value={patientRiskFilter} onChange={(event) => setPatientRiskFilter(event.target.value)} aria-label="Filtrar pacientes por criticidade" className="h-10 min-w-0 rounded-lg border px-2 text-xs" style={inputStyle}>
                      <option value="todos">Criticidade</option>
                      <option value="low">Baixa</option>
                      <option value="medium">Moderada</option>
                      <option value="high">Crítica</option>
                    </select>
                    <select value={patientStatusFilter} onChange={(event) => setPatientStatusFilter(event.target.value)} aria-label="Filtrar pacientes por situação clínica" className="h-10 min-w-0 rounded-lg border px-2 text-xs" style={inputStyle}>
                      <option value="todos">Situação</option>
                      <option value="estável">Estável</option>
                      <option value="atenção">Atenção</option>
                      <option value="crítico">Crítico</option>
                    </select>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {filteredPatients.map((p) => {
                      const risk = getPatientRisk(p)
                      const active = selectedPaciente?.id === p.id
                      return (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedPaciente(p)}
                            aria-pressed={active}
                            className="list-row flex w-full items-center gap-3 rounded-xl border p-2.5 text-left"
                            style={{
                              background: active ? "var(--role-soft)" : "var(--card)",
                              borderColor: active ? "var(--role)" : "var(--border)",
                            }}
                          >
                            <Avatar initials={p.avatar} tone={riskTone(risk)} />
                            <span className="min-w-0 flex-1">
                              <span className="block break-words text-sm font-semibold" style={{ color: "var(--foreground)" }}>{p.nome}</span>
                              <span className="block break-words text-xs" style={{ color: "var(--muted-foreground)" }}>
                                {p.leito !== "—" ? `Leito ${p.leito}` : "Sem leito"} · {p.condicao}
                              </span>
                            </span>
                            <StatusBadge tone={riskTone(risk)} size="sm">{riskLabel(risk)}</StatusBadge>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                  {filteredPatients.length === 0 && (
                    <div className="mt-3">
                      <EmptyState icon="search" title="Nenhum paciente encontrado" description="Ajuste a busca ou os filtros para ver outros pacientes." />
                    </div>
                  )}
                </SectionCard>

                <div className="min-w-0">
                  {selectedPaciente ? (
                    <div className="slide-up flex flex-col gap-5">
                      <section className="overflow-hidden rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }} aria-label={`Prontuário de ${selectedPaciente.nome}`}>
                        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center" style={{ background: "linear-gradient(120deg, var(--role-soft), var(--card) 70%)" }}>
                          <Avatar initials={selectedPaciente.avatar} size="lg" tone={riskTone(getPatientRisk(selectedPaciente))} solid />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="text-xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>{selectedPaciente.nome}</h2>
                              <StatusBadge tone={riskTone(getPatientRisk(selectedPaciente))} icon={riskIcon(getPatientRisk(selectedPaciente))}>{riskLabel(getPatientRisk(selectedPaciente))}</StatusBadge>
                            </div>
                            <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
                              <span className="font-mono">{selectedPaciente.id}</span> · {selectedPaciente.idade} anos · {selectedPaciente.sexo === "M" ? "Masculino" : "Feminino"} · {selectedPaciente.condicao}
                            </p>
                            <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                              {selectedPaciente.leito !== "—" ? `Leito ${selectedPaciente.leito} · ${selectedPaciente.setor}` : "Sem internação ativa"} · Último atendimento: {selectedPaciente.ultimo}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => openPrescriptionFor(selectedPaciente.id)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                              <UiIcon name="plus" size={15} /> Prescrever
                            </button>
                            <button type="button" onClick={() => openExamFor(selectedPaciente.id)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--secondary)", color: "var(--primary)" }}>
                              <UiIcon name="exames" size={15} /> Solicitar exame
                            </button>
                          </div>
                        </div>
                        <div className="border-t p-5" style={{ borderColor: "var(--border)" }}>
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>Últimos sinais vitais</p>
                          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                            <VitalTile icon="gauge" label="Pressão arterial" value={selectedLatestVitals?.pressao ?? "—"} unit="mmHg" />
                            <VitalTile icon="heart" label="Freq. cardíaca" value={selectedLatestVitals?.fc ?? "—"} unit="bpm" alert={selectedLatestVitals?.fc !== undefined && selectedLatestVitals.fc > 100} />
                            <VitalTile icon="thermometer" label="Temperatura" value={selectedLatestVitals?.temp ?? "—"} unit="°C" alert={selectedLatestVitals?.temp !== undefined && selectedLatestVitals.temp >= 38} />
                            <VitalTile icon="droplet" label="SpO₂" value={selectedLatestVitals?.spo2 ?? "—"} unit="%" alert={selectedLatestVitals?.spo2 !== undefined && selectedLatestVitals.spo2 < 94} />
                          </div>
                          <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 border-t pt-4 md:grid-cols-3" style={{ borderColor: "var(--border)" }}>
                            <KeyValue label="Nascimento" value={selectedPaciente.dataNasc} />
                            <KeyValue label="Tipo sanguíneo" value={selectedPaciente.tipoSanguineo} />
                            <KeyValue label="Convênio" value={selectedPaciente.convenio} />
                            <KeyValue label="Telefone" value={selectedPaciente.telefone} />
                            <KeyValue label="CPF" value={selectedPaciente.cpf} mono />
                            <KeyValue label="Setor" value={selectedPaciente.setor} />
                          </dl>
                        </div>
                      </section>

                      <SectionCard
                        title="Evolução clínica"
                        description={`${selectedEvolutionCount} registro${selectedEvolutionCount === 1 ? "" : "s"} · médicos e profissionais de enfermagem`}
                        icon="evolucao"
                        action={
                          <button
                            type="button"
                            onClick={() => setShowEvolutionForm((current) => !current)}
                            aria-expanded={showEvolutionForm}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold"
                            style={{ background: showEvolutionForm ? "var(--secondary)" : "var(--primary)", color: showEvolutionForm ? "var(--primary)" : "var(--primary-foreground)" }}
                          >
                            {showEvolutionForm ? "Fechar" : <><UiIcon name="plus" size={14} /> Nova evolução</>}
                          </button>
                        }
                      >
                        {showEvolutionForm && (
                          <form onSubmit={handleSalvarEvolucaoClinica} className="slide-up mb-5 flex flex-col gap-3 rounded-xl border p-4" style={{ background: "var(--background)", borderColor: "var(--border)" }}>
                            <label className={labelClass} style={{ color: "var(--foreground)" }}>
                              Anotação médica para {selectedPaciente.nome}
                              <textarea required value={evolutionDraft} onChange={(event) => setEvolutionDraft(event.target.value)} rows={4} placeholder="Registre a avaliação, conduta ou observação clínica" className="min-h-24 rounded-lg border p-3 text-sm font-normal" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }} />
                            </label>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Responsável: {userName} · data e hora preenchidas automaticamente</span>
                              <div className="flex gap-2">
                                <button type="button" onClick={() => { setShowEvolutionForm(false); setEvolutionDraft("") }} className="min-h-10 rounded-lg px-4 text-sm font-semibold" style={{ background: "var(--secondary)", color: "var(--primary)" }}>Cancelar</button>
                                <button type="submit" disabled={!evolutionDraft.trim()} className="min-h-10 rounded-lg px-4 text-sm font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Salvar evolução</button>
                              </div>
                            </div>
                          </form>
                        )}
                        {(evolucoesClinicas[selectedPaciente.id] ?? []).length ? (
                          <ol>
                            {(evolucoesClinicas[selectedPaciente.id] ?? []).map((rc, i, list) => (
                              <TimelineItem
                                key={i}
                                last={i === list.length - 1}
                                tone={rc.perfil === "Enfermagem" ? "success" : "role"}
                                title={rc.perfil === "Médico" ? "Evolução médica" : rc.perfil === "Enfermagem" ? "Evolução de enfermagem" : "Atendimento clínico"}
                                meta={rc.data}
                              >
                                <p style={{ color: "var(--foreground)" }}>{rc.descricao}</p>
                                {(rc.pressao || rc.fc !== undefined || rc.spo2 !== undefined) && (
                                  <p className="mt-1 text-xs tabular-nums">
                                    {rc.pressao && `PA ${rc.pressao} · `}{rc.fc !== undefined && `FC ${rc.fc} bpm · `}{rc.temp !== undefined && `${rc.temp} °C · `}{rc.spo2 !== undefined && `SpO₂ ${rc.spo2}%`}
                                  </p>
                                )}
                                {rc.profissional && <p className="mt-1 text-xs font-medium">{rc.profissional}</p>}
                              </TimelineItem>
                            ))}
                          </ol>
                        ) : (
                          <EmptyState icon="evolucao" title="Sem evoluções registradas" description="Use “Nova evolução” para registrar a primeira anotação." />
                        )}
                      </SectionCard>
                    </div>
                  ) : (
                    <EmptyState icon="atendimento" title="Selecione um paciente" description="O prontuário, os sinais vitais e a evolução clínica serão exibidos aqui." />
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "prescricao" && (
            <div className="fade-in">
              <PageTitle
                title="Prescrições"
                subtitle="Prescrições médicas, itens emitidos e situação da administração pela equipe de enfermagem"
                action={
                  <button
                    type="button"
                    onClick={() => setShowPrescriptionForm((current) => !current)}
                    aria-expanded={showPrescriptionForm}
                    className="inline-flex h-11 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold"
                    style={{ background: showPrescriptionForm ? "var(--secondary)" : "var(--primary)", color: showPrescriptionForm ? "var(--primary)" : "var(--primary-foreground)" }}
                  >
                    {showPrescriptionForm ? "Fechar formulário" : <><UiIcon name="plus" size={16} /> Nova prescrição</>}
                  </button>
                }
                meta={
                  <>
                    <MetaItem icon="prescricao" label="Ativas" value={prescricoesAtivas.length} tone="info" />
                    <MetaItem icon="clock" label="Itens a administrar" value={itensPendentes} tone="warning" />
                    <MetaItem icon="checkCircle" label="Concluídas" value={prescricoesHistorico.length} tone="success" />
                  </>
                }
              />
              {showPrescriptionForm && (
                <SectionCard title="Nova prescrição" description="A prescrição será registrada no sistema e vinculada ao atendimento do paciente." icon="prescricao" className="slide-up mb-5">
                  <form onSubmit={handleSalvarPrescricao} className="flex flex-col gap-5">
                    <FormSection step={1} title="Paciente e medicamento">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <label className={labelClass + " sm:col-span-2"} style={{ color: "var(--foreground)" }}>Paciente
                          <select required value={prescriptionForm.pacienteId} onChange={(event) => setPrescriptionForm({ ...prescriptionForm, pacienteId: event.target.value })} className="min-h-11 rounded-lg border px-3 text-sm font-normal" style={inputStyle}>
                            {pacientes.map((patient) => <option key={patient.id} value={patient.id}>{patient.nome} · {patient.id}</option>)}
                          </select>
                        </label>
                        <label className={labelClass} style={{ color: "var(--foreground)" }}>Medicamento
                          <input required value={prescriptionForm.medicamento} onChange={(event) => setPrescriptionForm({ ...prescriptionForm, medicamento: event.target.value })} placeholder="Nome do medicamento" className="min-h-11 rounded-lg border px-3 text-sm font-normal" style={inputStyle} />
                        </label>
                        <label className={labelClass} style={{ color: "var(--foreground)" }}>Dosagem
                          <input required value={prescriptionForm.dosagem} onChange={(event) => setPrescriptionForm({ ...prescriptionForm, dosagem: event.target.value })} placeholder="Ex.: 500 mg" className="min-h-11 rounded-lg border px-3 text-sm font-normal" style={inputStyle} />
                        </label>
                      </div>
                    </FormSection>
                    <FormSection step={2} title="Posologia" description="Via, horário de início e duração do tratamento">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        <label className={labelClass} style={{ color: "var(--foreground)" }}>Via de administração
                          <select value={prescriptionForm.via} onChange={(event) => setPrescriptionForm({ ...prescriptionForm, via: event.target.value })} className="min-h-11 rounded-lg border px-3 text-sm font-normal" style={inputStyle}>
                            <option>Oral</option><option>IV</option><option>IM</option><option>SC</option><option>Tópica</option>
                          </select>
                        </label>
                        <label className={labelClass} style={{ color: "var(--foreground)" }}>Horário inicial
                          <input required type="time" value={prescriptionForm.horario} onChange={(event) => setPrescriptionForm({ ...prescriptionForm, horario: event.target.value })} className="min-h-11 rounded-lg border px-3 text-sm font-normal" style={inputStyle} />
                        </label>
                        <label className={labelClass} style={{ color: "var(--foreground)" }}>Frequência
                          <input required value={prescriptionForm.frequencia} onChange={(event) => setPrescriptionForm({ ...prescriptionForm, frequencia: event.target.value })} placeholder="Ex.: 8/8h" className="min-h-11 rounded-lg border px-3 text-sm font-normal" style={inputStyle} />
                        </label>
                        <label className={labelClass} style={{ color: "var(--foreground)" }}>Duração
                          <input required value={prescriptionForm.duracao} onChange={(event) => setPrescriptionForm({ ...prescriptionForm, duracao: event.target.value })} placeholder="Ex.: 7 dias" className="min-h-11 rounded-lg border px-3 text-sm font-normal" style={inputStyle} />
                        </label>
                        <label className={labelClass} style={{ color: "var(--foreground)" }}>Quantidade
                          <input required type="number" min="1" value={prescriptionForm.quantidade} onChange={(event) => setPrescriptionForm({ ...prescriptionForm, quantidade: event.target.value })} className="min-h-11 rounded-lg border px-3 text-sm font-normal" style={inputStyle} />
                        </label>
                      </div>
                    </FormSection>
                    <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--border)" }}>
                      <p className="flex items-start gap-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        <UiIcon name="info" size={15} /> Confira os dados e a dose antes de salvar. A prescrição será registrada no banco de dados.
                      </p>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setShowPrescriptionForm(false)} className="min-h-11 flex-1 rounded-lg px-4 text-sm font-semibold sm:flex-none" style={{ background: "var(--secondary)", color: "var(--primary)" }}>Cancelar</button>
                        <button type="submit" className="min-h-11 flex-1 rounded-lg px-5 text-sm font-semibold sm:flex-none" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>Salvar prescrição</button>
                      </div>
                    </div>
                  </form>
                </SectionCard>
              )}

              {[
                { title: "Prescrições ativas", description: "Com itens aguardando administração", list: prescricoesAtivas, icon: "prescricao", empty: "Nenhuma prescrição ativa no momento." },
                { title: "Histórico", description: "Todos os itens já administrados", list: prescricoesHistorico, icon: "checkCircle", empty: "As prescrições concluídas aparecerão aqui." },
              ].map((group) => (
                <section key={group.title} className="mb-6" aria-label={group.title}>
                  <div className="mb-3 flex items-center gap-2">
                    <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>{group.title}</h2>
                    <span className="rounded-full px-2 text-xs font-semibold tabular-nums" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>{group.list.length}</span>
                    <span className="hidden text-xs sm:inline" style={{ color: "var(--muted-foreground)" }}>· {group.description}</span>
                  </div>
                  {group.list.length === 0 && <EmptyState icon={group.icon} title={group.empty} />}
                  <div className="flex flex-col gap-3">
                    {group.list.map((rx) => {
                      const pac = pacientes.find((p) => p.id === rx.pacienteId)
                      const pending = rx.itens.filter((item) => !medicacoesAdministradas.includes(item.id)).length
                      const isHistory = group.list === prescricoesHistorico
                      const open = !isHistory || expandedPrescricao === rx.id
                      return (
                        <article key={rx.id} className="overflow-hidden rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
                          <header className="flex flex-wrap items-center gap-3 border-b px-4 py-3.5 sm:px-5" style={{ borderColor: open ? "var(--border)" : "transparent", background: "color-mix(in srgb, var(--secondary) 40%, var(--card))" }}>
                            <Avatar initials={pac?.avatar ?? "--"} />
                            <div className="min-w-0 flex-1">
                              <p className="break-words text-sm font-semibold" style={{ color: "var(--foreground)" }}>{pac?.nome ?? rx.pacienteId}</p>
                              <p className="break-words text-xs" style={{ color: "var(--muted-foreground)" }}>
                                {pac && pac.leito !== "—" ? `Leito ${pac.leito} · ` : ""}Emitida em {rx.data} · {rx.medico}
                              </p>
                            </div>
                            <span className="hidden font-mono text-xs sm:inline" style={{ color: "var(--muted-foreground)" }}>{rx.id}</span>
                            {pending ? (
                              <StatusBadge tone="warning" icon="clock">{pending} pendente{pending === 1 ? "" : "s"}</StatusBadge>
                            ) : (
                              <StatusBadge tone="success" icon="check">Concluída</StatusBadge>
                            )}
                            {isHistory && (
                              <button type="button" onClick={() => setExpandedPrescricao(open ? null : rx.id)} aria-expanded={open} aria-label={open ? "Ocultar itens" : "Ver itens"} className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--secondary)", color: "var(--primary)" }}>
                                <span style={{ transform: open ? "rotate(180deg)" : "none", display: "flex" }}><UiIcon name="chevronDown" size={16} /></span>
                              </button>
                            )}
                          </header>
                          {open && (
                            <>
                              <div className="hidden overflow-x-auto md:block">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr style={{ color: "var(--muted-foreground)" }}>
                                      {["Medicamento", "Dose", "Via", "Frequência", "Horário", "Duração", "Quantidade", "Situação"].map((h) => (
                                        <th key={h} className="px-4 py-2.5 text-left">{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {rx.itens.map((item) => {
                                      const done = medicacoesAdministradas.includes(item.id)
                                      return (
                                        <tr key={item.id} style={{ borderTop: "1px solid var(--border)" }}>
                                          <td className="px-4 py-3">
                                            <span className="flex items-center gap-2 font-semibold" style={{ color: "var(--foreground)" }}><UiIcon name="pill" size={15} />{item.medicamento}</span>
                                            <span className="font-mono text-[11px]" style={{ color: "var(--muted-foreground)" }}>{item.id}</span>
                                          </td>
                                          <td className="px-4 py-3" style={{ color: "var(--foreground)" }}>{item.dosagem}</td>
                                          <td className="px-4 py-3">{item.via}</td>
                                          <td className="px-4 py-3">{item.frequencia}</td>
                                          <td className="px-4 py-3 font-mono">{itemHorario(item) || "—"}</td>
                                          <td className="px-4 py-3">{item.duracao}</td>
                                          <td className="px-4 py-3 font-mono">{item.quantidade}</td>
                                          <td className="px-4 py-3">
                                            {done ? <StatusBadge tone="success" icon="check" size="sm">Administrado</StatusBadge> : <StatusBadge tone="neutral" icon="clock" size="sm">Pendente</StatusBadge>}
                                          </td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              </div>
                              <ul className="divide-y md:hidden" style={{ borderColor: "var(--border)" }}>
                                {rx.itens.map((item) => {
                                  const done = medicacoesAdministradas.includes(item.id)
                                  return (
                                    <li key={item.id} className="flex items-start gap-3 px-4 py-3" style={{ borderColor: "var(--border)" }}>
                                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--role-soft)", color: "var(--role-strong)" }}><UiIcon name="pill" size={15} /></span>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{item.medicamento} · {item.dosagem}</p>
                                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{item.via} · {item.frequencia} · {item.duracao} · Quantidade: {item.quantidade}{itemHorario(item) ? ` · início ${itemHorario(item)}` : ""}</p>
                                      </div>
                                      {done ? <StatusBadge tone="success" icon="check" size="sm">Administrado</StatusBadge> : <StatusBadge tone="neutral" icon="clock" size="sm">Pendente</StatusBadge>}
                                    </li>
                                  )
                                })}
                              </ul>
                            </>
                          )}
                          {!open && (
                            <div className="flex flex-wrap gap-2 px-4 pb-3.5 sm:px-5">
                              {rx.itens.map((item) => (
                                <span key={item.id} className="rounded-full border px-2.5 py-1 text-xs" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>{item.medicamento} · {item.dosagem}</span>
                              ))}
                            </div>
                          )}
                        </article>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}

          {activeTab === "exames" && (
            <div className="fade-in">
              <PageTitle
                title="Exames e resultados"
                subtitle="Exames laboratoriais, de imagem e eletrocardiogramas"
                action={
                  <button
                    type="button"
                    onClick={() => setShowExamForm((current) => !current)}
                    aria-expanded={showExamForm}
                    className="inline-flex h-11 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold"
                    style={{ background: showExamForm ? "var(--secondary)" : "var(--primary)", color: showExamForm ? "var(--primary)" : "var(--primary-foreground)" }}
                  >
                    {showExamForm ? "Fechar formulário" : <><UiIcon name="plus" size={16} /> Solicitar exame</>}
                  </button>
                }
                meta={
                  <>
                    <MetaItem icon="checkCircle" label="Com resultado" value={todosExames.filter((exam) => exam.status === "resultado").length} tone="success" />
                    <MetaItem icon="clock" label="Em andamento" value={todosExames.filter((exam) => exam.status === "em andamento").length} tone="warning" />
                    <MetaItem icon="agenda" label="Agendados ou solicitados" value={todosExames.filter((exam) => exam.status === "agendado").length} tone="info" />
                  </>
                }
              />
              {showExamForm && (
                <SectionCard title="Solicitar exame" description="A solicitação será registrada no sistema e ficará disponível para a recepção." icon="exames" className="slide-up mb-5">
                  <form onSubmit={handleSolicitarExame} className="flex flex-col gap-5">
                    <FormSection step={1} title="Paciente e exame">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <label className={labelClass} style={{ color: "var(--foreground)" }}>Paciente
                          <select required value={examForm.pacienteId} onChange={(event) => setExamForm({ ...examForm, pacienteId: event.target.value })} className="min-h-11 rounded-lg border px-3 text-sm font-normal" style={inputStyle}>
                            {pacientes.map((patient) => <option key={patient.id} value={patient.id}>{patient.nome} · {patient.id}</option>)}
                          </select>
                        </label>
                        <label className={labelClass} style={{ color: "var(--foreground)" }}>Exame solicitado
                          <input required value={examForm.nome} onChange={(event) => setExamForm({ ...examForm, nome: event.target.value })} placeholder="Ex.: Hemograma completo" className="min-h-11 rounded-lg border px-3 text-sm font-normal" style={inputStyle} />
                        </label>
                        <label className={labelClass} style={{ color: "var(--foreground)" }}>Categoria
                          <select value={examForm.tipo} onChange={(event) => setExamForm({ ...examForm, tipo: event.target.value as ExamType })} className="min-h-11 rounded-lg border px-3 text-sm font-normal" style={inputStyle}>
                            <option value="ExameLaboratorial">Laboratorial</option><option value="ExameImagem">Imagem</option>
                          </select>
                        </label>
                      </div>
                    </FormSection>
                    <FormSection step={2} title="Dados do exame" description="O exame será vinculado ao paciente, ao médico e ao atendimento no sistema.">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {examForm.tipo === "ExameLaboratorial" ? <>
                          <label className={labelClass} style={{ color: "var(--foreground)" }}>Amostra
                            <input required value={examForm.amostra} onChange={(event) => setExamForm({ ...examForm, amostra: event.target.value })} className="min-h-11 rounded-lg border px-3 text-sm font-normal" style={inputStyle} />
                          </label>
                          <label className={labelClass} style={{ color: "var(--foreground)" }}>Método
                            <input required value={examForm.metodo} onChange={(event) => setExamForm({ ...examForm, metodo: event.target.value })} className="min-h-11 rounded-lg border px-3 text-sm font-normal" style={inputStyle} />
                          </label>
                        </> : <>
                          <label className={labelClass} style={{ color: "var(--foreground)" }}>Modalidade
                            <input required value={examForm.modalidade} onChange={(event) => setExamForm({ ...examForm, modalidade: event.target.value })} placeholder="Ex.: radiografia" className="min-h-11 rounded-lg border px-3 text-sm font-normal" style={inputStyle} />
                          </label>
                          <label className={labelClass} style={{ color: "var(--foreground)" }}>Região do corpo
                            <input required value={examForm.regiaoCorpo} onChange={(event) => setExamForm({ ...examForm, regiaoCorpo: event.target.value })} className="min-h-11 rounded-lg border px-3 text-sm font-normal" style={inputStyle} />
                          </label>
                        </>}
                      </div>
                    </FormSection>
                    <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end" style={{ borderColor: "var(--border)" }}>
                      <button type="button" onClick={() => setShowExamForm(false)} className="min-h-11 rounded-lg px-4 text-sm font-semibold" style={{ background: "var(--secondary)", color: "var(--primary)" }}>Cancelar</button>
                      <button type="submit" className="min-h-11 rounded-lg px-5 text-sm font-semibold" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>Salvar solicitação</button>
                    </div>
                  </form>
                </SectionCard>
              )}

              <div className="mb-4">
                <SegmentedControl
                  label="Filtrar exames por categoria"
                  value={examTypeFilter}
                  onChange={setExamTypeFilter}
                  options={[
                    { value: "todos", label: "Todos", count: todosExames.length },
                    { value: "ExameLaboratorial", label: "Laboratoriais", count: todosExames.filter((exam) => exam.tipo === "ExameLaboratorial").length },
                    { value: "ExameImagem", label: "Imagem", count: todosExames.filter((exam) => exam.tipo === "ExameImagem").length },
                    { value: "ECG", label: "ECG", count: todosExames.filter((exam) => exam.tipo === "ECG").length },
                  ]}
                />
              </div>

              {examesVisiveis.length === 0 && <EmptyState icon="exames" title="Nenhum exame nesta categoria" />}
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {examesVisiveis.map((ex) => {
                  const pac = pacientes.find((p) => p.id === ex.pacienteId)
                  const type = examTypeMeta(ex.tipo)
                  const status = examStatusMeta(ex)
                  return (
                    <article key={ex.id} className="relative flex min-w-0 flex-col overflow-hidden rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
                      <span className="absolute inset-x-0 top-0 h-1" style={{ background: toneStyles[type.tone].solid }} aria-hidden="true" />
                      <div className="flex items-start gap-3 p-4 pt-5 sm:p-5 sm:pt-6">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: toneStyles[type.tone].bg, color: toneStyles[type.tone].fg }} aria-hidden="true">
                          <UiIcon name={type.icon} size={20} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h3 className="text-[15px] font-semibold leading-snug" style={{ color: "var(--foreground)" }}>{ex.nome}</h3>
                            <StatusBadge tone={status.tone} icon={status.icon} size="sm">{status.label}</StatusBadge>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
                            <StatusBadge tone={type.tone} size="sm">{type.label}</StatusBadge>
                            <span className="font-mono">{ex.id}</span>
                          </div>
                        </div>
                      </div>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t px-4 py-3 sm:grid-cols-3 sm:px-5" style={{ borderColor: "var(--border)" }}>
                        <KeyValue label="Paciente" value={pac?.nome ?? ex.pacienteId} />
                        <KeyValue label="Data" value={`${ex.data}${"hora" in ex && ex.hora && ex.hora !== "A definir" ? " · " + ex.hora : ""}`} />
                        <KeyValue label="Solicitante" value={ex.solicitante} />
                      </dl>
                      {ex.resultado && (
                        <div className="mx-4 mb-4 rounded-xl border p-3 text-sm leading-relaxed sm:mx-5" style={{ background: "var(--success-surface)", borderColor: toneStyles.success.border, color: "var(--foreground)" }}>
                          <span className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--success-foreground)" }}><UiIcon name="checkCircle" size={13} /> Resultado</span>
                          {ex.resultado}
                        </div>
                      )}
                      {examesLocais.some((localExam) => localExam.id === ex.id) && ex.status === "em andamento" && (
                        <div className="mx-4 mb-4 sm:mx-5">
                          {resultExamId === ex.id ? (
                            <form onSubmit={handleSalvarResultadoExame} className="flex flex-col gap-2" aria-label={`Registrar resultado de ${ex.nome}`}>
                              <textarea required value={examResultDraft} onChange={(event) => setExamResultDraft(event.target.value)} placeholder="Descreva o resultado do exame" aria-label="Resultado do exame" rows={3} className="min-h-20 min-w-0 rounded-lg border p-3 text-sm" style={inputStyle} />
                              <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => { setResultExamId(null); setExamResultDraft("") }} className="min-h-10 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--secondary)", color: "var(--primary)" }}>Cancelar</button>
                                <button type="submit" className="min-h-10 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Salvar resultado</button>
                              </div>
                            </form>
                          ) : (
                            <button type="button" onClick={() => { setResultExamId(ex.id); setExamResultDraft("") }} className="min-h-10 w-full rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--secondary)", color: "var(--primary)" }}>Registrar resultado</button>
                          )}
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === "agenda" && (
            <div className="fade-in">
              <PageTitle
                title="Agenda médica"
                subtitle={`Consultas atribuídas a ${doctorProfile?.nome ?? userName} · ${doctorProfile ? formatSpecialty(doctorProfile.especialidade) : "agenda médica"}`}
                meta={
                  <>
                    <MetaItem icon="agenda" label="Consultas" value={agendaExibida.length} tone="info" />
                    <MetaItem icon="clock" label="Aguardando" value={agendaExibida.filter((item) => item.status === "Agendada").length} tone="neutral" />
                    <MetaItem icon="stethoscope" label="Em atendimento" value={agendaExibida.filter((item) => item.status === "Em atendimento").length} tone="warning" />
                    <MetaItem icon="checkCircle" label="Concluídas" value={agendaExibida.filter((item) => item.concluido).length} tone="success" />
                  </>
                }
              />
              {rescheduleAppointmentId && (
                <SectionCard title="Reagendar consulta" description={agendaExibida.find((item) => item.id === rescheduleAppointmentId)?.paciente} icon="agenda" className="slide-up mb-5">
                  <form onSubmit={handleReagendarConsulta} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <label className={labelClass + " flex-1"} style={{ color: "var(--foreground)" }}>Nova data
                      <input required type="date" min={localDateInputValue()} value={rescheduleForm.data} onChange={(event) => setRescheduleForm({ ...rescheduleForm, data: event.target.value })} className="min-h-11 rounded-lg border px-3 text-sm font-normal" style={inputStyle} />
                    </label>
                    <label className={labelClass + " flex-1"} style={{ color: "var(--foreground)" }}>Novo horário
                      <input required type="time" value={rescheduleForm.hora} onChange={(event) => setRescheduleForm({ ...rescheduleForm, hora: event.target.value })} className="min-h-11 rounded-lg border px-3 text-sm font-normal" style={inputStyle} />
                    </label>
                    <button type="button" onClick={() => setRescheduleAppointmentId(null)} className="min-h-11 rounded-lg px-4 text-sm font-semibold" style={{ background: "var(--secondary)", color: "var(--primary)" }}>Cancelar</button>
                    <button type="submit" className="min-h-11 rounded-lg px-4 text-sm font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Salvar novo horário</button>
                  </form>
                  {rescheduleError && <p role="alert" className="mt-3 flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--danger-foreground)" }}><UiIcon name="alert" size={16} />{rescheduleError}</p>}
                </SectionCard>
              )}
              {agendaPorData.length === 0 && <EmptyState icon="agenda" title="Nenhuma consulta agendada" description="As consultas marcadas pela recepção aparecerão aqui." />}
              <div className="flex flex-col gap-6">
                {agendaPorData.map((group) => (
                  <section key={group.data} aria-label={formatAgendaDate(group.data)}>
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold capitalize" style={{ color: "var(--foreground)" }}>
                      <span className="h-2 w-2 rounded-full" style={{ background: group.data === localDateInputValue() ? "var(--role)" : "var(--neutral)" }} aria-hidden="true" />
                      {formatAgendaDate(group.data)}
                      <span className="text-xs font-normal normal-case" style={{ color: "var(--muted-foreground)" }}>· {group.itens.length} consulta{group.itens.length === 1 ? "" : "s"}</span>
                    </h2>
                    <ol className="flex flex-col gap-2.5">
                      {group.itens.map((a) => (
                        <li key={a.key} className="grid grid-cols-[3.75rem_minmax(0,1fr)] gap-3 sm:grid-cols-[5rem_minmax(0,1fr)]">
                          <div className="pt-3.5 text-right">
                            <p className="font-mono text-base font-semibold tabular-nums" style={{ color: a.concluido ? "var(--muted-foreground)" : "var(--role-strong)" }}>{a.hora}</p>
                          </div>
                          <div className="relative flex flex-col gap-3 overflow-hidden rounded-xl border p-3.5 pl-5 sm:flex-row sm:items-center" style={{ background: "var(--card)", borderColor: "var(--border)", opacity: a.concluido ? 0.75 : 1 }}>
                            <span className="absolute inset-y-0 left-0 w-1" style={{ background: toneStyles[appointmentTone(a.status)].solid }} aria-hidden="true" />
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <Avatar initials={a.paciente.split(" ").map((part) => part[0]).slice(0, 2).join("")} size="sm" />
                              <div className="min-w-0">
                                <p className="break-words text-sm font-semibold" style={{ color: "var(--foreground)", textDecoration: a.concluido ? "line-through" : "none" }}>{a.paciente}</p>
                                <p className="break-words text-xs" style={{ color: "var(--muted-foreground)" }}>{a.tipo} · {a.local}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusBadge tone={appointmentTone(a.status)} icon={a.concluido ? "check" : a.status === "Em atendimento" ? "stethoscope" : "clock"} size="sm">{a.status}</StatusBadge>
                              {a.status === "Agendada" && (
                                <button type="button" onClick={() => {
                                  setRescheduleAppointmentId(a.id)
                                  setRescheduleForm({ data: a.data, hora: a.hora })
                                  setRescheduleError("")
                                }} className="min-h-9 rounded-lg border px-3 text-xs font-semibold" style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }}>
                                  Reagendar
                                </button>
                              )}
                              {a.status === "Em atendimento" && (
                                <button type="button" onClick={() => handleConcluirConsulta(a.id)} className="min-h-9 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>Concluir consulta</button>
                              )}
                              {a.status === "Agendada" && (
                                <button type="button" onClick={() => handleIniciarConsulta(a.id)} className="min-h-9 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Iniciar atendimento</button>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </section>
                ))}
              </div>
            </div>
          )}

          {activeTab === "internacao" && (
            <div className="fade-in">
              <PageTitle
                title="Internações"
                subtitle="Pacientes internados sob sua responsabilidade"
                meta={
                  <>
                    <MetaItem icon="internacao" label="Internados" value={internacoesExibidas.length} tone="info" />
                    <MetaItem icon="alert" label="Em risco" value={internacoesExibidas.filter((item) => { const patient = pacientes.find((p) => p.id === item.pacienteId); return patient ? getPatientRisk(patient) !== "low" : false }).length} tone="danger" />
                  </>
                }
              />
              {internacoesExibidas.length === 0 && <EmptyState icon="internacao" title="Nenhuma internação ativa" description="Pacientes internados pela recepção aparecerão aqui." />}
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {internacoesExibidas.map((int) => {
                  const pac = pacientes.find((p) => p.id === int.pacienteId)
                  const rc = latestVitalsFor(int.pacienteId)
                  const risk = pac ? getPatientRisk(pac) : "low"
                  const entrada = parseDisplayDate(int.entrada)
                  const alta = parseDisplayDate(int.altaPrevista)
                  const diaInternacao = entrada ? Math.max(1, daysBetween(entrada, new Date()) + 1) : null
                  const totalPrevisto = entrada && alta ? Math.max(1, daysBetween(entrada, alta)) : null
                  const progresso = diaInternacao && totalPrevisto ? (diaInternacao / totalPrevisto) * 100 : null
                  return (
                    <article key={int.key} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
                      <header className="flex items-start gap-3 p-4 sm:p-5">
                        <Avatar initials={pac?.avatar ?? "--"} size="lg" tone={riskTone(risk)} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>{pac?.nome ?? int.pacienteId}</h3>
                            <StatusBadge tone={riskTone(risk)} icon={riskIcon(risk)} size="sm">{riskLabel(risk)}</StatusBadge>
                          </div>
                          <p className="mt-0.5 text-sm" style={{ color: "var(--muted-foreground)" }}>{int.motivo}</p>
                          <p className="mt-0.5 font-mono text-xs" style={{ color: "var(--muted-foreground)" }}>{int.id}</p>
                        </div>
                        <div className="shrink-0 rounded-xl px-3 py-2 text-center" style={{ background: "var(--role-soft)" }}>
                          <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--role-strong)" }}>Leito</p>
                          <p className="text-lg font-bold leading-tight" style={{ color: "var(--role-strong)" }}>{int.leito}</p>
                        </div>
                      </header>
                      <div className="border-t px-4 py-3 sm:px-5" style={{ borderColor: "var(--border)" }}>
                        <dl className="grid grid-cols-3 gap-3">
                          <KeyValue label="Setor" value={int.ala} />
                          <KeyValue label="Entrada" value={int.entrada} />
                          <KeyValue label="Alta prevista" value={int.altaPrevista} />
                        </dl>
                        <div className="mt-3">
                          <div className="mb-1.5 flex justify-between text-xs" style={{ color: "var(--muted-foreground)" }}>
                            <span>{diaInternacao ? `${diaInternacao}º dia de internação` : "Tempo de internação indisponível"}</span>
                            {totalPrevisto && (progresso !== null && progresso > 100 ? <span className="font-semibold" style={{ color: "var(--danger-foreground)" }}>Prazo de alta previsto ultrapassado</span> : <span>Previsão: {totalPrevisto} dias</span>)}
                          </div>
                          {progresso !== null && <ProgressBar value={progresso} tone={progresso > 100 ? "danger" : progresso > 80 ? "warning" : "role"} label="Progresso até a alta prevista" />}
                        </div>
                      </div>
                      {rc && (
                        <div className="grid grid-cols-2 gap-2 border-t px-4 py-3 sm:px-5 md:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4" style={{ borderColor: "var(--border)" }}>
                          <VitalTile icon="gauge" label="PA" value={rc.pressao ?? "—"} unit="mmHg" />
                          <VitalTile icon="heart" label="FC" value={rc.fc ?? "—"} unit="bpm" alert={rc.fc !== undefined && rc.fc > 100} />
                          <VitalTile icon="thermometer" label="Temp." value={rc.temp ?? "—"} unit="°C" alert={rc.temp !== undefined && rc.temp >= 38} />
                          <VitalTile icon="droplet" label="SpO₂" value={rc.spo2 ?? "—"} unit="%" alert={rc.spo2 !== undefined && rc.spo2 < 94} />
                        </div>
                      )}
                      <footer className="mt-auto flex flex-wrap items-center gap-2 border-t px-4 py-3 sm:px-5" style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--secondary) 35%, var(--card))" }}>
                        <button type="button" onClick={() => goToPatient(int.pacienteId)} className="min-h-10 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Evoluir prontuário</button>
                        <button type="button" onClick={() => openPrescriptionFor(int.pacienteId)} className="min-h-10 rounded-lg border px-3 text-xs font-semibold" style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }}>Nova prescrição</button>
                        {altaEmConfirmacaoId === int.id ? (
                          <div role="alertdialog" aria-label="Confirmar alta" className="flex w-full flex-wrap items-center gap-2 rounded-lg border p-2.5 sm:ml-auto sm:w-auto" style={{ background: "var(--warning-surface)", borderColor: toneStyles.warning.border }}>
                            <span className="text-xs font-semibold" style={{ color: "var(--warning-foreground)" }}>Liberar o leito {int.leito}?</span>
                            <button type="button" onClick={() => setAltaEmConfirmacaoId(null)} className="min-h-9 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--card)", color: "var(--foreground)" }}>Cancelar</button>
                            <button type="button" onClick={() => handleDarAlta(int.pacienteId, int.id, int.leito)} className="min-h-9 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>Confirmar alta</button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setAltaEmConfirmacaoId(int.id)} className="min-h-10 rounded-lg px-3 text-xs font-semibold sm:ml-auto" style={{ background: "var(--success-surface)", color: "var(--success-foreground)" }}>Dar alta</button>
                        )}
                      </footer>
                    </article>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === "atividades" && <ActivityLog token={token} role="MEDICO" />}

          {activeTab === "alertas" && (
            <div className="fade-in">
              <PageTitle
                title="Central de alertas"
                subtitle={`${alertasPendentes.length + monitoringPendingCount} alerta${alertasPendentes.length + monitoringPendingCount === 1 ? "" : "s"} pendente${alertasPendentes.length + monitoringPendingCount === 1 ? "" : "s"} de avaliação`}
                action={
                  alertasPendentes.length > 0 ? (
                    <button type="button" onClick={markAllAlertsRecognized} className="inline-flex h-11 items-center gap-1.5 rounded-xl border px-4 text-sm font-semibold" style={{ background: "var(--card)", color: "var(--primary)", borderColor: "var(--border)" }}>
                      <UiIcon name="check" size={16} /> Reconhecer todos os alertas
                    </button>
                  ) : undefined
                }
                meta={
                  <>
                    <MetaItem icon="alert" label="Críticos" value={alertasPendentes.filter((alert) => alert.severity === "high").length} tone="danger" />
                    <MetaItem icon="info" label="Atenção" value={alertasPendentes.filter((alert) => alert.severity === "medium").length} tone="warning" />
                    <MetaItem icon="monitoramento" label="Monitoramento" value={monitoringPendingCount} tone="info" />
                  </>
                }
              />

              <MonitoringAlertsPanel
                alerts={monitoringAlertsDoMedico}
                profile="Médico"
                acknowledgedKeys={monitoringAcknowledged}
                setAcknowledgedKeys={setMonitoringAcknowledged}
                onOpenMonitoring={() => setActiveTab("monitoramento")}
              />

              <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--foreground)" }}>Alertas clínicos</h2>
              <div className="grid grid-cols-1 gap-3">
                {alertas.map((a) => {
                  const p = pacientes.find((x) => x.id === a.pacienteId)
                  const tone = riskTone(a.severity)
                  const reconhecido = !a.ativo
                  return (
                    <article
                      key={a.id}
                      className="relative overflow-hidden rounded-2xl border p-4 pl-5 sm:p-5 sm:pl-6"
                      style={{ background: "var(--card)", borderColor: reconhecido ? "var(--border)" : toneStyles[tone].border, opacity: reconhecido ? 0.7 : 1, boxShadow: "var(--shadow-sm)" }}
                    >
                      <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: reconhecido ? "var(--neutral)" : toneStyles[tone].solid }} aria-hidden="true" />
                      <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: toneStyles[tone].bg, color: toneStyles[tone].fg }} aria-hidden="true">
                            <UiIcon name="alert" size={19} />
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusBadge tone={tone} size="sm">{riskLabel(a.severity)}</StatusBadge>
                              <span className="font-mono text-xs" style={{ color: "var(--muted-foreground)" }}>{a.id}</span>
                              {reconhecido && <StatusBadge tone="neutral" icon="check" size="sm">Reconhecido pela equipe</StatusBadge>}
                            </div>
                            <h3 className="mt-1.5 text-[15px] font-semibold" style={{ color: "var(--foreground)" }}>{a.titulo}</h3>
                            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{p?.nome} · {a.local} · {a.data} · {a.horario}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 md:flex-col md:items-end md:gap-1">
                          <p className="text-2xl font-bold leading-none tabular-nums" style={{ color: toneStyles[tone].fg }}>{a.valor}<span className="ml-1 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{a.label}</span></p>
                        </div>
                        <div className="flex flex-wrap gap-2 md:flex-col">
                          {p && <button type="button" onClick={() => goToPatient(p.id)} className="min-h-10 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Visualizar prontuário</button>}
                          {!reconhecido && (
                            <button type="button" onClick={() => markAlertRecognized(a.id)} className="min-h-10 rounded-lg border px-3 text-xs font-semibold" style={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }}>Reconhecer alerta</button>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          )}

        </main>
        </SectionContext.Provider>
      </div>
    </div>
  )
}
