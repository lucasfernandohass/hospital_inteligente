import { createContext, useContext, useEffect, useId, useState } from "react"
import type { ReactNode } from "react"
import ThemeToggle, { type Theme } from "./ThemeToggle"

// ---------------------------------------------------------------------------
// Ícones (traço único, 24x24, herdam currentColor)
// ---------------------------------------------------------------------------
const iconPaths: Record<string, ReactNode> = {
  overview: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  recepcao: <><path d="M3 21h18M5 21V10l7-5 7 5v11" /><path d="M10 21v-5h4v5M10 11h4" /></>,
  atendimento: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  internados: <><path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 15h18M6 10V7a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3M3 18v2M21 18v2" /></>,
  monitoramento: <><path d="M3 12h4l2-6 4 12 2-6h6" /></>,
  prescricao: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5V3h6v1.5M9 10h6M9 14h6M9 18h3" /></>,
  administracao: <><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" /><path d="m8.5 8.5 7 7" /></>,
  exames: <><path d="M9 3h6M10 3v6l-5.5 9.2A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.8L14 9V3" /><path d="M8 15h8" /></>,
  agenda: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  agendamento: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M12 14v4M10 16h4" /></>,
  internacao: <><path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 15h18M6 10V7a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3M3 18v2M21 18v2" /></>,
  evolucao: <><path d="M3 3v18h18" /><path d="m7 15 4-4 3 3 6-6" /></>,
  atividades: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  alertas: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
  "cadastro-paciente": <><circle cx="9" cy="8" r="4" /><path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 3 .8M19 14v6M16 17h6" /></>,
  "consulta-paciente": <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  equipe: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  "cadastro-leito": <><path d="M3 18v-6a2 2 0 0 1 2-2h9M3 15h12M6 10V7a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3M3 18v2M19 13v6M16 16h6" /></>,
  "mapa-leitos": <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  ficha: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  alert: <><path d="M10.3 3.6 2.4 17a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
  check: <><path d="m5 12 4 4L19 6" /></>,
  checkCircle: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  chevronRight: <><path d="m9 6 6 6-6 6" /></>,
  chevronDown: <><path d="m6 9 6 6 6-6" /></>,
  arrowRight: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  pill: <><rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-45 12 12)" /><path d="m8.5 8.5 7 7" /></>,
  heart: <><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" /></>,
  droplet: <><path d="M12 2.7 6.3 8.4a8 8 0 1 0 11.4 0Z" /></>,
  thermometer: <><path d="M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0Z" /></>,
  wind: <><path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h7" /></>,
  gauge: <><path d="M12 14 16 9" /><path d="M3.3 19a10 10 0 1 1 17.4 0" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="m21 15-5-5L5 20" /></>,
  ecg: <><path d="M3 12h4l2-7 4 14 2-7h6" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a7 7 0 0 1 16 0v1" /></>,
  phone: <><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" /></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></>,
  printer: <><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></>,
  stethoscope: <><path d="M6 3v5a4 4 0 0 0 8 0V3" /><path d="M10 12v2a5 5 0 0 0 10 0v-2" /><circle cx="20" cy="10" r="2" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <><path d="M20.2 15.2A8.5 8.5 0 0 1 8.8 3.8 8.5 8.5 0 1 0 20.2 15.2Z" /></>,
  send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
  doc: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" /><path d="M14 3v5h5" /></>,
  building: <><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1" /></>,
}

