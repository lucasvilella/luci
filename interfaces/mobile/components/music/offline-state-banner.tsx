"use client"

import { useState, useEffect } from "react"
import { WifiOff } from "lucide-react"

export function OfflineStateBanner() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    // Detecção inicial
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOffline(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="w-full bg-[var(--accent-purple)]/90 text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 backdrop-blur-md sticky top-0 z-50 shadow-md animate-fade-in">
      <WifiOff className="size-4 animate-pulse" />
      <span>Modo offline ativo. Exibindo músicas salvas no dispositivo.</span>
    </div>
  )
}
