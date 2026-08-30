"use client"

import { useCallback, useEffect, useState } from "react"

type Theme = "light" | "dark"

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("luci-theme") as Theme | null
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const initial = saved || (prefersDark ? "dark" : "light")

    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(initial)
    root.setAttribute("data-theme", initial)
    document.body.setAttribute("data-theme", initial)

    setThemeState(initial)
    setMounted(true)
  }, [])

  const setTheme = useCallback((next: Theme) => {
    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(next)
    root.setAttribute("data-theme", next)
    document.body.setAttribute("data-theme", next)

    try {
      localStorage.setItem("luci-theme", next)
    } catch {}
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark")
  }, [theme, setTheme])

  return { theme, setTheme, toggleTheme, mounted }
}
