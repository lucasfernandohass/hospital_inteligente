import { useMemo, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { Professional, ProfessionalRole } from "./professionalStore"
import { logActivity } from "./activityStore"

interface Props {
  professionals: Professional[]
  setProfessionals: Dispatch<SetStateAction<Professional[]>>
}

const inputClass = "min-h-11 w-full min-w-0 rounded-xl border px-3 text-sm outline-none focus:ring-2"
const controlStyle = { background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }

export default function StaffManagement({ professionals, setProfessionals }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<ProfessionalRole | "Todos">("Todos")
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Médico" as ProfessionalRole,
    registration: "",
    specialty: "",
  })
  const [error, setError] = useState("")

  const visibleProfessionals = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR")
    return professionals.filter((professional) => {
      const matchesRole = roleFilter === "Todos" || professional.role === roleFilter
      const searchable = [professional.name, professional.email, professional.registration, professional.specialty]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
      return matchesRole && searchable.includes(normalizedQuery)
    })
  }, [professionals, query, roleFilter])

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const registration = form.registration.trim().toLocaleLowerCase("pt-BR")
    if (professionals.some((professional) => professional.registration.toLocaleLowerCase("pt-BR") === registration)) {
      setError("Este registro profissional já está cadastrado.")
      return
    }

    const id = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : String(Date.now())
    setProfessionals((current) => [
      { ...form, id: "PRO-" + id, name: form.name.trim(), email: form.email.trim(), registration: form.registration.trim(), specialty: form.specialty.trim(), active: true },
      ...current,
    ])
    logActivity("Recepção", "Cadastro concluído", "Profissional", `${form.role} · ${form.registration.trim()}`)
    setForm({ name: "", email: "", role: "Médico", registration: "", specialty: "" })
    setError("")
    setShowForm(false)
  }

  const toggleActive = (id: string) => {
    const target = professionals.find((professional) => professional.id === id)
    if (!target) return
    logActivity("Recepção", target.active ? "Cadastro desativado" : "Cadastro reativado", "Profissional", `${target.role} · ${target.registration}`)
    setProfessionals((current) =>
      current.map((professional) => professional.id === id ? { ...professional, active: !professional.active } : professional),
    )
  }

  return (
    <section className="fade-in min-w-0 space-y-5" aria-labelledby="equipe-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 id="equipe-title" className="text-2xl font-bold sm:text-3xl" style={{ color: "var(--foreground)" }}>Equipe e profissionais</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>Cadastro demonstrativo da equipe hospitalar.</p>
        </div>
        <button type="button" onClick={() => { setShowForm((value) => !value); setError("") }} className="min-h-11 rounded-xl px-4 text-sm font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
          {showForm ? "Fechar cadastro" : "Cadastrar profissional"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 rounded-[var(--radius)] border p-4 sm:grid-cols-2 xl:grid-cols-3" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
            Nome completo
            <input required minLength={3} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} style={controlStyle} />
          </label>
          <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
            E-mail institucional
            <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={inputClass} style={controlStyle} />
          </label>
          <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
            Perfil de acesso
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as ProfessionalRole })} className={inputClass} style={controlStyle}>
              <option>Médico</option>
              <option>Enfermagem</option>
              <option>Recepção</option>
            </select>
          </label>
          <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
            Registro profissional / matrícula
            <input required value={form.registration} onChange={(event) => setForm({ ...form, registration: event.target.value })} placeholder="CRM, COREN ou matrícula" className={inputClass} style={controlStyle} />
          </label>
          <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
            Especialidade ou setor
            <input value={form.specialty} onChange={(event) => setForm({ ...form, specialty: event.target.value })} className={inputClass} style={controlStyle} />
          </label>
          <div className="flex items-end">
            <button type="submit" className="min-h-11 w-full rounded-xl px-4 text-sm font-semibold" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>Salvar cadastro demonstrativo</button>
          </div>
          {error && <p role="alert" className="text-xs font-medium text-red-600 sm:col-span-2 xl:col-span-3">{error}</p>}
          <p className="text-[10px] sm:col-span-2 xl:col-span-3" style={{ color: "var(--muted-foreground)" }}>Este cadastro fica neste navegador e não cria uma conta de acesso real.</p>
        </form>
      )}

      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
        {[
          { label: "Profissionais cadastrados", value: professionals.length },
          { label: "Ativos", value: professionals.filter((professional) => professional.active).length },
          { label: "Inativos", value: professionals.filter((professional) => !professional.active).length },
        ].map((item) => (
          <div key={item.label} className="rounded-[var(--radius)] border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{item.label}</p>
            <p className="mt-2 text-2xl font-bold" style={{ color: "var(--primary)" }}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-[var(--radius)] border p-4 sm:flex-row" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nome, e-mail, registro ou setor" aria-label="Buscar profissional" className={inputClass + " flex-1"} style={controlStyle} />
        <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as ProfessionalRole | "Todos")} aria-label="Filtrar por perfil" className={inputClass + " sm:w-auto"} style={controlStyle}>
          <option>Todos</option>
          <option>Médico</option>
          <option>Enfermagem</option>
          <option>Recepção</option>
        </select>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visibleProfessionals.map((professional) => (
          <article key={professional.id} className="min-w-0 rounded-[var(--radius)] border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold" style={{ color: "var(--foreground)" }}>{professional.name}</h2>
                <p className="mt-1 truncate text-xs" style={{ color: "var(--muted-foreground)" }}>{professional.email}</p>
              </div>
              <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: professional.active ? "var(--secondary)" : "var(--alert-icon-bg)", color: professional.active ? "var(--primary)" : "var(--alert-foreground)" }}>
                {professional.active ? "Ativo" : "Inativo"}
              </span>
            </div>
            <div className="mt-4 space-y-2 border-t pt-3 text-xs" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
              <p><strong style={{ color: "var(--foreground)" }}>Perfil:</strong> {professional.role}</p>
              <p><strong style={{ color: "var(--foreground)" }}>Registro:</strong> {professional.registration}</p>
              {professional.specialty && <p><strong style={{ color: "var(--foreground)" }}>Setor:</strong> {professional.specialty}</p>}
            </div>
            <button type="button" onClick={() => toggleActive(professional.id)} className="mt-4 min-h-10 w-full rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--secondary)", color: "var(--primary)" }}>
              {professional.active ? "Desativar cadastro" : "Reativar cadastro"}
            </button>
          </article>
        ))}
        {visibleProfessionals.length === 0 && (
          <div className="rounded-[var(--radius)] border p-8 text-center text-sm md:col-span-2 xl:col-span-3" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
            Nenhum profissional encontrado.
          </div>
        )}
      </div>

      <p className="rounded-lg border px-3 py-2 text-[10px]" style={{ background: "var(--alert-surface)", borderColor: "var(--alert-border)", color: "var(--muted-foreground)" }}>
        Os dados são simulados e armazenados localmente. Esta tela não gerencia permissões nem autenticação reais.
      </p>
    </section>
  )
}
