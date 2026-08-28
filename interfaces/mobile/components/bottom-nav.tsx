"use client"

import { Film, Music, Mic, Cpu, Settings } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type GlobalModuleId = "films" | "music" | "luci" | "home-assistant" | "settings"

const GLOBAL_TABS: { id: GlobalModuleId; label: string; icon: LucideIcon; isOrb?: boolean }[] = [
  { id: "films", label: "Filmes", icon: Film },
  { id: "music", label: "Música", icon: Music },
  { id: "luci", label: "Orb", icon: Mic, isOrb: true },
  { id: "home-assistant", label: "Smart", icon: Cpu },
  { id: "settings", label: "Config", icon: Settings },
]

export function BottomNav({
  active,
  onChange,
}: {
  active: GlobalModuleId
  onChange: (id: GlobalModuleId) => void
}) {
  return (
    <nav
      aria-label="Navegação Global Luci"
      className="flex items-center justify-around bg-[var(--bg-surface-glass)] border-t border-[var(--border)] px-3 py-2 backdrop-blur-2xl z-40"
    >
      {GLOBAL_TABS.map(({ id, label, icon: Icon, isOrb }) => {
        const isActive = active === id

        if (isOrb) {
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-label="Abrir Assistente Luci"
              className="flex flex-col items-center -mt-6 group active:scale-95 transition-transform"
            >
              <div className="size-13 rounded-full bg-gradient-to-tr from-[#0033ff] via-[#977dff] to-[#ffccf2] p-[2px] shadow-lg shadow-[#0033ff]/50">
                <div className="size-full rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                  <Icon className="size-6 text-[var(--accent-pink)] animate-pulse" />
                </div>
              </div>
              <span className="text-[10.5px] font-bold text-[var(--accent-pink)] mt-1">
                {label}
              </span>
            </button>
          )
        }

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-current={isActive ? "page" : undefined}
            className="flex flex-1 flex-col items-center gap-1 rounded-xl py-1 transition-all active:scale-95"
          >
            <span
              className={`flex size-9 items-center justify-center rounded-full transition-all ${
                isActive
                  ? "bg-[var(--accent-blue)] text-white shadow-md shadow-[#0033ff]/40"
                  : "text-[var(--text-secondary)]/70 hover:text-[var(--text-secondary)]"
              }`}
            >
              <Icon className="size-4.5" aria-hidden="true" />
            </span>
            <span
              className={`text-[10.5px] font-bold transition-colors ${
                isActive ? "text-white" : "text-[var(--text-muted)]"
              }`}
            >
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
