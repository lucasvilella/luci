"use client"

import { useCallback, useEffect, useState } from "react"

type Theme = "light" | "dark"

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const current = document.documentElement.classList.contains("dark") ? "dark" : "light"
    setThemeState(current)
    setMounted(true)
  }, [])

  const setTheme = useCallback((next: Theme) => {
    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(next)
    try {
      localStorage.setItem("nova-theme", next)
    } catch {}
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark")
  }, [theme, setTheme])

  return { theme, setTheme, toggleTheme, mounted }
}
