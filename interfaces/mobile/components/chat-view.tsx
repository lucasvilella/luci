"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Sparkles, Copy, Share2, Mic, Languages, Loader2, Trash2 } from "lucide-react"
import { useConversation } from "@/hooks/use-conversation"
import { useAuth } from "@/hooks/use-auth"

const SUGGESTIONS = [
  "Qual a previsão do tempo para hoje?",
  "Qual a cotação do dólar e do bitcoin agora?",
  "Quando é o próximo feriado nacional?",
  "Toque um lofi relaxante no LuciMusic",
]

export function ChatView() {
  const { user } = useAuth()
  const { messages, isProcessing, sendTextMessage, clearConversation } = useConversation()
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

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

  return (
    <div className="flex h-full flex-col bg-background animate-view-in select-none">
      {/* ─── Header do Chat ─── */}
      <div className="flex items-center justify-between px-5 pb-3 pt-3 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div>
          <h1 className="text-base font-semibold text-foreground flex items-center gap-1.5">
            Chat Luci
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20">
              Cérebro Único
            </span>
          </h1>
          <p className="text-[11px] text-muted-foreground">Memória Omnichannel Unificada</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={clearConversation}
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Limpar Histórico"
            aria-label="Limpar Histórico"
          >
            <Trash2 className="size-4" />
          </button>
          <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
        </div>
      </div>

      {/* ─── Lista de Mensagens Unificada ─── */}
      <div className="flex-1 space-y-3.5 overflow-y-auto px-5 py-4 scrollbar-none pb-4">
        {messages.map((m) => (
          <div key={m.id} className="space-y-1">
            {m.role === "assistant" ? (
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                  <Sparkles className="size-4" aria-hidden="true" />
                </span>
                <div className="max-w-[82%]">
                  <div className="rounded-2xl rounded-tl-md border border-border bg-card px-4 py-3 text-xs leading-relaxed text-card-foreground shadow-sm">
                    {/* Badge do canal de origem */}
                    {m.inputType === "voice" && (
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-indigo-400 mb-1.5">
                        <Mic className="size-3" /> Resposta por Voz
                      </div>
                    )}
                    {m.inputType === "interpreter" && (
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-purple-400 mb-1.5">
                        <Languages className="size-3" /> Intérprete Simultâneo
                      </div>
                    )}
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
              <div className="flex justify-end">
                <div className="max-w-[82%] rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-xs leading-relaxed text-primary-foreground shadow-sm">
                  {m.inputType === "voice" && (
                    <div className="flex items-center gap-1 text-[10px] font-medium text-primary-foreground/80 mb-1">
                      <Mic className="size-3" /> Transcrição de Voz
                    </div>
                  )}
                  {m.inputType === "interpreter" && (
                    <div className="flex items-center gap-1 text-[10px] font-medium text-primary-foreground/80 mb-1">
                      <Languages className="size-3" /> Fala do Interlocutor
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Sparkles className="size-4 animate-spin" />
            </span>
            <div className="rounded-2xl rounded-tl-md border border-border bg-card px-4 py-3 text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="size-3.5 animate-spin text-primary" />
              <span>Luci está pensando...</span>
            </div>
          </div>
        )}

        {/* ─── Sugestões Rápidas (Se histórico tiver poucas mensagens) ─── */}
        {messages.length <= 2 && (
          <div className="pt-2 space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground">Sugestões rápidas:</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => handleSend(sug)}
                  className="px-3 py-1.5 rounded-xl border border-border bg-card/60 hover:bg-accent text-xs text-card-foreground text-left transition-colors"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── Input de Texto ─── */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSend(input)
        }}
        className="flex items-center gap-2 px-4 py-2.5 border-t border-border/50 bg-background/90 backdrop-blur-md"
      >
        <div className="flex flex-1 items-center rounded-full border border-border bg-card px-4 focus-within:border-primary/50 transition-colors">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escreva uma mensagem para a Luci..."
            aria-label="Mensagem"
            disabled={isProcessing}
            className="w-full bg-transparent py-2.5 text-xs text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <button
          type="submit"
          disabled={!input.trim() || isProcessing}
          aria-label="Enviar mensagem"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-primary/20"
        >
          <Send className="size-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  )
}
