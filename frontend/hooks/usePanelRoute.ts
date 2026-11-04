import { useCallback, useEffect, useState } from "react"

export type PanelSection = "administrador" | "medico" | "enfermagem" | "recepcao"

export function pathForPanel(section: PanelSection, page: string) {
  return `/painel/${section}/${page}`
}

export function usePanelRoute<T extends string>(section: PanelSection, pages: readonly T[], fallback: T) {
  const readPage = useCallback((): T => {
    const parts = window.location.pathname.split("/").filter(Boolean)
    const routePage = parts[0] === "painel" && parts[1] === section ? parts[2] : undefined
    return pages.includes(routePage as T) ? routePage as T : fallback
  }, [fallback, pages, section])

  const [page, setPage] = useState<T>(readPage)
  const selectPage = useCallback((next: T) => {
    if (!pages.includes(next)) return
    const nextPath = pathForPanel(section, next)
    if (window.location.pathname !== nextPath) window.history.pushState({}, "", nextPath)
    setPage(next)
  }, [pages, section])

  useEffect(() => {
    if (window.location.pathname !== pathForPanel(section, page)) {
      window.history.replaceState({}, "", pathForPanel(section, page))
    }
    const syncPage = () => {
      const parts = window.location.pathname.split("/").filter(Boolean)
      if (parts[0] === "painel" && parts[1] === section) setPage(readPage())
    }
    window.addEventListener("popstate", syncPage)
    return () => window.removeEventListener("popstate", syncPage)
  }, [page, readPage, section])

  return [page, selectPage] as const
}
