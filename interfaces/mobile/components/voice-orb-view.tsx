"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Plus, Mic, Keyboard, Loader2, Sparkles, ArrowUpRight, ImageIcon, FileText, Zap } from "lucide-react"
import { luciApiFetch } from "@/lib/api"
import { useConversation } from "@/hooks/use-conversation"

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

export function VoiceOrbView({ onSwitchToChat }: { onSwitchToChat?: () => void }) {
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
        setStatusText("Diga 'Ei, Luci' ou toque no microfone")
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
      setStatusText("Diga 'Ei, Luci' ou toque no microfone")
      return
    }

    if (listening || isUserActiveSessionRef.current) {
      // Cancelamento: usuário clicou enquanto estava ouvindo para cancelar sem processar
      isUserActiveSessionRef.current = false
      setListening(false)
      capturedTextRef.current = ""
      setTranscript("")
      setStatusText("Cancelado. Diga 'Ei, Luci' ou toque no microfone")
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

  // ─── Envio de Atalho (Cards) ───
  const handleShortcutClick = (command: string) => {
    setTranscript(command)
    sendVoiceQuery(command)
  }

  // ─── Upload de Documentos ───
  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setStatusText(`Arquivo selecionado: ${file.name}`)
      // TODO: Enviar ao backend quando endpoint estiver pronto
      sendVoiceQuery(`Analise o arquivo "${file.name}" que estou enviando.`)
    }
    e.target.value = ""
  }

  // Determinar estado visual do Orb
  const orbState = loading ? "processing" : speaking ? "speaking" : listening ? "listening" : "idle"

  return (
    <div className="flex h-full flex-col bg-[#F8FAFC] animate-view-in select-none">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-center px-6 pt-6 pb-2">
        <h1 className="text-lg font-extrabold tracking-tight text-zinc-900">LUCI</h1>
      </div>

      {/* ─── Scrollable Content ─── */}
      <div className="flex-1 flex flex-col items-center overflow-y-auto no-scrollbar px-6 pb-4">

        {/* ─── Orb Central Premium ─── */}
        <div className="relative flex items-center justify-center py-8 mt-2">
          {/* Anel externo animado (listening / speaking) */}
          {(orbState === "listening" || orbState === "speaking") && (
            <>
              <span
                className="absolute size-52 rounded-full border-2 border-indigo-400/40 animate-orb-listening-ring"
                aria-hidden="true"
              />
              <span
                className="absolute size-52 rounded-full border border-violet-400/30 animate-orb-listening-ring"
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
              className={`absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#6366F1,#8B5CF6,#06B6D4,#A78BFA,#6366F1)] opacity-90 blur-[1px] ${
                orbState === "processing" ? "animate-orb-processing" : "animate-orb-rotate"
              }`}
              style={{ animationDuration: orbState === "processing" ? "0.8s" : "14s" }}
            />
            {/* Gradiente radial interno */}
            <div className="absolute inset-3 rounded-full bg-[radial-gradient(circle_at_35%_35%,#C4B5FD,#6366F1_55%,#4F46E5)]" />
            {/* Glow shadow */}
            <div className="absolute inset-0 rounded-full shadow-[0_0_60px_-5px_rgba(99,102,241,0.5)]" />

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
              <h2 className="text-xl font-extrabold text-zinc-900 mb-0.5">Olá, eu sou a Luci</h2>
              <p className="text-sm text-zinc-500">Sua assistente digital inteligente</p>
            </>
          )}
          <p className={`text-sm font-semibold mt-2 ${
            orbState === "listening" ? "text-indigo-600" :
            orbState === "processing" ? "text-amber-600" :
            orbState === "speaking" ? "text-emerald-600" :
            "text-zinc-500"
          }`}>
            {statusText}
          </p>
        </div>

        {/* ─── Transcrição / Resposta ─── */}
        {(transcript || response || loading) && (
          <div className="w-full max-w-sm text-center mb-5 px-2">
            {transcript && !loading && (
              <p className="text-xs text-zinc-400 italic mb-1.5">"{transcript}"</p>
            )}
            {response && (
              <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm px-4 py-3">
                <p className="text-sm font-medium text-zinc-800 leading-relaxed whitespace-pre-wrap">{response}</p>
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
                className="w-full text-left p-4 rounded-2xl bg-white border border-zinc-200/70 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all active:scale-[0.98] group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-zinc-900 mb-1">{card.title}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">{card.description}</p>
                  </div>
                  <div className="size-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0 ml-3 group-hover:bg-indigo-100 transition-colors">
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
                    className="text-left p-4 rounded-2xl bg-white border border-zinc-200/70 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all active:scale-[0.98] group"
                  >
                    <div className="size-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600 mb-3 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                      <Icon className="size-4.5" />
                    </div>
                    <h3 className="text-xs font-bold text-zinc-900 mb-0.5">{card.title}</h3>
                    <p className="text-[10px] text-zinc-500">{card.description}</p>
                    <div className="flex justify-end mt-2">
                      <ArrowUpRight className="size-3.5 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── Botões Inferiores (3 botões) ─── */}
      <div className="flex items-center justify-center gap-6 px-6 pb-5 pt-2 bg-[#F8FAFC]">
        {/* + Upload Documento */}
        <button
          type="button"
          onClick={handleFileUpload}
          aria-label="Enviar documento"
          className="flex size-12 items-center justify-center rounded-full bg-white border border-zinc-200 shadow-sm text-zinc-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 active:scale-95 transition-all"
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
              ? "bg-rose-500 text-white shadow-rose-500/30 ring-4 ring-rose-400/30"
              : speaking
                ? "bg-emerald-500 text-white shadow-emerald-500/30"
                : "bg-[#4F46E5] text-white shadow-[0_8px_30px_-6px_rgba(79,70,229,0.5)] hover:scale-105"
          }`}
        >
          {listening && (
            <span className="absolute inset-0 animate-ping rounded-full bg-rose-500/30" aria-hidden="true" />
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
