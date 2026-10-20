import { useState } from "react"
import logo from "./logo.png"
import ThemeToggle, { type Theme } from "./ThemeToggle"

interface SidebarTab {
  key: string
  label: string
}

interface Props {
  role: string
  initials: string
  name: string
  detail: string
  tabs: SidebarTab[]
  activeTab: string
  onSelect: (key: string) => void
  onLogout: () => void
  alertCount?: number
  theme: Theme
  onToggleTheme: () => void
}

export default function DashboardSidebar({
  role,
  initials,
  name,
  detail,
  tabs,
  activeTab,
  onSelect,
  onLogout,
  alertCount = 0,
  theme,
  onToggleTheme,
}: Props) {
  const [open, setOpen] = useState(false)
  const alertTab = tabs.find((tab) => tab.key === "alertas")

  const selectTab = (key: string) => {
    onSelect(key)
    setOpen(false)
  }

  const navigation = (
    <nav
      aria-label="Seções do painel"
      className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3"
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.key
        const hasAlert = tab.key === "alertas" && alertCount > 0
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => selectTab(tab.key)}
            aria-current={active ? "page" : undefined}
            className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm font-medium transition-colors"
            style={{
              background: active ? "var(--primary)" : "transparent",
              color: active
                ? "var(--primary-foreground)"
                : "var(--muted-foreground)",
            }}
          >
            <span>{tab.label}</span>
            {hasAlert && (
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                {alertCount}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )

  const alertsPanel = alertTab && (
    <div
      className="mx-3 mb-3 rounded-2xl border p-4"
      style={{
        background: "var(--alert-surface)",
        borderColor: "var(--alert-border)",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-[0.16em]"
            style={{ color: "var(--muted-foreground)" }}
          >
            Central de alertas
          </p>
          <p
            className="mt-1 text-3xl font-bold leading-none"
            style={{
              color:
                alertCount > 0 ? "var(--alert-foreground)" : "var(--accent)",
            }}
          >
            {alertCount}
          </p>
        </div>
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{
            background: "var(--alert-icon-bg)",
            color: "var(--alert-foreground)",
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 3 2.8 19h18.4L12 3Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path
              d="M12 9v4m0 3h.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </div>
      <p className="mt-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
        {alertCount > 0 ? "Pendentes de avaliação" : "Tudo sob controle"}
      </p>
      <button
        type="button"
        onClick={() => selectTab(alertTab.key)}
        className="mt-3 min-h-10 w-full rounded-lg px-3 text-left text-xs font-semibold transition-colors"
        style={{ background: "var(--card)", color: "var(--primary)" }}
      >
        Abrir alertas <span aria-hidden="true">→</span>
      </button>
    </div>
  )

  const brand = (
    <div
      className="flex items-center gap-3 border-b p-5"
      style={{ borderColor: "var(--border)" }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ background: "var(--primary)" }}
      >
        <img src={logo} alt="" className="app-logo h-7 w-7 object-contain" />
      </div>
      <div className="min-w-0">
        <div
          className="truncate text-sm font-semibold"
          style={{ color: "var(--primary)" }}
        >
          Hospital Inteligente
        </div>
        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          {role}
        </div>
      </div>
    </div>
  )

  const profile = (
    <div
      className="flex items-center gap-3 border-b px-5 py-4"
      style={{ borderColor: "var(--border)" }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ background: "var(--accent)" }}
      >
        {initials}
      </div>
      <div className="min-w-0">
        <div
          className="truncate text-sm font-semibold"
          style={{ color: "var(--foreground)" }}
        >
          {name}
        </div>
        <div
          className="truncate text-xs"
          style={{ color: "var(--muted-foreground)" }}
        >
          {detail}
        </div>
      </div>
    </div>
  )

  const logout = (
    <div className="border-t p-3" style={{ borderColor: "var(--border)" }}>
      <button
        type="button"
        onClick={onLogout}
        className="min-h-11 w-full rounded-xl px-3 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-500/10"
      >
        Sair da conta
      </button>
    </div>
  )

  return (
    <>
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden h-dvh w-64 flex-col overflow-hidden border-r xl:flex"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        {brand}
        {navigation}
        {alertsPanel}
        {logout}
      </aside>

      <div
        className="fixed inset-x-0 top-0 z-40 grid h-16 grid-cols-[40px_40px_1fr_40px] items-center gap-2 border-b px-3 xl:hidden"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <button
          type="button"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border"
          style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--control-foreground)" }}
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          )}
        </button>
        <button
          type="button"
          aria-label={alertTab ? `Abrir alertas (${alertCount})` : "Alertas"}
          onClick={() => alertTab && selectTab(alertTab.key)}
          disabled={!alertTab}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ color: "var(--control-foreground)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          {alertCount > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">{alertCount}</span>}
        </button>
        <img src={logo} alt="Hospital Inteligente" className="app-logo absolute left-1/2 h-9 w-14 -translate-x-1/2 object-contain" />
        <div className="flex h-10 w-10 items-center justify-center justify-self-end rounded-full text-xs font-bold text-white" style={{ background: "var(--accent)" }} aria-label={`Perfil ${initials}`}>{initials}</div>
      </div>

      <div className="fixed bottom-4 right-4 z-40 xl:hidden">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} floating />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 xl:hidden" role="presentation">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full bg-slate-950/50"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={`Navegação ${role}`}
            className="relative flex h-dvh w-[min(86vw,320px)] flex-col overflow-hidden border-r shadow-2xl"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            {brand}
            {profile}
            {navigation}
            {alertsPanel}
            {logout}
          </aside>
        </div>
      )}
    </>
  )
}
