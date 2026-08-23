"use client"

import { useState } from "react"
import { VoiceOrbView } from "@/components/voice-orb-view"
import { ChatView } from "@/components/chat-view"

export function UnifiedLuciView({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const [subMode, setSubMode] = useState<"voice" | "chat">("voice")

  return (
    <div className="flex h-full flex-col bg-[#F8FAFC] animate-view-in select-none">
      {/* ─── Visualização Ativa: Orbe de Voz ou Chat ─── */}
      <div className="flex-1 overflow-hidden">
        {subMode === "voice" ? (
          <VoiceOrbView onSwitchToChat={() => setSubMode("chat")} />
        ) : (
          <ChatView onSwitchToVoice={() => setSubMode("voice")} />
        )}
      </div>
    </div>
  )
}
