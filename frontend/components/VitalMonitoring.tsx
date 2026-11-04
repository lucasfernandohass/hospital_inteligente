import { useEffect, useMemo, useState } from "react"
import { logActivity } from "./activityStore"
import { PageTitle } from "./ui"
import type { LiveVitalReading } from "../hooks/useVitalFeed"

interface MonitoredPatient {
  id: string
  name: string
  bed: string
  sector: string
  condition: string
  /** Última pressão arterial registrada no prontuário (a simulação não mede PA). */
  bloodPressure?: string
  liveVital?: LiveVitalReading
}

interface VitalSample {
  time: string
  heartRate: number
  oxygen: number
  respiration: number
  temperature: number
}

interface MonitorRecord extends MonitoredPatient, VitalSample {
  connected: boolean
  available: string[]
  ecgAbnormal: boolean
  deviceName: string
  deviceId: string
  history: VitalSample[]
}

interface Props {
  patients: MonitoredPatient[]
  liveVitals: Record<string, LiveVitalReading>
  profile: "Médico" | "Enfermagem"
  storageKey: string
  acknowledgedAlerts: string[]
  setAcknowledgedAlerts: React.Dispatch<React.SetStateAction<string[]>>
  onAlertsChange: (alerts: MonitoringAlert[]) => void
}

export interface MonitoringAlert {
  key: string
  patientId: string
  patientName: string
  bed: string
  sector: string
  label: string
  value: string
  limit: string
  time: string
  severity: "Informativo" | "Moderado" | "Crítico"
}

type Filter = "all" | "attention" | "normal" | "offline"
type Thresholds = {
  heartRateMin: number
  heartRateMax: number
  oxygenMin: number
  respirationMax: number
  temperatureMax: number
}

interface TriggeredEvent {
  id: string
  label: string
  value: string
  limit: string
}

interface Occurrence {
  id: string
  key: string
  patientId?: string
  patientName: string
  bed?: string
  sector?: string
  label: string
  value: string
  limit: string
  startedAt: string
  resolvedAt?: string
  severity: "Informativo" | "Moderado" | "Crítico"
  acknowledged: boolean
}

const defaultThresholds: Thresholds = {
  heartRateMin: 50,
  heartRateMax: 110,
  oxygenMin: 92,
  respirationMax: 24,
  temperatureMax: 38,
}

const dateTimeClock = () =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date())

function hasAttention(record: MonitorRecord, thresholds: Thresholds) {
  return getTriggeredEvents(record, thresholds).length > 0
}

function getTrendEvents(record: MonitorRecord): TriggeredEvent[] {
  if (record.history.length < 6) return []
  const previous = record.history.slice(-6, -3)
  const recent = record.history.slice(-3)
  const average = (samples: VitalSample[], key: keyof Omit<VitalSample, "time">) =>
    samples.reduce((total, sample) => total + sample[key], 0) / samples.length
  const trends: TriggeredEvent[] = []
  const heartRateChange = average(recent, "heartRate") - average(previous, "heartRate")
  const oxygenChange = average(recent, "oxygen") - average(previous, "oxygen")
  const respirationChange = average(recent, "respiration") - average(previous, "respiration")
  const temperatureChange = average(recent, "temperature") - average(previous, "temperature")

  if (Math.abs(heartRateChange) >= 15) trends.push({ id: "trend-heart-rate", label: "Variação rápida da frequência cardíaca", value: (heartRateChange > 0 ? "+" : "") + heartRateChange.toFixed(0) + " bpm", limit: "variação de 15 bpm entre médias" })
  if (oxygenChange <= -3) trends.push({ id: "trend-oxygen", label: "Queda rápida da saturação", value: oxygenChange.toFixed(1) + " pontos percentuais", limit: "queda de 3 pontos entre médias" })
  if (respirationChange >= 5) trends.push({ id: "trend-respiration", label: "Aumento rápido da frequência respiratória", value: "+" + respirationChange.toFixed(0) + " rpm", limit: "aumento de 5 rpm entre médias" })
  if (temperatureChange >= 0.5) trends.push({ id: "trend-temperature", label: "Aumento rápido da temperatura", value: "+" + temperatureChange.toFixed(1) + " °C", limit: "aumento de 0,5 °C entre médias" })
  return trends
}

