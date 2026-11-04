export interface ActivityEntry {
  id: string
  timestamp: string
  profile: string
  action: string
  entity: string
  details: string
}

export const ACTIVITY_STORAGE_KEY = "inteliHosp-atividades-locais"
const activityEventName = "inteliHosp-activity-change"

export function readActivities(): ActivityEntry[] {
  try {
    const saved = JSON.parse(localStorage.getItem(ACTIVITY_STORAGE_KEY) ?? "[]") as ActivityEntry[]
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

export function logActivity(profile: string, action: string, entity: string, details: string) {
  const entry: ActivityEntry = {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()),
    timestamp: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(new Date()),
    profile,
    action,
    entity,
    details,
  }

  try {
    localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify([entry, ...readActivities()].slice(0, 500)))
    window.dispatchEvent(new Event(activityEventName))
  } catch {
    // O registro de atividades é demonstrativo e fica limitado ao navegador atual.
  }
}

export { activityEventName }
