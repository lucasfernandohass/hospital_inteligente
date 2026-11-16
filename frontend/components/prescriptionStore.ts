export interface SharedPrescriptionItem {
  id: string
  medicamento: string
  dosagem: string
  via: string
  horario: string
  frequencia: string
  duracao: string
  quantidade: number
}

export interface SharedPrescription {
  id: string
  pacienteId: string
  data: string
  medico: string
  medicoId?: string
  item: SharedPrescriptionItem
}

