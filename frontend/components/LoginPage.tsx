import { useState } from "react"
import type { Screen } from "../App"
import logo from "./logo.webp?no-inline"
import ThemeToggle, { type Theme } from "./ThemeToggle"
import { api, ApiError, roleForScreen, type AuthSession } from "../services/api"

interface Props {
  onLogin: (session: AuthSession) => void
  /** Chamado ao escolher o perfil (usado para pré-carregar o painel). */
  onRoleSelect?: (screen: Screen) => void
  theme: Theme
  onToggleTheme: () => void
}

type Role = "administrador" | "doutor" | "enfermeira" | "recepcionista" | null

const roles: {
  key: Role
  label: string
  placeholder: string
  name: string
  description: string
}[] = [
  {
    key: "administrador",
    label: "Administrador",
    placeholder: "seu.email@hospital.br",
    name: "Conta administradora",
    description: "Gestão de acessos",
  },
  {
    key: "doutor",
    label: "Médico",
    placeholder: "seu.email@hospital.br",
    name: "Conta médica",
    description: "Prontuários e prescrições",
  },
  {
    key: "enfermeira",
    label: "Enfermeira",
    placeholder: "seu.email@hospital.br",
    name: "Conta de enfermagem",
    description: "Cuidados e medicação",
  },
  {
    key: "recepcionista",
    label: "Recepcionista",
    placeholder: "seu.email@hospital.br",
    name: "Conta de recepção",
    description: "Cadastros, leitos e agenda",
  },
]

const RoleIcon = ({ role }: { role: Role }) => {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  }
  if (role === "doutor")
    return (
      <svg {...common}>
        <path d="M6 3v5a4 4 0 0 0 8 0V3" />
        <path d="M10 12v2a5 5 0 0 0 10 0v-2" />
        <circle cx="20" cy="10" r="2" />
      </svg>
    )
  if (role === "enfermeira")
    return (
      <svg {...common}>
        <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" />
        <path d="M3.2 12h4.3l1.5-3 2 6 1.5-3h3" />
      </svg>
    )
  if (role === "administrador")
    return (
      <svg {...common}>
        <path d="M12 3 4 6v5c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6l-8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    )
  return (
    <svg {...common}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18M8 14h3M8 17h6" />
    </svg>
  )
}

const FieldIcon = ({ name }: { name: "mail" | "lock" }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "mail" ? (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ) : (
      <>
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </>
    )}
  </svg>
)