function getTriggeredEvents(record: MonitorRecord, thresholds: Thresholds) {
  const events: TriggeredEvent[] = []
  if (!record.connected) return [{ id: "device-offline", label: "Dispositivo sem comunicação", value: record.deviceId, limit: "última leitura há menos de 15 segundos" }]
  if (record.available.includes("heartRate") && record.heartRate < thresholds.heartRateMin) events.push({ id: "heart-rate-low", label: "Frequência cardíaca abaixo do limite", value: record.heartRate + " bpm", limit: "mínimo " + thresholds.heartRateMin + " bpm" })
  if (record.available.includes("heartRate") && record.heartRate > thresholds.heartRateMax) events.push({ id: "heart-rate-high", label: "Frequência cardíaca acima do limite", value: record.heartRate + " bpm", limit: "máximo " + thresholds.heartRateMax + " bpm" })
  if (record.available.includes("oxygen") && record.oxygen < thresholds.oxygenMin) events.push({ id: "oxygen-low", label: "Saturação abaixo do limite", value: record.oxygen.toFixed(1) + "%", limit: "mínimo " + thresholds.oxygenMin + "%" })
  if (record.available.includes("respiration") && record.respiration > thresholds.respirationMax) events.push({ id: "respiration-high", label: "Frequência respiratória acima do limite", value: record.respiration + " rpm", limit: "máximo " + thresholds.respirationMax + " rpm" })
  if (record.available.includes("temperature") && record.temperature >= thresholds.temperatureMax) events.push({ id: "temperature-high", label: "Temperatura acima do limite", value: record.temperature.toFixed(1) + " °C", limit: "máximo " + thresholds.temperatureMax + " °C" })
  return [...events, ...getTrendEvents(record)]
}

function isCritical(record: MonitorRecord) {
  return (record.available.includes("heartRate") && (record.heartRate < 40 || record.heartRate > 130)) || (record.available.includes("oxygen") && record.oxygen < 88) || (record.available.includes("respiration") && record.respiration > 30) || (record.available.includes("temperature") && record.temperature >= 39)
}

function eventSeverity(record: MonitorRecord, eventId: string): MonitoringAlert["severity"] {
  if (eventId.startsWith("trend-")) return "Informativo"
  const critical =
    (eventId.startsWith("heart-rate-") && (record.heartRate < 40 || record.heartRate > 130)) ||
    (eventId === "oxygen-low" && record.oxygen < 88) ||
    (eventId === "respiration-high" && record.respiration > 30) ||
    (eventId === "temperature-high" && record.temperature >= 39)
  return critical ? "Crítico" : "Moderado"
}

function makeRecords(patients: MonitoredPatient[]): MonitorRecord[] {
  return patients.map((patient) => {
    return {
      ...patient,
      connected: false,
      available: [],
      ecgAbnormal: false,
      deviceName: "Monitor externo",
      deviceId: "MON-" + patient.id,
      heartRate: 0,
      oxygen: 0,
      respiration: 0,
      temperature: 0,
      time: "Sem leitura",
      history: [],
    }
  })
}

function isVitalSample(value: unknown): value is VitalSample {
  if (!value || typeof value !== "object") return false
  const sample = value as Partial<VitalSample>
  return typeof sample.time === "string" &&
    Number.isFinite(sample.heartRate) &&
    Number.isFinite(sample.oxygen) &&
    Number.isFinite(sample.respiration) &&
    Number.isFinite(sample.temperature)
}

function isMonitorRecord(value: unknown): value is MonitorRecord {
  if (!value || typeof value !== "object") return false
  const record = value as Partial<MonitorRecord>
  return typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.bed === "string" &&
    typeof record.sector === "string" &&
    typeof record.condition === "string" &&
    typeof record.connected === "boolean" &&
    Array.isArray(record.available) &&
    typeof record.ecgAbnormal === "boolean" &&
    typeof record.deviceName === "string" &&
    typeof record.deviceId === "string" &&
    typeof record.time === "string" &&
    Number.isFinite(record.heartRate) &&
    Number.isFinite(record.oxygen) &&
    Number.isFinite(record.respiration) &&
    Number.isFinite(record.temperature) &&
    Array.isArray(record.history) &&
    record.history.every(isVitalSample)
}

function readSavedRecords(storageKey: string, patients: MonitoredPatient[]) {
  const initial = makeRecords(patients)
  try {
    const legacyKeys = storageKey === "inteliHosp-monitoramento"
      ? ["inteliHosp-monitoramento-medico", "inteliHosp-monitoramento-enfermagem"]
      : []
    const canonical = localStorage.getItem(storageKey)
    const saved = canonical
      ? JSON.parse(canonical) as MonitorRecord[] | null
      : legacyKeys.flatMap((key) => {
          try {
            const records = JSON.parse(localStorage.getItem(key) ?? "[]") as MonitorRecord[]
            return Array.isArray(records) ? records : []
          } catch {
            return []
          }
        })
    if (!Array.isArray(saved)) return initial
    const validSaved = saved.filter(isMonitorRecord)
    const currentIds = new Set(initial.map((record) => record.id))
    const currentRecords = initial.map((record) => {
      const stored = validSaved.find((item) => item.id === record.id)
      return stored
        ? { ...record, ...stored, history: Array.isArray(stored.history) ? stored.history.slice(-720) : record.history }
        : record
    })
    const archivedRecords = validSaved.filter((record) => !currentIds.has(record.id))
    return [...currentRecords, ...archivedRecords]
  } catch {
    return initial
  }
}

