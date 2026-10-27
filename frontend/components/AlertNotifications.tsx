import { useEffect, useRef, useState } from "react"
import type { MonitoringAlert } from "./VitalMonitoring"

interface Props {
  alerts: MonitoringAlert[]
  profile: "Médico" | "Enfermagem"
  onOpenAlerts: () => void
}

interface NotificationItem {
  id: string
  alert: MonitoringAlert
}

const severityRank = { Informativo: 1, Moderado: 2, Crítico: 3 }
const MOBILE_QUERY = "(max-width: 639px)"
const MOBILE_DURATION = 6000
const DESKTOP_DURATION = 10000
const DESKTOP_VISIBLE = 3
/** Um mesmo alerta (paciente + parâmetro) não é notificado de novo antes deste intervalo. */
const REPEAT_COOLDOWN = 60000
const MAX_QUEUE = 8

function useIsMobile() {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches)
  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY)
    const update = () => setMobile(media.matches)
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])
  return mobile
}

const toneFor = (severity: MonitoringAlert["severity"]) =>
  severity === "Crítico"
    ? { bar: "var(--danger)", surface: "var(--danger-surface)", text: "var(--danger-foreground)" }
    : severity === "Moderado"
      ? { bar: "var(--warning)", surface: "var(--warning-surface)", text: "var(--warning-foreground)" }
      : { bar: "var(--info)", surface: "var(--secondary)", text: "var(--control-foreground)" }

const AlertIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.3 3.6 2.4 17a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></svg>
)

