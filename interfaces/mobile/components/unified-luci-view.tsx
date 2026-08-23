"use client"

import { useState } from "react"
import { VoiceOrbView } from "@/components/voice-orb-view"
import { ChatView } from "@/components/chat-view"
import { MessageSquare, Mic, Menu } from "lucide-react"

export function UnifiedLuciView({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const [subMode, setSubMode] = useState<"voice" | "chat">("voice")

  return (
    <div className="flex h-full flex-col bg-background animate-view-in select-none">
      {/* ─── Header Minimalista com Botão de 3 Tracinhos e Toggle de Modo ─── */}
      <header className="flex items-center justify-between px-6 pt-5 pb-3 bg-background border-b border-border/40">
        <button
          type="button"
          onClick={onOpenMenu}
          className="size-11 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800/90 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_4px_rgba(0,0,0,0.06)] border border-zinc-200/80 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-200 active:scale-95 transition-all"
          aria-label="Menu"
        >
          <Menu className="size-5 stroke-[2.2]" />
        </button>

        {/* Alternador de Voz / Chat interno do módulo Luci */}
        <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60">
          <button
            type="button"
            onClick={() => setSubMode("voice")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subMode === "voice"
                ? "bg-white dark:bg-zinc-900 text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mic className="size-3.5" /> Voz
          </button>
          <button
            type="button"
            onClick={() => setSubMode("chat")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subMode === "chat"
                ? "bg-white dark:bg-zinc-900 text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="size-3.5" /> Chat
          </button>
        </div>
      </header>

      {/* ─── Visualização Ativa: Orbe de Voz ou Chat ─── */}
      <div className="flex-1 overflow-hidden">
        {subMode === "voice" ? <VoiceOrbView /> : <ChatView />}
      </div>
    </div>
  )
}
