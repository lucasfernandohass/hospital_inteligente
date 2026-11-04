import { Component, Suspense, lazy, useEffect, useState } from "react"
import type { ReactNode } from "react"
import LoginPage from "./components/LoginPage"
import type { Theme } from "./components/ThemeToggle"
import AdminDashboard from "./components/AdminDashboard"
import { roleForScreen, screenForRole, type AuthSession } from "./services/api"
import { pathForPanel, type PanelSection } from "./hooks/usePanelRoute"

export type Screen = "login" | "administrador" | "doutor" | "enfermeira" | "recepcionista"
const SESSION_KEY = "inteliHosp-session"
const panelByScreen: Record<Exclude<Screen, "login">, { section: PanelSection; firstPage: string }> = {
  administrador: { section: "administrador", firstPage: "equipe" },
  doutor: { section: "medico", firstPage: "overview" },
  enfermeira: { section: "enfermagem", firstPage: "internados" },
  recepcionista: { section: "recepcao", firstPage: "recepcao" },
}

function screenForPath(pathname: string): Screen | null {
  const section = pathname.split("/").filter(Boolean)[1]
  return ({ administrador: "administrador", medico: "doutor", enfermagem: "enfermeira", recepcao: "recepcionista" } as Record<string, Exclude<Screen, "login">>)[section] ?? null
}

function pathForScreen(screen: Screen) {
  if (screen === "login") return "/login"
  const route = panelByScreen[screen]
  return pathForPanel(route.section, route.firstPage)
}

function readSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AuthSession>
    if (!parsed.token || !parsed.nome || !parsed.email || !parsed.role || !["RECEPCIONISTA", "MEDICO", "ENFERMEIRA", "ADMINISTRADOR"].includes(parsed.role)) return null
    return parsed as AuthSession
  } catch { return null }
}

// Cada painel é carregado sob demanda (chunk próprio no build).
const dashboardLoaders = {
  doutor: () => import("./components/DoutorDashboard"),
  enfermeira: () => import("./components/EnfermeiraDashboard"),
  recepcionista: () => import("./components/RecepcionistaDashboard"),
}

const DoutorDashboard = lazy(dashboardLoaders.doutor)
const EnfermeiraDashboard = lazy(dashboardLoaders.enfermeira)
const RecepcionistaDashboard = lazy(dashboardLoaders.recepcionista)

// O navegador memoriza a falha de um import() dinâmico, então a nova tentativa real
// exige recarregar a página. O painel desejado é lembrado só para esse recarregamento
// (sessionStorage, lido uma única vez e apagado — sem ciclo de tentativas).
const RETRY_SCREEN_KEY = "inteliHosp-retry-screen"

function readRetryScreen(): Screen {
  try {
    const saved = sessionStorage.getItem(RETRY_SCREEN_KEY)
    sessionStorage.removeItem(RETRY_SCREEN_KEY)
    return saved === "administrador" || saved === "doutor" || saved === "enfermeira" || saved === "recepcionista" ? saved : "login"
  } catch {
    return "login"
  }
}

function retryDashboard(screen: Screen) {
  try {
    sessionStorage.setItem(RETRY_SCREEN_KEY, screen)
  } catch {
    // Sem sessionStorage, o recarregamento volta ao login.
  }
  window.location.reload()
}

/** Mostra uma tela de erro se o painel não puder ser carregado (sem tentativas automáticas). */
class DashboardErrorBoundary extends Component<{ children: ReactNode; onRetry: () => void; onBack: () => void }, { failed: boolean; message: string }> {
  state = { failed: false, message: "" }

  static getDerivedStateFromError() {
    return { failed: true, message: "" }
  }

  componentDidCatch(error: Error) {
    console.error("Falha ao renderizar o painel:", error)
    this.setState({ message: error.message })
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6">
        <div role="alert" className="w-full max-w-sm rounded-2xl border p-6 text-center" style={{ background: "var(--card)", borderColor: "var(--border)", boxShadow: "var(--shadow-md)" }}>
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "var(--danger-surface)", color: "var(--danger-foreground)" }} aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.6 2.4 17a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></svg>
          </span>
          <h1 className="mt-4 text-lg font-bold" style={{ color: "var(--foreground)" }}>Não foi possível carregar o painel</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>Verifique a conexão e tente novamente.</p>
          {import.meta.env.DEV && this.state.message && <pre className="mt-3 overflow-auto rounded-lg p-3 text-left text-xs" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>{this.state.message}</pre>}
          <div className="mt-5 flex flex-col gap-2">
            <button type="button" onClick={this.props.onRetry} className="min-h-11 rounded-xl px-4 text-sm font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              Tentar novamente
            </button>
            <button type="button" onClick={this.props.onBack} className="min-h-11 rounded-xl border px-4 text-sm font-semibold" style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}>
              Voltar ao login
            </button>
          </div>
        </div>
      </div>
    )
  }
}

