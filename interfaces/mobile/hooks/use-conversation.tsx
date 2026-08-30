"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { luciApiFetch } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { useAppNavigationStore } from "@/stores/useAppNavigationStore"
import { useMusicPlayer } from "@/hooks/use-music-player"

export type InputType = "text" | "voice" | "interpreter"

export type UnifiedMessage = {
  id: string | number
  role: "user" | "assistant" | "system"
  inputType: InputType
  content: string
  audioFilePath?: string
  audioBase64?: string
  createdAt?: number
}

type ConversationContextValue = {
  messages: UnifiedMessage[]
  isProcessing: boolean
  sendTextMessage: (text: string) => Promise<string>
  sendVoiceMessage: (text: string, voice?: string) => Promise<{ reply: string; audioBase64?: string }>
  uploadFile: (file: File, message?: string) => Promise<string>
  clearConversation: () => Promise<void>
  refreshHistory: () => Promise<void>
}

const ConversationContext = createContext<ConversationContextValue | null>(null)

export function ConversationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.username || "lucas"

  const [messages, setMessages] = useState<UnifiedMessage[]>([])
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  // Carrega histórico unificado do backend
  const refreshHistory = useCallback(async () => {
    try {
      const res = await luciApiFetch(`/api/v1/chat/history?userId=${encodeURIComponent(userId)}`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(
            data.messages.map((m: any) => ({
              id: m.id,
              role: m.role,
              inputType: m.inputType || "text",
              content: m.content,
              audioFilePath: m.audioFilePath,
              createdAt: m.createdAt,
            }))
          )
        } else {
          // Mensagem inicial de boas-vindas padrão se histórico estiver vazio
          setMessages([
            {
              id: "init_1",
              role: "assistant",
              inputType: "text",
              content: `Olá, ${user?.name ? user.name.split(" ")[0] : "Lucas"}! Como posso te ajudar hoje? Você pode falar comigo por voz ou digitar aqui no chat.`,
              createdAt: Date.now(),
            },
          ])
        }
      }
    } catch (err) {
      console.warn("[ConversationBrain] Falha ao carregar histórico:", err)
    }
  }, [userId, user?.name])

  useEffect(() => {
    refreshHistory()

    // Pré-carregamento silencioso do feed do LuciMusic em background (0ms no primeiro clique)
    if (typeof window !== "undefined") {
      import("@/lib/lucimusic").then(({ fetchMusicHome }) => {
        fetchMusicHome()
          .then((data) => {
            try {
              localStorage.setItem("lucimusic_feed_v1", JSON.stringify(data))
            } catch {}
          })
          .catch(() => {})
      })
    }
  }, [refreshHistory])

  // ─── Enviar Mensagem de Texto (Aba Chat) ───
  const sendTextMessage = useCallback(
    async (text: string): Promise<string> => {
      const trimmed = text.trim()
      if (!trimmed || isProcessing) return ""

      const tempUserMsg: UnifiedMessage = {
        id: `temp_${Date.now()}`,
        role: "user",
        inputType: "text",
        content: trimmed,
        createdAt: Date.now(),
      }

      setMessages((prev) => [...prev, tempUserMsg])
      setIsProcessing(true)

      try {
        const res = await luciApiFetch("/api/v1/chat/text", {
          method: "POST",
          body: JSON.stringify({ message: trimmed, userId }),
        })

        if (!res.ok) throw new Error("Erro ao processar mensagem")
        const data = await res.json()

        const botMsg: UnifiedMessage = {
          id: data.assistant_message?.id || `bot_${Date.now()}`,
          role: "assistant",
          inputType: "text",
          content: data.reply || "Resposta recebida.",
          createdAt: Date.now(),
        }

        setMessages((prev) => [...prev, botMsg])

        // ─── Despacho Automático de Ação no App (Navegação / Música / Automação) ───
        if (data.intent) {
          const { appActionDispatcher } = await import("@/lib/app-action-dispatcher")
          appActionDispatcher.dispatchIntent(data.intent, trimmed)
        }

        return data.reply
      } catch (err) {
        console.error("[ConversationBrain] Erro no chat:", err)
        const errorMsg: UnifiedMessage = {
          id: `err_${Date.now()}`,
          role: "assistant",
          inputType: "text",
          content: "Desculpe, ocorreu uma oscilação na conexão com o cérebro da Luci.",
          createdAt: Date.now(),
        }
        setMessages((prev) => [...prev, errorMsg])
        return ""
      } finally {
        setIsProcessing(false)
      }
    },
    [isProcessing, userId]
  )

  // ─── Enviar Mensagem de Voz (Aba Voice Orb) ───
  const sendVoiceMessage = useCallback(
    async (text: string, voice = "pt-BR-ThalitaNeural"): Promise<{ reply: string; audioBase64?: string }> => {
      const trimmed = text.trim()
      if (!trimmed || isProcessing) return { reply: "" }

      const tempUserMsg: UnifiedMessage = {
        id: `temp_voice_${Date.now()}`,
        role: "user",
        inputType: "voice",
        content: trimmed,
        createdAt: Date.now(),
      }

      setMessages((prev) => [...prev, tempUserMsg])
      setIsProcessing(true)

      try {
        const res = await luciApiFetch("/api/v1/chat/voice", {
          method: "POST",
          body: JSON.stringify({ message: trimmed, userId, voice, generateAudio: true }),
        })

        if (!res.ok) throw new Error("Erro no processamento de voz")
        const data = await res.json()

        const botMsg: UnifiedMessage = {
          id: data.assistant_message?.id || `bot_voice_${Date.now()}`,
          role: "assistant",
          inputType: "voice",
          content: data.reply,
          audioBase64: data.audio_base64,
          createdAt: Date.now(),
        }

        setMessages((prev) => [...prev, botMsg])

        // ─── Despacho Automático de Ação no App (Navegação / Música / Automação) ───
        if (data.intent) {
          const { appActionDispatcher } = await import("@/lib/app-action-dispatcher")
          appActionDispatcher.dispatchIntent(data.intent, trimmed)
        }

        return { reply: data.reply, audioBase64: data.audio_base64 }
      } catch (err) {
        console.error("[ConversationBrain] Erro na voz:", err)
        return { reply: "Desculpe, ocorreu um erro ao processar sua voz." }
      } finally {
        setIsProcessing(false)
      }
    },
    [isProcessing, userId]
  )

  // ─── Enviar Arquivo / Multimodal ───
  const uploadFile = useCallback(
    async (file: File, message = "Analise o arquivo anexo."): Promise<string> => {
      if (!file || isProcessing) return ""

      const tempUserMsg: UnifiedMessage = {
        id: `temp_file_${Date.now()}`,
        role: "user",
        inputType: "text",
        content: `[Anexo enviado: ${file.name}] ${message}`,
        createdAt: Date.now(),
      }

      setMessages((prev) => [...prev, tempUserMsg])
      setIsProcessing(true)

      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("message", message)
        formData.append("userId", userId)

        const res = await luciApiFetch("/api/v1/chat/upload", {
          method: "POST",
          body: formData,
        })

        if (!res.ok) throw new Error("Erro ao fazer upload do arquivo")
        const data = await res.json()

        const botMsg: UnifiedMessage = {
          id: data.assistant_message?.id || `bot_file_${Date.now()}`,
          role: "assistant",
          inputType: "text",
          content: data.reply || "Arquivo recebido e analisado.",
          createdAt: Date.now(),
        }

        setMessages((prev) => [...prev, botMsg])
        return data.reply
      } catch (err) {
        console.error("[ConversationBrain] Erro no upload:", err)
        return ""
      } finally {
        setIsProcessing(false)
      }
    },
    [isProcessing, userId]
  )

  // ─── Limpar Conversa ───
  const clearConversation = useCallback(async () => {
    try {
      await luciApiFetch("/api/v1/chat/history", { method: "DELETE" })
      setMessages([])
    } catch {}
  }, [])

  const value = useMemo<ConversationContextValue>(
    () => ({
      messages,
      isProcessing,
      sendTextMessage,
      sendVoiceMessage,
      uploadFile,
      clearConversation,
      refreshHistory,
    }),
    [messages, isProcessing, sendTextMessage, sendVoiceMessage, uploadFile, clearConversation, refreshHistory]
  )

  return <ConversationContext.Provider value={value}>{children}</ConversationContext.Provider>
}

export function useConversation() {
  const ctx = useContext(ConversationContext)
  if (!ctx) throw new Error("useConversation deve ser usado dentro de ConversationProvider")
  return ctx
}
