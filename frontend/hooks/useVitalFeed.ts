import { useEffect, useMemo, useState } from "react"
import { api, type VitalDto } from "../services/api"

export interface LiveVitalSample {
  time: string
  heartRate: number
  oxygen: number
  respiration: number
  temperature: number
}

export interface LiveVitalReading {
  heartRate?: number
  oxygen?: number
  respiration?: number
  temperature?: number
  systolic?: number
  diastolic?: number
  capturedAt?: string
  history: LiveVitalSample[]
}

function applyMeasurement(current: LiveVitalReading, vital: VitalDto): LiveVitalReading {
  const next = { ...current, history: [...current.history] }
  const value = Number(vital.valor)
  if (!Number.isFinite(value)) return current
  if (vital.tipo === "FREQUENCIA_CARDIACA") next.heartRate = value
  if (vital.tipo === "SATURACAO_OXIGENIO") next.oxygen = value
  if (vital.tipo === "FREQUENCIA_RESPIRATORIA") next.respiration = value
  if (vital.tipo === "TEMPERATURA") next.temperature = value
  if (vital.tipo === "PRESSAO_SISTOLICA") next.systolic = value
  if (vital.tipo === "PRESSAO_DIASTOLICA") next.diastolic = value
  next.capturedAt = vital.capturadoEm
  if (next.heartRate !== undefined && next.oxygen !== undefined && next.respiration !== undefined && next.temperature !== undefined) {
    const sample = {
      time: new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(vital.capturadoEm)),
      heartRate: next.heartRate, oxygen: next.oxygen, respiration: next.respiration, temperature: next.temperature,
    }
    if (next.history[next.history.length - 1]?.time === sample.time) next.history[next.history.length - 1] = sample
    else next.history.push(sample)
    next.history = next.history.slice(-720)
  }
  return next
}

function parseFrames(data: string) {
  return data.split("\0").filter((frame) => frame.trim().length > 0)
}

function decodeFrame(frame: string) {
  const normalized = frame.replace(/\r/g, "")
  const split = normalized.indexOf("\n\n")
  if (split < 0) return { command: normalized.trim(), body: "" }
  return { command: normalized.slice(0, normalized.indexOf("\n")).trim(), body: normalized.slice(split + 2).trim() }
}

export function useVitalFeed(patientIds: string[], token: string) {
  const patientIdsKey = useMemo(() => [...new Set(patientIds.filter((id) => /^\d+$/.test(id)))].sort().join(","), [patientIds])
  const [readings, setReadings] = useState<Record<string, LiveVitalReading>>({})
  const [connection, setConnection] = useState<"connecting" | "connected" | "disconnected">("connecting")

  useEffect(() => {
    const ids = patientIdsKey ? patientIdsKey.split(",") : []
    let socket: WebSocket | null = null
    let reconnectTimer = 0
    let cancelled = false
    let subscriptionCounter = 0

    const loadSnapshots = async () => {
      const entries = await Promise.all(ids.map(async (id) => {
        try { return [id, await api.getCurrentVitals(id, token)] as const }
        catch { return [id, [] as VitalDto[]] as const }
      }))
      if (cancelled) return
      setReadings((current) => {
        const next = { ...current }
        for (const [id, signals] of entries) {
          let reading = next[id] ?? { history: [] }
          for (const signal of signals.sort((a, b) => a.capturadoEm.localeCompare(b.capturadoEm))) reading = applyMeasurement(reading, signal)
          next[id] = reading
        }
        return next
      })
    }

    const connect = () => {
      if (cancelled || !token || ids.length === 0) { setConnection("disconnected"); return }
      setConnection("connecting")
      const wsUrl = (import.meta.env.VITE_WS_URL ?? "ws://localhost:8080/ws").replace(/\/$/, "")
      socket = new WebSocket(wsUrl)
      socket.onopen = () => socket?.send(`CONNECT\naccept-version:1.2\nhost:localhost\nheart-beat:10000,10000\nAuthorization:Bearer ${token}\n\n\0`)
      socket.onmessage = (event) => {
        if (typeof event.data !== "string") return
        for (const frame of parseFrames(event.data)) {
          const decoded = decodeFrame(frame)
          if (decoded.command === "CONNECTED") {
            setConnection("connected")
            ids.forEach((id) => socket?.send(`SUBSCRIBE\nid:sub-${subscriptionCounter++}\ndestination:/topic/pacientes/${id}/sinais-vitais\nack:auto\n\n\0`))
          } else if (decoded.command === "MESSAGE") {
            try {
              const vital = JSON.parse(decoded.body) as VitalDto
              const id = String(vital.pacienteId)
              if (!ids.includes(id)) continue
              setReadings((current) => ({ ...current, [id]: applyMeasurement(current[id] ?? { history: [] }, vital) }))
            } catch { /* ignora frames incompletos */ }
          } else if (decoded.command === "ERROR") {
            setConnection("disconnected")
          }
        }
      }
      socket.onerror = () => setConnection("disconnected")
      socket.onclose = () => {
        setConnection("disconnected")
        if (!cancelled) reconnectTimer = window.setTimeout(connect, 4000)
      }
    }

    void loadSnapshots()
    connect()
    return () => {
      cancelled = true
      window.clearTimeout(reconnectTimer)
      if (socket?.readyState === WebSocket.OPEN) socket.close(1000, "painel alterado")
      else socket?.close()
    }
  }, [patientIdsKey, token])

  return { readings, connection }
}
