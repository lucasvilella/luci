"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Mic, MessageSquare, X, Sparkles, Volume2, Loader2 } from "lucide-react"
import { luciApiFetch } from "@/lib/api"

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
  const [statusText, setStatusText] = useState("Toque no microfone para falar")

  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<any>(null)
  const capturedTextRef = useRef<string>("")
  const audioQueueRef = useRef<AudioPlayerQueue | null>(null)
  const streamSentenceCounter = useRef<number>(0)
  const isProcessingRef = useRef<boolean>(false)

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }

  const synthesizeAndEnqueueSentence = useCallback(async (sentence: string, index: number) => {
    const cleanSentence = cleanTextForSpeech(sentence)
    if (cleanSentence.length < 2) return

    try {
      const res = await luciApiFetch("/api/v1/tts/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleanSentence }),
      })

      if (!res.ok) return
      const buffer = await res.arrayBuffer()
      audioQueueRef.current?.enqueueIndexed(index, buffer)
    } catch (err) {
      console.error("TTS fetch error:", err)
    }
  }, [])

  const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])

  const sendVoiceQuery = useCallback(async (text: string) => {
    if (!text.trim() || isProcessingRef.current) return
    isProcessingRef.current = true
    setLoading(true)
    setStatusText("Luci está pensando...")
    setResponse("")
    streamSentenceCounter.current = 0
    audioQueueRef.current?.stopAndClear()

    const currentHistory = [...conversationHistory]

    try {
      const res = await luciApiFetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          userId: "Lucas",
          history: currentHistory,
        }),
      })

      if (!res.ok) throw new Error("Chat request failed")

      const contentType = res.headers.get("content-type") || ""

      if (contentType.includes("text/event-stream")) {
        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        let sentenceBuffer = ""
        let fullText = ""

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split("\n")

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const dataStr = line.replace("data: ", "").trim()
                if (dataStr === "[DONE]") continue

                try {
                  const parsed = JSON.parse(dataStr)
                  if (parsed.chunk) {
                    sentenceBuffer += parsed.chunk
                    fullText += parsed.chunk
                    setResponse(fullText)
                    setLoading(false)

                    const match = sentenceBuffer.match(/([^.!?\n]+[.!?\n]+)/)
                    if (match) {
                      const fullSentence = match[0]
                      sentenceBuffer = sentenceBuffer.slice(fullSentence.length)
                      const currentIndex = streamSentenceCounter.current++
                      synthesizeAndEnqueueSentence(fullSentence, currentIndex)
                    }
                  }
                } catch {}
              }
            }
          }

          if (sentenceBuffer.trim()) {
            const currentIndex = streamSentenceCounter.current++
            synthesizeAndEnqueueSentence(sentenceBuffer.trim(), currentIndex)
          }

          if (fullText.trim()) {
            setConversationHistory((prev) => [
              ...prev,
              { role: "user", content: text },
              { role: "assistant", content: fullText.trim() },
            ])
          }
        }
      } else {
        const data = await res.json()
        const reply = data.content || ""
        setResponse(reply)
        setLoading(false)
        synthesizeAndEnqueueSentence(reply, 0)
        if (reply.trim()) {
          setConversationHistory((prev) => [
            ...prev,
            { role: "user", content: text },
            { role: "assistant", content: reply.trim() },
          ])
        }
      }
    } catch (err) {
      console.error("Voice processing error:", err)
      setStatusText("Erro na resposta. Tente novamente.")
    } finally {
      isProcessingRef.current = false
      setLoading(false)
    }
  }, [synthesizeAndEnqueueSentence])

  const isContinuousSessionRef = useRef<boolean>(true)

  useEffect(() => {
    audioQueueRef.current = new AudioPlayerQueue((isSpeaking) => {
      setSpeaking(isSpeaking)
      if (isSpeaking) {
        setStatusText("Luci está falando...")
        // Pause recognition while Luci is speaking to avoid hearing herself
        try {
          recognitionRef.current?.stop()
        } catch {}
      } else {
        // Automatically re-open the mic for continuous conversation when Luci finishes speaking!
        if (isContinuousSessionRef.current) {
          setStatusText("Ouvindo sua resposta...")
          capturedTextRef.current = ""
          setTranscript("")
          setTimeout(() => {
            try {
              recognitionRef.current?.start()
              setListening(true)
            } catch {}
          }, 300)
        } else {
          setStatusText("Toque no microfone para falar")
        }
      }
    })

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRec) {
      const rec = new SpeechRec()
      // continuous = false is much more reliable on Android mobile browsers
      rec.continuous = false
      rec.interimResults = true
      rec.lang = "pt-BR"

      rec.onstart = () => {
        setListening(true)
        setStatusText("Ouvindo você...")
      }

      rec.onresult = (event: any) => {
        clearSilenceTimer()

        let currentText = ""
        let isFinal = false
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentText += event.results[i][0].transcript
          if (event.results[i].isFinal) isFinal = true
        }

        if (currentText.trim()) {
          capturedTextRef.current = currentText.trim()
          setTranscript(capturedTextRef.current)

          if (isFinal) {
            // Android finalized sentence: trigger immediately!
            try {
              rec.stop()
            } catch {}
            setListening(false)
            sendVoiceQuery(capturedTextRef.current)
          } else {
            // Silence timer for interim results
            silenceTimerRef.current = setTimeout(() => {
              const finalText = capturedTextRef.current
              if (finalText.length >= 2) {
                try {
                  rec.stop()
                } catch {}
                setListening(false)
                sendVoiceQuery(finalText)
              }
            }, 900)
          }
        }
      }

      rec.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error)
        setListening(false)
        clearSilenceTimer()
      }

      rec.onend = () => {
        setListening(false)
        clearSilenceTimer()
        // If we captured speech but recognition ended before timer fired, send it now
        if (capturedTextRef.current.trim().length >= 2 && !isProcessingRef.current) {
          sendVoiceQuery(capturedTextRef.current)
        }
      }

      recognitionRef.current = rec
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
  }, [sendVoiceQuery])

  const toggleMic = () => {
    audioQueueRef.current?.initAudioContext()
    clearSilenceTimer()
    isContinuousSessionRef.current = true

    if (speaking) {
      audioQueueRef.current?.stopAndClear()
      setSpeaking(false)
    }

    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      if (capturedTextRef.current.trim()) {
        sendVoiceQuery(capturedTextRef.current)
      }
    } else {
      setTranscript("")
      setResponse("")
      capturedTextRef.current = ""
      try {
        recognitionRef.current?.start()
        setListening(true)
      } catch (err) {
        console.warn("Recognition start fallback:", err)
      }
    }
  }

  const cancelSession = () => {
    isContinuousSessionRef.current = false
    clearSilenceTimer()
    try {
      recognitionRef.current?.stop()
    } catch {}
    setListening(false)
    audioQueueRef.current?.stopAndClear()
    setSpeaking(false)
    setTranscript("")
    setResponse("")
    setStatusText("Toque no microfone para falar")
  }

  const speakDemo = () => {
    audioQueueRef.current?.initAudioContext()
    const text = "Olá! Eu sou a Luci. A voz Thalita Neural online já está funcionando com fallback automático e resposta instantânea."
    setTranscript("Teste de áudio da Luci")
    setResponse(text)
    streamSentenceCounter.current = 0
    audioQueueRef.current?.stopAndClear()
    synthesizeAndEnqueueSentence(text, 0)
  }

  const [appMode, setAppMode] = useState<"assistant" | "interpreter">("assistant")

  return (
    <div className="flex h-full flex-col items-center justify-between px-6 pb-4 pt-2 animate-view-in bg-background">
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

      {appMode === "interpreter" && (
        <div className="mt-1 flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[11px] font-medium text-cyan-300">
          <span>👨 Homem (PT) ➔ 🇨🇳 Mandarim</span>
          <span>•</span>
          <span>👩 Mulher (Mandarim) ➔ 🇧🇷 PT-BR</span>
        </div>
      )}

      {/* Interactive Orb */}
      <div className="relative flex flex-1 items-center justify-center">
        <div className="relative flex items-center justify-center">
          {/* pulsing rings */}
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
          {/* core orb */}
          <div className="relative size-52 animate-orb-pulse">
            <div className="absolute inset-0 animate-orb-rotate rounded-full bg-[conic-gradient(from_0deg,var(--chart-4),var(--primary),var(--chart-2),var(--chart-3),var(--chart-4))] opacity-90 blur-[1px]" />
            <div className="absolute inset-3 rounded-full bg-[radial-gradient(circle_at_30%_30%,var(--chart-3),var(--primary)_55%,var(--chart-4))]" />
            <div className="absolute inset-0 rounded-full shadow-[0_0_60px_-5px_var(--primary)]" />
            {/* equalizer bars */}
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

      <p className="text-sm font-medium text-primary text-center px-4">
        {statusText}
      </p>

      {/* Transcript or AI response */}
      <div className="mt-4 min-h-24 max-w-xs text-balance text-center text-base font-semibold leading-relaxed text-foreground px-2 overflow-y-auto max-h-32">
        {loading && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span>Processando resposta...</span>
          </div>
        )}
        {transcript && !loading && <p className="text-xs text-muted-foreground mb-1">"{transcript}"</p>}
        {response || (!transcript && !loading && "Toque no microfone ou em uma sugestão abaixo:")}
        
        {!transcript && !response && !loading && (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {[
              "Quem é você?",
              "Como está o trânsito?",
              "Conte uma curiosidade",
            ].map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  audioQueueRef.current?.initAudioContext()
                  setTranscript(prompt)
                  sendVoiceQuery(prompt)
                }}
                className="rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-foreground hover:bg-accent active:scale-95 transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-2 flex w-full items-center justify-center gap-6 pb-2">
        <button
          type="button"
          onClick={speakDemo}
          className="flex size-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-accent active:scale-95"
          aria-label="Testar voz"
          title="Testar voz da Luci"
        >
          <Volume2 className="size-4" />
        </button>

        <button
          type="button"
          onClick={toggleMic}
          aria-label={listening ? "Parar de ouvir" : "Começar a ouvir"}
          className="relative flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_40px_-8px_var(--primary)] transition-transform active:scale-95"
        >
          {listening && <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" aria-hidden="true" />}
          <Mic className="relative size-7" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={cancelSession}
          className="flex size-11 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-accent active:scale-95"
          aria-label="Cancelar"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
