"use client"

import { useState } from "react"
import { Send, Sparkles, Copy, Share2, Music } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { luciApiFetch } from "@/lib/api"

type Message = {
  id: number
  role: "assistant" | "user"
  text: string
}

const SUGGESTIONS = [
  { icon: Music, label: "Lofi Beats" },
  { icon: Sparkles, label: "Sons ambientes" },
  { icon: Music, label: "Clássico & Motivacional" },
]

export function ChatView() {
  const { user } = useAuth()
  const firstName = user?.name.split(" ")[0] ?? ""
  const [messages, setMessages] = useState<Message[]>(() => [
    { id: 1, role: "assistant", text: `Olá, ${firstName}! Como posso te ajudar hoje?` },
    { id: 2, role: "user", text: "Recomende uma playlist para estudar." },
    {
      id: 3,
      role: "assistant",
      text: "Claro! Separei três opções de foco para acompanhar seus estudos. Toque para ouvir no player.",
    },
  ])
  const [input, setInput] = useState("")

  const [isTyping, setIsTyping] = useState(false)

  async function send(text: string) {
    const value = text.trim()
    if (!value || isTyping) return

    const userMsg: Message = { id: Date.now(), role: "user", text: value }
    const botMsgId = Date.now() + 1
    const initialBotMsg: Message = { id: botMsgId, role: "assistant", text: "" }

    setMessages((prev) => [...prev, userMsg, initialBotMsg])
    setInput("")
    setIsTyping(true)

    try {
      const res = await luciApiFetch("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: value,
          userId: user?.name || "Lucas",
          history: messages.map((m) => ({ role: m.role, content: m.text })),
        }),
      })

      if (!res.ok) throw new Error("Chat failed")

      const contentType = res.headers.get("content-type") || ""

      if (contentType.includes("text/event-stream")) {
        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        let fullText = ""

        if (reader) {
          while (true) {
            const { done, value: chunkVal } = await reader.read()
            if (done) break

            const chunk = decoder.decode(chunkVal, { stream: true })
            const lines = chunk.split("\n")

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const dataStr = line.replace("data: ", "").trim()
                if (dataStr === "[DONE]") continue

                try {
                  const parsed = JSON.parse(dataStr)
                  if (parsed.chunk) {
                    fullText += parsed.chunk
                    setMessages((prev) =>
                      prev.map((m) => (m.id === botMsgId ? { ...m, text: fullText } : m))
                    )
                  }
                } catch {}
              }
            }
          }
        }
      } else {
        const data = await res.json()
        setMessages((prev) =>
          prev.map((m) => (m.id === botMsgId ? { ...m, text: data.content || "" } : m))
        )
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId ? { ...m, text: "Desculpe, ocorreu um erro ao processar sua mensagem." } : m
        )
      )
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="flex h-full flex-col animate-view-in">
      <div className="flex items-center justify-between px-5 pb-3 pt-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Chat com a Luci</h1>
          <p className="text-xs text-muted-foreground">Assistente inteligente</p>
        </div>
        <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="size-4" aria-hidden="true" />
        </span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-2">
        {messages.map((m) =>
          m.role === "assistant" ? (
            <div key={m.id} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Sparkles className="size-4" aria-hidden="true" />
              </span>
              <div className="max-w-[78%]">
                <div className="rounded-2xl rounded-tl-md border border-border bg-card px-4 py-3 text-sm leading-relaxed text-card-foreground">
                  {m.text}
                </div>
                <div className="mt-1.5 flex gap-3 pl-1 text-muted-foreground">
                  <button className="flex items-center gap-1 text-xs hover:text-foreground" type="button">
                    <Copy className="size-3" aria-hidden="true" /> Copiar
                  </button>
                  <button className="flex items-center gap-1 text-xs hover:text-foreground" type="button">
                    <Share2 className="size-3" aria-hidden="true" /> Compartilhar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[78%] rounded-2xl rounded-tr-md bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground">
                {m.text}
              </div>
            </div>
          ),
        )}

        {/* quick replies */}
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <div className="w-[78%] rounded-2xl rounded-tl-md border border-border bg-card p-2">
            <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Sugestões rápidas</p>
            <div className="space-y-1">
              {SUGGESTIONS.map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => send(label)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm text-card-foreground transition-colors hover:bg-accent"
                >
                  <Icon className="size-4 text-primary" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* input */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
        className="flex items-center gap-2 px-5 pb-2 pt-3"
      >
        <div className="flex flex-1 items-center rounded-full border border-border bg-card px-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escreva uma mensagem..."
            aria-label="Mensagem"
            className="w-full bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <button
          type="submit"
          aria-label="Enviar mensagem"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95"
        >
          <Send className="size-5" aria-hidden="true" />
        </button>
      </form>
    </div>
  )
}
