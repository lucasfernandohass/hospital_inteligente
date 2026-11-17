import { useCallback, useEffect, useState } from "react"
import type { FormEvent, ReactNode } from "react"
import DashboardSidebar from "./DashboardSidebar"
import ActivityLog from "./ActivityLog"
import { logActivity } from "./activityStore"
import type { Theme } from "./ThemeToggle"
import { PageTitle } from "./ui"
import { api, ApiError, type ApiRole, type AuthSession, type StaffMember, type StaffPayload } from "../services/api"
import { formatSpecialty } from "../services/mappers"
import { usePanelRoute } from "../hooks/usePanelRoute"

interface Props { session: AuthSession; onLogout: () => void; theme: Theme; onToggleTheme: () => void }
type StaffRole = Exclude<ApiRole, "ADMINISTRADOR">

const emptyForm = (): StaffPayload => ({
  nome: "", cpf: "", dataNascimento: "", telefone: "", endereco: "", matricula: "", dataAdmissao: "",
  email: "", senha: "", role: "MEDICO", crm: "", especialidade: "", coren: "", setor: "",
})
const fieldClass = "min-h-11 w-full rounded-xl border px-3 text-sm outline-none focus:ring-2"
const fieldStyle = { background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }

function onlyDigits(value: string) { return value.replace(/\D/g, "") }

function formatCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11)
  return digits.replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1-$2")
}

function isValidCpf(value: string) {
  const cpf = onlyDigits(value)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  const checkDigit = (length: number) => {
    let sum = 0
    for (let index = 0; index < length; index++) sum += Number(cpf[index]) * (length + 1 - index)
    const remainder = (sum * 10) % 11
    return remainder === 10 ? 0 : remainder
  }
  return checkDigit(9) === Number(cpf[9]) && checkDigit(10) === Number(cpf[10])
}

function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11)
  if (digits.length <= 2) return digits ? `(${digits}` : ""
  const area = digits.slice(0, 2)
  const number = digits.slice(2)
  return number.length <= 4 ? `(${area}) ${number}` : number.length <= 8
    ? `(${area}) ${number.slice(0, 4)}-${number.slice(4)}`
    : `(${area}) ${number.slice(0, 5)}-${number.slice(5)}`
}

function isAtLeast18(birthDate: string) {
  if (!birthDate) return false
  const [year, month, day] = birthDate.split("-").map(Number)
  if (!year || !month || !day) return false
  const today = new Date()
  let age = today.getFullYear() - year
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age--
  return age >= 18
}

