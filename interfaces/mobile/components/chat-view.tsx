"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Sparkles, Copy, Mic, Loader2, Trash2, ChevronLeft, Plus, Square } from "lucide-react"
import { useConversation } from "@/hooks/use-conversation"
import { voiceInputManager } from "@/lib/voice-input-manager"

const SUGGESTIONS = [
  "Qual a previsão do tempo para hoje?",
  "Qual a cotação do dólar e do bitcoin agora?",
  "Quando é o próximo feriado nacional?",
  "Toque um lofi relaxante no LuciMusic",
]

export function ChatView({
  onSwitchToVoice,
  onOpenMenu,
}: {
  onSwitchToVoice?: () => void
  onOpenMenu?: () => void
}) {
  const { messages, isProcessing, sendTextMessage, uploadFile, clearConversation } = useConversation()
  const [input, setInput] = useState("")
  const [isRecordingAudio, setIsRecordingAudio] = useState(false)
  const [recordingText, setRecordingText] = useState("")
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isProcessing])

  const handleSend = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isProcessing) return
    setInput("")
    await sendTextMessage(trimmed)
  }

  // ─── Gravação de áudio → transcrição → texto via VoiceInputManager (Modo Ditado) ───
  const handleToggleRecording = useCallback(() => {
    if (isRecordingAudio) {
      voiceInputManager.stopSpeechRecognition()
      setIsRecordingAudio(false)
      if (recordingText.trim()) {
        handleSend(recordingText.trim())
      }
      setRecordingText("")
      return
    }

    setIsRecordingAudio(true)
    setRecordingText("")

    const started = voiceInputManager.startSpeechRecognition(
      (transcript: string) => {
        setRecordingText(transcript)
      },
      () => {
        setIsRecordingAudio(false)
      },
      true
    )

    if (!started) {
      setIsRecordingAudio(false)
    }
  }, [isRecordingAudio, recordingText, isProcessing])

  // ─── Upload de Documentos ───
  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await uploadFile(file, "Analise o arquivo anexo.")
    }
    e.target.value = ""
  }

  return (
    <div className="flex h-full flex-col bg-background animate-view-in select-none">
      {/* ─── Header do Chat com Botão Voltar (<), Título Central e Ações à Direita (Menu/Limpar) ─── */}
      <div className="flex items-center justify-between px-5 pb-3 pt-4 border-b border-border/80 bg-card/90 backdrop-blur-md z-10">
        <button
          type="button"
          onClick={onSwitchToVoice}
          aria-label="Voltar para voz"
          className="flex size-10 items-center justify-center rounded-full bg-secondary text-foreground hover:bg-secondary/80 active:scale-95 transition-all shadow-sm"
        >
          <ChevronLeft className="size-5.5 stroke-[2.2]" />
        </button>

        <div className="text-center">
          <h1 className="text-sm font-extrabold text-foreground tracking-tight">Luci Chat</h1>
          <p className="text-[10px] text-muted-foreground font-medium">Cérebro Unificado</p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={clearConversation}
            className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-destructive hover:bg-destructive/10 active:scale-95 transition-all"
            title="Limpar Histórico"
            aria-label="Limpar Histórico"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {/* ─── Lista de Mensagens ─── */}
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4 no-scrollbar">
        {messages.map((m) => (
          <div key={m.id} className="space-y-1">
            {m.role === "assistant" ? (
              /* ─── Mensagem da Luci (esquerda) ─── */
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-sm">
                  <Sparkles className="size-3.5" aria-hidden="true" />
                </span>
                <div className="max-w-[82%]">
                  <div className="rounded-2xl rounded-tl-md bg-card border border-border px-4 py-3 text-xs leading-relaxed text-foreground shadow-sm">
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                  <div className="mt-1 flex gap-3 pl-1 text-muted-foreground text-[10px]">
                    <button
                      onClick={() => navigator.clipboard.writeText(m.content)}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                      type="button"
                    >
                      <Copy className="size-3" /> Copiar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ─── Mensagem do Usuário (direita) ─── */
              <div className="flex justify-end">
                <div className="max-w-[82%] rounded-2xl rounded-tr-md bg-primary px-4 py-3 text-xs leading-relaxed text-primary-foreground shadow-sm">
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* ─── Indicador de Processamento ─── */}
        {isProcessing && (
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <Sparkles className="size-3.5 animate-spin" />
            </span>
            <div className="rounded-2xl rounded-tl-md bg-card border border-border px-4 py-3 text-xs text-muted-foreground flex items-center gap-2 shadow-sm">
              <Loader2 className="size-3.5 animate-spin text-primary" />
              <span>Luci está pensando...</span>
            </div>
          </div>
        )}

        {/* ─── Sugestões Rápidas ─── */}
        {messages.length <= 2 && (
          <div className="pt-3 space-y-2">
            <p className="text-[11px] font-semibold text-muted-foreground">Sugestões rápidas:</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => handleSend(sug)}
                  className="px-3 py-1.5 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-primary/10 text-xs text-foreground text-left transition-all active:scale-95"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── Recording Banner ─── */}
      {isRecordingAudio && (
        <div className="px-5 py-2 bg-destructive/10 border-t border-destructive/20">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-destructive animate-pulse" />
            <p className="text-xs text-destructive font-medium flex-1 truncate">
              {recordingText || "Ouvindo... fale e toque no mic para enviar."}
            </p>
          </div>
        </div>
      )}

      {/* ─── Input Bar ─── */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSend(input)
        }}
        className="flex items-center gap-2.5 px-4 py-3 border-t border-border bg-card/90 backdrop-blur-md"
      >
        {/* + Upload */}
        <button
          type="button"
          onClick={handleFileUpload}
          aria-label="Enviar documento"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-primary hover:bg-primary/10 active:scale-95 transition-all"
        >
          <Plus className="size-5 stroke-[2.5]" />
        </button>

        {/* Input de Texto */}
        <div className="flex flex-1 items-center rounded-full bg-secondary border border-border px-4 focus-within:border-primary/50 focus-within:bg-card transition-all">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            aria-label="Mensagem"
            disabled={isProcessing || isRecordingAudio}
            className="w-full bg-transparent py-2.5 text-xs text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Botão Send ou Mic */}
        {input.trim() ? (
          <button
            type="submit"
            disabled={isProcessing}
            aria-label="Enviar mensagem"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-primary/20"
          >
            <Send className="size-4" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleToggleRecording}
            aria-label={isRecordingAudio ? "Parar gravação" : "Gravar áudio"}
            className={`flex size-10 shrink-0 items-center justify-center rounded-full transition-all active:scale-95 shadow-md ${
              isRecordingAudio
                ? "bg-destructive text-destructive-foreground shadow-destructive/30"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
            }`}
          >
            {isRecordingAudio ? (
              <Square className="size-4 fill-current" />
            ) : (
              <Mic className="size-4" />
            )}
          </button>
        )}
      </form>

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
