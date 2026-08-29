"use client"

import React from "react"
import { Mic, Sparkles, X } from "lucide-react"
import { useAppNavigationStore } from "@/stores/useAppNavigationStore"

export function PushToTalkOverlay() {
  const { isPushToTalkActive, setPushToTalkActive } = useAppNavigationStore()

  if (!isPushToTalkActive) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-end pb-32 animate-fade-in pointer-events-none select-none">
      {/* Backdrop sutil */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />

      {/* Card Flutuante de Escuta Ativa */}
      <div
        className="relative z-10 flex flex-col items-center gap-3 px-6 py-4 rounded-3xl shadow-2xl border animate-slide-up"
        style={{
          backgroundColor: "var(--bg-deck)",
          borderColor: "var(--border-subtle)",
          boxShadow: "0 20px 40px rgba(92, 98, 236, 0.3)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-[var(--accent-primary)] text-white shadow-md shadow-[#5c62ec]/40 animate-pulse">
            <Mic className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-[var(--accent-primary)] animate-ping" />
              <h4 className="text-xs font-bold text-[var(--text-primary)]">
                Ouvindo comando rápido...
              </h4>
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
              Solte o botão para executar no local
            </p>
          </div>
        </div>

        {/* Ondas Sonoras Simuladas */}
        <div className="flex items-center gap-1 h-4">
          <span className="w-1 bg-[var(--accent-primary)] rounded-full h-2 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1 bg-[var(--accent-primary)] rounded-full h-4 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1 bg-[var(--accent-primary)] rounded-full h-3 animate-bounce" style={{ animationDelay: "300ms" }} />
          <span className="w-1 bg-[var(--accent-primary)] rounded-full h-5 animate-bounce" style={{ animationDelay: "75ms" }} />
          <span className="w-1 bg-[var(--accent-primary)] rounded-full h-2 animate-bounce" style={{ animationDelay: "220ms" }} />
        </div>
      </div>
    </div>
  )
}