export default function LoginPage({ onLogin, onRoleSelect, theme, onToggleTheme }: Props) {
  const [role, setRole] = useState<Role>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loginNotice, setLoginNotice] = useState("")

  const selectedRole = roles.find((r) => r.key === role)

  // Campos só ficam habilitados após selecionar um perfil
  const camposHabilitados = role !== null
  // Botão só fica habilitado com perfil + email + senha preenchidos
  const podeEntrar =
    role !== null && email.trim().length > 0 && password.trim().length > 0

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role || !podeEntrar) return
    setLoading(true)
    setLoginNotice("")
    try {
      const authenticated = await api.login(email.trim(), password)
      const expectedRole = roleForScreen(role)
      if (authenticated.role !== expectedRole) {
        setLoading(false)
        setLoginNotice(`Esta conta possui perfil ${authenticated.role}, diferente do perfil selecionado.`)
        return
      }
      onLogin(authenticated)
    } catch (error) {
      setLoading(false)
      setLoginNotice(error instanceof ApiError ? error.message : "Não foi possível autenticar.")
    }
  }

  const inputStyle = {
    borderColor: "var(--border)",
    background: camposHabilitados ? "var(--card)" : "var(--secondary)",
    color: "var(--foreground)",
  }

  return (
    <div className="relative flex min-h-screen">
      {/* Painel institucional */}
      <div
        className="relative hidden w-[44%] max-w-[640px] flex-col justify-between overflow-hidden p-10 text-white lg:flex xl:p-14"
        style={{ background: "linear-gradient(160deg, #0D1B2A 0%, #102A45 55%, #134A6E 100%)" }}
      >
        <div className="login-hero-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -bottom-40 -right-32 h-[420px] w-[420px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(0,166,166,0.35), transparent 65%)" }}
          aria-hidden="true"
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg, #1E4F86, #00A6A6)" }}>
              <img src={logo} alt="" className="app-logo-on-dark h-7 w-7 object-contain" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight">Hospital Inteligente</div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "#5FD4D0" }}>Plataforma interna</div>
            </div>
          </div>

          <h1 className="mt-16 max-w-md text-[2.5rem] font-bold leading-[1.1] tracking-tight xl:text-5xl">
            Cuidado que <span style={{ color: "#5FD4D0" }}>conecta</span> a equipe.
          </h1>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed" style={{ color: "rgba(230,238,246,0.75)" }}>
            Prontuários, prescrições, leitos e sinais vitais em um só lugar — para médicos, equipe de enfermagem e recepção.
          </p>

          {/* Ilustração de monitor (decorativa) */}
          <div
            className="mt-10 max-w-sm rounded-2xl border p-5"
            style={{ background: "rgba(7,18,30,0.65)", borderColor: "rgba(61,214,245,0.18)" }}
            aria-hidden="true"
          >
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: "#86A0B8" }}>
              <span>Leito 12A · Monitor</span>
              <span className="flex items-center gap-1.5" style={{ color: "#35E08F" }}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" /> Ao vivo
              </span>
            </div>
            <svg viewBox="0 0 320 56" className="mt-3 h-14 w-full">
              <path
                d="M0 28H40l8-2 6 2h25l8-4 5 8 7-24 8 39 8-19 6 2h33l8-2 6 2h24l8-4 5 8 7-24 8 39 8-19 6 2h33l8-2 6 2h27"
                className="ecg-trace"
                fill="none"
                stroke="#35E08F"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[
                { label: "FC", value: "72", unit: "bpm", color: "#35E08F" },
                { label: "SpO₂", value: "98", unit: "%", color: "#3DD6F5" },
                { label: "FR", value: "16", unit: "rpm", color: "#F5D547" },
              ].map((vital) => (
                <div key={vital.label}>
                  <div className="text-[11px] font-semibold" style={{ color: vital.color }}>{vital.label}</div>
                  <div className="monitor-value mt-1 text-2xl" style={{ color: vital.color }}>
                    {vital.value}
                    <span className="ml-1 text-[11px] font-medium" style={{ color: "#86A0B8" }}>{vital.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs" style={{ color: "rgba(230,238,246,0.55)" }}>
          <span>© 2026 Hospital Inteligente</span>
          <span>Uso interno da equipe</span>
        </div>
      </div>

      {/* Formulário */}
      <main className="relative flex flex-1 items-center justify-center bg-[var(--background)] px-4 py-20 sm:px-6 lg:px-12">
        <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>

        <div className="slide-up w-full max-w-[460px]">
          {/* Marca (tablet e celular) */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg, #1E4F86, #00A6A6)" }}>
              <img src={logo} alt="" className="app-logo-on-dark h-6 w-6 object-contain" />
            </div>
            <div>
              <div className="font-bold tracking-tight" style={{ color: "var(--foreground)" }}>Hospital Inteligente</div>
              <div className="ui-eyebrow text-[11px]">Plataforma interna</div>
            </div>
          </div>

          <div
            className="rounded-2xl border p-6 sm:p-8"
            style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-md)" }}
          >
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
              Acesso restrito
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
              Selecione seu perfil e faça o login.
            </p>

            {/* Seletor de perfis */}
            <fieldset className="mt-6">
              <legend className="mb-2.5 text-xs font-semibold" style={{ color: "var(--foreground)" }}>
                Perfil de acesso
              </legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3" role="radiogroup" aria-label="Perfil de acesso">
                {roles.map((r) => {
                  const active = role === r.key
                  return (
                    <button
                      key={r.key}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        setRole(r.key)
                        if (r.key) onRoleSelect?.(r.key)
                        setEmail("")
                        setPassword("")
                        setLoginNotice("")
                      }}
                      className="relative flex min-h-[104px] flex-col items-center justify-center gap-2 rounded-xl border-2 px-1.5 py-3 text-center transition-all duration-150 hover:border-[var(--border-strong)]"
                      style={{
                        borderColor: active ? "var(--primary)" : "var(--border)",
                        background: active ? "color-mix(in srgb, var(--primary) 8%, var(--card))" : "var(--card)",
                        boxShadow: active ? "0 0 0 3px var(--focus-ring)" : "none",
                      }}
                    >
                      {active && (
                        <span
                          className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-white"
                          style={{ background: "var(--primary)" }}
                          aria-hidden="true"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>
                        </span>
                      )}
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{
                          background: active ? "var(--primary)" : "var(--secondary)",
                          color: active ? "var(--primary-foreground)" : "var(--control-foreground)",
                        }}
                      >
                        <RoleIcon role={r.key} />
                      </span>
                      <span className="text-[13px] font-semibold leading-tight" style={{ color: "var(--foreground)" }}>
                        {r.label}
                      </span>
                      <span className="hidden text-[11px] leading-snug sm:block" style={{ color: "var(--muted-foreground)" }}>
                        {r.description}
                      </span>
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4">
              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--foreground)" }}>
                  E-mail
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }}>
                    <FieldIcon name="mail" />
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!camposHabilitados}
                    placeholder={
                      camposHabilitados
                        ? (selectedRole?.placeholder ?? "seu@email.com")
                        : "Selecione um perfil primeiro"
                    }
                    required
                    className="login-input h-12 w-full rounded-xl border pl-11 pr-4 text-base outline-none disabled:cursor-not-allowed disabled:opacity-70 sm:text-sm"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label htmlFor="login-password" className="block text-xs font-semibold" style={{ color: "var(--foreground)" }}>
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => setLoginNotice("A recuperação de senha ainda não está conectada neste protótipo.")}
                    className="text-xs font-medium hover:underline"
                    style={{ color: "var(--control-foreground)" }}
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }}>
                    <FieldIcon name="lock" />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={!camposHabilitados}
                    placeholder={
                      camposHabilitados
                        ? "••••••••"
                        : "Selecione um perfil primeiro"
                    }
                    required
                    className="login-input h-12 w-full rounded-xl border pl-11 pr-20 text-base outline-none disabled:cursor-not-allowed disabled:opacity-70 sm:text-sm"
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    disabled={!camposHabilitados}
                    aria-pressed={showPassword}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-1.5 top-1/2 h-9 -translate-y-1/2 rounded-lg px-3 text-xs font-semibold disabled:opacity-40"
                    style={{ color: "var(--control-foreground)" }}
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!podeEntrar || loading}
                className="mt-2 flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-150 enabled:hover:brightness-110 enabled:active:translate-y-px disabled:cursor-not-allowed"
                style={{
                  background: podeEntrar || loading ? "var(--primary)" : "var(--muted)",
                  color: podeEntrar || loading ? "var(--primary-foreground)" : "var(--muted-foreground)",
                  boxShadow: podeEntrar ? "0 6px 16px color-mix(in srgb, var(--primary) 30%, transparent)" : "none",
                }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                    </svg>
                    Autenticando…
                  </>
                ) : (
                  <>
                    Entrar{selectedRole ? ` como ${selectedRole.label.toLowerCase()}` : ""}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </>
                )}
              </button>
              {!camposHabilitados && (
                <p className="-mt-1 text-center text-xs" style={{ color: "var(--muted-foreground)" }}>
                  Escolha um perfil acima para liberar os campos.
                </p>
              )}
            </form>

            {loginNotice && (
              <p
                role="status"
                className="mt-4 flex gap-2 rounded-xl border px-3.5 py-3 text-xs leading-relaxed"
                style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--muted-foreground)" }}
              >
                <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
                {loginNotice}
              </p>
            )}
          </div>

      <p className="mt-6 text-center text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            Acesso autenticado pela API. O painel e as permissões são definidos pelo perfil da conta.{" "}
            <button
              type="button"
              onClick={() => setLoginNotice("Solicitações de acesso ainda não são recebidas pelo protótipo. Use um perfil demonstrativo para navegar.")}
              className="font-semibold hover:underline"
              style={{ color: "var(--control-foreground)" }}
            >
              Solicitar acesso
            </button>
          </p>
        </div>
      </main>
    </div>
  )
}
