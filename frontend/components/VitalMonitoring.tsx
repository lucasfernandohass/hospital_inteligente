import { useEffect, useMemo, useState } from "react"
import { logActivity } from "./activityStore"

interface MonitoredPatient {
  id: string
  name: string
  bed: string
  sector: string
  condition: string
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
  ecgAbnormal: boolean
  deviceName: string
  deviceId: string
  history: VitalSample[]
}

interface Props {
  patients: MonitoredPatient[]
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

const clock = () =>
  new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date())

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
  if (record.heartRate < thresholds.heartRateMin) events.push({ id: "heart-rate-low", label: "Frequência cardíaca abaixo do limite", value: record.heartRate + " bpm", limit: "mínimo " + thresholds.heartRateMin + " bpm" })
  if (record.heartRate > thresholds.heartRateMax) events.push({ id: "heart-rate-high", label: "Frequência cardíaca acima do limite", value: record.heartRate + " bpm", limit: "máximo " + thresholds.heartRateMax + " bpm" })
  if (record.oxygen < thresholds.oxygenMin) events.push({ id: "oxygen-low", label: "Saturação abaixo do limite", value: record.oxygen.toFixed(1) + "%", limit: "mínimo " + thresholds.oxygenMin + "%" })
  if (record.respiration > thresholds.respirationMax) events.push({ id: "respiration-high", label: "Frequência respiratória acima do limite", value: record.respiration + " rpm", limit: "máximo " + thresholds.respirationMax + " rpm" })
  if (record.temperature >= thresholds.temperatureMax) events.push({ id: "temperature-high", label: "Temperatura acima do limite", value: record.temperature.toFixed(1) + " °C", limit: "máximo " + thresholds.temperatureMax + " °C" })
  if (!record.connected) events.push({ id: "device-offline", label: "Dispositivo sem comunicação", value: record.deviceId, limit: "conexão ativa" })
  if (record.ecgAbnormal) events.push({ id: "ecg-change", label: "Alteração detectada no ECG demonstrativo", value: "Traçado irregular simulado", limit: "padrão regular" })
  return [...events, ...getTrendEvents(record)]
}

function isCritical(record: MonitorRecord) {
  return record.heartRate < 40 || record.heartRate > 130 || record.oxygen < 88 || record.respiration > 30 || record.temperature >= 39
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
  return patients.map((patient, index) => {
    const heartRate = index === 2 ? 116 : 68 + ((index * 7) % 24)
    const oxygen = index === 4 ? 90 : 98 - (index % 3)
    const respiration = index === 1 ? 22 : 14 + ((index * 2) % 7)
    const temperature = index === 3 ? 37.8 : 36.4 + ((index * 3) % 8) / 10
    const history = Array.from({ length: 10 }, (_, sampleIndex) => {
      const hour = 8 + Math.floor(sampleIndex / 6)
      const minute = (sampleIndex * 6) % 60
      return {
        time: String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0"),
        heartRate: Math.max(45, heartRate + Math.round(Math.sin(sampleIndex * 1.3) * 5)),
        oxygen: Math.min(100, Math.max(80, oxygen + Math.sin(sampleIndex * 0.8))),
        respiration: Math.max(8, respiration + Math.round(Math.cos(sampleIndex) * 2)),
        temperature: temperature + Math.sin(sampleIndex * 0.7) * 0.2,
      }
    })
    return {
      ...patient,
      connected: index !== 3,
      ecgAbnormal: index === 2,
      deviceName: "Monitor multiparamétrico",
      deviceId: "MON-" + patient.id,
      heartRate,
      oxygen,
      respiration,
      temperature,
      time: clock(),
      history,
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

function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: "var(--background)" }}>
      <p className="text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums" style={{ color: "var(--foreground)" }}>
        {value} <span className="text-[10px] font-medium" style={{ color: "var(--muted-foreground)" }}>{unit}</span>
      </p>
    </div>
  )
}

