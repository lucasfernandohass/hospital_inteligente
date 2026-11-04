import { useCallback, useEffect, useState } from "react"
import type { FormEvent, ReactNode } from "react"
import DashboardSidebar from "./DashboardSidebar"
import type { Theme } from "./ThemeToggle"
import { PageTitle } from "./ui"
import { api, ApiError, type ApiRole, type AuthSession, type StaffMember, type StaffPayload } from "../services/api"
import { usePanelRoute } from "../hooks/usePanelRoute"

interface Props { session: AuthSession; onLogout: () => void; theme: Theme; onToggleTheme: () => void }
type StaffRole = Exclude<ApiRole, "ADMINISTRADOR">

const emptyForm = (): StaffPayload => ({
  nome: "", cpf: "", dataNascimento: "", telefone: "", endereco: "", matricula: "", dataAdmissao: "",
  email: "", senha: "", role: "MEDICO", crm: "", especialidade: "", coren: "", setor: "",
})
const fieldClass = "min-h-11 w-full rounded-xl border px-3 text-sm outline-none focus:ring-2"
const fieldStyle = { background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }

export default function AdminDashboard({ session, onLogout, theme, onToggleTheme }: Props) {
  const [activeTab, setActiveTab] = usePanelRoute("administrador", ["equipe"] as const, "equipe")
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [form, setForm] = useState<StaffPayload>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const loadStaff = useCallback(async () => {
    setLoading(true)
    try {
      setStaff((await api.listStaff(session.token)).filter((member) => member.role !== "ADMINISTRADOR"))
      setError("")
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar os funcionários.")
    } finally { setLoading(false) }
  }, [session.token])

  useEffect(() => { void loadStaff() }, [loadStaff])

  const update = (field: keyof StaffPayload, value: string) => setForm((current) => ({ ...current, [field]: value }))
  const resetForm = () => { setForm(emptyForm()); setEditingId(null); setNotice("") }
  const beginEdit = (member: StaffMember) => {
    setForm({
      nome: member.nome, cpf: member.cpf, dataNascimento: member.dataNascimento,
      telefone: member.telefone ?? "", endereco: member.endereco ?? "", matricula: member.matricula,
      dataAdmissao: member.dataAdmissao, email: member.email, senha: "", role: member.role as StaffRole,
      crm: member.crm ?? "", especialidade: member.especialidade ?? "", coren: member.coren ?? "", setor: member.setor ?? "",
    })
    setEditingId(member.id)
    setNotice("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true); setError(""); setNotice("")
    const payload: StaffPayload = { ...form, cpf: form.cpf.replace(/\D/g, "") }
    try {
      if (editingId === null) await api.createStaff(payload, session.token)
      else await api.updateStaff(editingId, payload, session.token)
      resetForm()
      setNotice(editingId === null ? "Funcionário cadastrado." : "Cadastro atualizado. A senha informada foi redefinida.")
      await loadStaff()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível salvar o cadastro.")
    } finally { setSaving(false) }
  }

  const remove = async (member: StaffMember) => {
    if (!window.confirm(`Excluir o cadastro de ${member.nome}?`)) return
    setError(""); setNotice("")
    try {
      await api.deleteStaff(member.id, session.token)
      setStaff((current) => current.filter((item) => item.id !== member.id))
      setNotice("Cadastro excluído.")
      if (editingId === member.id) resetForm()
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível excluir o cadastro.")
    }
  }

  const roleLabel: Record<ApiRole, string> = { ADMINISTRADOR: "Administrador", MEDICO: "Médico", ENFERMEIRA: "Enfermeira", RECEPCIONISTA: "Recepcionista" }
  const isDoctor = form.role === "MEDICO"
  const isNurse = form.role === "ENFERMEIRA"
  const isReceptionist = form.role === "RECEPCIONISTA"

  return <div className="min-h-screen" style={{ background: "var(--background)" }}>
    <DashboardSidebar role="Administrador" initials={session.nome.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()} name={session.nome} detail={session.email}
      tabs={[{ key: "equipe", label: "Equipe e acessos", group: "Administração" }]} activeTab={activeTab} onSelect={(key) => setActiveTab(key as "equipe")} onLogout={onLogout} theme={theme} onToggleTheme={onToggleTheme} />
    <main className="min-w-0 px-4 pb-10 pt-20 sm:px-6 xl:ml-64 xl:px-8 xl:pt-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageTitle eyebrow="Administração do sistema" title="Equipe e acessos" subtitle="Cadastre e mantenha as contas de médicos, enfermeiros e recepcionistas." />
        {(error || notice) && <p role={error ? "alert" : "status"} className="rounded-xl border px-4 py-3 text-sm" style={{ background: error ? "var(--danger-surface)" : "var(--success-surface)", borderColor: "var(--border)", color: error ? "var(--danger-foreground)" : "var(--success-foreground)" }}>{error || notice}</p>}

        <form onSubmit={submit} className="grid grid-cols-1 gap-4 rounded-2xl border p-5 sm:grid-cols-2 xl:grid-cols-3" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <h2 className="text-base font-bold sm:col-span-2 xl:col-span-3" style={{ color: "var(--foreground)" }}>{editingId === null ? "Cadastrar funcionário" : "Editar funcionário"}</h2>
          <Field label="Nome completo" required><input required maxLength={150} value={form.nome} onChange={(e) => update("nome", e.target.value)} className={fieldClass} style={fieldStyle} /></Field>
          <Field label="CPF (11 dígitos)" required><input required minLength={11} maxLength={14} value={form.cpf} onChange={(e) => update("cpf", e.target.value)} className={fieldClass} style={fieldStyle} /></Field>
          <Field label="Data de nascimento" required><input required type="date" value={form.dataNascimento} onChange={(e) => update("dataNascimento", e.target.value)} className={fieldClass} style={fieldStyle} /></Field>
          <Field label="Telefone"><input maxLength={20} value={form.telefone} onChange={(e) => update("telefone", e.target.value)} className={fieldClass} style={fieldStyle} /></Field>
          <Field label="Endereço"><input maxLength={255} value={form.endereco} onChange={(e) => update("endereco", e.target.value)} className={fieldClass} style={fieldStyle} /></Field>
          <Field label="Matrícula" required><input required maxLength={30} value={form.matricula} onChange={(e) => update("matricula", e.target.value)} className={fieldClass} style={fieldStyle} /></Field>
          <Field label="Data de admissão" required><input required type="date" value={form.dataAdmissao} onChange={(e) => update("dataAdmissao", e.target.value)} className={fieldClass} style={fieldStyle} /></Field>
          <Field label="E-mail de acesso" required><input required type="email" maxLength={150} value={form.email} onChange={(e) => update("email", e.target.value)} className={fieldClass} style={fieldStyle} /></Field>
          <Field label={editingId === null ? "Senha inicial (mínimo 12 caracteres)" : "Nova senha (mínimo 12 caracteres)"} required><input required minLength={12} maxLength={72} type="password" autoComplete="new-password" value={form.senha} onChange={(e) => update("senha", e.target.value)} className={fieldClass} style={fieldStyle} /></Field>
          <Field label="Perfil" required><select value={form.role} onChange={(e) => setForm((current) => ({ ...current, role: e.target.value as StaffRole }))} className={fieldClass} style={fieldStyle}><option value="MEDICO">Médico</option><option value="ENFERMEIRA">Enfermeiro(a)</option><option value="RECEPCIONISTA">Recepcionista</option></select></Field>
          {isDoctor && <Field label="CRM" required><input required value={form.crm} onChange={(e) => update("crm", e.target.value)} className={fieldClass} style={fieldStyle} /></Field>}
          {isDoctor && <Field label="Especialidade" required><input required value={form.especialidade} onChange={(e) => update("especialidade", e.target.value)} className={fieldClass} style={fieldStyle} /></Field>}
          {isNurse && <Field label="COREN" required><input required value={form.coren} onChange={(e) => update("coren", e.target.value)} className={fieldClass} style={fieldStyle} /></Field>}
          {(isNurse || isReceptionist) && <Field label="Setor" required><input required value={form.setor} onChange={(e) => update("setor", e.target.value)} className={fieldClass} style={fieldStyle} /></Field>}
          <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-3">
            <button disabled={saving} className="min-h-11 rounded-xl px-5 text-sm font-semibold disabled:opacity-60" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>{saving ? "Salvando…" : editingId === null ? "Criar conta" : "Salvar alterações"}</button>
            {editingId !== null && <button type="button" onClick={resetForm} className="min-h-11 rounded-xl border px-5 text-sm font-semibold" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>Cancelar edição</button>}
          </div>
        </form>

        <section className="overflow-hidden rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between gap-3 border-b p-5" style={{ borderColor: "var(--border)" }}>
            <div><h2 className="font-bold" style={{ color: "var(--foreground)" }}>Funcionários cadastrados</h2><p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>Contas e permissões gerenciadas pela API.</p></div>
            <button type="button" onClick={() => void loadStaff()} className="min-h-10 rounded-lg border px-3 text-xs font-semibold" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Atualizar</button>
          </div>
          {loading ? <p className="p-6 text-sm" style={{ color: "var(--muted-foreground)" }}>Carregando funcionários…</p> : staff.length === 0 ? <p className="p-6 text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhum funcionário cadastrado.</p> : <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {staff.map((member) => <article key={member.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0"><h3 className="truncate text-sm font-semibold" style={{ color: "var(--foreground)" }}>{member.nome}</h3><p className="truncate text-xs" style={{ color: "var(--muted-foreground)" }}>{member.email} · {roleLabel[member.role]} · Matrícula {member.matricula}</p><p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>{member.role === "MEDICO" ? `${member.crm} · ${member.especialidade}` : member.role === "ENFERMEIRA" ? `${member.coren} · ${member.setor}` : member.setor}</p></div>
              <div className="flex shrink-0 gap-2"><button type="button" onClick={() => beginEdit(member)} className="min-h-10 rounded-lg border px-3 text-xs font-semibold" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Editar</button><button type="button" onClick={() => void remove(member)} className="min-h-10 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--danger-surface)", color: "var(--danger-foreground)" }}>Excluir</button></div>
            </article>)}
          </div>}
        </section>
      </div>
    </main>
  </div>
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{label}{required && <span className="sr-only"> obrigatório</span>}{children}</label>
}
