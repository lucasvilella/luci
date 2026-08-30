"use client"

import React, { useEffect, useRef, useState } from "react"
import { Mic, Sparkles } from "lucide-react"
import { useAppNavigationStore } from "@/stores/useAppNavigationStore"
import { useConversation } from "@/hooks/use-conversation"
import { voiceInputManager } from "@/lib/voice-input-manager"

export function PushToTalkOverlay() {
  const { isPushToTalkActive } = useAppNavigationStore()
  const { sendVoiceMessage, sendAudioBlob } = useConversation()
  const [liveTranscript, setLiveTranscript] = useState("")
  const [volumeLevel, setVolumeLevel] = useState(0)
  const transcriptRef = useRef("")

  useEffect(() => {
    let active = true

    if (isPushToTalkActive) {
      setLiveTranscript("")
      transcriptRef.current = ""
      setVolumeLevel(0)

      // 1. Inicia gravação universal de microfone com monitor de volume em tempo real
      voiceInputManager.startRecording((vol) => {
        if (active) setVolumeLevel(vol)
      })

      // 2. Inicia prévia rápida STT onde suportado
      voiceInputManager.startSpeechRecognition(
        (text) => {
          if (active) {
            transcriptRef.current = text
            setLiveTranscript(text)
          }
        },
        () => {},
        true
      )
    } else {
      // Ao soltar o botão:
      voiceInputManager.stopSpeechRecognition()
      const previewText = transcriptRef.current.trim()

      voiceInputManager.stopRecording().then((audioBlob) => {
        if (previewText) {
          // Se obteve texto pelo reconhecimento nativo
          sendVoiceMessage(previewText)
        } else if (audioBlob && audioBlob.size > 300) {
          // Fallback universal: envia áudio gravado direto para o Whisper STT no backend
          sendAudioBlob(audioBlob)
        }
      })

      setLiveTranscript("")
      transcriptRef.current = ""
      setVolumeLevel(0)
    }

    return () => {
      active = false
    }
  }, [isPushToTalkActive, sendVoiceMessage, sendAudioBlob])

  if (!isPushToTalkActive) return null

  // Ajusta altura das barras conforme o volume capturado
  const h1 = Math.max(4, Math.min(24, 6 + volumeLevel * 20))
  const h2 = Math.max(6, Math.min(28, 8 + volumeLevel * 30))
  const h3 = Math.max(8, Math.min(32, 10 + volumeLevel * 40))
  const h4 = Math.max(6, Math.min(28, 8 + volumeLevel * 30))
  const h5 = Math.max(4, Math.min(24, 6 + volumeLevel * 20))

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-end pb-32 animate-fade-in pointer-events-none select-none">
      {/* Backdrop sutil */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />

      {/* Card Flutuante de Escuta Ativa */}
      <div
        className="relative z-10 flex flex-col items-center gap-3 px-6 py-4 rounded-3xl shadow-2xl border animate-slide-up max-w-[90vw]"
        style={{
          backgroundColor: "var(--bg-deck)",
          borderColor: "var(--border-subtle)",
          boxShadow: "0 20px 40px rgba(117, 39, 195, 0.35)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex size-11 items-center justify-center rounded-full bg-[var(--accent-primary)] text-white shadow-lg transition-transform shrink-0"
            style={{
              transform: `scale(${1 + volumeLevel * 0.3})`,
              boxShadow: `0 0 ${12 + volumeLevel * 20}px rgba(117, 39, 195, ${0.5 + volumeLevel * 0.5})`,
            }}
          >
            <Mic className="size-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#22c55e] animate-ping" />
              <h4 className="text-xs font-bold text-[var(--text-primary)]">
                {liveTranscript ? "Ouvindo..." : "Gravando sua voz..."}
              </h4>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 max-w-[220px] truncate">
              {liveTranscript || "Solte o botão para enviar"}
            </p>
          </div>
        </div>

        {/* Ondas Sonoras Reativas ao Volume Real do Microfone */}
        <div className="flex items-center gap-1.5 h-8">
          <span
            className="w-1.5 bg-[var(--accent-primary)] rounded-full transition-all duration-75"
            style={{ height: `${h1}px` }}
          />
          <span
            className="w-1.5 bg-[var(--accent-primary)] rounded-full transition-all duration-75"
            style={{ height: `${h2}px` }}
          />
          <span
            className="w-1.5 bg-[#a855f7] rounded-full transition-all duration-75"
            style={{ height: `${h3}px` }}
          />
          <span
            className="w-1.5 bg-[var(--accent-primary)] rounded-full transition-all duration-75"
            style={{ height: `${h4}px` }}
          />
          <span
            className="w-1.5 bg-[var(--accent-primary)] rounded-full transition-all duration-75"
            style={{ height: `${h5}px` }}
          />
        </div>
      </div>
    </div>
  )
}