export function UiIcon({ name, size = 18, strokeWidth = 1.8, className }: { name: string; size?: number; strokeWidth?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {iconPaths[name] ?? iconPaths.overview}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Tons semânticos
// ---------------------------------------------------------------------------
export type Tone = "role" | "primary" | "info" | "success" | "warning" | "danger" | "neutral" | "violet"

export const toneStyles: Record<Tone, { fg: string; bg: string; solid: string; border: string }> = {
  role: { fg: "var(--role-strong)", bg: "var(--role-soft)", solid: "var(--role)", border: "color-mix(in srgb, var(--role) 35%, transparent)" },
  primary: { fg: "var(--control-foreground)", bg: "color-mix(in srgb, var(--primary) 12%, var(--card))", solid: "var(--primary)", border: "color-mix(in srgb, var(--primary) 35%, transparent)" },
  info: { fg: "var(--control-foreground)", bg: "color-mix(in srgb, var(--info) 14%, var(--card))", solid: "var(--info)", border: "color-mix(in srgb, var(--info) 35%, transparent)" },
  success: { fg: "var(--success-foreground)", bg: "var(--success-surface)", solid: "var(--success)", border: "color-mix(in srgb, var(--success) 35%, transparent)" },
  warning: { fg: "var(--warning-foreground)", bg: "var(--warning-surface)", solid: "var(--warning)", border: "color-mix(in srgb, var(--warning) 40%, transparent)" },
  danger: { fg: "var(--danger-foreground)", bg: "var(--danger-surface)", solid: "var(--danger)", border: "color-mix(in srgb, var(--danger) 40%, transparent)" },
  neutral: { fg: "var(--neutral-foreground)", bg: "var(--neutral-surface)", solid: "var(--neutral)", border: "var(--border)" },
  violet: { fg: "var(--violet)", bg: "color-mix(in srgb, var(--violet) 13%, var(--card))", solid: "var(--violet)", border: "color-mix(in srgb, var(--violet) 35%, transparent)" },
}

// ---------------------------------------------------------------------------
// Contexto da seção ativa (ícone e rótulo do cabeçalho de página)
// ---------------------------------------------------------------------------
export interface SectionInfo {
  key: string
  label: string
  group?: string
  role: string
}

export const SectionContext = createContext<SectionInfo>({ key: "", label: "", role: "" })

// ---------------------------------------------------------------------------
// Cabeçalho de página
// ---------------------------------------------------------------------------
export function PageTitle({
  title,
  subtitle,
  action,
  eyebrow,
  icon,
  meta,
}: {
  title: string
  subtitle: string
  action?: ReactNode
  eyebrow?: string
  icon?: string
  meta?: ReactNode
}) {
  const section = useContext(SectionContext)
  const context = eyebrow ?? [section.role, section.group].filter(Boolean).join(" · ")
  return (
    <div className="page-header relative mb-6 overflow-hidden rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        <span
          className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl sm:flex"
          style={{ background: "var(--role-soft)", color: "var(--role-strong)" }}
          aria-hidden="true"
        >
          <UiIcon name={icon ?? section.key} size={26} strokeWidth={1.7} />
        </span>
        <div className="min-w-0 flex-1">
          {context && <p className="ui-eyebrow mb-1">{context}</p>}
          <h1 className="text-[1.5rem] font-bold leading-tight tracking-tight md:text-[1.75rem]" style={{ color: "var(--foreground)" }}>
            {title}
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            {subtitle}
          </p>
        </div>
        {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
      </div>
      {meta && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 border-t px-5 py-3 sm:px-6" style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--secondary) 45%, var(--card))" }}>
          {meta}
        </div>
      )}
    </div>
  )
}

/** Item curto exibido na faixa inferior do cabeçalho de página. */
export function MetaItem({ icon, label, value, tone = "neutral" }: { icon: string; label: string; value: ReactNode; tone?: Tone }) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-xs">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: toneStyles[tone].bg, color: toneStyles[tone].fg }} aria-hidden="true">
        <UiIcon name={icon} size={15} />
      </span>
      <span style={{ color: "var(--muted-foreground)" }}>{label}</span>
      <strong className="font-semibold tabular-nums" style={{ color: "var(--foreground)" }}>{value}</strong>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Cabeçalho de destaque (telas iniciais de cada perfil)
// ---------------------------------------------------------------------------
export function HeroHeader({
  eyebrow,
  title,
  subtitle,
  aside,
  children,
}: {
  eyebrow: string
  title: string
  subtitle: string
  aside?: ReactNode
  children?: ReactNode
}) {
  return (
    <section className="hero-band relative mb-5 overflow-hidden rounded-2xl p-4 text-white sm:mb-6 sm:p-7">
      <div className="hero-band-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--hero-accent)" }}>{eyebrow}</p>
          <h1 className="mt-1.5 text-[1.65rem] font-bold leading-tight tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed" style={{ color: "rgba(230, 238, 246, 0.78)" }}>{subtitle}</p>
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
      {children && <div className="relative mt-4 sm:mt-6">{children}</div>}
    </section>
  )
}

