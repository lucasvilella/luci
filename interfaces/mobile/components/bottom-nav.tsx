"use client"

import { Mic, MessageCircle, Music, House } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type TabId = "voice" | "chat" | "music" | "home"

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "voice", label: "Voz", icon: Mic },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "music", label: "Música", icon: Music },
  { id: "home", label: "Casa", icon: House },
]

export function BottomNav({
  active,
  onChange,
}: {
  active: TabId | undefined
  onChange: (id: TabId) => void
}) {
  return (
    <nav
      aria-label="Navegação principal"
      className="flex items-center justify-around border-t border-border bg-card/80 px-2 py-2 backdrop-blur-xl"
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-current={isActive ? "page" : undefined}
            className="flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 transition-colors"
          >
            <span
              className={`flex size-10 items-center justify-center rounded-full transition-all ${
                isActive ? "bg-primary text-primary-foreground shadow-[0_6px_20px_-6px_var(--primary)]" : "text-muted-foreground"
              }`}
            >
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span className={`text-[11px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