function readSavedThresholds(storageKey: string): Thresholds {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? "null") as Partial<Thresholds> | null
    return { ...defaultThresholds, ...stored }
  } catch {
    return defaultThresholds
  }
}

function readOccurrences(storageKey: string): Occurrence[] {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]") as Occurrence[]
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

function points(values: number[], min: number, max: number) {
  return values
    .map((value, index) => {
      const x = 8 + (index / Math.max(values.length - 1, 1)) * 284
      const y = 48 - ((value - min) / (max - min)) * 38
      return x + "," + Math.min(48, Math.max(10, y))
    })
    .join(" ")
}

function Metric({ label, short, value, unit, color, alarm = false, offline = false }: { label: string; short: string; value: string; unit: string; color: string; alarm?: boolean; offline?: boolean }) {
  const tone = offline ? "var(--monitor-muted)" : alarm ? "var(--vital-alarm)" : color
  return (
    <div className="monitor-tile rounded-lg px-3 py-2.5" style={alarm && !offline ? { borderColor: "color-mix(in srgb, var(--vital-alarm) 55%, transparent)" } : undefined}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold tracking-wide" style={{ color: tone }} title={label}>{short}</p>
        <p className="truncate text-[11px]" style={{ color: "var(--monitor-muted)" }}>{unit}</p>
      </div>
      <p className="monitor-value mt-1.5 text-[2rem]" style={{ color: tone }} aria-label={label + ": " + value + " " + unit}>
        {offline ? "--" : value}
      </p>
    </div>
  )
}

