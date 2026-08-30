"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Sparkles, Music, House, Film, ArrowUpRight, MessageSquare, Paperclip, Loader2 } from "lucide-react"
import { luciApiFetch } from "@/lib/api"
import { useConversation } from "@/hooks/use-conversation"
import { voiceInputManager } from "@/lib/voice-input-manager"
import { getOrbState, type OrbState } from "@/lib/orb-state"
import { useAppNavigationStore } from "@/stores/useAppNavigationStore"

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
    .replace(/L\.U\.C\.I\./gi, "Luci")
    .replace(/L\.U\.C\.I/gi, "Luci")
    .replace(/\s+/g, " ")
    .trim()
}

// ─── Atalhos Recorrentes Inteligentes (Clean & Minimalista) ───
const SHORTCUT_PROMPTS = [
  {
    id: "resumo",
    title: "Resumo do meu dia",
    subtitle: "Clima, compromissos e notícias",
    command: "Me dê um resumo rápido do meu dia.",
    icon: Sparkles,
  },
  {
    id: "musica",
    title: "Tocar algo relaxante",
    subtitle: "Sessão tranquila no LuciMusic",
    command: "Luci, toca uma playlist relaxante",
    icon: Music,
  },
  {
    id: "casa",
    title: "Status da Casa",
    subtitle: "Verificar luzes e dispositivos",
    command: "Como estão os dispositivos da casa inteligente?",
    icon: House,
  },
  {
    id: "ideias",
    title: "Planejar minha semana",
    subtitle: "Organizar tarefas e objetivos",
    command: "Me ajude a organizar as metas principais da minha semana.",
    icon: Film,
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
  const [hasStartedConversation, setHasStartedConversation] = useState(false)

  const silenceTimerRef = useRef<any>(null)
  const audioQueueRef = useRef<AudioPlayerQueue | null>(null)
  const isProcessingRef = useRef<boolean>(false)
  const isUserActiveSessionRef = useRef<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { activeTabByModule, setActiveTab } = useAppNavigationStore()
  const currentTab = activeTabByModule["orb"] || "chat"

  // Se a aba do deck for "chat", alterna automaticamente para o modo de chat
  useEffect(() => {
    if (currentTab === "chat" && onSwitchToChat) {
      // Deixa disponível para o usuário
    }
  }, [currentTab, onSwitchToChat])

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

  // ─── Enviar Mensagem para o Cérebro da Luci ───
  const sendVoiceQuery = useCallback(async (text: string) => {
    if (!text.trim() || isProcessingRef.current) return
    isProcessingRef.current = true
    isUserActiveSessionRef.current = false
    clearSilenceTimer()

    voiceInputManager.stopSpeechRecognition()
    setListening(false)
    setHasStartedConversation(true)

    setLoading(true)
    setResponse("")
    audioQueueRef.current?.stopAndClear()

    try {
      const result = await sendVoiceMessage(text)
      setResponse(result.reply)
      setLoading(false)

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
    } finally {
      isProcessingRef.current = false
      setLoading(false)
    }
  }, [sendVoiceMessage, synthesizeAndEnqueueSentence])

  // Inicia o STT compartilhado via voiceInputManager
  const startListeningSession = useCallback(() => {
    if (isProcessingRef.current) return

    voiceInputManager.unlockAudio()
    setHasStartedConversation(true)
    setListening(true)
    setResponse("")
    setTranscript("")

    voiceInputManager.startSpeechRecognition(
      (currentSpeech: string, isFinal: boolean) => {
        if (!currentSpeech) return
        setTranscript(currentSpeech)

        // Limpeza de silêncio e disparo natural após término da fala
        clearSilenceTimer()
        silenceTimerRef.current = setTimeout(() => {
          if (currentSpeech.trim()) {
            sendVoiceQuery(currentSpeech.trim())
          }
        }, 1400)
      },
      () => {
        // Se a sessão ainda estiver ativa e não estiver processando nem falando, reativa suavemente
        if (isUserActiveSessionRef.current && !isProcessingRef.current) {
          setListening(true)
        } else {
          setListening(false)
        }
      },
      true
    )
  }, [sendVoiceQuery])

  // Escuta contínua em segundo plano com detecção de Wake Word ("Ei Luci", "Luci", etc.)
  const startWakeWordListener = useCallback(() => {
    if (isProcessingRef.current || isUserActiveSessionRef.current) return

    voiceInputManager.startSpeechRecognition(
      (speechText: string) => {
        if (!speechText) return

        const wakeRegex = /\b(ei\s+luci|oi\s+luci|ol[aá]\s+luci|hey\s+luci|ok\s+luci|luci|lucy)\b/i
        if (wakeRegex.test(speechText)) {
          console.log("[VoiceOrb] Wake word detectada via reconhecimento fonético contínuo:", speechText)
          isUserActiveSessionRef.current = true
          setHasStartedConversation(true)
          setListening(true)
          setResponse("")
          
          // Remove a wake word do início para extrair o comando imediato (ex: "Luci toca raul seixas")
          const cleanCommand = speechText.replace(wakeRegex, "").trim()
          if (cleanCommand) {
            setTranscript(cleanCommand)
            clearSilenceTimer()
            silenceTimerRef.current = setTimeout(() => {
              sendVoiceQuery(cleanCommand)
            }, 1200)
          } else {
            setTranscript("Ouvindo você...")
          }
        }
      },
      () => {
        // Reativa o listener de wake word automaticamente enquanto a tela do Orb estiver ativa
        if (!isUserActiveSessionRef.current && !isProcessingRef.current) {
          setTimeout(() => {
            startWakeWordListener()
          }, 300)
        }
      },
      true
    )
  }, [sendVoiceQuery])

  // Ativar ou pausar escuta ao clicar no próprio Orbe central
  const handleOrbClick = useCallback(() => {
    if (speaking) {
      audioQueueRef.current?.stopAndClear()
      setSpeaking(false)
      return
    }

    if (listening) {
      voiceInputManager.stopSpeechRecognition()
      setListening(false)
      isUserActiveSessionRef.current = false
      if (transcript.trim()) {
        sendVoiceQuery(transcript.trim())
      }
    } else {
      isUserActiveSessionRef.current = true
      startListeningSession()
    }
  }, [speaking, listening, transcript, sendVoiceQuery, startListeningSession])

  // Inicializa o AudioQueue, escuta contínua de wake word e contexto
  useEffect(() => {
    audioQueueRef.current = new AudioPlayerQueue((isSpeaking) => {
      setSpeaking(isSpeaking)
    })

    voiceInputManager.setActiveContext("orb")
    startWakeWordListener()

    return () => {
      audioQueueRef.current?.stopAndClear()
      voiceInputManager.stopSpeechRecognition()
      clearSilenceTimer()
      isUserActiveSessionRef.current = false
    }
  }, [startWakeWordListener])

  // Determinar estado visual do Orb
  const orbState: OrbState = getOrbState(loading, speaking, listening)

  const handleShortcutClick = (cmd: string) => {
    setTranscript(cmd)
    setHasStartedConversation(true)
    sendVoiceQuery(cmd)
  }

  // Se houver conversa ativa ou resposta ou fala, oculta os atalhos
  const isConversationActive = hasStartedConversation || Boolean(transcript || response || loading || listening || speaking)

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-between bg-[var(--bg-app)] text-[var(--text-primary)] select-none px-6 pt-4 pb-24 overflow-hidden">
      
      {/* ─── Topo Limpo e Minimalista ─── */}
      <div className="w-full flex items-center justify-end z-10 min-h-[36px]">
        {isConversationActive && (
          <button
            type="button"
            onClick={() => {
              setHasStartedConversation(false)
              setTranscript("")
              setResponse("")
              setListening(false)
              audioQueueRef.current?.stopAndClear()
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95 transition-all shadow-sm"
          >
            Novo Tópico
          </button>
        )}
      </div>

      {/* ─── CENTRO: ORBE DA MARCA LUCI & RESPOSTA DE TEXTO ELEGANTE ─── */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm text-center relative my-auto">
        
        {/* Orbe Eéreo com o Gradiente Oficial da Marca (#2B1776 a #7527C3 + Brilho e Ondas) */}
        <div className="relative flex items-center justify-center my-6">
          
          {/* Ondas / Ripple Suaves na Escuta ou Fala */}
          {(orbState === "listening" || orbState === "speaking") && (
            <>
              <span className="absolute size-64 rounded-full bg-gradient-to-tr from-[#2B1776]/20 to-[#7527C3]/30 animate-orb-listening-ripple pointer-events-none" />
              <span className="absolute size-56 rounded-full bg-[#7527c3]/20 animate-orb-listening-ripple [animation-delay:0.5s] pointer-events-none" />
            </>
          )}

          {/* Orbe Principal Interativo (Toque para falar/pausar) */}
          <button
            type="button"
            onClick={handleOrbClick}
            aria-label={listening ? "Parar de ouvir" : "Falar com a Luci"}
            className={`relative size-44 sm:size-48 rounded-full cursor-pointer transition-transform active:scale-95 outline-none ${
              orbState === "processing" ? "animate-spin" : "animate-orb-ethereal"
            }`}
            style={{
              background: "linear-gradient(135deg, #2B1776 0%, #5c62ec 45%, #7527C3 75%, #ffccf2 100%)",
              boxShadow: "0 0 60px 10px rgba(117, 39, 195, 0.45), 0 0 100px 30px rgba(43, 23, 118, 0.25)",
            }}
          >
            {/* Camada interna de profundidade e brilho perolado */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/30 via-transparent to-black/25 backdrop-blur-sm" />
            
            {/* Ícone de Loading Discreto se estiver processando */}
            {orbState === "processing" && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <Loader2 className="size-8 animate-spin" />
              </div>
            )}
          </button>
        </div>

        {/* ─── ÁREA DE TEXTO / CONVERSA VIVA COM A LUCI ─── */}
        <div className="w-full min-h-[90px] flex flex-col items-center justify-center transition-all duration-300">
          {!isConversationActive ? (
            <div className="space-y-1 animate-fade-in">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-primary)]">
                Fale suas ideias em voz alta
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Toque no orbe ou use o botão central a qualquer momento
              </p>
            </div>
          ) : (
            <div className="space-y-3 w-full animate-fade-in px-2">
              {/* Fala do Usuário em Destaque Fino */}
              {transcript && (
                <p className="text-sm font-semibold text-[var(--accent-primary)] italic">
                  "{transcript}"
                </p>
              )}

              {/* Status Dinâmico */}
              {orbState === "listening" && (
                <span className="text-xs font-bold text-[var(--text-secondary)] tracking-wide animate-pulse">
                  Escutando...
                </span>
              )}

              {orbState === "processing" && (
                <span className="text-xs font-bold text-[var(--accent-primary)] tracking-wide animate-pulse">
                  Luci está pensando...
                </span>
              )}

              {/* Resposta Completa da Luci em Tipografia Nobre */}
              {response && (
                <div className="py-2 text-left max-h-[30vh] overflow-y-auto no-scrollbar">
                  <p className="text-base sm:text-lg font-medium text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                    {response}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── BASE: ATALHOS DE USO RECORRENTE (Somem ao ativar a conversa) ─── */}
      {!isConversationActive && (
        <div className="w-full max-w-sm space-y-2 pt-2 animate-slide-up">
          <div className="grid grid-cols-2 gap-2.5">
            {SHORTCUT_PROMPTS.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleShortcutClick(item.command)}
                  className="flex flex-col items-start justify-between p-3.5 rounded-2xl bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] shadow-sm hover:border-[var(--border-strong)] active:scale-[0.97] transition-all text-left group"
                >
                  <div className="flex size-8 items-center justify-center rounded-xl bg-[var(--bg-surface-2)] text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors mb-2">
                    <Icon className="size-4 stroke-[2]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-primary)] leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Input de Arquivo Oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.txt,.csv,.xlsx,.xls,.doc,.docx"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (file) {
            setHasStartedConversation(true)
            setTranscript(`Analisando anexo: ${file.name}`)
            setLoading(true)
            try {
              const reply = await uploadFile(file, "Analise o arquivo anexo.")
              setResponse(reply)
            } catch {
              setResponse("Ocorreu um erro ao processar o arquivo.")
            } finally {
              setLoading(false)
            }
          }
          e.target.value = ""
        }}
      />
    </div>
  )
}
