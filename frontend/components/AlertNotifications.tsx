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

export default function AlertNotifications({ alerts, profile, onOpenAlerts }: Props) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const previousSeverity = useRef<Map<string, MonitoringAlert["severity"]> | null>(null)

  useEffect(() => {
    const currentSeverity = new Map(alerts.map((alert) => [alert.key, alert.severity]))
    const previous = previousSeverity.current
    previousSeverity.current = currentSeverity
    if (!previous) return

    const relevant = alerts.filter((alert) => {
      const previousLevel = previous.get(alert.key)
      return previousLevel === undefined || severityRank[alert.severity] > severityRank[previousLevel]
    })
    if (relevant.length === 0) return

    const timestamp = Date.now()
    const additions = relevant.map((alert, index) => ({
      id: `${alert.key}-${timestamp}-${index}`,
      alert,
    }))
    setNotifications((current) => [...current, ...additions].slice(-3))
    for (const notification of additions) {
      window.setTimeout(() => {
        setNotifications((current) => current.filter((item) => item.id !== notification.id))
      }, 10000)
    }
  }, [alerts])

  if (notifications.length === 0) return null

  return (
    <aside className="fixed bottom-4 left-4 z-50 flex w-[min(28rem,calc(100vw-2rem))] flex-col gap-2 sm:bottom-6 sm:left-6" aria-label={`Notificações de ${profile}`} aria-live="polite">
      {notifications.map(({ id, alert }) => {
        const critical = alert.severity === "Crítico"
        return (
          <article key={id} role="status" className="rounded-2xl border p-4 shadow-xl" style={{ background: "var(--card)", borderColor: critical ? "var(--alert-border)" : "var(--border)" }}>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold" style={{ background: critical ? "var(--alert-icon-bg)" : "var(--secondary)", color: critical ? "var(--alert-foreground)" : "var(--primary)" }} aria-hidden="true">!</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-bold" style={{ color: "var(--foreground)" }}>Novo alerta · {profile}</p>
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: critical ? "var(--alert-icon-bg)" : "var(--secondary)", color: critical ? "var(--alert-foreground)" : "var(--primary)" }}>{alert.severity}</span>
                </div>
                <p className="mt-1 truncate text-xs font-semibold" style={{ color: "var(--foreground)" }}>{alert.patientName} · {alert.label}</p>
                <p className="mt-0.5 text-[10px]" style={{ color: "var(--muted-foreground)" }}>{alert.value} · Leito {alert.bed} · {alert.sector}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={onOpenAlerts} className="min-h-9 rounded-lg px-3 text-[10px] font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Abrir central de alertas</button>
                  <button type="button" aria-label="Dispensar notificação" onClick={() => setNotifications((current) => current.filter((item) => item.id !== id))} className="min-h-9 rounded-lg px-3 text-[10px] font-semibold" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>Dispensar</button>
                </div>
              </div>
            </div>
          </article>
        )
      })}
    </aside>
  )
}