export default function AlertNotifications({ alerts, profile, onOpenAlerts }: Props) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const previousSeverity = useRef<Map<string, MonitoringAlert["severity"]> | null>(null)
  const lastNotified = useRef(new Map<string, { at: number; severity: MonitoringAlert["severity"] }>())
  const timers = useRef(new Map<string, number>())
  const isMobile = useIsMobile()
  const isMobileRef = useRef(isMobile)
  isMobileRef.current = isMobile

  const remove = (id: string) => {
    const timer = timers.current.get(id)
    if (timer !== undefined) window.clearTimeout(timer)
    timers.current.delete(id)
    setNotifications((current) => current.filter((item) => item.id !== id))
  }

  const clearAll = () => {
    for (const timer of timers.current.values()) window.clearTimeout(timer)
    timers.current.clear()
    setNotifications([])
  }

  // Limpa todos os timers ao desmontar
  useEffect(() => {
    const active = timers.current
    return () => {
      for (const timer of active.values()) window.clearTimeout(timer)
      active.clear()
    }
  }, [])

  useEffect(() => {
    const currentSeverity = new Map(alerts.map((alert) => [alert.key, alert.severity]))
    const previous = previousSeverity.current
    previousSeverity.current = currentSeverity
    if (!previous) return

    const now = Date.now()
    const relevant = alerts.filter((alert) => {
      const previousLevel = previous.get(alert.key)
      const isNewOrWorse = previousLevel === undefined || severityRank[alert.severity] > severityRank[previousLevel]
      if (!isNewOrWorse) return false
      // Evita uma sequência de notificações quando o monitor oscila em torno do limite
      const last = lastNotified.current.get(alert.key)
      const escalated = previousLevel !== undefined
      const worseThanLastNotified = last !== undefined && severityRank[alert.severity] > severityRank[last.severity]
      return escalated || worseThanLastNotified || last === undefined || now - last.at >= REPEAT_COOLDOWN
    })
    if (relevant.length === 0) return

    const additions = relevant.map((alert, index) => ({ id: `${alert.key}-${now}-${index}`, alert }))
    for (const { alert } of additions) lastNotified.current.set(alert.key, { at: now, severity: alert.severity })
    setNotifications((current) => {
      const next = [...current, ...additions]
      for (const dropped of next.slice(0, Math.max(0, next.length - MAX_QUEUE))) {
        const timer = timers.current.get(dropped.id)
        if (timer !== undefined) window.clearTimeout(timer)
        timers.current.delete(dropped.id)
      }
      return next.slice(-MAX_QUEUE)
    })
    const duration = isMobileRef.current ? MOBILE_DURATION : DESKTOP_DURATION
    for (const notification of additions) {
      timers.current.set(notification.id, window.setTimeout(() => remove(notification.id), duration))
    }
  }, [alerts])

  if (notifications.length === 0) return null

  // Mais graves primeiro; entre iguais, os mais recentes
  const ordered = [...notifications].sort((a, b) => severityRank[b.alert.severity] - severityRank[a.alert.severity] || notifications.indexOf(b) - notifications.indexOf(a))
  const visible = ordered.slice(0, isMobile ? 1 : DESKTOP_VISIBLE)
  const hidden = ordered.length - visible.length
  const openCenter = () => {
    clearAll()
    onOpenAlerts()
  }

  if (isMobile) {
    const { id, alert } = visible[0]
    const tone = toneFor(alert.severity)
    return (
      <aside className="fixed inset-x-3 bottom-3 z-40" aria-label={`Notificações de ${profile}`} aria-live="polite">
        <article role="status" className="toast-in relative overflow-hidden rounded-xl border py-2.5 pl-4 pr-1.5" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-lg)" }}>
          <span className="absolute inset-y-0 left-0 w-1" style={{ background: tone.bar }} aria-hidden="true" />
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: tone.surface, color: tone.text }}>
              <AlertIcon size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-start gap-1.5 text-[13px] font-semibold leading-tight" style={{ color: "var(--foreground)" }}>
                <span className="shrink-0 rounded px-1.5 py-px text-[11px] font-bold" style={{ background: tone.surface, color: tone.text }}>{alert.severity}</span>
                <span>{alert.label}</span>
              </p>
              <p className="mt-0.5 break-words text-xs" style={{ color: "var(--muted-foreground)" }}>
                {alert.patientName} · <strong style={{ color: "var(--foreground)" }}>{alert.value}</strong> · Leito {alert.bed}
              </p>
            </div>
            <button type="button" onClick={openCenter} className="min-h-10 shrink-0 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              {hidden > 0 ? `Ver +${hidden}` : "Ver"}
            </button>
            <button type="button" aria-label="Dispensar notificação" onClick={() => remove(id)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ color: "var(--muted-foreground)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </button>
          </div>
          {hidden > 0 && <p className="sr-only">Mais {hidden} alerta{hidden === 1 ? "" : "s"} novo{hidden === 1 ? "" : "s"} na central.</p>}
        </article>
      </aside>
    )
  }

  return (
    <aside className="fixed right-6 top-20 z-40 flex w-[min(22rem,calc(100vw-3rem))] flex-col gap-2" aria-label={`Notificações de ${profile}`} aria-live="polite">
      {visible.map(({ id, alert }) => {
        const tone = toneFor(alert.severity)
        return (
          <article key={id} role="status" className="toast-in relative overflow-hidden rounded-xl border p-3.5 pl-5" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-lg)" }}>
            <span className="absolute inset-y-0 left-0 w-1" style={{ background: tone.bar }} aria-hidden="true" />
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: tone.surface, color: tone.text }}>
                <AlertIcon />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>Novo alerta · {profile}</p>
                  <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: tone.surface, color: tone.text }}>{alert.severity}</span>
                </div>
                <p className="mt-1 text-sm font-semibold leading-snug" style={{ color: "var(--foreground)" }}>{alert.label}</p>
                <p className="mt-0.5 break-words text-xs" style={{ color: "var(--muted-foreground)" }}>{alert.patientName} · {alert.value} · Leito {alert.bed} · {alert.sector}</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <button type="button" onClick={openCenter} className="min-h-9 rounded-lg px-3 text-xs font-semibold transition hover:brightness-110" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Abrir central de alertas</button>
                  <button type="button" aria-label="Dispensar notificação" onClick={() => remove(id)} className="min-h-9 rounded-lg px-3 text-xs font-semibold transition hover:brightness-95" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>Dispensar</button>
                </div>
              </div>
            </div>
          </article>
        )
      })}
      {hidden > 0 && (
        <button type="button" onClick={openCenter} className="self-end rounded-full border px-3 py-1.5 text-xs font-semibold" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--control-foreground)", boxShadow: "var(--shadow-sm)" }}>
          +{hidden} novo{hidden === 1 ? "" : "s"} alerta{hidden === 1 ? "" : "s"}
        </button>
      )}
    </aside>
  )
}
