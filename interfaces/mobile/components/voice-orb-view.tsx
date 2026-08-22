"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Mic, Sparkles, Volume2, Loader2 } from "lucide-react"
import { luciApiFetch } from "@/lib/api"
import { useConversation } from "@/hooks/use-conversation"

class AudioPlayerQueue {
  private audioContext: AudioContext | null = null
  private queue: { index: number; buffer: ArrayBuffer }[] = []
  private nextExpectedIndex: number = 0
  private isPlaying: boolean = false
  private currentSourceNode: AudioBufferSourceNode | null = null
  private onStateChange?: (speaking: boolean) => void

  constructor(onStateChange?: (speaking: boolean) => void) {
    this.onStateChange = onStateChange
  }

  public initAudioContext(): AudioContext {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      this.audioContext = new AudioCtx()
    }
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume()
    }
    return this.audioContext
  }

  public enqueueIndexed(index: number, buffer: ArrayBuffer): void {
    this.queue.push({ index, buffer })
    this.queue.sort((a, b) => a.index - b.index)

    if (!this.isPlaying) {
      this.playNext()
    }
  }

  public stopAndClear(): void {
    this.queue = []
    this.nextExpectedIndex = 0
    if (this.currentSourceNode) {
      try {
        this.currentSourceNode.stop()
        this.currentSourceNode.disconnect()
      } catch {}
      this.currentSourceNode = null
    }
    this.isPlaying = false
    if (this.onStateChange) this.onStateChange(false)
  }

  private async playNext(): Promise<void> {
    if (this.queue.length === 0 || this.queue[0].index !== this.nextExpectedIndex) {
      if (this.queue.length === 0) {
        this.isPlaying = false
        if (this.onStateChange) this.onStateChange(false)
      }
      return
    }

    this.isPlaying = true
    if (this.onStateChange) this.onStateChange(true)

    const item = this.queue.shift()!
    this.nextExpectedIndex++

    const ctx = this.initAudioContext()

    try {
      const audioBuffer = await ctx.decodeAudioData(item.buffer.slice(0))
      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(ctx.destination)

      this.currentSourceNode = source

      source.onended = () => {
        this.currentSourceNode = null
        this.playNext()
      }

      source.start()
    } catch (err) {
      console.error("[AudioPlayerQueue] Audio decode error:", err)
      this.playNext()
    }
  }
}

