"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Plus, Mic, Keyboard, Loader2, Sparkles, ArrowUpRight, ImageIcon, FileText, Zap, Menu } from "lucide-react"
import { luciApiFetch } from "@/lib/api"
import { useConversation } from "@/hooks/use-conversation"
import { voiceInputManager } from "@/lib/voice-input-manager"
import { getOrbState, type OrbState } from "@/lib/orb-state"

// ─── AudioPlayerQueue (reprodução sequencial de chunks TTS) ───
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

// ─── Atalhos de exemplo (cards) ───
const SHORTCUT_CARDS = [
  {
    id: "resumo",
    title: "Resumo do meu dia",
    description: "Veja compromissos, previsão do tempo e notícias importantes personalizadas.",
    icon: Sparkles,
    command: "Me dê um resumo do meu dia: compromissos, clima e notícias importantes.",
    large: true,
  },
  {
    id: "imagem",
    title: "Gerar Imagem com IA",
    description: "Descreva e crie",
    icon: ImageIcon,
    command: "Quero gerar uma imagem com IA. Me ajude a descrever.",
    large: false,
  },
  {
    id: "automacao",
    title: "Automação Rápida",
    description: "Controle inteligente",
    icon: Zap,
    command: "Quais automações de casa inteligente eu posso configurar?",
    large: false,
  },
]