export default function VitalMonitoring({ patients, profile, storageKey, acknowledgedAlerts, setAcknowledgedAlerts, onAlertsChange }: Props) {
  const [records, setRecords] = useState(() => readSavedRecords(storageKey, patients))
  const activePatientIds = useMemo(() => new Set(patients.map((patient) => patient.id)), [patients])
  const [thresholds, setThresholds] = useState(() => readSavedThresholds(storageKey + "-thresholds"))
  const [filter, setFilter] = useState<Filter>("all")
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState(patients[0]?.id ?? "")
  const [showDeviceForm, setShowDeviceForm] = useState(false)
  const [devicePatientId, setDevicePatientId] = useState(patients[0]?.id ?? "")
  const [deviceName, setDeviceName] = useState("Monitor multiparamétrico")
  const [deviceId, setDeviceId] = useState("")
  const [deviceError, setDeviceError] = useState("")
  const [showAllHistory, setShowAllHistory] = useState(false)
  const [occurrences, setOccurrences] = useState(() => readOccurrences(storageKey + "-occurrences"))

  useEffect(() => {
    setRecords((current) => {
      const byId = new Map(current.map((record) => [record.id, record]))
      const missing = patients.filter((patient) => !byId.has(patient.id))
      const newRecords = makeRecords(missing)
      const additions = new Map(newRecords.map((record) => [record.id, record]))
      return current.map((record) => {
        const patient = patients.find((item) => item.id === record.id)
        return patient ? { ...record, ...patient } : record
      }).concat(newRecords).map((record) => additions.get(record.id) ?? record)
    })
  }, [patients])

  useEffect(() => {
    setSelectedId((current) => activePatientIds.has(current) ? current : patients[0]?.id ?? "")
    setDevicePatientId((current) => activePatientIds.has(current) ? current : patients[0]?.id ?? "")
  }, [activePatientIds, patients])

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(records))
    } catch {
      // A demonstração continua funcionando mesmo se o navegador bloquear o armazenamento.
    }
  }, [records, storageKey])

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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRecords((current) =>
        current.map((record) => {
          if (!activePatientIds.has(record.id) || !record.connected) return record
          const sample: VitalSample = {
            time: clock(),
            heartRate: Math.max(45, record.heartRate + Math.round(Math.random() * 4 - 2)),
            oxygen: Math.min(100, Math.max(80, record.oxygen + Math.random() * 0.4 - 0.2)),
            respiration: Math.max(8, record.respiration + Math.round(Math.random() * 2 - 1)),
            temperature: Math.min(40, Math.max(35, record.temperature + Math.random() * 0.1 - 0.05)),
          }
          return {
            ...record,
            ...sample,
            ecgAbnormal: Math.random() < 0.015 ? !record.ecgAbnormal : record.ecgAbnormal,
            history: [...record.history.slice(-719), sample],
          }
        }),
      )
    }, 5000)
    return () => window.clearInterval(timer)
  }, [activePatientIds])

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

  const setDeviceConnection = (id: string, connected: boolean) => {
    const record = records.find((item) => item.id === id)
    if (!record || record.connected === connected) return
    setRecords((current) => current.map((item) => (item.id === id ? { ...item, connected, time: clock() } : item)))
    logActivity(profile, connected ? "Dispositivo reconectado" : "Dispositivo desconectado", id, record.deviceId + " · Leito " + record.bed)
  }

  const saveDevice = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const patient = records.find((record) => record.id === devicePatientId)
    if (!patient || !deviceName.trim() || !deviceId.trim()) return
    const duplicate = records.some(
      (record) => record.id !== devicePatientId && record.deviceId.toLocaleLowerCase("pt-BR") === deviceId.trim().toLocaleLowerCase("pt-BR"),
    )
    if (duplicate) {
      setDeviceError("Este identificador já está vinculado a outro paciente.")
      return
    }
    setRecords((current) =>
      current.map((record) =>
        record.id === devicePatientId
          ? { ...record, deviceName: deviceName.trim(), deviceId: deviceId.trim(), connected: true, time: clock() }
          : record,
      ),
    )
    logActivity(profile, "Dispositivo vinculado ao paciente", patient.id, deviceName.trim() + " · " + deviceId.trim())
    setSelectedId(devicePatientId)
    setShowDeviceForm(false)
    setDeviceId("")
    setDeviceError("")
  }

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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 id="monitoramento-title" className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--foreground)" }}>Monitoramento de sinais vitais</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>Acompanhamento demonstrativo de pacientes e dispositivos conectados.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold" style={{ background: "var(--secondary)", color: "var(--primary)" }}>
            <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--accent)" }} />
            Simulação ao vivo
          </span>
          <button type="button" onClick={() => { setShowDeviceForm((value) => !value); setDeviceError("") }} className="min-h-10 rounded-xl px-3 text-xs font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
            {showDeviceForm ? "Fechar vínculo" : "Vincular dispositivo"}
          </button>
        </div>
      </div>

      {showDeviceForm && (
        <form onSubmit={saveDevice} className="grid grid-cols-1 gap-3 rounded-[var(--radius)] border p-4 sm:grid-cols-2 xl:grid-cols-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
            Paciente
            <select required value={devicePatientId} onChange={(event) => setDevicePatientId(event.target.value)} className="min-h-11 rounded-xl border px-3 text-sm" style={controlStyle}>
              {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} · leito {patient.bed}</option>)}
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
            Tipo de dispositivo
            <select value={deviceName} onChange={(event) => setDeviceName(event.target.value)} className="min-h-11 rounded-xl border px-3 text-sm" style={controlStyle}>
              <option>Monitor multiparamétrico</option>
              <option>Oxímetro de pulso</option>
              <option>Termômetro digital</option>
              <option>Monitor de ECG</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
            Identificação do dispositivo
            <input required value={deviceId} onChange={(event) => { setDeviceId(event.target.value); setDeviceError("") }} placeholder="Ex.: MON-001" className="min-h-11 rounded-xl border px-3 text-sm" style={controlStyle} />
          </label>
          <div className="flex items-end">
            <button type="submit" className="min-h-11 w-full rounded-xl px-4 text-sm font-semibold" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>
              Salvar vínculo simulado
            </button>
          </div>
          <p className="text-[10px] sm:col-span-2 xl:col-span-4" style={{ color: "var(--muted-foreground)" }}>
            Os dados do vínculo ficam salvos somente neste navegador.
          </p>
          {deviceError && <p role="alert" className="text-xs font-semibold text-red-600 sm:col-span-2 xl:col-span-4">{deviceError}</p>}
        </form>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Pacientes acompanhados", value: visibleRecords.length, color: "var(--primary)" },
          { label: "Sem limites excedidos", value: stableCount, color: "var(--accent)" },
          { label: "Com parâmetros de atenção", value: attentionCount, color: "var(--alert-foreground)" },
          { label: "Dispositivos desconectados", value: offlineCount, color: "var(--muted-foreground)" },
        ].map((item) => (
          <div key={item.label} className="rounded-[var(--radius)] border p-4 sm:p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{item.label}</p>
            <p className="mt-2 text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
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
                <article key={record.id} className="min-w-0 rounded-[var(--radius)] border p-4 transition-colors" style={{ background: "var(--card)", borderColor: active ? "var(--accent)" : "var(--border)" }}>
                  <button type="button" onClick={() => setSelectedId(record.id)} className="w-full min-w-0 text-left" aria-pressed={active}>
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-bold" style={{ color: "var(--foreground)" }}>{record.name}</h2>
                        <p className="mt-1 truncate text-xs" style={{ color: "var(--muted-foreground)" }}>Leito {record.bed} · {record.sector}</p>
                      </div>
                      <span className="shrink-0 rounded-full px-2 py-1 text-[10px] font-bold" style={{ background: attention ? "var(--alert-icon-bg)" : "var(--secondary)", color: attention ? "var(--alert-foreground)" : "var(--primary)" }}>
                        {critical ? "Crítico" : attention ? "Atenção" : "Estável"}
                      </span>
                    </div>
                  </button>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3" style={{ borderColor: "var(--border)" }}>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium" style={{ color: record.connected ? "var(--accent)" : "var(--alert-foreground)" }}>
                      <span className="h-2 w-2 rounded-full bg-current" />
                      {record.deviceName} · {record.connected ? "Conectado" : "Desconectado"}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{record.deviceId} · {record.time}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Metric label="Frequência cardíaca" value={String(record.heartRate)} unit="bpm" />
                    <Metric label="Saturação" value={record.oxygen.toFixed(1)} unit="%" />
                    <Metric label="Frequência respiratória" value={String(record.respiration)} unit="rpm" />
                    <Metric label="Temperatura" value={record.temperature.toFixed(1)} unit="°C" />
                  </div>
                  <button type="button" onClick={() => setDeviceConnection(record.id, !record.connected)} className="mt-3 min-h-10 w-full rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--secondary)", color: "var(--primary)" }}>
                    Simular {record.connected ? "desconexão" : "reconexão"} do dispositivo
                  </button>
                </article>
              )
            })}
            {filteredRecords.length === 0 && (
              <div className="rounded-[var(--radius)] border p-8 text-center text-sm md:col-span-2" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                Nenhum paciente encontrado para esse filtro.
              </div>
            )}
          </div>
        </div>

        {selected && (
          <aside className="monitoring-printable min-w-0 rounded-[var(--radius)] border p-4 sm:p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Histórico recente</p>
                <h2 className="mt-1 truncate text-lg font-bold" style={{ color: "var(--foreground)" }}>{selected.name}</h2>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{selected.condition}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={printReport} className="rounded-lg px-2.5 py-1.5 text-[10px] font-semibold" style={{ background: "var(--secondary)", color: "var(--primary)" }}>Salvar em PDF</button>
                <button type="button" onClick={exportHistory} className="rounded-lg px-2.5 py-1.5 text-[10px] font-semibold" style={{ background: "var(--secondary)", color: "var(--primary)" }}>Exportar CSV</button>
                <span className="rounded-lg px-2.5 py-1.5 text-[10px] font-semibold" style={{ background: "var(--secondary)", color: "var(--primary)" }}>Leito {selected.bed}</span>
              </div>
            </div>
            <div className="mt-5 rounded-xl border p-3" style={{ background: "var(--background)", borderColor: "var(--border)" }}>
              <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: "var(--primary)" }} />Frequência cardíaca</span>
                <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />Saturação</span>
              </div>
              <svg viewBox="0 0 300 60" className="h-28 w-full" role="img" aria-label="Gráfico ilustrativo das últimas medições">
                <path d="M8 15H292M8 30H292M8 45H292" stroke="var(--border)" strokeDasharray="3 4" />
                <polyline points={points(selected.history.map((sample) => sample.heartRate), 45, 125)} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points={points(selected.history.map((sample) => sample.oxygen), 80, 100)} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-1 text-[10px]" style={{ color: "var(--muted-foreground)" }}>Série demonstrativa · atualização a cada 5 segundos · retenção local de até 1 hora</p>
            </div>
            <div className="mt-3 rounded-xl border p-3" style={{ background: "var(--background)", borderColor: "var(--border)" }}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-bold" style={{ color: "var(--foreground)" }}>Traçado ECG demonstrativo</h3>
                <span className="text-[10px]" aria-live="polite" style={{ color: selected.ecgAbnormal ? "var(--alert-foreground)" : "var(--muted-foreground)" }}>{selected.ecgAbnormal ? "Alteração simulada" : "Ritmo regular simulado"} · Ilustrativo</span>
              </div>
              <svg viewBox="0 0 320 56" className="mt-2 h-16 w-full" role="img" aria-label="Animação ilustrativa de um traçado de eletrocardiograma">
                <path d="M0 28H40l8-2 6 2h25l8-4 5 8 7-24 8 39 8-19 6 2h33l8-2 6 2h24l8-4 5 8 7-24 8 39 8-19 6 2h33l8-2 6 2h27" className="ecg-trace" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="mt-3 rounded-xl border p-3" role={selectedEvents.length ? "alert" : undefined} style={{ background: selectedEvents.length ? "var(--alert-surface)" : "var(--background)", borderColor: selectedEvents.length ? "var(--alert-border)" : "var(--border)" }}>
              <h3 className="text-xs font-bold" style={{ color: "var(--foreground)" }}>Verificação demonstrativa de limites</h3>
              {selectedEvents.length ? (
                <ul className="mt-2 space-y-2 text-[10px]" style={{ color: "var(--alert-foreground)" }}>
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
                <p className="mt-1 text-[10px]" style={{ color: "var(--muted-foreground)" }}>Nenhum limite configurado foi ultrapassado nesta simulação.</p>
              )}
            </div>
            <details className="mt-3 rounded-xl border p-3" style={{ background: "var(--background)", borderColor: "var(--border)" }}>
              <summary className="cursor-pointer text-xs font-bold" style={{ color: "var(--foreground)" }}>
                Histórico de ocorrências ({occurrences.length})
              </summary>
              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                {occurrences.length ? [...occurrences].reverse().slice(0, 30).map((occurrence) => (
                  <article key={occurrence.id} className="rounded-lg border p-3 text-[10px]" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong style={{ color: "var(--foreground)" }}>{occurrence.patientName} · {occurrence.label}</strong>
                      <span className="font-semibold" style={{ color: occurrence.severity === "Crítico" ? "var(--alert-foreground)" : "var(--primary)" }}>{occurrence.severity} · {occurrence.resolvedAt ? "Resolvido" : "Ativo"}</span>
                    </div>
                    <p className="mt-1">{occurrence.value} · Limite: {occurrence.limit}</p>
                    {(occurrence.patientId || occurrence.bed || occurrence.sector) && <p>{occurrence.patientId ? occurrence.patientId + " · " : ""}{occurrence.bed ? "Leito " + occurrence.bed + " · " : ""}{occurrence.sector ?? ""}</p>}
                    <p>Início: {occurrence.startedAt}{occurrence.resolvedAt ? " · Resolução: " + occurrence.resolvedAt : ""}</p>
                    <p>Atendimento: {occurrence.acknowledged ? "Reconhecido" : "Pendente"}</p>
                  </article>
                )) : <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>As ocorrências detectadas durante a simulação aparecerão aqui.</p>}
              </div>
            </details>
            <div className="mt-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-bold" style={{ color: "var(--foreground)" }}>Histórico recente · até 1 hora</h3>
                {selected.history.length > 6 && <button type="button" onClick={() => setShowAllHistory((value) => !value)} className="text-[10px] font-semibold" style={{ color: "var(--primary)" }}>{showAllHistory ? "Mostrar menos" : "Ver todas as medições"}</button>}
              </div>
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {[...selected.history].reverse().slice(0, showAllHistory ? 720 : 6).map((sample, index) => (
                  <div key={sample.time + "-" + index} className="grid grid-cols-[1fr_auto] gap-2 rounded-lg px-3 py-2 text-[10px]" style={{ background: "var(--background)" }}>
                    <span style={{ color: "var(--muted-foreground)" }}>{sample.time}</span>
                    <span className="text-right font-medium tabular-nums" style={{ color: "var(--foreground)" }}>
                      {sample.heartRate} bpm · {sample.oxygen.toFixed(1)}% · {sample.respiration} rpm · {sample.temperature.toFixed(1)}°C
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <details className="mt-4 rounded-xl border p-3" style={{ background: "var(--background)", borderColor: "var(--border)" }}>
              <summary className="cursor-pointer text-xs font-bold" style={{ color: "var(--foreground)" }}>Configurar limites demonstrativos</summary>
              <div className="mt-3 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                {[
                  { key: "heartRateMin", label: "FC mínima (bpm)" },
                  { key: "heartRateMax", label: "FC máxima (bpm)" },
                  { key: "oxygenMin", label: "SpO₂ mínima (%)" },
                  { key: "respirationMax", label: "FR máxima (rpm)" },
                  { key: "temperatureMax", label: "Temperatura máxima (°C)" },
                ].map((field) => (
                  <label key={field.key} className="flex min-w-0 flex-col gap-1 text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                    {field.label}
                    <input type="number" step={field.key === "temperatureMax" || field.key === "oxygenMin" ? "0.1" : "1"} value={thresholds[field.key as keyof Thresholds]} onChange={(event) => updateThreshold(field.key as keyof Thresholds, event.target.value)} className="min-h-10 min-w-0 rounded-lg border px-2 text-sm" style={controlStyle} />
                  </label>
                ))}
                <button type="button" onClick={() => setThresholds(defaultThresholds)} className="min-h-10 self-end rounded-lg px-3 text-xs font-semibold min-[420px]:col-span-2" style={{ background: "var(--secondary)", color: "var(--primary)" }}>
                  Restaurar limites de exemplo
                </button>
              </div>
              <p className="mt-2 text-[10px]" style={{ color: "var(--muted-foreground)" }}>Os limites são exemplos de interface e precisam ser definidos por protocolos clínicos antes de qualquer uso real.</p>
            </details>
          </aside>
        )}
      </div>

      <p className="rounded-lg border px-3 py-2 text-[10px] leading-relaxed" style={{ background: "var(--alert-surface)", borderColor: "var(--alert-border)", color: "var(--muted-foreground)" }}>
        Demonstração: medições, alertas e conexões são simulados no navegador e não devem ser usados para decisões clínicas.
      </p>
    </section>
  )
}
