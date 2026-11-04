import type { AppointmentDto, BedDto, InternmentDto, MedicationDto, PatientDto, PrescriptionDto, PrescriptionItemDto } from "./api"
import type { RegisteredBed, RegisteredPatient } from "../components/patientStore"
import type { Hospitalization } from "../components/hospitalizationStore"
import type { ReceptionAppointment } from "../components/appointmentStore"
import type { SharedPrescription } from "../components/prescriptionStore"

export function formatCpf(cpf: string) {
  const digits = cpf.replace(/\D/g, "")
  return digits.length === 11 ? digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : cpf
}

export function formatApiDate(date: string) {
  const [year, month, day] = date.slice(0, 10).split("-")
  return `${day}/${month}/${year}`
}

export const mapPatient = (patient: PatientDto): RegisteredPatient => ({
  id: String(patient.id), nome: patient.nome, cpf: formatCpf(patient.cpf), dataNasc: formatApiDate(patient.dataNascimento),
  telefone: patient.telefone ?? "", convenio: patient.convenio, sexo: patient.sexo ?? "",
})

function bedStatus(status: string): RegisteredBed["status"] {
  const normalized = status.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  if (normalized.includes("ocup")) return "Ocupado"
  if (normalized.includes("higien")) return "Higienização"
  if (normalized.includes("manut")) return "Manutenção"
  return "Disponível"
}

export function mapBed(bed: BedDto, internments: InternmentDto[] = []): RegisteredBed {
  const active = internments.find((internment) => internment.leitoId === bed.id && internment.dataAlta == null)
  return {
    id: String(bed.id), numero: bed.numero, andar: `${bed.andar}º andar`, quarto: bed.quarto, setor: bed.setor ?? bed.tipo,
    tipo: bed.tipo.toLowerCase().includes("uti") ? "UTI" : bed.tipo.toLowerCase().includes("isol") ? "Isolamento" : "Enfermaria",
    status: active ? "Ocupado" : bedStatus(bed.status), pacienteId: active ? String(active.pacienteId) : undefined,
  }
}

export function mapInternment(internment: InternmentDto, beds: BedDto[], doctors: { id: number; nome: string }[] = []): Hospitalization {
  const bed = beds.find((item) => item.id === internment.leitoId)
  return {
    id: String(internment.id), pacienteId: String(internment.pacienteId), leitoId: String(internment.leitoId),
    leito: bed?.numero ?? String(internment.leitoId), setor: bed?.tipo ?? "",
    motivo: internment.motivo, medicoId: String(internment.medicoId ?? ""), medico: doctors.find((doctor) => doctor.id === internment.medicoId)?.nome ?? "Equipe médica",
    dataEntrada: formatApiDate(internment.dataInternacao),
    dataAltaPrevista: internment.dataPrevistaAlta ? formatApiDate(internment.dataPrevistaAlta) : "A definir",
    status: internment.dataAlta ? "Alta" : "Ativa",
    dataAlta: internment.dataAlta ? formatApiDate(internment.dataAlta) : undefined,
  }
}

export function mapAppointment(appointment: AppointmentDto, patients: RegisteredPatient[]): ReceptionAppointment {
  const patient = patients.find((item) => item.id === String(appointment.pacienteId))
  return {
    id: String(appointment.id), medicoId: String(appointment.medicoId), data: appointment.data,
    hora: appointment.horario.slice(0, 5), paciente: patient?.nome ?? `Paciente ${appointment.pacienteId}`,
    pacienteId: String(appointment.pacienteId),
    status: appointment.status.toLowerCase().includes("conclu") ? "Concluída" : appointment.status.toLowerCase().includes("atendimento") ? "Em atendimento" : "Agendada",
  }
}

export function mapPrescriptions(prescriptions: PrescriptionDto[], items: PrescriptionItemDto[], medications: MedicationDto[], doctors: { id: number; nome: string }[]): SharedPrescription[] {
  const medicationById = new Map(medications.map((medication) => [medication.id, medication]))
  return prescriptions.flatMap((prescription) => items
    .filter((item) => item.prescricaoId === prescription.id)
    .map((item) => {
      const medication = medicationById.get(item.medicamentoId)
      return {
        id: String(prescription.id), pacienteId: String(prescription.pacienteId),
        data: prescription.data.slice(0, 10).split("-").reverse().join("/"),
        medico: doctors.find((doctor) => doctor.id === prescription.medicoId)?.nome ?? `Médico ${prescription.medicoId}`,
        item: {
          id: String(item.id), medicamento: medication?.nome ?? `Medicamento ${item.medicamentoId}`,
          dosagem: item.dose, via: item.viaAdministracao, horario: "Conforme aprazamento",
          frequencia: item.frequencia, duracao: item.duracao, quantidade: 1,
        },
      }
    }))
}