export function VoiceOrbView({
  onSwitchToChat,
  onOpenMenu,
}: {
  onSwitchToChat?: () => void
  onOpenMenu?: () => void
}) {
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [response, setResponse] = useState("")
  const [statusText, setStatusText] = useState("Diga 'Ei, Luci' ou toque no microfone")

  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<any>(null)
  const capturedTextRef = useRef<string>("")
  const audioQueueRef = useRef<AudioPlayerQueue | null>(null)
  const isProcessingRef = useRef<boolean>(false)
  const isUserActiveSessionRef = useRef<boolean>(false)
  const isListeningRef = useRef<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }

  const { sendVoiceMessage, uploadFile } = useConversation()

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

    voiceInputManager.stopSpeechRecognition()
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
      setStatusText(result.reply ? "Luci respondeu" : "Diga 'Ei, Luci' ou toque no microfone")

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

  // Inicia o STT compartilhado via voiceInputManager
  const startListeningSession = useCallback(() => {
    if (isProcessingRef.current) return

    voiceInputManager.startSpeechRecognition(
      (currentSpeech: string, isFinal: boolean) => {
        if (!currentSpeech) return

        // Regex flexível para variações fonéticas comuns de "Luci" no STT Mobile
        const wakeWordRegex = /\b(ei\s+luci|oi\s+luci|ol[aá]\s+luci|hey\s+luci|ok\s+luci|e\s+a[ií]\s+luci|luci|lucy|luzia|luzi|lusi|luz)\b/i
        const hasWakeWord = wakeWordRegex.test(currentSpeech)

        if (hasWakeWord && !isUserActiveSessionRef.current) {
          audioQueueRef.current?.initAudioContext()
          isUserActiveSessionRef.current = true
          setListening(true)
          setStatusText("Ouvindo você...")

          const commandAfterWake = currentSpeech.replace(wakeWordRegex, "").trim()
          capturedTextRef.current = commandAfterWake
          setTranscript(commandAfterWake)
        } else if (isUserActiveSessionRef.current) {
          // Se já está em sessão ativa (seja por wake word ou por clique no mic)
          const cleanText = currentSpeech.replace(wakeWordRegex, "").trim()
          capturedTextRef.current = cleanText || currentSpeech.trim()
          setTranscript(capturedTextRef.current)
        }

        // Se está em sessão de escuta ativa e possui texto
        if (isUserActiveSessionRef.current && capturedTextRef.current.length >= 2) {
          clearSilenceTimer()
          if (isFinal) {
            sendVoiceQuery(capturedTextRef.current)
          } else {
            // Voice Activity / Silence Timeout resiliente (1.2s após última palavra falada)
            silenceTimerRef.current = setTimeout(() => {
              if (capturedTextRef.current.length >= 2 && !isProcessingRef.current) {
                sendVoiceQuery(capturedTextRef.current)
              }
            }, 1200)
          }
        }
      },
      () => {
        isListeningRef.current = false
        clearSilenceTimer()

        // Se o microfone encerrou (onend do browser) e havia texto capturado pendente, processa imediatamente
        if (isUserActiveSessionRef.current && capturedTextRef.current.trim().length >= 2 && !isProcessingRef.current) {
          sendVoiceQuery(capturedTextRef.current.trim())
          return
        }

        // Se a sessão do usuário foi cancelada ou terminou, não reinicia imediatamente para evitar flood
        if (!isUserActiveSessionRef.current) {
          setListening(false)
        }
      },
      false
    )
  }, [sendVoiceQuery])

  // ─── Inicialização do Reconhecimento de Voz & Wake Word Compartilhada ───
  useEffect(() => {
    voiceInputManager.init().catch(() => {})
    voiceInputManager.setActiveContext("orb")

    audioQueueRef.current = new AudioPlayerQueue((isSpeaking) => {
      setSpeaking(isSpeaking)
      if (isSpeaking) {
        setStatusText("Luci está falando...")
        voiceInputManager.stopSpeechRecognition()
      } else {
        setStatusText("Diga 'Ei, Luci' ou toque no microfone")
      }
    })

    const unsubscribeWakeWord = voiceInputManager.registerWakeWordHandler("orb", () => {
      console.log("[VoiceOrb] Wake Word acionada na tela do Orb.")
      if (!isUserActiveSessionRef.current && !speaking && !loading) {
        audioQueueRef.current?.initAudioContext()
        isUserActiveSessionRef.current = true
        setListening(true)
        setStatusText("Ouvindo você...")
        startListeningSession()
      }
    })

    return () => {
      clearSilenceTimer()
      unsubscribeWakeWord()
      voiceInputManager.stopSpeechRecognition()
      if (audioQueueRef.current) {
        audioQueueRef.current.stopAndClear()
      }
    }
  }, [startListeningSession, speaking, loading])

  // ─── Botão Central Único: Iniciar Escuta ou Cancelar ───
  const handleCentralMicClick = () => {
    audioQueueRef.current?.initAudioContext()
    clearSilenceTimer()

    if (speaking) {
      audioQueueRef.current?.stopAndClear()
      setSpeaking(false)
      setStatusText("Diga 'Ei, Luci' ou toque no microfone")
      return
    }

    if (listening || isUserActiveSessionRef.current) {
      isUserActiveSessionRef.current = false
      setListening(false)
      capturedTextRef.current = ""
      setTranscript("")
      setStatusText("Cancelado. Diga 'Ei, Luci' ou toque no microfone")
      voiceInputManager.stopSpeechRecognition()
    } else {
      isUserActiveSessionRef.current = true
      setListening(true)
      setTranscript("")
      setResponse("")
      capturedTextRef.current = ""
      setStatusText("Ouvindo você...")
      startListeningSession()
    }
  }

  // ─── Envio de Atalho (Cards) ───
  const handleShortcutClick = (command: string) => {
    setTranscript(command)
    sendVoiceQuery(command)
  }

  // ─── Upload de Documentos ───
  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setStatusText(`Enviando ${file.name}...`)
      setLoading(true)
      try {
        const reply = await uploadFile(file, "Analise o arquivo anexo.")
        setResponse(reply)
        setStatusText(reply ? "Luci analisou o arquivo" : "Diga 'Ei, Luci' ou toque no microfone")
      } catch (err) {
        setStatusText("Erro ao enviar arquivo.")
      } finally {
        setLoading(false)
      }
    }
    e.target.value = ""
  }

  // Determinar estado visual do Orb pela Máquina de Estados Oficial (State Machine)
  const orbState: OrbState = getOrbState(loading, speaking, listening)

  return (
    <div className="flex h-full flex-col bg-background animate-view-in select-none">
      {/* ─── Header Principal ─── */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 z-10">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Abrir Menu de Módulos"
          className="size-10 flex items-center justify-center rounded-full bg-card border border-border shadow-sm text-foreground hover:bg-secondary active:scale-95 transition-all"
        >
          <Menu className="size-5" />
        </button>

        <h1 className="text-base font-extrabold tracking-wider text-foreground">LUCI</h1>

        <div className="size-10" />
      </div>

      {/* ─── Scrollable Content ─── */}
      <div className="flex-1 flex flex-col items-center overflow-y-auto no-scrollbar px-6 pb-4">

        {/* ─── Orb Central Premium ─── */}
        <div className="relative flex items-center justify-center py-8 mt-2">
          {/* Anel externo animado (listening / speaking) */}
          {(orbState === "listening" || orbState === "speaking") && (
            <>
              <span
                className="absolute size-52 rounded-full border-2 border-primary/40 animate-orb-listening-ring"
                aria-hidden="true"
              />
              <span
                className="absolute size-52 rounded-full border border-primary/30 animate-orb-listening-ring"
                style={{ animationDelay: "0.4s" }}
                aria-hidden="true"
              />
            </>
          )}

          {/* Orbe Core */}
          <div
            className={`relative size-44 rounded-full ${
              orbState === "idle" ? "animate-orb-idle" :
              orbState === "listening" ? "animate-orb-idle" :
              orbState === "processing" ? "" :
              "animate-orb-speaking"
            }`}
          >
            {/* Gradiente rotativo externo */}
            <div
              className={`absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#023D8A,#409775,#023D8A)] opacity-90 blur-[1px] ${
                orbState === "processing" ? "animate-orb-processing" : "animate-orb-rotate"
              }`}
              style={{ animationDuration: orbState === "processing" ? "0.8s" : "14s" }}
            />
            {/* Gradiente radial interno */}
            <div className="absolute inset-3 rounded-full bg-[radial-gradient(circle_at_35%_35%,#409775,#023D8A_60%,#023D8A)]" />
            {/* Glow shadow */}
            <div className="absolute inset-0 rounded-full shadow-[0_0_60px_-5px_rgba(2,61,138,0.5)]" />

            {/* Conteúdo interno do Orb */}
            <div className="absolute inset-0 flex items-center justify-center">
              {orbState === "processing" ? (
                <Loader2 className="size-10 text-white/90 animate-spin" />
              ) : (
                /* Equalizer bars */
                <div className="flex items-center justify-center gap-1.5">
                  {[0.5, 0.9, 0.4, 1, 0.65, 0.85, 0.45].map((h, idx) => (
                    <span
                      key={idx}
                      className="w-1.5 rounded-full bg-white/90 transition-all"
                      style={{
                        height: `${(orbState === "listening" || orbState === "speaking" ? h : 0.25) * 44}px`,
                        animation: (orbState === "listening" || orbState === "speaking") ? `eq-bar ${0.6 + idx * 0.1}s ease-in-out infinite` : "none",
                        animationDelay: `${idx * 0.08}s`,
                        transformOrigin: "center",
                      }}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Greeting / Status ─── */}
        <div className="text-center mb-5">
          {!response && !transcript && !loading && (
            <>
              <h2 className="text-xl font-extrabold text-foreground mb-0.5">Olá, eu sou a Luci</h2>
              <p className="text-sm text-muted-foreground">Sua assistente digital inteligente</p>
            </>
          )}
          <p className={`text-sm font-semibold mt-2 ${
            orbState === "listening" ? "text-primary" :
            orbState === "processing" ? "text-amber-600" :
            orbState === "speaking" ? "text-accent" :
            "text-muted-foreground"
          }`}>
            {statusText}
          </p>
        </div>

        {/* ─── Transcrição / Resposta ─── */}
        {(transcript || response || loading) && (
          <div className="w-full max-w-sm text-center mb-5 px-2">
            {transcript && !loading && (
              <p className="text-xs text-muted-foreground italic mb-1.5">"{transcript}"</p>
            )}
            {response && (
              <div className="bg-card rounded-2xl border border-border shadow-sm px-4 py-3">
                <p className="text-sm font-medium text-foreground leading-relaxed whitespace-pre-wrap">{response}</p>
              </div>
            )}
          </div>
        )}

        {/* ─── Cards de Atalho (apenas no idle, sem resposta) ─── */}
        {orbState === "idle" && !response && (
          <div className="w-full space-y-3 mt-auto mb-2">
            {/* Card grande */}
            {SHORTCUT_CARDS.filter(c => c.large).map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => handleShortcutClick(card.command)}
                className="w-full text-left p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-all active:scale-[0.98] group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-foreground mb-1">{card.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{card.description}</p>
                  </div>
                  <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 ml-3 group-hover:bg-primary/20 transition-colors">
                    <ArrowUpRight className="size-4.5" />
                  </div>
                </div>
              </button>
            ))}

            {/* 2 Cards menores */}
            <div className="grid grid-cols-2 gap-3">
              {SHORTCUT_CARDS.filter(c => !c.large).map((card) => {
                const Icon = card.icon
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => handleShortcutClick(card.command)}
                    className="text-left p-4 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-all active:scale-[0.98] group"
                  >
                    <div className="size-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground mb-3 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Icon className="size-4.5" />
                    </div>
                    <h3 className="text-xs font-bold text-foreground mb-0.5">{card.title}</h3>
                    <p className="text-[10px] text-muted-foreground">{card.description}</p>
                    <div className="flex justify-end mt-2">
                      <ArrowUpRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── Botões Inferiores (3 botões) ─── */}
      <div className="flex items-center justify-center gap-6 px-6 pb-5 pt-2 bg-background">
        {/* + Upload Documento */}
        <button
          type="button"
          onClick={handleFileUpload}
          aria-label="Enviar documento"
          className="flex size-12 items-center justify-center rounded-full bg-card border border-border shadow-sm text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/10 active:scale-95 transition-all"
        >
          <Plus className="size-5 stroke-[2.5]" />
        </button>

        {/* Mic Central (Botão Grande) */}
        <button
          type="button"
          onClick={handleCentralMicClick}
          aria-label={listening ? "Cancelar microfone" : "Ativar microfone"}
          className={`relative flex size-16 items-center justify-center rounded-full transition-all active:scale-95 shadow-xl ${
            listening
              ? "bg-destructive text-destructive-foreground shadow-destructive/30 ring-4 ring-destructive/30"
              : speaking
                ? "bg-accent text-accent-foreground shadow-accent/30"
                : "bg-primary text-primary-foreground shadow-[0_8px_30px_-6px_rgba(2,61,138,0.5)] hover:scale-105"
          }`}
        >
          {listening && (
            <span className="absolute inset-0 animate-ping rounded-full bg-destructive/30" aria-hidden="true" />
          )}
          <Mic className="relative size-7" aria-hidden="true" />
        </button>

        {/* Teclado → Chat */}
        <button
          type="button"
          onClick={onSwitchToChat}
          aria-label="Abrir chat por texto"
          className="flex size-12 items-center justify-center rounded-full bg-white border border-zinc-200 shadow-sm text-zinc-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 active:scale-95 transition-all"
        >
          <Keyboard className="size-5" />
        </button>
      </div>

      {/* Input file oculto para upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.txt,.csv,.xlsx,.xls,.doc,.docx"
        className="hidden"
        onChange={handleFileSelected}
      />
    </div>
  )
}
