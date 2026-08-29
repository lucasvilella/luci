"use client"

import React from "react"
import { Home, Compass, Sparkles, Bell, User } from "lucide-react"

export type FloatingDeckTab = "home" | "explore" | "luci" | "notifications" | "library"

interface FloatingDeckProps {
  activeTab: FloatingDeckTab
  onTabChange: (tab: FloatingDeckTab) => void
  unreadCount?: number
}

export function FloatingDeck({ activeTab, onTabChange, unreadCount = 0 }: FloatingDeckProps) {
  return (
    <nav
      aria-label="Deck Principal de Navegação"
      className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4"
    >
      <div
        className="pointer-events-auto relative flex h-16 w-full max-w-[420px] items-center justify-between rounded-full px-3 shadow-2xl transition-all duration-300 backdrop-blur-2xl"
        style={{
          backgroundColor: "var(--bg-deck)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-deck)",
        }}
      >
        {/* 1. Início (Home) */}
        <button
          type="button"
          onClick={() => onTabChange("home")}
          aria-label="Início"
          className="relative flex flex-1 flex-col items-center justify-center py-2 transition-transform active:scale-90"
        >
          <div
            className={`flex size-10 items-center justify-center rounded-full transition-all duration-200 ${
              activeTab === "home"
                ? "bg-[var(--accent-surface)] text-[var(--accent-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Home className="size-5" />
          </div>
          <span
            className={`text-[10px] font-medium tracking-tight transition-colors ${
              activeTab === "home" ? "font-bold text-[var(--text-primary)]" : "text-[var(--text-muted)]"
            }`}
          >
            Início
          </span>
        </button>

        {/* 2. Buscar / Explorar */}
        <button
          type="button"
          onClick={() => onTabChange("explore")}
          aria-label="Buscar"
          className="relative flex flex-1 flex-col items-center justify-center py-2 transition-transform active:scale-90"
        >
          <div
            className={`flex size-10 items-center justify-center rounded-full transition-all duration-200 ${
              activeTab === "explore"
                ? "bg-[var(--accent-surface)] text-[var(--accent-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Compass className="size-5" />
          </div>
          <span
            className={`text-[10px] font-medium tracking-tight transition-colors ${
              activeTab === "explore" ? "font-bold text-[var(--text-primary)]" : "text-[var(--text-muted)]"
            }`}
          >
            Buscar
          </span>
        </button>

        {/* 3. Orb Luci (Botão Central em Destaque) */}
        <div className="relative flex flex-1 justify-center">
          <button
            type="button"
            onClick={() => onTabChange("luci")}
            aria-label="Chamar Luci"
            className="group relative -top-3 flex size-[54px] items-center justify-center rounded-full p-[2px] transition-transform duration-200 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #5c62ec 0%, #7c82ff 50%, #ffccf2 100%)",
              boxShadow: "0 8px 24px rgba(92, 98, 236, 0.4)",
            }}
          >
            <div
              className="flex size-full items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105"
              style={{ backgroundColor: "var(--bg-surface-1)" }}
            >
              <Sparkles className="size-6 text-[#7c82ff] transition-transform duration-300 group-hover:rotate-12" />
            </div>
            {activeTab === "luci" && (
              <span className="absolute -bottom-1 size-1.5 rounded-full bg-[var(--accent-primary)] shadow-sm" />
            )}
          </button>
        </div>

        {/* 4. Alertas / Notificações */}
        <button
          type="button"
          onClick={() => onTabChange("notifications")}
          aria-label="Alertas"
          className="relative flex flex-1 flex-col items-center justify-center py-2 transition-transform active:scale-90"
        >
          <div
            className={`relative flex size-10 items-center justify-center rounded-full transition-all duration-200 ${
              activeTab === "notifications"
                ? "bg-[var(--accent-surface)] text-[var(--accent-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex size-2 items-center justify-center rounded-full bg-[var(--accent-primary)] ring-2 ring-[var(--bg-deck)]" />
            )}
          </div>
          <span
            className={`text-[10px] font-medium tracking-tight transition-colors ${
              activeTab === "notifications" ? "font-bold text-[var(--text-primary)]" : "text-[var(--text-muted)]"
            }`}
          >
            Alertas
          </span>
        </button>

        {/* 5. Conta / Biblioteca */}
        <button
          type="button"
          onClick={() => onTabChange("library")}
          aria-label="Biblioteca e Conta"
          className="relative flex flex-1 flex-col items-center justify-center py-2 transition-transform active:scale-90"
        >
          <div
            className={`flex size-10 items-center justify-center rounded-full transition-all duration-200 ${
              activeTab === "library"
                ? "bg-[var(--accent-surface)] text-[var(--accent-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <User className="size-5" />
          </div>
          <span
            className={`text-[10px] font-medium tracking-tight transition-colors ${
              activeTab === "library" ? "font-bold text-[var(--text-primary)]" : "text-[var(--text-muted)]"
            }`}
          >
            Biblioteca
          </span>
        </button>
      </div>
    </nav>
  )
}
