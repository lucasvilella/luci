import React from "react"
import { Music, Film, Sparkles, House, User } from "lucide-react"

export type FloatingDeckTab = "music" | "films" | "luci" | "home-assistant" | "profile"

interface FloatingDeckProps {
  activeTab: FloatingDeckTab
  onTabChange: (tab: FloatingDeckTab) => void
  unreadCount?: number
}

export function FloatingDeck({ activeTab, onTabChange, unreadCount = 0 }: FloatingDeckProps) {
  return (
    <nav
      aria-label="Deck Principal de Módulos"
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
        {/* 1. Módulo Música */}
        <button
          type="button"
          onClick={() => onTabChange("music")}
          aria-label="Música"
          className="relative flex flex-1 flex-col items-center justify-center py-2 transition-transform active:scale-90"
        >
          <div
            className={`flex size-10 items-center justify-center rounded-full transition-all duration-200 ${
              activeTab === "music"
                ? "bg-[var(--accent-surface)] text-[var(--accent-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Music className="size-5" />
          </div>
          <span
            className={`text-[10px] font-medium tracking-tight transition-colors ${
              activeTab === "music" ? "font-bold text-[var(--text-primary)]" : "text-[var(--text-muted)]"
            }`}
          >
            Música
          </span>
        </button>

        {/* 2. Módulo Filmes & Séries */}
        <button
          type="button"
          onClick={() => onTabChange("films")}
          aria-label="Filmes"
          className="relative flex flex-1 flex-col items-center justify-center py-2 transition-transform active:scale-90"
        >
          <div
            className={`flex size-10 items-center justify-center rounded-full transition-all duration-200 ${
              activeTab === "films"
                ? "bg-[var(--accent-surface)] text-[var(--accent-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Film className="size-5" />
          </div>
          <span
            className={`text-[10px] font-medium tracking-tight transition-colors ${
              activeTab === "films" ? "font-bold text-[var(--text-primary)]" : "text-[var(--text-muted)]"
            }`}
          >
            Cinema
          </span>
        </button>

        {/* 3. Orb Luci (Módulo Central de IA) */}
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

        {/* 4. Módulo Home Assistant */}
        <button
          type="button"
          onClick={() => onTabChange("home-assistant")}
          aria-label="Casa Inteligente"
          className="relative flex flex-1 flex-col items-center justify-center py-2 transition-transform active:scale-90"
        >
          <div
            className={`relative flex size-10 items-center justify-center rounded-full transition-all duration-200 ${
              activeTab === "home-assistant"
                ? "bg-[var(--accent-surface)] text-[var(--accent-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <House className="size-5" />
          </div>
          <span
            className={`text-[10px] font-medium tracking-tight transition-colors ${
              activeTab === "home-assistant" ? "font-bold text-[var(--text-primary)]" : "text-[var(--text-muted)]"
            }`}
          >
            Casa
          </span>
        </button>

        {/* 5. Módulo Perfil / Configurações */}
        <button
          type="button"
          onClick={() => onTabChange("profile")}
          aria-label="Perfil e Configurações"
          className="relative flex flex-1 flex-col items-center justify-center py-2 transition-transform active:scale-90"
        >
          <div
            className={`flex size-10 items-center justify-center rounded-full transition-all duration-200 ${
              activeTab === "profile"
                ? "bg-[var(--accent-surface)] text-[var(--accent-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <User className="size-5" />
          </div>
          <span
            className={`text-[10px] font-medium tracking-tight transition-colors ${
              activeTab === "profile" ? "font-bold text-[var(--text-primary)]" : "text-[var(--text-muted)]"
            }`}
          >
            Perfil
          </span>
        </button>
      </div>
    </nav>
  )
}