/** Indicador compacto dentro do cabeçalho de destaque. */
export function HeroStat({ label, value, hint, alert = false }: { label: string; value: ReactNode; hint?: string; alert?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3" style={{ background: "rgba(255,255,255,0.06)", borderColor: alert ? "rgba(255,120,120,0.45)" : "rgba(255,255,255,0.1)" }}>
      <p className="line-clamp-2 text-xs font-medium leading-snug" style={{ color: "rgba(230, 238, 246, 0.78)" }}>{label}</p>
      <p className="mt-auto pt-1 text-[1.4rem] font-bold leading-tight tabular-nums sm:text-2xl" style={{ color: alert ? "#FF9C94" : "#FFFFFF" }}>{value}</p>
      {hint && <p className="mt-1 line-clamp-2 text-[11px] leading-snug" style={{ color: "rgba(230, 238, 246, 0.62)" }}>{hint}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Indicadores
// ---------------------------------------------------------------------------
export function StatCard({
  icon,
  label,
  value,
  detail,
  tone = "role",
  status,
  progress,
  onClick,
}: {
  icon: string
  label: string
  value: ReactNode
  detail?: string
  tone?: Tone
  status?: string
  progress?: number
  onClick?: () => void
}) {
  const t = toneStyles[tone]
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: t.bg, color: t.fg }} aria-hidden="true">
          <UiIcon name={icon} size={19} />
        </span>
        {status && (
          <span className="inline-flex max-w-[60%] items-center gap-1.5 truncate rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: t.bg, color: t.fg }}>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: t.solid }} />
            {status}
          </span>
        )}
      </div>
      <p className="mt-3 text-[1.75rem] font-bold leading-none tracking-tight tabular-nums" style={{ color: "var(--foreground)" }}>{value}</p>
      <p className="mt-1.5 text-[13px] font-semibold leading-snug" style={{ color: "var(--foreground)" }}>{label}</p>
      {detail && <p className="mt-0.5 text-xs" style={{ color: "var(--muted-foreground)" }}>{detail}</p>}
      {progress !== undefined && <ProgressBar value={progress} tone={tone} className="mt-3" label={label} />}
    </>
  )
  const className = "stat-card relative min-w-0 overflow-hidden rounded-2xl border p-4 text-left"
  const style = { background: "var(--card)", borderColor: "var(--border)", "--stat-accent": t.solid } as React.CSSProperties
  return onClick ? (
    <button type="button" onClick={onClick} className={className + " stat-card-interactive w-full"} style={style}>{body}</button>
  ) : (
    <div className={className} style={style}>{body}</div>
  )
}

export function ProgressBar({ value, tone = "role", className = "", label }: { value: number; tone?: Tone; className?: string; label?: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <div
      className={"h-1.5 w-full overflow-hidden rounded-full " + className}
      style={{ background: "var(--muted)" }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="h-full rounded-full" style={{ width: clamped + "%", background: toneStyles[tone].solid }} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Superfícies
// ---------------------------------------------------------------------------
export function SectionCard({
  title,
  description,
  icon,
  action,
  children,
  className = "",
  bodyClassName = "p-4 sm:p-5",
  tone = "role",
}: {
  title: string
  description?: string
  icon?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  tone?: Tone
}) {
  return (
    <section className={"section-card min-w-0 overflow-hidden rounded-2xl border " + className} style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <header className="flex items-center gap-3 border-b px-4 py-3.5 sm:px-5" style={{ borderColor: "var(--border)" }}>
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: toneStyles[tone].bg, color: toneStyles[tone].fg }} aria-hidden="true">
            <UiIcon name={icon} size={17} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-[15px] font-semibold leading-snug" style={{ color: "var(--foreground)" }}>{title}</h2>
          {description && <p className="break-words text-xs" style={{ color: "var(--muted-foreground)" }}>{description}</p>}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  )
}

export function StatusBadge({ tone, children, icon, size = "md" }: { tone: Tone; children: ReactNode; icon?: string; size?: "sm" | "md" }) {
  const t = toneStyles[tone]
  return (
    <span
      className={"inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border font-semibold " + (size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs")}
      style={{ background: t.bg, color: t.fg, borderColor: t.border }}
    >
      {icon ? <UiIcon name={icon} size={size === "sm" ? 12 : 13} strokeWidth={2.2} /> : <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.solid }} aria-hidden="true" />}
      {children}
    </span>
  )
}

export function EmptyState({ icon, title, description, action }: { icon: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center" style={{ borderColor: "var(--border-strong)" }}>
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "var(--role-soft)", color: "var(--role-strong)" }} aria-hidden="true">
        <UiIcon name={icon} size={22} />
      </span>
      <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function QuickAction({ icon, label, hint, onClick, variant = "card" }: { icon: string; label: string; hint?: string; onClick: () => void; variant?: "card" | "hero" }) {
  if (variant === "hero")
    return (
      <button type="button" onClick={onClick} className="hero-action flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-center text-xs font-semibold leading-tight sm:min-h-11 sm:flex-row sm:gap-2 sm:px-3.5 sm:text-sm">
        <UiIcon name={icon} size={17} />
        {label}
      </button>
    )
  return (
    <button type="button" onClick={onClick} className="quick-action flex min-h-14 w-full items-center gap-3 rounded-xl border p-3 text-left" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--role-soft)", color: "var(--role-strong)" }} aria-hidden="true">
        <UiIcon name={icon} size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block break-words text-sm font-semibold" style={{ color: "var(--foreground)" }}>{label}</span>
        {hint && <span className="block break-words text-xs" style={{ color: "var(--muted-foreground)" }}>{hint}</span>}
      </span>
      <span style={{ color: "var(--muted-foreground)" }} aria-hidden="true"><UiIcon name="chevronRight" size={16} /></span>
    </button>
  )
}

