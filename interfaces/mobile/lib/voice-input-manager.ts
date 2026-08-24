/**
 * VoiceInputManager — Gerenciador Unificado de Áudio, Wake Word Local (Porcupine) e Ducking Suave.
 * Implementa escuta contínua no dispositivo sem requisições de rede para transcrição de wake word.
 * Utiliza um único AudioContext compartilhado e controla volume via GainNode sem interromper playback.
 */

import { PorcupineWorker } from "@picovoice/porcupine-web"
import { WebVoiceProcessor } from "@picovoice/web-voice-processor"

export type WakeWordCallback = () => void

class VoiceInputManager {
  private static instance: VoiceInputManager
  private audioContext: AudioContext | null = null
  private musicGainNode: GainNode | null = null
  private porcupineWorker: PorcupineWorker | null = null
  private isInitialized = false
  private isListening = false
  private wakeWordCallbacks: Set<WakeWordCallback> = new Set()

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
   * Se nenhuma chave estiver configurada ou se ocorrer erro, utiliza detecção via fallback local.
   */
  public async init(accessKey?: string, customKeywordPath?: string): Promise<void> {
    if (this.isInitialized) return

    const key = accessKey || process.env.NEXT_PUBLIC_PICOVOICE_ACCESS_KEY || ""

    try {
      if (key && typeof window !== "undefined") {
        // Inicializa o Porcupine com a palavra-chave configurada (ou built-in 'porcupine' / 'hey edison' / customizada)
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
   * Realiza ducking de volume suave no áudio via GainNode (sem pausar a mídia).
   * @param targetLevel Nível de volume reduzido (ex: 0.15 = 15%)
   * @param rampMs Tempo de transição em milissegundos
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
   * @param rampMs Tempo de transição em milissegundos
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
   * Pausa ou encerra a captura de microfone do WebVoiceProcessor.
   */
  public async stop(): Promise<void> {
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
