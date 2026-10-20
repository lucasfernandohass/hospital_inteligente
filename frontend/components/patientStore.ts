export interface RegisteredPatient {
  id: string
  nome: string
  cpf: string
  dataNasc: string
  telefone: string
  convenio: string
  sexo: string
}

export const PATIENT_STORAGE_KEY = "inteliHosp-recepcao-pacientes"
export const BED_STORAGE_KEY = "inteliHosp-recepcao-leitos"

export interface RegisteredBed {
  id: string
  numero: string
  andar: string
  setor: string
  tipo: "Enfermaria" | "UTI" | "Isolamento"
  status: "Disponível" | "Ocupado" | "Higienização" | "Manutenção"
  pacienteId?: string
}

export const initialHospitalSectors = ["Clínica Médica", "Cardiologia", "Pneumologia", "UTI", "Isolamento", "Enfermaria", "Pediatria"]

export const initialRegisteredBeds: RegisteredBed[] = [
  { id: "L-001", numero: "12A", andar: "1º andar", setor: "Clínica Médica", tipo: "Enfermaria", status: "Ocupado", pacienteId: "PAC-001" },
  { id: "L-002", numero: "12B", andar: "1º andar", setor: "Clínica Médica", tipo: "Enfermaria", status: "Disponível" },
  { id: "L-003", numero: "08A", andar: "1º andar", setor: "Pneumologia", tipo: "Enfermaria", status: "Disponível" },
  { id: "L-004", numero: "08B", andar: "1º andar", setor: "Pneumologia", tipo: "Enfermaria", status: "Higienização" },
  { id: "L-005", numero: "14B", andar: "2º andar", setor: "Isolamento", tipo: "Isolamento", status: "Ocupado", pacienteId: "PAC-003" },
  { id: "L-006", numero: "22A", andar: "3º andar", setor: "UTI", tipo: "UTI", status: "Ocupado", pacienteId: "PAC-005" },
  { id: "L-007", numero: "22B", andar: "3º andar", setor: "UTI", tipo: "UTI", status: "Disponível" },
  { id: "L-008", numero: "23A", andar: "3º andar", setor: "UTI", tipo: "UTI", status: "Manutenção" },
  { id: "L-009", numero: "05A", andar: "1º andar", setor: "Cardiologia", tipo: "Enfermaria", status: "Disponível" },
  { id: "L-010", numero: "05B", andar: "1º andar", setor: "Pediatria", tipo: "Enfermaria", status: "Disponível" },
]

export function normalizeRegisteredBeds(beds: RegisteredBed[]) {
  let changed = false
  const normalized = beds.map((bed) => {
    if (bed.setor?.trim()) return bed
    changed = true
    return { ...bed, setor: initialRegisteredBeds.find((seed) => seed.id === bed.id)?.setor ?? bed.tipo }
  })
  return changed ? normalized : beds
}

export const initialRegisteredPatients: RegisteredPatient[] = [
  { id: "PAC-001", nome: "João da Silva", cpf: "123.456.789-00", dataNasc: "15/03/1979", telefone: "(11) 98765-4321", convenio: "Amil Gold", sexo: "M" },
  { id: "PAC-002", nome: "Maria Fernanda Souza", cpf: "987.654.321-11", dataNasc: "02/07/1964", telefone: "(11) 91234-5678", convenio: "Unimed", sexo: "F" },
  { id: "PAC-003", nome: "Carlos Alberto Mendes", cpf: "456.123.789-22", dataNasc: "20/11/1991", telefone: "(11) 92345-6789", convenio: "Unimed", sexo: "M" },
  { id: "PAC-004", nome: "Ana Beatriz Lima", cpf: "321.789.456-33", dataNasc: "08/06/1997", telefone: "(11) 93456-7890", convenio: "SulAmérica", sexo: "F" },
  { id: "PAC-005", nome: "Roberto Nogueira Alves", cpf: "741.852.963-44", dataNasc: "14/09/1972", telefone: "(11) 94567-8901", convenio: "Amil Gold", sexo: "M" },
]