export function FormSection({ step, title, description, children, className = "" }: { step?: number; title: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <fieldset className={"form-section min-w-0 border-t pt-5 first:border-t-0 first:pt-0 " + className} style={{ borderColor: "var(--border)" }}>
      <legend className="sr-only">{title}</legend>
      <div className="mb-4 flex items-start gap-3">
        {step !== undefined && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: "var(--role-soft)", color: "var(--role-strong)" }} aria-hidden="true">{step}</span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{title}</p>
          {description && <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{description}</p>}
        </div>
      </div>
      {children}
    </fieldset>
  )
}

export function Avatar({ initials, size = "md", tone = "role", solid = false }: { initials: string; size?: "sm" | "md" | "lg"; tone?: Tone; solid?: boolean }) {
  const dims = size === "lg" ? "h-14 w-14 text-base" : size === "sm" ? "h-8 w-8 text-[11px]" : "h-10 w-10 text-xs"
  const t = toneStyles[tone]
  return (
    <span className={"flex shrink-0 items-center justify-center rounded-full font-bold " + dims} style={{ background: solid ? t.solid : t.bg, color: solid ? "#FFFFFF" : t.fg }} aria-hidden="true">
      {initials}
    </span>
  )
}

export function KeyValue({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>{label}</dt>
      <dd className={"mt-0.5 break-words text-sm font-medium " + (mono ? "font-mono" : "")} style={{ color: "var(--foreground)" }}>{value}</dd>
    </div>
  )
}

/** Tile de sinal vital em superfície clara (prontuários e listas). */
export function VitalTile({ icon, label, value, unit, alert = false }: { icon: string; label: string; value: ReactNode; unit: string; alert?: boolean }) {
  return (
    <div className="min-w-0 rounded-xl border px-3 py-2.5" style={{ background: alert ? "var(--danger-surface)" : "var(--background)", borderColor: alert ? toneStyles.danger.border : "var(--border)" }}>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: alert ? "var(--danger-foreground)" : "var(--muted-foreground)" }}>
        <UiIcon name={icon} size={13} strokeWidth={2} />
        <span className="truncate">{label}</span>
        {alert && <span className="sr-only">(fora do limite)</span>}
      </p>
      <p className="mt-1 truncate text-lg font-bold leading-none tabular-nums" style={{ color: alert ? "var(--danger-foreground)" : "var(--foreground)" }}>
        {value}
        <span className="ml-1 text-[11px] font-medium" style={{ color: "var(--muted-foreground)" }}>{unit}</span>
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Campos de formulário (definidos fora dos painéis para não perder o foco)
// ---------------------------------------------------------------------------
const fieldStyle = (error?: string) => ({
  background: "var(--card)",
  borderColor: error ? "var(--danger)" : "var(--border)",
  color: "var(--foreground)",
})

function FieldMessage({ id, error, hint, hintTone = "neutral" }: { id: string; error?: string; hint?: string; hintTone?: "neutral" | "success" }) {
  if (error)
    return (
      <span id={id} className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--danger-foreground)" }}>
        <UiIcon name="alert" size={13} strokeWidth={2} /> {error}
      </span>
    )
  if (hint)
    return (
      <span id={id} className="flex items-center gap-1 text-xs" style={{ color: hintTone === "success" ? "var(--success-foreground)" : "var(--muted-foreground)" }}>
        {hintTone === "success" && <UiIcon name="check" size={13} strokeWidth={2.2} />} {hint}
      </span>
    )
  return null
}

