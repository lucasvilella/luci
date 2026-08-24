/**
 * VoiceInputManager — Gerenciador Unificado de Áudio, STT, Wake Word Local (Porcupine) e Ducking Suave.
 * Conforme docs/99_RULES/NON_NEGOTIABLES.md e STATE_MACHINE.md:
 * - Compartilha um único AudioContext e GainNode com todo o sistema (Música, Orb e Chat).
 * - Suporta escuta de Wake Word ("Hey Luci" / Porcupine local).
 * - Fornece suporte unificado a reconhecimento de fala (STT) para evitar instâncias concorrentes.
 */

import { PorcupineWorker } from "@picovoice/porcupine-web"
import { WebVoiceProcessor } from "@picovoice/web-voice-processor"

export type WakeWordCallback = () => void
export type SpeechResultCallback = (transcript: string, isFinal: boolean) => void
export type SpeechEndCallback = () => void

class VoiceInputManager {
  private static instance: VoiceInputManager
  private audioContext: AudioContext | null = null
  private musicGainNode: GainNode | null = null
  private porcupineWorker: PorcupineWorker | null = null
  private isInitialized = false
  private isListening = false
  private wakeWordCallbacks: Set<WakeWordCallback> = new Set()

  // STT Unificado (SpeechRecognition)
  private recognition: any = null
  private onSpeechResultCallback: SpeechResultCallback | null = null
  private onSpeechEndCallback: SpeechEndCallback | null = null
  private isRecognitionActive = false

  private constructor() {}

  public static getInstance(): VoiceInputManager {
    if (!VoiceInputManager.instance) {
      VoiceInputManager.instance = new VoiceInputManager()
    }
    return VoiceInputManager.instance
  }

