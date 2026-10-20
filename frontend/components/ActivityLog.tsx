import { useEffect, useMemo, useState } from "react"
import { activityEventName, readActivities } from "./activityStore"
import type { ActivityEntry } from "./activityStore"

const controlStyle = { background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }

export default function ActivityLog() {
  const [entries, setEntries] = useState<ActivityEntry[]>(readActivities)
  const [query, setQuery] = useState("")

  useEffect(() => {
    const refresh = () => setEntries(readActivities())
    window.addEventListener(activityEventName, refresh)
    window.addEventListener("storage", refresh)
    return () => {
      window.removeEventListener(activityEventName, refresh)
      window.removeEventListener("storage", refresh)
    }
  }, [])

  const visibleEntries = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR")
    return entries.filter((entry) => [entry.profile, entry.action, entry.entity, entry.details].join(" ").toLocaleLowerCase("pt-BR").includes(normalized))
  }, [entries, query])

  return (
    <section className="fade-in min-w-0 space-y-5" aria-labelledby="activity-log-title">
      <div>
        <h1 id="activity-log-title" className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--foreground)" }}>Registro de atividades</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>Ações registradas localmente durante a demonstração do frontend.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-[var(--radius)] border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Eventos guardados neste navegador</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: "var(--primary)" }}>{entries.length}</p>
        </div>
        <div className="flex flex-col justify-center rounded-[var(--radius)] border p-4 text-xs" style={{ background: "var(--alert-surface)", borderColor: "var(--alert-border)", color: "var(--muted-foreground)" }}>
          Este histórico é demonstrativo: não substitui auditoria de servidor e pode ser apagado pelo navegador.
        </div>
      </div>

      <label className="flex min-w-0 flex-col gap-1.5 rounded-[var(--radius)] border p-4 text-xs font-medium sm:flex-row sm:items-center" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
        Buscar no histórico
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Perfil, ação ou registro" className="min-h-11 min-w-0 flex-1 rounded-xl border px-3 text-sm" style={controlStyle} />
      </label>

      <div className="space-y-3">
        {visibleEntries.map((entry) => (
          <article key={entry.id} className="rounded-[var(--radius)] border p-4 sm:p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: "var(--secondary)", color: "var(--primary)" }}>{entry.profile}</span>
              <time className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{entry.timestamp}</time>
            </div>
            <h2 className="mt-3 text-sm font-semibold" style={{ color: "var(--foreground)" }}>{entry.action} · {entry.entity}</h2>
            <p className="mt-1 break-words text-xs" style={{ color: "var(--muted-foreground)" }}>{entry.details}</p>
          </article>
        ))}
        {visibleEntries.length === 0 && (
          <div className="rounded-[var(--radius)] border border-dashed p-8 text-center text-sm" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
            {entries.length ? "Nenhuma atividade corresponde à busca." : "As ações da demonstração aparecerão aqui quando forem realizadas."}
          </div>
        )}
      </div>
    </section>
  )
}