export default function VitalMonitoring({ patients, liveVitals, profile, storageKey, acknowledgedAlerts, setAcknowledgedAlerts, onAlertsChange }: Props) {
  const [records, setRecords] = useState(() => readSavedRecords(storageKey, patients))
  const patientIdsKey = patients.map((patient) => patient.id).join("|")
  const activePatientIds = useMemo(() => new Set(patientIdsKey ? patientIdsKey.split("|") : []), [patientIdsKey])
  const [thresholds, setThresholds] = useState(() => readSavedThresholds(storageKey + "-thresholds"))
  const [filter, setFilter] = useState<Filter>("all")
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState(patients[0]?.id ?? "")
  const [showAllHistory, setShowAllHistory] = useState(false)
  const [occurrences, setOccurrences] = useState(() => readOccurrences(storageKey + "-occurrences"))

  useEffect(() => {
    setRecords((current) => {
      const byId = new Map(current.map((record) => [record.id, record]))
      const missing = patients.filter((patient) => !byId.has(patient.id))
      let changed = missing.length > 0
      const updated = current.map((record) => {
        const patient = patients.find((item) => item.id === record.id)
        if (!patient) return record
        if (record.name === patient.name && record.bed === patient.bed && record.sector === patient.sector && record.condition === patient.condition && record.bloodPressure === patient.bloodPressure) return record
        changed = true
        return { ...record, ...patient }
      })
      return changed ? updated.concat(makeRecords(missing)) : current
    })
  }, [patients])

  useEffect(() => {
    setSelectedId((current) => activePatientIds.has(current) ? current : patients[0]?.id ?? "")
  }, [activePatientIds, patients])

  useEffect(() => {
    const now = Date.now()
    setRecords((current) => {
      const next = patients.map((patient) => {
      const record = current.find((item) => item.id === patient.id) ?? makeRecords([patient])[0]
      const reading = liveVitals[patient.id]
      const captured = reading?.capturedAt ? new Date(reading.capturedAt).getTime() : 0
      const history: VitalSample[] = (reading?.history ?? []).map((sample) => ({ ...sample }))
      return { ...record, ...patient, connected: captured > 0 && now - captured < 15000,
        available: [reading?.heartRate !== undefined ? "heartRate" : "", reading?.oxygen !== undefined ? "oxygen" : "", reading?.respiration !== undefined ? "respiration" : "", reading?.temperature !== undefined ? "temperature" : ""].filter(Boolean),
        heartRate: reading?.heartRate ?? 0, oxygen: reading?.oxygen ?? 0,
        respiration: reading?.respiration ?? 0, temperature: reading?.temperature ?? 0,
        bloodPressure: reading?.systolic !== undefined && reading.diastolic !== undefined ? `${reading.systolic}/${reading.diastolic}` : patient.bloodPressure,
        time: reading?.capturedAt ? new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(reading.capturedAt)) : "Sem leitura",
        history: history.slice(-720), ecgAbnormal: false }
      })
      if (current.length === next.length && current.every((record, index) => {
        const updated = next[index]
        return record.id === updated.id && record.name === updated.name && record.bed === updated.bed && record.sector === updated.sector && record.condition === updated.condition && record.connected === updated.connected && JSON.stringify(record.available) === JSON.stringify(updated.available) && record.heartRate === updated.heartRate && record.oxygen === updated.oxygen && record.respiration === updated.respiration && record.temperature === updated.temperature && record.time === updated.time && record.history.length === updated.history.length && record.history.at(-1)?.time === updated.history.at(-1)?.time
      })) return current
      return next
    })
  }, [liveVitals, patients])

  useEffect(() => {
    const timer = window.setInterval(() => setRecords((current) => current.map((record) => {
      const captured = liveVitals[record.id]?.capturedAt ? new Date(liveVitals[record.id]!.capturedAt!).getTime() : 0
      const connected = captured > 0 && Date.now() - captured < 15000
      return record.connected === connected ? record : { ...record, connected }
    })), 1000)
    return () => window.clearInterval(timer)
  }, [liveVitals])

  useEffect(() => {
    try {
      localStorage.setItem(storageKey + "-thresholds", JSON.stringify(thresholds))
    } catch {
      // Os limites permanecem ativos durante a sessão mesmo sem armazenamento local.
    }
  }, [storageKey, thresholds])

  useEffect(() => {
    try {
      localStorage.setItem(storageKey + "-occurrences", JSON.stringify(occurrences))
    } catch {
      // O histórico permanece disponível durante a sessão se o navegador bloquear o armazenamento.
    }
  }, [occurrences, storageKey])

  const visibleRecords = useMemo(() => records.filter((record) => activePatientIds.has(record.id)), [activePatientIds, records])
  const selected = visibleRecords.find((record) => record.id === selectedId) ?? visibleRecords[0]
  const attentionCount = visibleRecords.filter((record) => hasAttention(record, thresholds)).length
  const stableCount = visibleRecords.filter((record) => record.connected && !hasAttention(record, thresholds)).length
  const activeEvents = useMemo(() => visibleRecords.flatMap((record) =>
    getTriggeredEvents(record, thresholds).map((event) => ({
      key: record.id + ":" + event.id,
      patientId: record.id,
      patientName: record.name,
      bed: record.bed,
      sector: record.sector,
      label: event.label,
      value: event.value,
      limit: event.limit,
      time: dateTimeClock(),
      severity: eventSeverity(record, event.id),
    })),
  ), [visibleRecords, thresholds])
  const selectedEvents = selected ? getTriggeredEvents(selected, thresholds) : []
  const offlineCount = visibleRecords.filter((record) => !record.connected).length
  const filteredRecords = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR")
    return visibleRecords.filter((record) => {
      const text = (record.name + " " + record.bed + " " + record.sector).toLocaleLowerCase("pt-BR")
      const matchesFilter =
        filter === "all" ||
        (filter === "attention" && hasAttention(record, thresholds)) ||
        (filter === "normal" && record.connected && !hasAttention(record, thresholds)) ||
        (filter === "offline" && !record.connected)
      return text.includes(normalized) && matchesFilter
    })
  }, [filter, query, visibleRecords, thresholds])

  const updateThreshold = (key: keyof Thresholds, value: string) => {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) setThresholds((current) => ({ ...current, [key]: parsed }))
  }

  const printReport = () => {
    setShowAllHistory(true)
    window.setTimeout(() => window.print(), 100)
  }
  const exportHistory = () => {
    if (!selected) return
    const rows = [
      ["Horário", "Frequência cardíaca (bpm)", "Saturação (%)", "Frequência respiratória (rpm)", "Temperatura (°C)"],
      ...selected.history.map((sample) => [
        sample.time,
        String(sample.heartRate),
        sample.oxygen.toFixed(1),
        String(sample.respiration),
        sample.temperature.toFixed(1),
      ]),
    ]
    const csv = rows.map((row) => row.map((value) => '"' + value.replace(/"/g, '""') + '"').join(";")).join("\n")
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "historico-" + selected.id + ".csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  const controlStyle = { background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }

  useEffect(() => {
    onAlertsChange(activeEvents)
  }, [activeEvents, onAlertsChange])

  useEffect(() => {
    const activeKeys = new Set(activeEvents.map((event) => event.key))
    setAcknowledgedAlerts((current) => {
      const next = current.filter((key) => activeKeys.has(key))
      return next.length === current.length ? current : next
    })
  }, [records, thresholds])

  useEffect(() => {
    setOccurrences((current) => {
      let changed = false
      const next = current.map((occurrence) => {
        if (occurrence.resolvedAt) return occurrence
        const acknowledged = acknowledgedAlerts.includes(occurrence.key)
        if (occurrence.acknowledged === acknowledged) return occurrence
        changed = true
        return { ...occurrence, acknowledged }
      })
      return changed ? next : current
    })
  }, [acknowledgedAlerts])

  useEffect(() => {
    const activeByKey = new Map(activeEvents.map((event) => [event.key, event]))
    const timestamp = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "medium",
    }).format(new Date())
    setOccurrences((current) => {
      let changed = false
      const next = current.map((occurrence) => {
        if (!occurrence.resolvedAt && !activeByKey.has(occurrence.key)) {
          changed = true
          return { ...occurrence, resolvedAt: timestamp }
        }
        return occurrence
      })
      for (const [key, event] of activeByKey) {
        if (next.some((occurrence) => occurrence.key === key && !occurrence.resolvedAt)) continue
        const record = records.find((item) => item.id === event.patientId)
        if (!record) continue
        next.push({
          id: key + ":" + Date.now(),
          key,
          patientId: event.patientId,
          patientName: record.name,
          bed: record.bed,
          sector: record.sector,
          label: event.label,
          value: event.value,
          limit: event.limit,
          startedAt: timestamp,
          severity: event.severity,
          acknowledged: acknowledgedAlerts.includes(key),
        })
        changed = true
      }
      return changed ? next.slice(-500) : current
    })
  }, [activeEvents, acknowledgedAlerts, records])

  return (
    <section className="fade-in min-w-0 space-y-5" aria-labelledby="monitoramento-title">
      <div id="monitoramento-title" className="-mb-1">
        <PageTitle
          eyebrow={"Monitoramento · " + profile}
          title="Monitoramento de sinais vitais"
          subtitle="Acompanhamento das últimas medições recebidas da API e do WebSocket."
          action={
            <>
              <span className="inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-xs font-semibold" style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--foreground)" }}>
                Feed do monitor
              </span>
            </>
          }
        />
      </div>


      <div className="keep-2-cols grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Pacientes acompanhados", value: visibleRecords.length, color: "var(--foreground)", dot: "var(--info)" },
          { label: "Sem limites excedidos", value: stableCount, color: "var(--success-foreground)", dot: "var(--success)" },
          { label: "Com parâmetros de atenção", value: attentionCount, color: attentionCount ? "var(--danger-foreground)" : "var(--foreground)", dot: "var(--danger)" },
          { label: "Dispositivos desconectados", value: offlineCount, color: "var(--neutral-foreground)", dot: "var(--neutral)" },
        ].map((item) => (
          <div key={item.label} className="rounded-[var(--radius)] border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <p className="flex items-start gap-2 text-xs font-medium leading-tight" style={{ color: "var(--muted-foreground)" }}><span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: item.dot }} />{item.label}</p>
            <p className="mt-1.5 text-2xl font-bold tabular-nums" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.85fr)]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-3 rounded-[var(--radius)] border p-4 sm:flex-row sm:items-center" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar paciente, leito ou setor"
              aria-label="Buscar paciente, leito ou setor"
              className="min-h-11 min-w-0 flex-1 rounded-xl border px-3 text-sm outline-none focus:ring-2"
              style={controlStyle}
            />
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as Filter)}
              aria-label="Filtrar pacientes monitorados"
              className="min-h-11 rounded-xl border px-3 text-sm"
              style={controlStyle}
            >
              <option value="all">Todos os pacientes</option>
              <option value="attention">Com atenção</option>
              <option value="normal">Estáveis</option>
              <option value="offline">Dispositivo offline</option>
            </select>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2">
            {filteredRecords.map((record) => {
              const attention = hasAttention(record, thresholds)
              const critical = isCritical(record)
              const active = selected?.id === record.id
              return (
                <article
                  key={record.id}
                  className="monitor-screen min-w-0 rounded-[var(--radius)] p-3.5 transition-shadow"
                  style={{
                    borderColor: active ? "var(--vital-spo2)" : critical ? "color-mix(in srgb, var(--vital-alarm) 60%, transparent)" : undefined,
                    boxShadow: active ? "0 0 0 2px color-mix(in srgb, var(--vital-spo2) 35%, transparent), var(--shadow-md)" : "var(--shadow-sm)",
                  }}
                >
                  <button type="button" onClick={() => setSelectedId(record.id)} className="w-full min-w-0 rounded-md text-left" aria-pressed={active} aria-label={"Selecionar " + record.name + ", leito " + record.bed}>
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-bold" style={{ color: "var(--monitor-text)" }}>{record.name}</h2>
                        <p className="mt-0.5 truncate text-xs" style={{ color: "var(--monitor-muted)" }}>Leito {record.bed} · {record.sector}</p>
                      </div>
                      <span
                        className="shrink-0 rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wide"
                        style={{
                          background: critical ? "var(--badge-danger)" : attention ? "rgba(245, 213, 71, 0.16)" : "rgba(53, 224, 143, 0.14)",
                          color: critical ? "#FFFFFF" : attention ? "var(--vital-rr)" : "var(--vital-hr)",
                        }}
                      >
                        {critical ? "Crítico" : attention ? "Atenção" : "Estável"}
                      </span>
                    </div>
                  </button>
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color: record.connected ? "var(--vital-hr)" : "var(--vital-alarm)" }}>
                      <span className={"h-2 w-2 rounded-full bg-current" + (record.connected ? " animate-pulse" : "")} />
                      {record.deviceName} · {record.connected ? "Conectado" : "Desconectado"}
                    </span>
                    <span className="font-mono text-[11px] tabular-nums" style={{ color: "var(--monitor-muted)" }}>{record.deviceId} · {record.time}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Metric label="Frequência cardíaca" short="FC" value={String(record.heartRate)} unit="bpm" color="var(--vital-hr)" alarm={record.heartRate < thresholds.heartRateMin || record.heartRate > thresholds.heartRateMax} offline={!record.connected || !record.available.includes("heartRate")} />
                    <Metric label="Saturação" short="SpO₂" value={record.oxygen.toFixed(1)} unit="%" color="var(--vital-spo2)" alarm={record.oxygen < thresholds.oxygenMin} offline={!record.connected || !record.available.includes("oxygen")} />
                    <Metric label="Frequência respiratória" short="FR" value={String(record.respiration)} unit="rpm" color="var(--vital-rr)" alarm={record.respiration > thresholds.respirationMax} offline={!record.connected || !record.available.includes("respiration")} />
                    <Metric label="Temperatura" short="TEMP" value={record.temperature.toFixed(1)} unit="°C" color="var(--vital-temp)" alarm={record.temperature >= thresholds.temperatureMax} offline={!record.connected || !record.available.includes("temperature")} />
                    <div className="monitor-tile col-span-2 flex items-center justify-between gap-3 rounded-lg px-3 py-2">
                      <p className="text-[11px] font-bold tracking-wide" style={{ color: "var(--vital-bp)" }}>PA <span className="font-medium" style={{ color: "var(--monitor-muted)" }}>· último registro</span></p>
                      <p className="monitor-value text-xl" style={{ color: "var(--vital-bp)" }} aria-label={"Pressão arterial do último registro: " + (record.bloodPressure ?? "sem registro") + " mmHg"}>
                        {record.bloodPressure ?? "--/--"}<span className="ml-1 text-[11px] font-medium" style={{ color: "var(--monitor-muted)" }}>mmHg</span>
                      </p>
                    </div>
                  </div>
                </article>
              )
            })}
            {filteredRecords.length === 0 && (
              <div className="rounded-[var(--radius)] border border-dashed p-10 text-center text-sm md:col-span-2" style={{ borderColor: "var(--border-strong)", color: "var(--muted-foreground)" }}>
                Nenhum paciente encontrado para esse filtro.
              </div>
            )}
          </div>
        </div>

        {selected && (
          <aside className="monitoring-printable min-w-0 rounded-[var(--radius)] border p-4 sm:p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="ui-eyebrow">Paciente selecionado</p>
                <h2 className="mt-1 truncate text-lg font-bold" style={{ color: "var(--foreground)" }}>{selected.name}</h2>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{selected.condition}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Leito {selected.bed}</span>
                <button type="button" onClick={printReport} className="min-h-9 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--secondary)", color: "var(--primary)" }}>Salvar em PDF</button>
                <button type="button" onClick={exportHistory} className="min-h-9 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--secondary)", color: "var(--primary)" }}>Exportar CSV</button>
              </div>
            </div>
            <div className="monitor-screen mt-4 rounded-xl p-3.5">
              <p className="text-xs" style={{ color: "var(--monitor-muted)" }}>O endpoint atual fornece parâmetros numéricos. O traçado de ECG não está disponível na API.</p>
              <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-3 min-[420px]:grid-cols-3">
                {[
                  { short: "FC", value: String(selected.heartRate), unit: "bpm", color: "var(--vital-hr)", live: true },
                  { short: "SpO₂", value: selected.oxygen.toFixed(1), unit: "%", color: "var(--vital-spo2)", live: true },
                  { short: "FR", value: String(selected.respiration), unit: "rpm", color: "var(--vital-rr)", live: true },
                  { short: "TEMP", value: selected.temperature.toFixed(1), unit: "°C", color: "var(--vital-temp)", live: true },
                  { short: "PA", value: selected.bloodPressure ?? "--/--", unit: "mmHg · registro", color: "var(--vital-bp)", live: false },
                ].map((vital) => (
                  <div key={vital.short} className="min-w-0">
                    <p className="truncate text-[11px] font-bold" style={{ color: vital.color }}>{vital.short} <span className="font-medium" style={{ color: "var(--monitor-muted)" }}>{vital.unit}</span></p>
                    <p className="monitor-value mt-1 text-[1.65rem]" style={{ color: selected.connected || !vital.live ? vital.color : "var(--monitor-muted)" }}>{selected.connected || !vital.live ? vital.value : "--"}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="monitor-screen mt-3 rounded-xl p-3.5">
              <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium" style={{ color: "var(--monitor-muted)" }}>
                <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: "var(--vital-hr)" }} />Frequência cardíaca</span>
                <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: "var(--vital-spo2)" }} />Saturação</span>
              </div>
              <svg viewBox="0 0 300 60" className="h-28 w-full" role="img" aria-label="Gráfico das últimas medições recebidas">
                <path d="M8 15H292M8 30H292M8 45H292" stroke="var(--monitor-border)" strokeDasharray="3 4" />
                <polyline className="monitor-trace" points={points(selected.history.map((sample) => sample.heartRate), 45, 125)} fill="none" stroke="var(--vital-hr)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <polyline className="monitor-trace" points={points(selected.history.map((sample) => sample.oxygen), 80, 100)} fill="none" stroke="var(--vital-spo2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-1 text-[11px]" style={{ color: "var(--monitor-muted)" }}>Leituras recebidas do WebSocket · retenção em memória de até 1 hora</p>
            </div>
            <div className="mt-3 rounded-xl border p-3" role={selectedEvents.length ? "alert" : undefined} style={{ background: selectedEvents.length ? "var(--alert-surface)" : "var(--background)", borderColor: selectedEvents.length ? "var(--alert-border)" : "var(--border)" }}>
              <h3 className="text-xs font-bold" style={{ color: "var(--foreground)" }}>Verificação de limites</h3>
              {selectedEvents.length ? (
                <ul className="mt-2 space-y-2 text-xs" style={{ color: "var(--alert-foreground)" }}>
                  {selectedEvents.map((event) => {
                    const key = selected.id + ":" + event.id
                    const acknowledged = acknowledgedAlerts.includes(key)
                    return (
                      <li key={key} className="flex flex-wrap items-center justify-between gap-2 border-t pt-2 first:border-0 first:pt-0" style={{ borderColor: "var(--alert-border)" }}>
                        <div>
                          <p className="font-semibold">{event.label}</p>
                          <p>{event.value} · Limite: {event.limit}</p>
                          <p className="opacity-80">{acknowledged ? "Reconhecido" : "Pendente"} · {selected.time}</p>
                        </div>
                        {!acknowledged && (
                          <button type="button" onClick={() => {
                            setAcknowledgedAlerts((current) => current.includes(key) ? current : [...current, key])
                            setOccurrences((current) => current.map((occurrence) => occurrence.key === key && !occurrence.resolvedAt ? { ...occurrence, acknowledged: true } : occurrence))
                            logActivity(profile, "Alerta de monitoramento reconhecido", selected.id, `${event.label} · ${event.value}`)
                          }} className="min-h-9 rounded-lg px-2.5 font-semibold" style={{ background: "var(--card)", color: "var(--alert-foreground)" }}>
                            Reconhecer
                          </button>
                        )}
                      </li>
                    )
                  })}
                  <li className="pt-1 font-semibold">Nível visual: {isCritical(selected) ? "Crítico" : "Moderado"}</li>
                </ul>
              ) : (
                <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>Nenhum limite configurado foi ultrapassado nos dados recebidos.</p>
              )}
            </div>
            <details className="mt-3 rounded-xl border p-3" style={{ background: "var(--background)", borderColor: "var(--border)" }}>
              <summary className="monitor-summary -m-3 flex min-h-11 cursor-pointer items-center rounded-xl p-3 text-xs font-bold" style={{ color: "var(--foreground)" }}>
                Histórico de ocorrências ({occurrences.length})
              </summary>
              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                {occurrences.length ? [...occurrences].reverse().slice(0, 30).map((occurrence) => (
                  <article key={occurrence.id} className="rounded-lg border p-3 text-[11px] leading-relaxed" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong style={{ color: "var(--foreground)" }}>{occurrence.patientName} · {occurrence.label}</strong>
                      <span className="font-semibold" style={{ color: occurrence.severity === "Crítico" ? "var(--danger-foreground)" : occurrence.severity === "Moderado" ? "var(--warning-foreground)" : "var(--primary)" }}>{occurrence.severity} · {occurrence.resolvedAt ? "Resolvido" : "Ativo"}</span>
                    </div>
                    <p className="mt-1">{occurrence.value} · Limite: {occurrence.limit}</p>
                    {(occurrence.patientId || occurrence.bed || occurrence.sector) && <p>{occurrence.patientId ? occurrence.patientId + " · " : ""}{occurrence.bed ? "Leito " + occurrence.bed + " · " : ""}{occurrence.sector ?? ""}</p>}
                    <p>Início: {occurrence.startedAt}{occurrence.resolvedAt ? " · Resolução: " + occurrence.resolvedAt : ""}</p>
                    <p>Atendimento: {occurrence.acknowledged ? "Reconhecido" : "Pendente"}</p>
                  </article>
                )) : <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>As ocorrências detectadas durante a simulação aparecerão aqui.</p>}
              </div>
            </details>
            <div className="mt-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-bold" style={{ color: "var(--foreground)" }}>Histórico recente · até 1 hora</h3>
                {selected.history.length > 6 && <button type="button" onClick={() => setShowAllHistory((value) => !value)} className="min-h-8 text-xs font-semibold" style={{ color: "var(--primary)" }}>{showAllHistory ? "Mostrar menos" : "Ver todas as medições"}</button>}
              </div>
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {[...selected.history].reverse().slice(0, showAllHistory ? 720 : 6).map((sample, index) => (
                  <div key={sample.time + "-" + index} className="grid grid-cols-[auto_1fr] gap-3 rounded-lg px-3 py-2 text-xs" style={{ background: "var(--background)" }}>
                    <span className="font-mono tabular-nums" style={{ color: "var(--muted-foreground)" }}>{sample.time}</span>
                    <span className="text-right font-medium tabular-nums" style={{ color: "var(--foreground)" }}>
                      {sample.heartRate} bpm · {sample.oxygen.toFixed(1)}% · {sample.respiration} rpm · {sample.temperature.toFixed(1)}°C
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <details className="mt-4 rounded-xl border p-3" style={{ background: "var(--background)", borderColor: "var(--border)" }}>
              <summary className="monitor-summary -m-3 flex min-h-11 cursor-pointer items-center rounded-xl p-3 text-xs font-bold" style={{ color: "var(--foreground)" }}>Configurar limites demonstrativos</summary>
              <div className="mt-3 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                {[
                  { key: "heartRateMin", label: "FC mínima (bpm)" },
                  { key: "heartRateMax", label: "FC máxima (bpm)" },
                  { key: "oxygenMin", label: "SpO₂ mínima (%)" },
                  { key: "respirationMax", label: "FR máxima (rpm)" },
                  { key: "temperatureMax", label: "Temperatura máxima (°C)" },
                ].map((field) => (
                  <label key={field.key} className="flex min-w-0 flex-col gap-1 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                    {field.label}
                    <input type="number" step={field.key === "temperatureMax" || field.key === "oxygenMin" ? "0.1" : "1"} value={thresholds[field.key as keyof Thresholds]} onChange={(event) => updateThreshold(field.key as keyof Thresholds, event.target.value)} className="min-h-10 min-w-0 rounded-lg border px-2 text-sm" style={controlStyle} />
                  </label>
                ))}
                <button type="button" onClick={() => setThresholds(defaultThresholds)} className="min-h-10 self-end rounded-lg px-3 text-xs font-semibold min-[420px]:col-span-2" style={{ background: "var(--secondary)", color: "var(--primary)" }}>
                  Restaurar limites de exemplo
                </button>
              </div>
              <p className="mt-2 text-xs" style={{ color: "var(--muted-foreground)" }}>Os limites são exemplos de interface e precisam ser definidos por protocolos clínicos antes de qualquer uso real.</p>
            </details>
          </aside>
        )}
      </div>

      <p className="rounded-lg border px-3 py-2.5 text-xs leading-relaxed" style={{ background: "var(--warning-surface)", borderColor: "color-mix(in srgb, var(--warning) 35%, transparent)", color: "var(--warning-foreground)" }}>
        Os valores exibidos vêm da última leitura recebida pela API/WebSocket. Uma conexão fica offline após 15 segundos sem atualização.
      </p>
    </section>
  )
}
