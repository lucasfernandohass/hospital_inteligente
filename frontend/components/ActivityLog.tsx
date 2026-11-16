import { useEffect, useState } from "react"
import { api, ApiError, type ActivityDto, type ApiRole } from "../services/api"
import { EmptyState, PageTitle } from "./ui"

interface Props {
  token: string
  role: ApiRole
}

const roleLabels: Record<ApiRole, string> = {
  ADMINISTRADOR: "Administrador",
  RECEPCIONISTA: "Recepcionista",
  MEDICO: "Médico",
  ENFERMEIRA: "Enfermeira",
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value))
}

export default function ActivityLog({ token, role }: Props) {
  const [records, setRecords] = useState<ActivityDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let current = true
    setLoading(true)
    api.listActivities(token)
      .then((items) => { if (current) { setRecords(items); setError("") } })
      .catch((cause) => { if (current) setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar as atividades.") })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [token])

  const isAdmin = role === "ADMINISTRADOR"

  return (
    <section className="fade-in space-y-5" aria-labelledby="activity-log-title">
      <div id="activity-log-title">
        <PageTitle eyebrow="Auditoria" title="Registro de atividades" subtitle={isAdmin ? "Atividades registradas por todos os funcionários." : "Atividades realizadas na sua conta."} />
      </div>
      {error && <p role="alert" className="rounded-xl border px-4 py-3 text-sm" style={{ background: "var(--danger-surface)", borderColor: "var(--border)", color: "var(--danger-foreground)" }}>{error}</p>}
      {loading ? (
        <p className="rounded-xl border p-4 text-sm" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--muted-foreground)" }}>Carregando atividades…</p>
      ) : records.length === 0 ? (
        <EmptyState icon="atividades" title="Nenhuma atividade registrada" />
      ) : (
        <div className="overflow-hidden rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
            {records.map((record) => (
              <li key={record.id} className="grid gap-2 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{record.acao}</p>
                  <p className="mt-0.5 text-sm" style={{ color: "var(--muted-foreground)" }}>{record.entidade}{record.detalhes ? ` · ${record.detalhes}` : ""}</p>
                  {isAdmin && <p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>{record.funcionarioNome} · {roleLabels[record.funcionarioRole]}</p>}
                </div>
                <time className="text-xs tabular-nums sm:text-right" dateTime={record.dataHora} style={{ color: "var(--muted-foreground)" }}>{formatDate(record.dataHora)}</time>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