/** Antecipa o download do painel escolhido no login (sem alterar o fluxo). */
function prefetchDashboard(screen: Screen) {
  if (screen !== "login" && screen !== "administrador") void dashboardLoaders[screen]().catch(() => undefined)
}

function DashboardFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, #1E4F86, #00A6A6)" }} aria-hidden="true">
          <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Carregando o painel…</p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--muted-foreground)" }}>Hospital Inteligente</p>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(readSession)
  const [screen, setScreen] = useState<Screen>(() => {
    readRetryScreen()
    const authenticated = readSession()
    if (!authenticated) return "login"
    const allowedScreen = screenForRole(authenticated.role)
    return screenForPath(window.location.pathname) === allowedScreen ? allowedScreen : allowedScreen
  })
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return localStorage.getItem("inteliHosp-theme") === "dark" ? "dark" : "light"
    } catch {
      return "light"
    }
  })
  const [animKey, setAnimKey] = useState(0)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem("inteliHosp-theme", theme)
    } catch {
      // O tema escolhido continua valendo durante esta sessão.
    }
  }, [theme])

  useEffect(() => {
    const syncRoute = () => {
      const authenticated = readSession()
      if (!authenticated) {
        if (window.location.pathname !== "/login") window.history.replaceState({}, "", "/login")
        setScreen("login")
        return
      }
      const allowedScreen = screenForRole(authenticated.role)
      const requestedScreen = screenForPath(window.location.pathname)
      if (requestedScreen !== allowedScreen) {
        const defaultPath = pathForScreen(allowedScreen)
        window.history.replaceState({}, "", defaultPath)
      }
      setScreen(allowedScreen)
    }
    window.addEventListener("popstate", syncRoute)
    syncRoute()
    return () => window.removeEventListener("popstate", syncRoute)
  }, [])

  const navigate = (next: Screen) => {
    if (next === "login") {
      sessionStorage.removeItem(SESSION_KEY)
      setSession(null)
    }
    window.history.pushState({}, "", pathForScreen(next))
    setScreen(next)
    setAnimKey((k) => k + 1)
  }

  const handleLogin = (authenticated: AuthSession) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(authenticated))
    window.history.pushState({}, "", pathForScreen(screenForRole(authenticated.role)))
    setSession(authenticated)
    setScreen(screenForRole(authenticated.role))
    setAnimKey((k) => k + 1)
  }

  const toggleTheme = () =>
    setTheme((current) => (current === "light" ? "dark" : "light"))

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div key={animKey} className="screen-enter">
        {screen === "login" && (
          <LoginPage
            onLogin={handleLogin}
            onRoleSelect={prefetchDashboard}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )}
        {screen !== "login" && (
        <DashboardErrorBoundary key={screen} onRetry={() => retryDashboard(screen)} onBack={() => navigate("login")}>
        <Suspense fallback={<DashboardFallback />}>
          {screen === "doutor" && (
            <DoutorDashboard
              onNavigate={navigate}
              token={session?.token ?? ""}
              userName={session?.nome ?? ""}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          )}
          {screen === "enfermeira" && (
            <EnfermeiraDashboard
              onNavigate={navigate}
              token={session?.token ?? ""}
              userName={session?.nome ?? ""}
              userId={session?.id ?? 0}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          )}
          {screen === "recepcionista" && (
            <RecepcionistaDashboard
              onNavigate={navigate}
              token={session?.token ?? ""}
              userName={session?.nome ?? ""}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          )}
          {screen === "administrador" && session?.role === "ADMINISTRADOR" && (
            <AdminDashboard session={session} onLogout={() => navigate("login")} theme={theme} onToggleTheme={toggleTheme} />
          )}
        </Suspense>
        </DashboardErrorBoundary>
        )}
      </div>
    </div>
  )
}