function cleanTextForSpeech(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/http[s]?:\/\/\S+/gi, "")
    .replace(/[*_#`~>]/g, "")
    .replace(/L\.U\.C\.I\./gi, "Lucy")
    .replace(/L\.U\.C\.I/gi, "Lucy")
    .replace(/\bLuci\b/gi, "Lucy")
    .replace(/\s+/g, " ")
    .trim()
}

export function VoiceOrbView() {
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [response, setResponse] = useState("")
  const [statusText, setStatusText] = useState("Diga 'Luci' ou toque no microfone")

  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<any>(null)
  const capturedTextRef = useRef<string>("")
  const audioQueueRef = useRef<AudioPlayerQueue | null>(null)
  const isProcessingRef = useRef<boolean>(false)
  const isUserActiveSessionRef = useRef<boolean>(false)
  const isListeningRef = useRef<boolean>(false)

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }

  const { sendVoiceMessage } = useConversation()

  // ─── Síntese e Enfileiramento de Voz TTS ───
  const synthesizeAndEnqueueSentence = useCallback(async (sentence: string, index: number) => {
    const cleanSentence = cleanTextForSpeech(sentence)
    if (cleanSentence.length < 2) return

    try {
      const res = await luciApiFetch("/api/v1/chat/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleanSentence,
          voice: "pt-BR-ThalitaNeural",
        }),
      })

      if (res.ok) {
        const buffer = await res.arrayBuffer()
        audioQueueRef.current?.enqueueIndexed(index, buffer)
      }
    } catch (err) {
      console.error("[VoiceOrb] Erro TTS:", err)
    }
  }, [])

  // ─── Enviar Mensagem para o Cérebro Unificado ───
  const sendVoiceQuery = useCallback(async (text: string) => {
    if (!text.trim() || isProcessingRef.current) return
    isProcessingRef.current = true
    isUserActiveSessionRef.current = false
    clearSilenceTimer()

    try {
      recognitionRef.current?.stop()
    } catch {}
    setListening(false)
    isListeningRef.current = false

    setLoading(true)
    setStatusText("Luci está pensando...")
    setResponse("")
    audioQueueRef.current?.stopAndClear()

    try {
      const result = await sendVoiceMessage(text)
      setResponse(result.reply)
      setLoading(false)
      setStatusText(result.reply ? "Luci respondeu" : "Diga 'Luci' ou toque no microfone")

      if (result.audioBase64) {
        const binaryString = atob(result.audioBase64)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        audioQueueRef.current?.enqueueIndexed(0, bytes.buffer)
      } else if (result.reply) {
        synthesizeAndEnqueueSentence(result.reply, 0)
      }
    } catch (err) {
      console.error("[VoiceOrb] Erro no processamento de voz:", err)
      setStatusText("Erro na resposta. Tente novamente.")
    } finally {
      isProcessingRef.current = false
      setLoading(false)
    }
  }, [sendVoiceMessage, synthesizeAndEnqueueSentence])

  // ─── Inicialização do Reconhecimento de Voz & Wake Word Contínua ───
  useEffect(() => {
    audioQueueRef.current = new AudioPlayerQueue((isSpeaking) => {
      setSpeaking(isSpeaking)
      if (isSpeaking) {
        setStatusText("Luci está falando...")
        try {
          recognitionRef.current?.stop()
        } catch {}
      } else {
        setStatusText("Diga 'Luci' ou toque no microfone")
        // Reinicia a escuta contínua de wake word / resposta
        setTimeout(() => {
          try {
            recognitionRef.current?.start()
          } catch {}
        }, 400)
      }
    })

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRec) {
      const rec = new SpeechRec()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = "pt-BR"

      rec.onstart = () => {
        isListeningRef.current = true
        setListening(isUserActiveSessionRef.current)
      }

      rec.onresult = (event: any) => {
        let interimTranscript = ""
        let finalTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i]
          if (item.isFinal) {
            finalTranscript += item[0].transcript
          } else {
            interimTranscript += item[0].transcript
          }
        }

        const currentSpeech = (finalTranscript || interimTranscript).trim()
        if (!currentSpeech) return

        // 1. Detecção de Wake Word "Luci" / "Lucy" / "Ok Luci" / "Ei Luci"
        const wakeWordRegex = /\b(luci|lucy|luzi|lusi|ok luci|ei luci|hey luci)\b/i
        const hasWakeWord = wakeWordRegex.test(currentSpeech)

        if (hasWakeWord && !isUserActiveSessionRef.current) {
          // Ativação por Wake Word!
          audioQueueRef.current?.initAudioContext()
          isUserActiveSessionRef.current = true
          setListening(true)
          setStatusText("Ouvindo você...")
          
          // Remove a palavra de ativação e captura o comando que veio junto
          const commandAfterWake = currentSpeech.replace(wakeWordRegex, "").trim()
          capturedTextRef.current = commandAfterWake
          setTranscript(commandAfterWake)
        } else if (isUserActiveSessionRef.current) {
          // Já está em sessão ativa (ou por toque no botão ou por wake word)
          capturedTextRef.current = currentSpeech.replace(wakeWordRegex, "").trim()
          setTranscript(capturedTextRef.current)
        }

        // 2. Detecção de Silêncio e Envio Rápido
        if (isUserActiveSessionRef.current && capturedTextRef.current.length >= 2) {
          clearSilenceTimer()

          // Se a frase foi marcada como final pela API ou após 800ms de silêncio
          if (finalTranscript.trim()) {
            const queryToSend = capturedTextRef.current
            sendVoiceQuery(queryToSend)
          } else {
            silenceTimerRef.current = setTimeout(() => {
              const queryToSend = capturedTextRef.current
              if (queryToSend.length >= 2) {
                sendVoiceQuery(queryToSend)
              }
            }, 800)
          }
        }
      }

      rec.onerror = (event: any) => {
        if (event.error !== "no-speech") {
          console.warn("[VoiceOrb] Speech error:", event.error)
        }
      }

      rec.onend = () => {
        isListeningRef.current = false
        // Se não estiver falando nem processando, reinicia automaticamente para manter a escuta contínua de wake word
        if (!isProcessingRef.current && audioQueueRef.current && !speaking) {
          setTimeout(() => {
            try {
              rec.start()
            } catch {}
          }, 300)
        }
      }

      recognitionRef.current = rec

      try {
        rec.start()
      } catch {}
    }

    return () => {
      clearSilenceTimer()
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {}
      }
      if (audioQueueRef.current) {
        audioQueueRef.current.stopAndClear()
      }
    }
  }, [sendVoiceQuery, speaking])

  // ─── Botão Central Único: Iniciar Escuta ou Cancelar ───
  const handleCentralMicClick = () => {
    audioQueueRef.current?.initAudioContext()
    clearSilenceTimer()

    if (speaking) {
      // Se a Luci estiver falando, o clique interrompe a fala
      audioQueueRef.current?.stopAndClear()
      setSpeaking(false)
      setStatusText("Diga 'Luci' ou toque no microfone")
      return
    }

    if (listening || isUserActiveSessionRef.current) {
      // Cancelamento: usuário clicou enquanto estava ouvindo para cancelar sem processar
      isUserActiveSessionRef.current = false
      setListening(false)
      capturedTextRef.current = ""
      setTranscript("")
      setStatusText("Cancelado. Diga 'Luci' ou toque no microfone")
      try {
        recognitionRef.current?.stop()
      } catch {}
    } else {
      // Ativação manual do microfone
      isUserActiveSessionRef.current = true
      setListening(true)
      setTranscript("")
      setResponse("")
      capturedTextRef.current = ""
      setStatusText("Ouvindo você...")
      try {
        recognitionRef.current?.start()
      } catch {}
    }
  }

  const [appMode, setAppMode] = useState<"assistant" | "interpreter">("assistant")

  return (
    <div className="flex h-full flex-col items-center justify-between px-6 pb-6 pt-2 animate-view-in bg-background select-none">
      {/* ─── Mode Switcher Header ─── */}
      <div className="flex w-full items-center justify-center gap-2 pt-2">
        <div className="flex rounded-full bg-card/80 p-1 border border-border shadow-sm">
          <button
            type="button"
            onClick={() => setAppMode("assistant")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              appMode === "assistant"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="size-3.5" />
            Assistente
          </button>

          <button
            type="button"
            onClick={() => setAppMode("interpreter")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              appMode === "interpreter"
                ? "bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white shadow-[0_0_15px_rgba(0,242,254,0.4)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Volume2 className="size-3.5" />
            Intérprete Universal
          </button>
        </div>
      </div>

      {/* Orbe Central Interativo */}
      <div className="relative flex flex-1 items-center justify-center">
        <div className="relative flex items-center justify-center">
          {/* Anéis pulsantes */}
          <span
            className={`absolute size-56 rounded-full bg-primary/20 transition-all duration-700 ${
              listening || speaking ? "scale-125 opacity-70 animate-ping" : "scale-90 opacity-20"
            }`}
            aria-hidden="true"
          />
          <span
            className={`absolute size-56 rounded-full bg-primary/15 transition-all duration-1000 ${
              speaking ? "scale-150 opacity-50" : "scale-100 opacity-10"
            }`}
            aria-hidden="true"
          />
          {/* Orbe Core */}
          <div className="relative size-52 animate-orb-pulse">
            <div className="absolute inset-0 animate-orb-rotate rounded-full bg-[conic-gradient(from_0deg,var(--chart-4),var(--primary),var(--chart-2),var(--chart-3),var(--chart-4))] opacity-90 blur-[1px]" />
            <div className="absolute inset-3 rounded-full bg-[radial-gradient(circle_at_30%_30%,var(--chart-3),var(--primary)_55%,var(--chart-4))]" />
            <div className="absolute inset-0 rounded-full shadow-[0_0_60px_-5px_var(--primary)]" />
            {/* Equalizador de barras */}
            <div className="absolute inset-0 flex items-center justify-center gap-1.5">
              {[0.5, 0.9, 0.4, 1, 0.65, 0.85, 0.45].map((h, idx) => (
                <span
                  key={idx}
                  className="w-1.5 rounded-full bg-primary-foreground/90 transition-all"
                  style={{
                    height: `${(listening || speaking ? h : 0.25) * 48}px`,
                    animation: (listening || speaking) ? `eq-bar ${0.7 + idx * 0.12}s ease-in-out infinite` : "none",
                    animationDelay: `${idx * 0.09}s`,
                    transformOrigin: "center",
                  }}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status da Luci */}
      <p className="text-sm font-medium text-primary text-center px-4">
        {statusText}
      </p>

      {/* Transcrição ou Resposta */}
      <div className="mt-4 min-h-16 max-w-xs text-balance text-center text-base font-semibold leading-relaxed text-foreground px-2 overflow-y-auto max-h-32">
        {loading && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span>Processando resposta...</span>
          </div>
        )}
        {transcript && !loading && <p className="text-xs text-muted-foreground mb-1">"{transcript}"</p>}
        {response && <p className="text-sm font-medium text-foreground">{response}</p>}
      </div>

      {/* ─── Botão Central Único de Microfone (Ativar / Cancelar) ─── */}
      <div className="mt-4 flex w-full items-center justify-center pb-2">
        <button
          type="button"
          onClick={handleCentralMicClick}
          aria-label={listening ? "Cancelar microfone" : "Ativar microfone"}
          className={`relative flex size-18 items-center justify-center rounded-full transition-all active:scale-95 shadow-xl ${
            listening
              ? "bg-rose-500 text-white shadow-rose-500/40 ring-4 ring-rose-500/30"
              : "bg-primary text-primary-foreground shadow-[0_10px_40px_-8px_var(--primary)] hover:scale-105"
          }`}
        >
          {listening && (
            <span className="absolute inset-0 animate-ping rounded-full bg-rose-500/40" aria-hidden="true" />
          )}
          <Mic className="relative size-8" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
