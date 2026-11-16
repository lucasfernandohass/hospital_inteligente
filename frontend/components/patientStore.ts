export interface RegisteredPatient {
  id: string
  nome: string
  cpf: string
  dataNasc: string
  telefone: string
  convenio: string
  sexo: string
}

export interface RegisteredBed {
  id: string
  numero: string
  andar: string
  quarto?: string
  setor: string
  tipo: "Enfermaria" | "UTI" | "Isolamento"
  status: "Disponível" | "Ocupado" | "Higienização" | "Manutenção"
  pacienteId?: string
}

