import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import logo from "./logo.webp?no-inline"
import ThemeToggle, { type Theme } from "./ThemeToggle"
import { logActivity } from "./activityStore"
import { UiIcon } from "./ui"

// Classe de cor do perfil (o menu móvel é renderizado fora do painel, via portal)
const roleClass: Record<string, string> = { Médico: "role-medico", Enfermagem: "role-enfermagem", Recepção: "role-recepcao" }

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface SidebarTab {
  key: string
  label: string
  group?: string
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
  const drawerRef = useRef<HTMLElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const alertTab = tabs.find((tab) => tab.key === "alertas")
  const activeLabel = tabs.find((tab) => tab.key === activeTab)?.label ?? role

  const selectTab = (key: string) => {
    onSelect(key)
    setOpen(false)
    window.scrollTo({ top: 0 })
  }

  // Menu móvel (modal): foco inicial dentro do menu, Tab/Shift+Tab contidos,
  // fundo inerte e sem rolagem, Esc fecha e o foco volta ao botão de abertura.
  useEffect(() => {
    if (!open) return
    const root = document.getElementById("root")
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    root?.setAttribute("inert", "")
    const drawer = drawerRef.current
    const initial = drawer?.querySelector<HTMLElement>("[aria-current='page']") ?? drawer?.querySelector<HTMLElement>(FOCUSABLE)
    initial?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        setOpen(false)
        return
      }
      if (event.key !== "Tab" || !drawer) return
      const focusable = [...drawer.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const current = document.activeElement
      if (event.shiftKey && (current === first || !drawer.contains(current))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (current === last || !drawer.contains(current))) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    const menuButton = menuButtonRef.current
    return () => {
      document.body.style.overflow = previousOverflow
      root?.removeAttribute("inert")
      document.removeEventListener("keydown", onKeyDown)
      menuButton?.focus()
    }
  }, [open])

  // Agrupa itens consecutivos com o mesmo grupo (ordem definida pelo painel).
  const groups = tabs.reduce<{ name: string; items: SidebarTab[] }[]>((acc, tab) => {
    const name = tab.group ?? "Menu"
    const last = acc[acc.length - 1]
    if (last && last.name === name) last.items.push(tab)
    else acc.push({ name, items: [tab] })
    return acc
  }, [])

  const navigation = (
    <nav aria-label="Seções do painel" className="ui-nav ui-nav-scroll min-h-0 flex-1 overflow-y-auto px-3 py-4">
      {groups.map((group) => (
      <div key={group.name} className="ui-nav-group" role="group" aria-label={group.name}>
      <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--nav-muted)" }}>
        {group.name}
      </p>
      <ul className="space-y-0.5">
        {group.items.map((tab) => {
          const active = activeTab === tab.key
          const hasAlert = tab.key === "alertas" && alertCount > 0
          return (
            <li key={tab.key}>
              <button
                type="button"
                onClick={() => selectTab(tab.key)}
                aria-current={active ? "page" : undefined}
                className="ui-nav-item flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors"
              >
                <span className="ui-nav-icon flex shrink-0">
                  <UiIcon name={tab.key} size={18} />
                </span>
                <span className="min-w-0 flex-1 truncate">{tab.label}</span>
                {hasAlert && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-bold leading-4 text-white"
                    style={{ background: "var(--badge-danger)" }}
                    aria-label={`${alertCount} pendentes`}
                  >
                    {alertCount}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
      </div>
      ))}
    </nav>
  )

  const alertsPanel = alertTab && (
    <div className="mx-3 mb-3 rounded-xl border p-3" style={{ background: "var(--nav-surface)", borderColor: "var(--nav-border)" }}>
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: alertCount > 0 ? "rgba(255, 93, 93, 0.16)" : "rgba(53, 224, 143, 0.14)",
            color: alertCount > 0 ? "#FF8A8A" : "#5BE3A6",
          }}
        >
          <UiIcon name={alertCount > 0 ? "alert" : "check"} size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold" style={{ color: "var(--nav-foreground)" }}>
            {alertCount > 0 ? `${alertCount} alerta${alertCount === 1 ? "" : "s"} pendente${alertCount === 1 ? "" : "s"}` : "Sem alertas pendentes"}
          </p>
          <p className="text-[11px]" style={{ color: "var(--nav-muted)" }}>
            {alertCount > 0 ? "Requerem avaliação" : "Tudo sob controle"}
          </p>
        </div>
      </div>
      {alertCount > 0 && activeTab !== alertTab.key && (
        <button
          type="button"
          onClick={() => selectTab(alertTab.key)}
          className="mt-3 flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors hover:brightness-110"
          style={{ background: "rgba(255, 255, 255, 0.08)", color: "var(--nav-foreground)" }}
        >
          Abrir central de alertas <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  )

  const brand = (
    <div className="flex h-16 shrink-0 items-center gap-3 border-b px-5" style={{ borderColor: "var(--nav-border)" }}>
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ background: "linear-gradient(135deg, #1E4F86, #00A6A6)" }}
      >
        <img src={logo} alt="" className="app-logo-on-dark h-6 w-6 object-contain" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-bold tracking-tight" style={{ color: "#FFFFFF" }}>
          Hospital Inteligente
        </div>
        <div className="text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: "var(--hero-accent, #5FD4D0)" }}>
          {role}
        </div>
      </div>
    </div>
  )

  const profile = (
    <div className="border-t p-3" style={{ borderColor: "var(--nav-border)" }}>
      <div className="flex items-center gap-3 rounded-xl px-2 py-2">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg, #1E4F86, #00A6A6)" }}
          aria-hidden="true"
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold" style={{ color: "var(--nav-foreground)" }}>{name}</div>
          <div className="truncate text-xs" style={{ color: "var(--nav-muted)" }}>{detail}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          logActivity(role, "Sessão encerrada", "Acesso demonstrativo", name)
          onLogout()
        }}
        className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors hover:bg-white/5"
        style={{ color: "#FF9C94" }}
      >
        <UiIcon name="logout" size={18} />
        Sair da conta
      </button>
    </div>
  )

  return (
    <>
      <aside
        className="ui-nav fixed inset-y-0 left-0 z-30 hidden h-dvh w-64 flex-col overflow-hidden xl:flex"
        style={{ background: "var(--nav-bg)" }}
        aria-label={`Navegação ${role}`}
      >
        {brand}
        {navigation}
        {alertsPanel}
        {profile}
      </aside>

      {/* Barra superior (tablet e celular) */}
      <div
        className="fixed inset-x-0 top-0 z-40 flex h-16 items-center gap-2 border-b px-3 sm:px-4 xl:hidden"
        style={{
          background: "color-mix(in srgb, var(--card) 92%, transparent)",
          borderColor: "var(--border)",
          backdropFilter: "saturate(1.4) blur(10px)",
          WebkitBackdropFilter: "saturate(1.4) blur(10px)",
        }}
      >
        <button
          ref={menuButtonRef}
          type="button"
          aria-label="Abrir menu"
          aria-expanded={open}
          aria-controls="dashboard-mobile-menu"
          onClick={() => setOpen(true)}
          className="ui-icon-button flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
          style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--control-foreground)" }}
        >
          <UiIcon name="menu" size={20} strokeWidth={2} />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg min-[400px]:flex"
            style={{ background: "linear-gradient(135deg, #1E4F86, #00A6A6)" }}
          >
            <img src={logo} alt="" className="app-logo-on-dark h-5 w-5 object-contain" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--muted-foreground)" }}>{role}</div>
            <div className="truncate text-sm font-semibold leading-tight" style={{ color: "var(--foreground)" }}>{activeLabel}</div>
          </div>
        </div>
        {alertTab && (
          <button
            type="button"
            aria-label={alertCount ? `Abrir alertas (${alertCount} pendentes)` : "Abrir alertas"}
            onClick={() => selectTab(alertTab.key)}
            className="ui-icon-button relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--control-foreground)" }}
          >
            <UiIcon name="alertas" size={20} />
            {alertCount > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold text-white"
                style={{ background: "var(--badge-danger)", boxShadow: "0 0 0 2px var(--card)" }}
              >
                {alertCount}
              </span>
            )}
          </button>
        )}
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      {open && createPortal(
        <div className={`${roleClass[role] ?? ""} fixed inset-0 z-50 xl:hidden`} role="presentation">
          <button
            type="button"
            aria-label="Fechar menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fade-in absolute inset-0 h-full w-full"
            style={{ background: "rgba(5, 12, 20, 0.6)" }}
          />
          <aside
            ref={drawerRef}
            id="dashboard-mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label={`Navegação ${role}`}
            className="ui-nav drawer-in relative flex h-dvh w-[min(86vw,320px)] flex-col overflow-hidden shadow-2xl"
            style={{ background: "var(--nav-bg)" }}
          >
            <div className="relative">
              {brand}
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setOpen(false)}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg transition-colors hover:bg-white/10"
                style={{ color: "var(--nav-foreground)" }}
              >
                <UiIcon name="close" size={20} strokeWidth={2} />
              </button>
            </div>
            {navigation}
            {alertsPanel}
            {profile}
          </aside>
        </div>,
        document.body,
      )}
    </>
  )
}
