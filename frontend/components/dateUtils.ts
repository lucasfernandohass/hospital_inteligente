// Leitura tolerante das datas exibidas nos dados demonstrativos
// ("12 Set 2026", "26 de out. de 2026", "26/10/2026" ou "2026-10-26").
const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

export function parseDisplayDate(value: string | undefined): Date | null {
  if (!value) return null
  const text = value.trim().toLocaleLowerCase("pt-BR")
  let match = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (match) return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]))
  match = text.match(/^(\d{1,2})\s+(?:de\s+)?([a-zç]{3})[a-zç.]*\s+(?:de\s+)?(\d{4})/)
  if (match) {
    const month = months.indexOf(match[2])
    if (month >= 0) return new Date(Number(match[3]), month, Number(match[1]))
  }
  return null
}

/** Dias corridos entre duas datas (ignora horário). */
export function daysBetween(start: Date, end: Date) {
  const a = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const b = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
  return Math.round((b - a) / 86400000)
}

/** Saudação conforme o horário local. */
export function greeting(date = new Date()) {
  const hour = date.getHours()
  return hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite"
}