function FieldLabel({ htmlFor, label, required }: { htmlFor: string; label: string; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
      {label}
      {required && <span aria-hidden="true" style={{ color: "var(--danger-foreground)" }}> *</span>}
    </label>
  )
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
  error,
  hint,
  hintTone,
  type = "text",
  inputMode,
  autoComplete,
  className = "",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  error?: string
  hint?: string
  hintTone?: "neutral" | "success"
  type?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
  autoComplete?: string
  className?: string
}) {
  const id = useId()
  const messageId = id + "-msg"
  return (
    <div className={"flex min-w-0 flex-col gap-1.5 " + className}>
      <FieldLabel htmlFor={id} label={label} required={required} />
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        className="h-11 rounded-lg border px-3 text-sm outline-none"
        style={fieldStyle(error)}
      />
      <FieldMessage id={messageId} error={error} hint={hint} hintTone={hintTone} />
    </div>
  )
}

export function SelectField({
  label,
  value,
  onChange,
  required,
  hint,
  children,
  className = "",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  hint?: string
  children: ReactNode
  className?: string
}) {
  const id = useId()
  return (
    <div className={"flex min-w-0 flex-col gap-1.5 " + className}>
      <FieldLabel htmlFor={id} label={label} required={required} />
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} required={required} aria-describedby={hint ? id + "-msg" : undefined} className="h-11 rounded-lg border px-3 text-sm outline-none" style={fieldStyle()}>
        {children}
      </select>
      <FieldMessage id={id + "-msg"} hint={hint} />
    </div>
  )
}

/** Mensagem de retorno (sucesso, erro ou aviso) junto à ação. */
export function InlineNotice({ tone, children, icon }: { tone: Tone; children: ReactNode; icon?: string }) {
  const t = toneStyles[tone]
  return (
    <p role={tone === "danger" ? "alert" : "status"} className="inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-xs font-semibold" style={{ background: t.bg, color: t.fg, borderColor: t.border }}>
      <UiIcon name={icon ?? (tone === "success" ? "checkCircle" : tone === "danger" ? "alert" : "info")} size={15} />
      {children}
    </p>
  )
}

/** Expande listas resumidas; por padrão só aparece no celular (`mobileOnly`). */
/** Limite efetivo: só resume a lista quando sobrariam ao menos 2 itens escondidos. */
export const summaryLimit = (total: number, limit: number) => (total - limit >= 2 ? limit : total)

export function ShowMoreButton({ expanded, onToggle, hiddenCount, controls, label = ["item", "itens"], mobileOnly = true }: { expanded: boolean; onToggle: () => void; hiddenCount: number; controls?: string; label?: [string, string]; mobileOnly?: boolean }) {
  if (hiddenCount <= 0) return null
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-controls={controls}
      className={"mt-2 flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold " + (mobileOnly ? "sm:hidden" : "")}
      style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--primary)" }}
    >
      {expanded ? "Mostrar menos" : `Mostrar mais ${hiddenCount} ${hiddenCount === 1 ? label[0] : label[1]}`}
      <span style={{ transform: expanded ? "rotate(180deg)" : "none", display: "flex" }}><UiIcon name="chevronDown" size={14} /></span>
    </button>
  )
}

/** Item de linha do tempo vertical. */
export function TimelineItem({ tone = "role", title, meta, children, last = false }: { tone?: Tone; title: ReactNode; meta?: ReactNode; children?: ReactNode; last?: boolean }) {
  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!last && <span className="absolute left-[7px] top-5 bottom-0 w-px" style={{ background: "var(--border)" }} aria-hidden="true" />}
      <span className="relative mt-1 h-[15px] w-[15px] shrink-0 rounded-full border-[3px]" style={{ borderColor: toneStyles[tone].solid, background: "var(--card)" }} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <div className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{title}</div>
          {meta && <div className="text-xs tabular-nums" style={{ color: "var(--muted-foreground)" }}>{meta}</div>}
        </div>
        {children && <div className="mt-1 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{children}</div>}
      </div>
    </li>
  )
}