  /**
   * Obtém ou inicializa o AudioContext compartilhado para todas as interfaces de áudio.
   */
  public getAudioContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === "closed") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      this.audioContext = new AudioCtx()
    }
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume().catch(() => {})
    }
    return this.audioContext
  }

  /**
   * Obtém ou cria o GainNode principal para controle de volume do player de música.
   */
  public getMusicGainNode(): GainNode {
    const ctx = this.getAudioContext()
    if (!this.musicGainNode) {
      this.musicGainNode = ctx.createGain()
      this.musicGainNode.gain.setValueAtTime(1.0, ctx.currentTime)
      this.musicGainNode.connect(ctx.destination)
    }
    return this.musicGainNode
  }

  /**
   * Registra um callback para quando a wake word for detectada.
   */
  public onWakeWord(callback: WakeWordCallback): () => void {
    this.wakeWordCallbacks.add(callback)
    return () => {
      this.wakeWordCallbacks.delete(callback)
    }
  }

  /**
   * Dispara todos os ouvintes da wake word.
   */
  private triggerWakeWord() {
    this.wakeWordCallbacks.forEach((cb) => {
      try {
        cb()
      } catch (err) {
        console.error("[VoiceInputManager] Erro no callback de wake word:", err)
      }
    })
  }

  /**
   * Inicializa o Porcupine Worker e o WebVoiceProcessor com chave de acesso Picovoice.
   */
  public async init(accessKey?: string, customKeywordPath?: string): Promise<void> {
    if (this.isInitialized) return

    const key = accessKey || process.env.NEXT_PUBLIC_PICOVOICE_ACCESS_KEY || ""

    try {
      if (key && typeof window !== "undefined") {
        const keyword = customKeywordPath
          ? { customWritePath: customKeywordPath, label: "Hey Luci" }
          : { builtin: "Porcupine", sensitivity: 0.65 }

        this.porcupineWorker = await PorcupineWorker.create(
          key,
          keyword,
          (keywordLabel: string) => {
            console.log(`[VoiceInputManager] Wake word detectada: ${keywordLabel}`)
            this.triggerWakeWord()
          },
          (error: Error) => {
            console.warn("[VoiceInputManager] Erro no Porcupine Worker:", error)
          }
        )

        await WebVoiceProcessor.subscribe(this.porcupineWorker)
        this.isListening = true
        console.log("[VoiceInputManager] Porcupine Wake Word Engine ativo localmente.")
      } else {
        console.log("[VoiceInputManager] Chave Picovoice não informada. Operando em modo de escuta com ducking via UI.")
      }
    } catch (e) {
      console.warn("[VoiceInputManager] Fallback para modo sem Porcupine WASM:", e)
    }

    this.isInitialized = true
  }

  /**
   * Inicia o reconhecimento de fala unificado (STT) para Orb ou Ditado no Chat.
   */
  public startSpeechRecognition(
    onResult: SpeechResultCallback,
    onEnd?: SpeechEndCallback,
    continuous = true
  ): boolean {
    if (typeof window === "undefined") return false

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn("[VoiceInputManager] SpeechRecognition não suportado pelo navegador.")
      return false
    }

    this.stopSpeechRecognition()

    try {
      this.recognition = new SpeechRecognition()
      this.recognition.lang = "pt-BR"
      this.recognition.continuous = continuous
      this.recognition.interimResults = true

      this.onSpeechResultCallback = onResult
      this.onSpeechEndCallback = onEnd || null

      this.recognition.onresult = (event: any) => {
        let interimTranscript = ""
        let finalTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          } else {
            interimTranscript += event.results[i][0].transcript
          }
        }

        const fullText = (finalTranscript || interimTranscript).trim()
        if (this.onSpeechResultCallback) {
          this.onSpeechResultCallback(fullText, Boolean(finalTranscript))
        }
      }

      this.recognition.onerror = (e: any) => {
        console.warn("[VoiceInputManager] Erro no SpeechRecognition:", e)
      }

      this.recognition.onend = () => {
        this.isRecognitionActive = false
        if (this.onSpeechEndCallback) {
          this.onSpeechEndCallback()
        }
      }

      this.recognition.start()
      this.isRecognitionActive = true
      return true
    } catch (err) {
      console.warn("[VoiceInputManager] Falha ao iniciar SpeechRecognition:", err)
      this.isRecognitionActive = false
      return false
    }
  }

  /**
   * Encerra o reconhecimento de fala ativo.
   */
  public stopSpeechRecognition(): void {
    if (this.recognition && this.isRecognitionActive) {
      try {
        this.recognition.stop()
      } catch {}
    }
    this.recognition = null
    this.isRecognitionActive = false
  }

  /**
   * Realiza ducking de volume suave no áudio via GainNode (sem pausar a mídia).
   */
  public duckAudio(targetLevel = 0.15, rampMs = 150): void {
    try {
      const ctx = this.getAudioContext()
      const gainNode = this.getMusicGainNode()
      const now = ctx.currentTime
      gainNode.gain.cancelScheduledValues(now)
      gainNode.gain.setValueAtTime(gainNode.gain.value, now)
      gainNode.gain.linearRampToValueAtTime(targetLevel, now + rampMs / 1000)
    } catch (e) {
      console.warn("[VoiceInputManager] Falha ao executar duckAudio:", e)
    }
  }

  /**
   * Restaura o volume original do áudio suavemente.
   */
  public restoreAudio(rampMs = 150): void {
    try {
      const ctx = this.getAudioContext()
      const gainNode = this.getMusicGainNode()
      const now = ctx.currentTime
      gainNode.gain.cancelScheduledValues(now)
      gainNode.gain.setValueAtTime(gainNode.gain.value, now)
      gainNode.gain.linearRampToValueAtTime(1.0, now + rampMs / 1000)
    } catch (e) {
      console.warn("[VoiceInputManager] Falha ao executar restoreAudio:", e)
    }
  }

  /**
   * Pausa ou encerra a captura de microfone.
   */
  public async stop(): Promise<void> {
    this.stopSpeechRecognition()
    if (this.porcupineWorker) {
      try {
        await WebVoiceProcessor.unsubscribe(this.porcupineWorker)
        await this.porcupineWorker.release()
      } catch {}
      this.porcupineWorker = null
    }
    this.isListening = false
    this.isInitialized = false
  }
}

export const voiceInputManager = VoiceInputManager.getInstance()
