"use client"

import React, { useState, useEffect } from "react"
import { Search, Bell, Sun, Moon } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"
import { useAppNavigationStore } from "@/stores/useAppNavigationStore"
import { useMusicNavigation } from "@/hooks/use-music-navigation"

interface AppHeaderProps {
  user?: {
    name: string
    greeting?: string
    avatarUrl?: string
  }
  userName?: string
  avatarUrl?: string
  greeting?: string
  notificationCount?: number
  onSearchClick: () => void
  onNotificationClick?: () => void
}

export function AppHeader({
  user,
  userName = "Lucas",
  avatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  greeting,
  notificationCount = 3,
  onSearchClick,
  onNotificationClick,
}: AppHeaderProps) {
  const { setActiveTab } = useAppNavigationStore()
  const { goToNotifications } = useMusicNavigation()
  const { theme, toggleTheme, mounted } = useTheme()

  // Saudação calculada dinamicamente pelo horário local do dispositivo
  const [currentGreeting, setCurrentGreeting] = useState("Bom dia")

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
      setCurrentGreeting("Bom dia")
    } else if (hour >= 12 && hour < 18) {
      setCurrentGreeting("Boa tarde")
    } else {
      setCurrentGreeting("Boa noite")
    }
  }, [])

  const displayName = user?.name || userName
  const displayGreeting = user?.greeting || greeting || currentGreeting
  const displayAvatar = user?.avatarUrl || avatarUrl

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-5 pt-4 pb-3 bg-[var(--bg-app)]/90 backdrop-blur-xl select-none">
      {/* Lado Esquerdo: Avatar + Saudação + Nome */}
      <div className="flex items-center gap-3">
        <div className="relative size-12 rounded-full overflow-hidden bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] shadow-sm">
          <img
            src={displayAvatar}
            alt={displayName}
            className="size-full object-cover"
          />
        </div>

        <div>
          <span className="text-xs font-normal text-[var(--text-secondary)] flex items-center gap-1">
            {displayGreeting} 👋
          </span>
          <h1 className="text-base font-extrabold text-[var(--text-primary)] leading-tight tracking-tight">
            {displayName}
          </h1>
        </div>
      </div>

      {/* Lado Direito: Seletor Provisório de Tema + Busca + Notificação */}
      <div className="flex items-center gap-2">
        {/* Seletor Universal de Tema (Dark / Light) Provisório */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
          aria-label="Alternar tema"
          className="size-9 rounded-full bg-[var(--bg-surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-center transition-transform active:scale-90"
        >
          {mounted && theme === "dark" ? (
            <Sun className="size-4.5 text-amber-400" />
          ) : (
            <Moon className="size-4.5 text-indigo-600" />
          )}
        </button>

        {/* Botão de Busca */}
        <button
          type="button"
          onClick={onSearchClick}
          aria-label="Buscar"
          className="size-9 rounded-full bg-[var(--bg-surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-center transition-transform active:scale-90"
        >
          <Search className="size-4.5 stroke-[2]" />
        </button>

        {/* Botão de Notificações com Badge */}
        <button
          type="button"
          onClick={onNotificationClick || goToNotifications}
          aria-label={`Notificações: ${notificationCount} novas`}
          className="relative size-10 rounded-full bg-[var(--bg-surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-center transition-transform active:scale-90 shadow-sm hover:border-[var(--accent-primary)]/40"
        >
          <Bell className="size-5 stroke-[1.8]" />
          {notificationCount > 0 && (
            <span className="absolute top-2 right-2 size-2 rounded-full bg-[var(--accent-primary)] ring-2 ring-[var(--bg-app)] animate-pulse" />
          )}
        </button>
      </div>
    </header>
  )
}