/** Filtros segmentados (botões de alternância com aria-pressed). */
export function SegmentedControl<T extends string>({ value, onChange, options, label }: { value: T; onChange: (value: T) => void; options: { value: T; label: string; count?: number }[]; label: string }) {
  return (
    <div className="flex max-w-full flex-wrap gap-1 rounded-xl border p-1" style={{ background: "var(--secondary)", borderColor: "var(--border)" }} role="group" aria-label={label}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className="segmented-option flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-semibold"
            style={{ background: active ? "var(--card)" : "transparent", color: active ? "var(--foreground)" : "var(--muted-foreground)", boxShadow: active ? "var(--shadow-xs)" : "none" }}
          >
            {option.label}
            {option.count !== undefined && (
              <span className="rounded-full px-1.5 text-[11px] tabular-nums" style={{ background: active ? "var(--role-soft)" : "var(--card)", color: active ? "var(--role-strong)" : "var(--muted-foreground)" }}>{option.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Relógio compartilhado do cabeçalho
// ---------------------------------------------------------------------------
function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000)
    return () => window.clearInterval(timer)
  }, [])
  return now
}

export function shiftLabel(date = new Date()) {
  const hour = date.getHours()
  return hour >= 7 && hour < 19 ? "Plantão diurno · 07h–19h" : "Plantão noturno · 19h–07h"
}

// ---------------------------------------------------------------------------
// Cabeçalho desktop dos painéis
// ---------------------------------------------------------------------------
export function DashboardHeader({
  role,
  section,
  name,
  detail,
  initials,
  theme,
  onToggleTheme,
  alertCount,
  onOpenAlerts,
}: {
  role: string
  section: string
  name: string
  detail: string
  initials: string
  theme: Theme
  onToggleTheme: () => void
  alertCount?: number
  onOpenAlerts?: () => void
}) {
  const now = useClock()
  const date = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).format(now)
  const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(now)
  const isDay = now.getHours() >= 7 && now.getHours() < 19

  return (
    <header
      className="sticky top-0 z-20 hidden h-16 items-center justify-between gap-4 border-b px-6 xl:flex"
      style={{
        background: "color-mix(in srgb, var(--card) 88%, transparent)",
        borderColor: "var(--border)",
        backdropFilter: "saturate(1.4) blur(10px)",
        WebkitBackdropFilter: "saturate(1.4) blur(10px)",
      }}
    >
      <nav aria-label="Localização" className="min-w-0">
        <ol className="flex min-w-0 items-center gap-2 text-sm">
          <li className="flex shrink-0 items-center gap-2 font-medium" style={{ color: "var(--muted-foreground)" }}>
            <span className="h-2 w-2 rounded-full" style={{ background: "var(--role)" }} aria-hidden="true" />
            {role}
          </li>
          <li aria-hidden="true" style={{ color: "var(--border-strong)" }}>
            <UiIcon name="chevronRight" size={14} />
          </li>
          <li className="truncate font-semibold" style={{ color: "var(--foreground)" }} aria-current="page">{section}</li>
        </ol>
      </nav>

      <div className="flex shrink-0 items-center gap-2">
        <div
          className="mr-1 hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs 2xl:flex"
          style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
          title={shiftLabel(now)}
        >
          <UiIcon name={isDay ? "sun" : "moon"} size={14} />
          <span className="capitalize">{date}</span>
          <span aria-hidden="true">·</span>
          <time className="font-semibold tabular-nums" style={{ color: "var(--foreground)" }}>{time}</time>
        </div>
        {onOpenAlerts && (
          <button
            type="button"
            onClick={onOpenAlerts}
            aria-label={alertCount ? `Abrir alertas (${alertCount} pendentes)` : "Abrir alertas"}
            title="Alertas"
            className="ui-icon-button relative flex h-10 w-10 items-center justify-center rounded-xl border"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--control-foreground)" }}
          >
            <UiIcon name="alertas" size={19} />
            {!!alertCount && (
              <span
                className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold text-white"
                style={{ background: "var(--badge-danger)", boxShadow: "0 0 0 2px var(--card)" }}
              >
                {alertCount > 99 ? "99+" : alertCount}
              </span>
            )}
          </button>
        )}
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <div className="ml-1 flex items-center gap-3 border-l pl-3" style={{ borderColor: "var(--border)" }}>
          <div className="min-w-0 max-w-[220px] text-right">
            <div className="truncate text-sm font-semibold leading-tight" style={{ color: "var(--foreground)" }}>{name}</div>
            <div className="truncate text-xs" style={{ color: "var(--muted-foreground)" }}>{detail}</div>
          </div>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg, var(--role), #0D1B2A)" }}
            aria-hidden="true"
          >
            {initials}
          </div>
        </div>
      </div>
    </header>
  )
}
