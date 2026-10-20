export type Theme = "light" | "dark"

interface Props {
  theme: Theme
  onToggle: () => void
  floating?: boolean
}

export default function ThemeToggle({ theme, onToggle, floating = false }: Props) {
  const nextTheme = theme === "light" ? "dark" : "light"

  return (
    <button
      type="button"
      aria-label={`Ativar tema ${nextTheme === "dark" ? "escuro" : "claro"}`}
      title={`Ativar tema ${nextTheme === "dark" ? "escuro" : "claro"}`}
      onClick={onToggle}
      className={`flex shrink-0 items-center justify-center border transition-colors ${floating ? "h-14 w-14 rounded-2xl shadow-lg" : "h-10 w-10 rounded-xl"}`}
      style={{
        background: "var(--card)",
        borderColor: "var(--border)",
        color: "var(--control-foreground)",
      }}
    >
      {theme === "light" ? (
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M20.2 15.2A8.5 8.5 0 0 1 8.8 3.8 8.5 8.5 0 1 0 20.2 15.2Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="4"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  )
}
