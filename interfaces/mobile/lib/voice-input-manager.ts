/**
 * VoiceInputManager — Gerenciador Unificado de Áudio, STT, Wake Word Local (Porcupine) e Ducking Suave.
 * Conforme docs/99_RULES/NON_NEGOTIABLES.md e STATE_MACHINE.md:
 * - Compartilha um único AudioContext e GainNode com todo o sistema (Música, Orb e Chat).
 * - Suporta escuta de Wake Word ("Hey Luci" / Porcupine local).
 * - Fornece suporte unificado a reconhecimento de fala (STT) para evitar instâncias concorrentes.
 */

export type WakeWordCallback = () => void
export type SpeechResultCallback = (transcript: string, isFinal: boolean) => void
export type SpeechEndCallback = () => void

export type VoiceContext = "orb" | "music" | "chat"

class VoiceInputManager {
  private static instance: VoiceInputManager | null = null
  private audioContext: AudioContext | null = null
  private musicGainNode: GainNode | null = null
  private porcupineWorker: any = null
  private isInitialized = false
  private isListening = false
  
  // Arbitragem de contexto ativo
  private activeContext: VoiceContext | null = null
  private contextCallbacks: Map<VoiceContext, WakeWordCallback> = new Map()

  // STT Unificado (SpeechRecognition)
  private recognition: any = null
  private onSpeechResultCallback: SpeechResultCallback | null = null
  private onSpeechEndCallback: SpeechEndCallback | null = null
  private isRecognitionActive = false

  public constructor() {}

  public static getInstance(): VoiceInputManager {
    if (!VoiceInputManager.instance) {
      VoiceInputManager.instance = new VoiceInputManager()
    }
    return VoiceInputManager.instance
  }

  /**
   * Define qual tela ou componente está ativo no primeiro plano.
   */
  public setActiveContext(context: VoiceContext | null): void {
    this.activeContext = context
    console.log(`[VoiceInputManager] Contexto de voz ativo definido para: ${context}`)
  }

  public getActiveContext(): VoiceContext | null {
    return this.activeContext
  }

  /**
   * Obtém ou inicializa o AudioContext compartilhado para todas as interfaces de áudio.
   */
  public getAudioContext(): AudioContext {
    if (typeof window === "undefined") return null as any
    if (!this.audioContext || this.audioContext.state === "closed") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        this.audioContext = new AudioCtx()
      }
    }
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume().catch(() => {})
    }
    return this.audioContext as AudioContext
  }

  public getMusicGainNode(): GainNode {
    const ctx = this.getAudioContext()
    if (!this.musicGainNode && ctx) {
      this.musicGainNode = ctx.createGain()
      this.musicGainNode.connect(ctx.destination)
    }
    return this.musicGainNode as GainNode
  }

  /**
   * Registra um callback para quando a wake word for detectada para um contexto específico.
   */
  public registerWakeWordHandler(context: VoiceContext, callback: WakeWordCallback): () => void {
    this.contextCallbacks.set(context, callback)
    return () => {
      if (this.contextCallbacks.get(context) === callback) {
        this.contextCallbacks.delete(context)
      }
      if (this.activeContext === context) {
        this.activeContext = null
      }
    }
  }

  /**
   * Método de compatibilidade: registra para o contexto atual ou "orb".
   */
  public onWakeWord(callback: WakeWordCallback, context: VoiceContext = "orb"): () => void {
    return this.registerWakeWordHandler(context, callback)
  }

  /**
   * Dispara a wake word APENAS para o contexto ativo em primeiro plano.
   */
  private triggerWakeWord() {
    const targetContext = this.activeContext || "orb"
    const handler = this.contextCallbacks.get(targetContext)
    
    if (handler) {
      console.log(`[VoiceInputManager] Disparando Wake Word exclusivamente para o contexto ativo: ${targetContext}`)
      try {
        handler()
      } catch (err) {
        console.error(`[VoiceInputManager] Erro no handler de wake word (${targetContext}):`, err)
      }
    } else {
      console.log(`[VoiceInputManager] Wake Word detectada, mas nenhum handler ativo para contexto '${targetContext}'.`)
    }
  }

  /**
   * Inicializa o Porcupine Worker e o WebVoiceProcessor com chave de acesso Picovoice.
   */
  public async init(accessKey?: string, customKeywordPath?: string): Promise<void> {
    if (this.isInitialized) return

    const key = accessKey || process.env.NEXT_PUBLIC_PICOVOICE_ACCESS_KEY || ""

    try {
      if (key && typeof window !== "undefined") {
        const { PorcupineWorker } = await import("@picovoice/porcupine-web")
        const { WebVoiceProcessor } = await import("@picovoice/web-voice-processor")

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
   * Retorna se a Wake Word por hardware/WASM local está disponível.
   */
  public hasLocalWakeWord(): boolean {
    return Boolean(this.porcupineWorker && this.isListening)
  }

  /**
   * Desbloqueia o AudioContext no primeiro gesto do usuário (requisito Android/iOS PWA).
   */
  public unlockAudio(): void {
    if (typeof window === "undefined") return
    try {
      const ctx = this.getAudioContext()
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {})
      }
    } catch {}
  }

  /**
   * Inicia o reconhecimento de fala unificado (STT) com buffer cumulativo resiliente para Mobile PWA.
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
      this.recognition.maxAlternatives = 1

      this.onSpeechResultCallback = onResult
      this.onSpeechEndCallback = onEnd || null

      let accumulatedFinalText = ""

      this.recognition.onresult = (event: any) => {
        let currentInterim = ""

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i]
          if (item.isFinal) {
            accumulatedFinalText += " " + item[0].transcript
          } else {
            currentInterim += item[0].transcript
          }
        }

        const fullText = (accumulatedFinalText + " " + currentInterim).replace(/\s+/g, " ").trim()
        const isFinal = Boolean(accumulatedFinalText.trim() && !currentInterim.trim())

        if (this.onSpeechResultCallback && fullText) {
          this.onSpeechResultCallback(fullText, isFinal)
        }
      }

      this.recognition.onerror = (e: any) => {
        // Ignora erros comuns inofensivos de interrupção (ex: 'no-speech' ou 'aborted')
        if (e.error !== "no-speech" && e.error !== "aborted") {
          console.warn("[VoiceInputManager] SpeechRecognition:", e.error)
        }
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
        if (typeof window !== "undefined") {
          const { WebVoiceProcessor } = await import("@picovoice/web-voice-processor")
          await WebVoiceProcessor.unsubscribe(this.porcupineWorker)
        }
        await this.porcupineWorker.release()
      } catch {}
      this.porcupineWorker = null
    }
    this.isListening = false
    this.isInitialized = false
  }
}

export function getVoiceInputManager(): VoiceInputManager {
  return VoiceInputManager.getInstance()
}

// Proxy seguro para acesso transparente e lazy à instância única
export const voiceInputManager: VoiceInputManager = new Proxy({} as VoiceInputManager, {
  get(_target, prop: keyof VoiceInputManager) {
    const instance = VoiceInputManager.getInstance()
    const value = instance[prop]
    if (typeof value === "function") {
      return value.bind(instance)
    }
    return value
  },
})
