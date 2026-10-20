import { useState } from "react"
import type { Screen } from "../App"
import logo from "./logo.png"
import ThemeToggle, { type Theme } from "./ThemeToggle"

interface Props {
  onNavigate: (screen: Screen) => void
  theme: Theme
  onToggleTheme: () => void
}

type Role = "doutor" | "enfermeira" | "recepcionista" | null

const roles: {
  key: Role
  label: string
  placeholder: string
  name: string
}[] = [
  {
    key: "doutor",
    label: "Médico",
    placeholder: "pedro.campos@hospital.br",
    name: "Dr. Pedro Campos",
  },
  {
    key: "enfermeira",
    label: "Enfermeira",
    placeholder: "ana.dias@hospital.br",
    name: "Enf. Ana Dias",
  },
  {
    key: "recepcionista",
    label: "Recepcionista",
    placeholder: "monica.@hospital.br",
    name: "Mônica Rodriguês",
  },
]

export default function LoginPage({ onNavigate, theme, onToggleTheme }: Props) {
  const [role, setRole] = useState<Role>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const selectedRole = roles.find((r) => r.key === role)

  // Campos só ficam habilitados após selecionar um perfil
  const camposHabilitados = role !== null
  // Botão só fica habilitado com perfil + email + senha preenchidos
  const podeEntrar =
    role !== null && email.trim().length > 0 && password.trim().length > 0

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!role || !podeEntrar) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      if (role === "doutor") onNavigate("doutor")
      else if (role === "enfermeira") onNavigate("enfermeira")
      else onNavigate("recepcionista")
    }, 900)
  }

  return (
    <div className="relative flex min-h-screen">
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
      {/* Left decorative panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[32%] p-10 text-white relative overflow-hidden"
        style={{
          background:
            "linear-gradient(145deg, #0A3060 0%, #0D4A8A 60%, #00A896 100%)",
        }}
      >
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full opacity-10 bg-white" />
        <div className="absolute bottom-16 -right-16 w-64 h-64 rounded-full opacity-10 bg-white" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-14">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
              <img
                src={logo}
                alt=""
                className="app-logo h-7 w-7 object-contain"
              />
            </div>
            <span className="font-semibold text-lg tracking-wide">
              Hospital Inteligente
            </span>
          </div>

          <p className="text-white/60 text-xs font-medium tracking-widest uppercase mb-4">
            Plataforma Interna
          </p>
          <h1
            className="text-4xl leading-tight mb-6"
            style={{ fontFamily: "Instrument Serif, serif" }}
          >
            Cuidado que
            <br />
            <em>conecta</em> a equipe.
          </h1>
          <p className="text-white/70 text-sm leading-relaxed max-w-xs">
            Acesso restrito à equipe hospitalar. Médicos, enfermeiras e
            recepcionistas integrados — prontuários, prescrições, leitos e
            alertas em tempo real.
          </p>
        </div>

        <div className="relative z-10 text-[11px] text-white/50">
          © 2026 Hospital Inteligente · Uso interno
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 bg-[var(--background)]">
        <div className="w-full max-w-md slide-up flex flex-col items-center text-center">
          {/* Marca (mobile) */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center">
              <img
                src={logo}
                alt=""
                className="app-logo h-6 w-6 object-contain"
              />
            </div>
            <span className="font-semibold text-[var(--control-foreground)]">
              Hospital Inteligente
            </span>
          </div>

          <h2
            className="text-3xl text-[var(--foreground)] mb-1"
            style={{ fontFamily: "Instrument Serif, serif" }}
          >
            Acesso restrito
          </h2>
          <p className="text-[var(--muted-foreground)] text-sm mb-8">
            Selecione seu perfil e faça o login
          </p>

          {/* Seletor de perfis */}
          <div className="w-full flex gap-2 mb-7">
            {roles.map((r) => (
              <button
                key={r.key}
                onClick={() => {
                  setRole(r.key)
                  setEmail("")
                  setPassword("")
                }}
                className="flex-1 flex items-center justify-center py-3.5 px-2 rounded-[var(--radius)] border-2 transition-all duration-200 cursor-pointer"
                style={{
                  borderColor:
                    role === r.key ? "var(--primary)" : "var(--border)",
                  background: role === r.key ? "var(--primary)" : "var(--card)",
                  color: role === r.key ? "white" : "var(--muted-foreground)",
                }}
              >
                <span className="text-[11px] font-semibold tracking-wide uppercase leading-tight">
                  {r.label}
                </span>
              </button>
            ))}
          </div>

          <form
            onSubmit={handleLogin}
            className="w-full flex flex-col gap-4 text-left"
          >
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5 tracking-wide">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!camposHabilitados}
                placeholder={
                  camposHabilitados
                    ? (selectedRole?.placeholder ?? "seu@email.com")
                    : "Selecione um perfil primeiro"
                }
                required
                className="w-full h-11 px-4 rounded-[var(--radius)] border text-base sm:text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: "var(--border)",
                  background: camposHabilitados
                    ? "var(--card)"
                    : "var(--muted)",
                  color: "var(--foreground)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5 tracking-wide">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!camposHabilitados}
                placeholder={
                  camposHabilitados
                    ? "••••••••"
                    : "Selecione um perfil primeiro"
                }
                required
                className="w-full h-11 px-4 rounded-[var(--radius)] border text-base sm:text-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: "var(--border)",
                  background: camposHabilitados
                    ? "var(--card)"
                    : "var(--muted)",
                  color: "var(--foreground)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />

              {/* Esqueceu? agora abaixo do campo de senha */}
              <div className="flex justify-end mt-1.5">
                <a
                  href="#"
                  className="text-xs text-[var(--accent)] hover:underline"
                >
                  Esqueceu sua senha?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={!podeEntrar || loading}
              className="h-11 rounded-[var(--radius)] font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 mt-1 cursor-pointer"
              style={{
                // Botão sempre com cor azul (var(--primary)); apenas a opacidade
                // é reduzida quando ainda não é possível entrar.
                background: "var(--primary)",
                color: "var(--primary-foreground)",
                opacity: !podeEntrar || loading ? 0.55 : 1,
              }}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeDasharray="31.4"
                      strokeDashoffset="10"
                    />
                  </svg>
                  Autenticando…
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <p className="text-center text-xs text-[var(--muted-foreground)] mt-8">
            Acesso apenas para funcionários cadastrados.{" "}
            <a href="#" className="text-[var(--accent)] hover:underline">
              Solicitar acesso
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
