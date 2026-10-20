import { useEffect, useState } from "react"
import LoginPage from "./components/LoginPage"
import DoutorDashboard from "./components/DoutorDashboard"
import EnfermeiraDashboard from "./components/EnfermeiraDashboard"
import RecepcionistaDashboard from "./components/RecepcionistaDashboard"
import type { Theme } from "./components/ThemeToggle"

export type Screen = "login" | "doutor" | "enfermeira" | "recepcionista"

export default function App() {
  const [screen, setScreen] = useState<Screen>("login")
  const [theme, setTheme] = useState<Theme>(() =>
    localStorage.getItem("inteliHosp-theme") === "dark" ? "dark" : "light",
  )
  const [animKey, setAnimKey] = useState(0)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem("inteliHosp-theme", theme)
  }, [theme])

  const navigate = (next: Screen) => {
    setScreen(next)
    setAnimKey((k) => k + 1)
  }

  const toggleTheme = () =>
    setTheme((current) => (current === "light" ? "dark" : "light"))

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div key={animKey} className="screen-enter">
        {screen === "login" && (
          <LoginPage
            onNavigate={navigate}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )}
        {screen === "doutor" && (
          <DoutorDashboard
            onNavigate={navigate}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )}
        {screen === "enfermeira" && (
          <EnfermeiraDashboard
            onNavigate={navigate}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )}
        {screen === "recepcionista" && (
          <RecepcionistaDashboard
            onNavigate={navigate}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )}
      </div>
    </div>
  )
}
