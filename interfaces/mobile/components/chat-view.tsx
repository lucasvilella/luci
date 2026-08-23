"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Sparkles, Copy, Mic, Loader2, Trash2, ChevronLeft, Plus, MicOff } from "lucide-react"
import { useConversation } from "@/hooks/use-conversation"

const SUGGESTIONS = [
  "Qual a previsão do tempo para hoje?",
  "Qual a cotação do dólar e do bitcoin agora?",
  "Quando é o próximo feriado nacional?",
  "Toque um lofi relaxante no LuciMusic",
]

export function ChatView({ onSwitchToVoice }: { onSwitchToVoice?: () => void }) {
  const { messages, isProcessing, sendTextMessage, clearConversation } = useConversation()
  const [input, setInput] = useState("")
  const [isRecordingAudio, setIsRecordingAudio] = useState(false)
  const [recordingText, setRecordingText] = useState("")
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const recognitionRef = useRef<any>(null)
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

  // ─── Gravação de áudio → transcrição → texto ───
  const handleToggleRecording = useCallback(() => {
    if (isRecordingAudio) {
      // Parar gravação
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
      }
      setIsRecordingAudio(false)
      if (recordingText.trim()) {
        handleSend(recordingText.trim())
      }
      setRecordingText("")
      return
    }

    // Iniciar gravação
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = "pt-BR"
    recognition.continuous = true
    recognition.interimResults = true
    recognitionRef.current = recognition

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((res: any) => res[0].transcript)
        .join("")
      setRecordingText(transcript)
    }

    recognition.onerror = () => {
      setIsRecordingAudio(false)
      setRecordingText("")
    }

    recognition.onend = () => {
      // Não faz auto-send aqui, o user decide quando parar
    }

    setIsRecordingAudio(true)
    setRecordingText("")
    try {
      recognition.start()
    } catch {
      setIsRecordingAudio(false)
    }
  }, [isRecordingAudio, recordingText, isProcessing])

  // ─── Upload de Documentos ───
  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleSend(`Analise o arquivo "${file.name}" que estou enviando.`)
    }
    e.target.value = ""
  }

  return (
    <div className="flex h-full flex-col bg-[#F8FAFC] animate-view-in select-none">
      {/* ─── Header do Chat ─── */}
      <div className="flex items-center justify-between px-5 pb-3 pt-4 border-b border-zinc-200/70 bg-white/80 backdrop-blur-md">
        <button
          type="button"
          onClick={onSwitchToVoice}
          aria-label="Voltar para voz"
          className="flex size-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200 active:scale-95 transition-all"
        >
          <ChevronLeft className="size-5" />
        </button>

        <div className="text-center">
          <h1 className="text-sm font-extrabold text-zinc-900">Luci Chat</h1>
          <p className="text-[10px] text-zinc-500">Cérebro Unificado</p>
        </div>

        <button
          type="button"
          onClick={clearConversation}
          className="flex size-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:text-rose-500 hover:bg-rose-50 active:scale-95 transition-all"
          title="Limpar Histórico"
          aria-label="Limpar Histórico"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {/* ─── Lista de Mensagens ─── */}
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4 no-scrollbar">
        {messages.map((m) => (
          <div key={m.id} className="space-y-1">
            {m.role === "assistant" ? (
              /* ─── Mensagem da Luci (esquerda) ─── */
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
                  <Sparkles className="size-3.5" aria-hidden="true" />
                </span>
                <div className="max-w-[82%]">
                  <div className="rounded-2xl rounded-tl-md bg-white border border-zinc-200/80 px-4 py-3 text-xs leading-relaxed text-zinc-800 shadow-sm">
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                  <div className="mt-1 flex gap-3 pl-1 text-zinc-400 text-[10px]">
                    <button
                      onClick={() => navigator.clipboard.writeText(m.content)}
                      className="flex items-center gap-1 hover:text-zinc-700 transition-colors"
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
                <div className="max-w-[82%] rounded-2xl rounded-tr-md bg-[#4F46E5] px-4 py-3 text-xs leading-relaxed text-white shadow-sm">
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* ─── Indicador de Processamento ─── */}
        {isProcessing && (
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
              <Sparkles className="size-3.5 animate-spin" />
            </span>
            <div className="rounded-2xl rounded-tl-md bg-white border border-zinc-200/80 px-4 py-3 text-xs text-zinc-500 flex items-center gap-2 shadow-sm">
              <Loader2 className="size-3.5 animate-spin text-indigo-500" />
              <span>Luci está pensando...</span>
            </div>
          </div>
        )}

        {/* ─── Sugestões Rápidas ─── */}
        {messages.length <= 2 && (
          <div className="pt-3 space-y-2">
            <p className="text-[11px] font-semibold text-zinc-400">Sugestões rápidas:</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => handleSend(sug)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-zinc-200 hover:border-indigo-300 hover:bg-indigo-50 text-xs text-zinc-700 text-left transition-all active:scale-95"
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
        <div className="px-5 py-2 bg-rose-50 border-t border-rose-200">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-rose-500 animate-pulse" />
            <p className="text-xs text-rose-700 font-medium flex-1 truncate">
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
        className="flex items-center gap-2.5 px-4 py-3 border-t border-zinc-200/70 bg-white/90 backdrop-blur-md"
      >
        {/* + Upload */}
        <button
          type="button"
          onClick={handleFileUpload}
          aria-label="Enviar documento"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:text-indigo-600 hover:bg-indigo-50 active:scale-95 transition-all"
        >
          <Plus className="size-5 stroke-[2.5]" />
        </button>

        {/* Input de Texto */}
        <div className="flex flex-1 items-center rounded-full bg-zinc-100 border border-zinc-200 px-4 focus-within:border-indigo-400 focus-within:bg-white transition-all">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            aria-label="Mensagem"
            disabled={isProcessing || isRecordingAudio}
            className="w-full bg-transparent py-2.5 text-xs text-zinc-900 outline-none placeholder:text-zinc-400"
          />
        </div>

        {/* Botão Send ou Mic */}
        {input.trim() ? (
          <button
            type="submit"
            disabled={isProcessing}
            aria-label="Enviar mensagem"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#4F46E5] text-white transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-indigo-500/20"
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
                ? "bg-rose-500 text-white shadow-rose-500/20 ring-2 ring-rose-400/30"
                : "bg-[#4F46E5] text-white shadow-indigo-500/20"
            }`}
          >
            {isRecordingAudio ? (
              <MicOff className="size-4" aria-hidden="true" />
            ) : (
              <Mic className="size-4" aria-hidden="true" />
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