function maxBirthDate() {
  const today = new Date()
  const year = today.getFullYear() - 18
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export default function AdminDashboard({ session, onLogout, theme, onToggleTheme }: Props) {
  const [activeTab, setActiveTab] = usePanelRoute("administrador", ["equipe", "atividades"] as const, "equipe")
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

  const update = (field: keyof StaffPayload, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setError("")
  }
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
    if (!isValidCpf(form.cpf)) { setError("Informe um CPF válido."); return }
    if (!isAtLeast18(form.dataNascimento)) { setError("O profissional deve ter 18 anos ou mais."); return }
    setSaving(true); setError(""); setNotice("")
    const payload: StaffPayload = { ...form, cpf: form.cpf.replace(/\D/g, "") }
    try {
      if (editingId === null) {
        await api.createStaff(payload, session.token)
        logActivity("Administrador", "Funcionário cadastrado", "Funcionário", `${form.nome} · ${roleLabel[form.role]}`)
      } else {
        await api.updateStaff(editingId, { ...payload, senha: form.senha || null }, session.token)
        logActivity("Administrador", "Cadastro de funcionário atualizado", "Funcionário", `${form.nome} · ${roleLabel[form.role]}`)
      }
      resetForm()
      setNotice(editingId === null ? "Funcionário cadastrado." : form.senha ? "Cadastro atualizado e senha redefinida." : "Cadastro atualizado. A senha atual foi mantida.")
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
      logActivity("Administrador", "Funcionário removido", "Funcionário", `${member.nome} · ${roleLabel[member.role]}`)
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
      tabs={[{ key: "equipe", label: "Equipe e acessos", group: "Administração" }, { key: "atividades", label: "Registro de Atividades", group: "Auditoria" }]} activeTab={activeTab} onSelect={(key) => setActiveTab(key as "equipe" | "atividades")} onLogout={onLogout} theme={theme} onToggleTheme={onToggleTheme} />
    <main className="min-w-0 px-4 pb-10 pt-20 sm:px-6 xl:ml-64 xl:px-8 xl:pt-8">
      {activeTab === "equipe" ? <div className="mx-auto max-w-6xl space-y-6">
        <PageTitle eyebrow="Administração do sistema" title="Equipe e acessos" subtitle="Cadastre e gerencie as contas de médicos, profissionais de enfermagem e recepcionistas." />
        {(error || notice) && <p role={error ? "alert" : "status"} className="rounded-xl border px-4 py-3 text-sm" style={{ background: error ? "var(--danger-surface)" : "var(--success-surface)", borderColor: "var(--border)", color: error ? "var(--danger-foreground)" : "var(--success-foreground)" }}>{error || notice}</p>}

        <form onSubmit={submit} className="grid grid-cols-1 gap-4 rounded-2xl border p-5 sm:grid-cols-2 xl:grid-cols-3" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <h2 className="text-base font-bold sm:col-span-2 xl:col-span-3" style={{ color: "var(--foreground)" }}>{editingId === null ? "Cadastrar funcionário" : "Editar funcionário"}</h2>
          <Field label="Nome completo" required><input required maxLength={150} value={form.nome} onChange={(e) => update("nome", e.target.value)} className={fieldClass} style={fieldStyle} /></Field>
          <Field label="CPF" required><input required inputMode="numeric" autoComplete="off" maxLength={14} placeholder="000.000.000-00" value={form.cpf} onChange={(e) => update("cpf", formatCpf(e.target.value))} aria-invalid={form.cpf.length > 0 && (onlyDigits(form.cpf).length !== 11 || !isValidCpf(form.cpf))} className={fieldClass} style={fieldStyle} />{form.cpf.length > 0 && onlyDigits(form.cpf).length < 11 && <FieldError>Informe os 11 dígitos do CPF.</FieldError>}{onlyDigits(form.cpf).length === 11 && !isValidCpf(form.cpf) && <FieldError>CPF inválido. Confira os dígitos.</FieldError>}</Field>
          <Field label="Data de nascimento" required><input required type="date" max={maxBirthDate()} value={form.dataNascimento} onChange={(e) => update("dataNascimento", e.target.value)} aria-invalid={Boolean(form.dataNascimento) && !isAtLeast18(form.dataNascimento)} className={fieldClass} style={fieldStyle} />{Boolean(form.dataNascimento) && !isAtLeast18(form.dataNascimento) && <FieldError>O profissional deve ter 18 anos ou mais.</FieldError>}</Field>
          <Field label="Telefone"><input inputMode="tel" autoComplete="tel" maxLength={15} placeholder="(00) 00000-0000" value={form.telefone} onChange={(e) => update("telefone", formatPhone(e.target.value))} className={fieldClass} style={fieldStyle} /></Field>
          <Field label="Endereço"><input maxLength={255} value={form.endereco} onChange={(e) => update("endereco", e.target.value)} className={fieldClass} style={fieldStyle} /></Field>
          <Field label="Matrícula" required><input required maxLength={30} value={form.matricula} onChange={(e) => update("matricula", e.target.value)} className={fieldClass} style={fieldStyle} /></Field>
          <Field label="Data de admissão" required><input required type="date" value={form.dataAdmissao} onChange={(e) => update("dataAdmissao", e.target.value)} className={fieldClass} style={fieldStyle} /></Field>
          <Field label="E-mail de acesso" required><input required type="email" maxLength={150} value={form.email} onChange={(e) => update("email", e.target.value)} className={fieldClass} style={fieldStyle} /></Field>
          <Field label={editingId === null ? "Senha inicial (mínimo de 12 caracteres)" : "Nova senha (opcional; mínimo de 12 caracteres)"} required={editingId === null}><input required={editingId === null} minLength={12} maxLength={72} type="password" autoComplete="new-password" value={form.senha} onChange={(e) => update("senha", e.target.value)} placeholder={editingId === null ? "Defina uma senha" : "Deixe vazio para manter a senha atual"} className={fieldClass} style={fieldStyle} /></Field>
          <Field label="Perfil" required><select value={form.role} onChange={(e) => setForm((current) => ({ ...current, role: e.target.value as StaffRole }))} className={fieldClass} style={fieldStyle}><option value="MEDICO">Médico</option><option value="ENFERMEIRA">Profissional de enfermagem</option><option value="RECEPCIONISTA">Recepcionista</option></select></Field>
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
            <div><h2 className="font-bold" style={{ color: "var(--foreground)" }}>Funcionários cadastrados</h2><p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>Contas e permissões.</p></div>
            <button type="button" onClick={() => void loadStaff()} className="min-h-10 rounded-lg border px-3 text-xs font-semibold" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Atualizar</button>
          </div>
          {loading ? <p className="p-6 text-sm" style={{ color: "var(--muted-foreground)" }}>Carregando funcionários…</p> : staff.length === 0 ? <p className="p-6 text-sm" style={{ color: "var(--muted-foreground)" }}>Nenhum funcionário cadastrado.</p> : <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {staff.map((member) => <article key={member.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0"><h3 className="truncate text-sm font-semibold" style={{ color: "var(--foreground)" }}>{member.nome}</h3><p className="truncate text-xs" style={{ color: "var(--muted-foreground)" }}>{member.email} · {roleLabel[member.role]} · Matrícula {member.matricula}</p><p className="mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>{member.role === "MEDICO" ? `${member.crm ?? "—"} · ${formatSpecialty(member.especialidade ?? "—")}` : member.role === "ENFERMEIRA" ? `${member.coren} · ${member.setor}` : member.setor}</p></div>
              <div className="flex shrink-0 gap-2"><button type="button" onClick={() => beginEdit(member)} className="min-h-10 rounded-lg border px-3 text-xs font-semibold" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>Editar</button><button type="button" onClick={() => void remove(member)} className="min-h-10 rounded-lg px-3 text-xs font-semibold" style={{ background: "var(--danger-surface)", color: "var(--danger-foreground)" }}>Excluir</button></div>
            </article>)}
          </div>}
        </section>
      </div> : <div className="mx-auto max-w-6xl"><ActivityLog token={session.token} role="ADMINISTRADOR" /></div>}
    </main>
  </div>
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <label className="flex min-w-0 flex-col gap-1.5 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{label}{required && <span className="sr-only"> obrigatório</span>}{children}</label>
}

function FieldError({ children }: { children: ReactNode }) {
  return <span className="text-xs font-medium" role="alert" style={{ color: "var(--danger-foreground)" }}>{children}</span>
}
