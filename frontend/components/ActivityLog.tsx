import { useEffect, useMemo, useState } from "react"
import { activityEventName, readActivities } from "./activityStore"
import type { ActivityEntry } from "./activityStore"
import { PageTitle, UiIcon } from "./ui"

const profileTone = (profile: string) => {
  const normalized = profile.toLocaleLowerCase("pt-BR")
  if (normalized.startsWith("méd")) return { bg: "color-mix(in srgb, var(--primary) 12%, var(--card))", fg: "var(--control-foreground)" }
  if (normalized.startsWith("enf")) return { bg: "var(--success-surface)", fg: "var(--success-foreground)" }
  if (normalized.startsWith("rec")) return { bg: "var(--warning-surface)", fg: "var(--warning-foreground)" }
  return { bg: "var(--secondary)", fg: "var(--muted-foreground)" }
}

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

  const profiles = new Set(entries.map((entry) => entry.profile)).size

  return (
    <section className="fade-in min-w-0" aria-labelledby="activity-log-title">
      <div id="activity-log-title">
        <PageTitle eyebrow="Auditoria local" title="Registro de atividades" subtitle="Ações registradas localmente durante a demonstração do frontend." />
      </div>

      <div className="keep-2-cols mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-[var(--radius)] border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <p className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Eventos neste navegador</p>
          <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: "var(--foreground)" }}>{entries.length}</p>
        </div>
        <div className="rounded-[var(--radius)] border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <p className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Perfis com atividade</p>
          <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: "var(--foreground)" }}>{profiles}</p>
        </div>
        <div className="col-span-2 flex items-start gap-2.5 rounded-[var(--radius)] border p-4 text-xs leading-relaxed sm:col-span-1" style={{ background: "var(--warning-surface)", borderColor: "color-mix(in srgb, var(--warning) 35%, transparent)", color: "var(--warning-foreground)" }}>
          <span className="mt-0.5 shrink-0"><UiIcon name="info" size={16} /></span>
          Histórico demonstrativo: não substitui auditoria de servidor e pode ser apagado pelo navegador.
        </div>
      </div>

      <div className="mb-4 relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }}><UiIcon name="search" size={17} /></span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por perfil, ação ou registro" aria-label="Buscar no histórico" className="min-h-11 w-full rounded-xl border pl-10 pr-3 text-sm" style={controlStyle} />
      </div>

      {visibleEntries.length > 0 ? (
        <ol className="overflow-hidden rounded-[var(--radius)] border" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-sm)" }}>
          {visibleEntries.map((entry, index) => {
            const tone = profileTone(entry.profile)
            return (
              <li key={entry.id} className="flex gap-3 px-4 py-3.5 sm:gap-4 sm:px-5" style={{ borderTop: index ? "1px solid var(--border)" : "none" }}>
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: tone.bg, color: tone.fg }} aria-hidden="true">
                  <UiIcon name="atividades" size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{entry.action} <span className="font-normal" style={{ color: "var(--muted-foreground)" }}>· {entry.entity}</span></h2>
                    <time className="text-xs tabular-nums" style={{ color: "var(--muted-foreground)" }}>{entry.timestamp}</time>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: tone.bg, color: tone.fg }}>{entry.profile}</span>
                    <p className="min-w-0 break-words text-xs" style={{ color: "var(--muted-foreground)" }}>{entry.details}</p>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      ) : (
        <div className="flex flex-col items-center rounded-[var(--radius)] border border-dashed px-6 py-12 text-center" style={{ borderColor: "var(--border-strong)" }}>
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}><UiIcon name={entries.length ? "search" : "atividades"} size={20} /></span>
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{entries.length ? "Nenhuma atividade encontrada" : "Nenhuma atividade ainda"}</p>
          <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>{entries.length ? "Nenhuma atividade corresponde à busca." : "As ações da demonstração aparecerão aqui quando forem realizadas."}</p>
        </div>
      )}
    </section>
  )
}
