import type { Dispatch, SetStateAction } from "react"
import type { MonitoringAlert } from "./VitalMonitoring"
import { logActivity } from "./activityStore"

interface Props {
  alerts: MonitoringAlert[]
  profile: "Médico" | "Enfermagem"
  acknowledgedKeys: string[]
  setAcknowledgedKeys: Dispatch<SetStateAction<string[]>>
  onOpenMonitoring: () => void
}

export default function MonitoringAlertsPanel({ alerts, profile, acknowledgedKeys, setAcknowledgedKeys, onOpenMonitoring }: Props) {
  const pendingCount = alerts.filter((alert) => !acknowledgedKeys.includes(alert.key)).length

  return (
    <section className="mb-5 rounded-[var(--radius)] border p-4 sm:p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }} aria-labelledby="monitoring-alerts-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="monitoring-alerts-title" className="text-base font-bold" style={{ color: "var(--foreground)" }}>Alertas do monitoramento simulado</h2>
          <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
            {alerts.length ? `${pendingCount} pendente${pendingCount === 1 ? "" : "s"} · ${alerts.length} ocorrência${alerts.length === 1 ? "" : "s"} ativa${alerts.length === 1 ? "" : "s"}` : "Nenhuma ocorrência ativa na última atualização do monitoramento."}
          </p>
        </div>
        <button type="button" onClick={onOpenMonitoring} className="min-h-10 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--secondary)", color: "var(--primary)" }}>
          Abrir monitoramento
        </button>
      </div>

      {alerts.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
          {alerts.map((alert) => {
            const acknowledged = acknowledgedKeys.includes(alert.key)
            return (
              <article key={alert.key} className="min-w-0 rounded-xl border p-4" style={{ background: "var(--background)", borderColor: alert.severity === "Crítico" ? "var(--alert-border)" : "var(--border)" }}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: alert.severity === "Crítico" ? "var(--alert-icon-bg)" : "var(--secondary)", color: alert.severity === "Crítico" ? "var(--alert-foreground)" : alert.severity === "Informativo" ? "var(--muted-foreground)" : "var(--primary)" }}>
                    {alert.severity}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{acknowledged ? "Reconhecido" : "Pendente"} · {alert.time}</span>
                </div>
                <h3 className="mt-3 text-sm font-semibold" style={{ color: "var(--foreground)" }}>{alert.label}</h3>
                <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>{alert.patientName} · Leito {alert.bed} · {alert.sector}</p>
                <p className="mt-2 text-xs font-medium" style={{ color: alert.severity === "Informativo" ? "var(--primary)" : "var(--alert-foreground)" }}>{alert.value} · Limite: {alert.limit}</p>
                {!acknowledged && (
                  <button type="button" onClick={() => {
                    setAcknowledgedKeys((current) => current.includes(alert.key) ? current : [...current, alert.key])
                    logActivity(profile, "Alerta de monitoramento reconhecido", alert.patientId, `${alert.label} · ${alert.value}`)
                  }} className="mt-3 min-h-9 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--card)", color: "var(--primary)", border: "1px solid var(--border)" }}>
                    Reconhecer alerta
                  </button>
                )}
              </article>
            )
          })}
        </div>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed p-4 text-xs" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
          Os alertas simulados ativos aparecerão aqui assim que o monitoramento for aberto. Os dados desta área são demonstrativos.
        </p>
      )}
    </section>
  )
}
