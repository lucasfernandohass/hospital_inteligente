import { useEffect, useRef, useState } from "react"
import type { Dispatch, SetStateAction } from "react"

export default function useLocalStorageState<T>(
  key: string,
  initialValue: T | (() => T),
): [T, Dispatch<SetStateAction<T>>] {
  const initialValueRef = useRef(initialValue)
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = typeof window === "undefined" ? null : window.localStorage.getItem(key)
      if (saved !== null) return JSON.parse(saved) as T
    } catch {
      // Se o armazenamento não estiver disponível, inicia com os dados demonstrativos.
    }
    return typeof initialValue === "function"
      ? (initialValue as () => T)()
      : initialValue
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // O estado em memória continua disponível nesta sessão.
    }
  }, [key, value])

  useEffect(() => {
    const syncFromAnotherTab = (event: StorageEvent) => {
      if (event.key !== key && event.key !== null) return
      try {
        if (event.newValue === null) {
          const fallback = initialValueRef.current
          setValue(typeof fallback === "function" ? (fallback as () => T)() : fallback)
        } else {
          setValue(JSON.parse(event.newValue) as T)
        }
      } catch {
        // Uma alteração inválida em outra aba não interrompe a tela atual.
      }
    }
    window.addEventListener("storage", syncFromAnotherTab)
    return () => window.removeEventListener("storage", syncFromAnotherTab)
  }, [key])

  return [value, setValue]
}
