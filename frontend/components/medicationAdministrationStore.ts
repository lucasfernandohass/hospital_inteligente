export const MEDICATION_ADMINISTRATION_STORAGE_KEY = "inteliHosp-medicacoes-administradas"
export const LEGACY_MEDICATION_ADMINISTRATION_STORAGE_KEY = "inteliHosp-enfermagem-medicacoes"

export function readMedicationAdministrations(): string[] {
  if (typeof window === "undefined") return []

  try {
    const shared = JSON.parse(window.localStorage.getItem(MEDICATION_ADMINISTRATION_STORAGE_KEY) ?? "[]")
    const legacy = JSON.parse(window.localStorage.getItem(LEGACY_MEDICATION_ADMINISTRATION_STORAGE_KEY) ?? "[]")
    const merged = [...new Set([...(Array.isArray(shared) ? shared : []), ...(Array.isArray(legacy) ? legacy : [])])]
    if (merged.length !== shared.length) window.localStorage.setItem(MEDICATION_ADMINISTRATION_STORAGE_KEY, JSON.stringify(merged))
    return merged
  } catch {
    return []
  }
}
