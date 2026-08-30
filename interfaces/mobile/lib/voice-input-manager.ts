/**
 * VoiceInputManager — Gerenciador Universal de Áudio, Gravação (MediaRecorder), STT e Volume Meter.
 * Funciona 100% no Android Studio (Capacitor), Chrome Mobile, PWA e Desktop.
 */

export type WakeWordCallback = () => void
export type SpeechResultCallback = (transcript: string, isFinal: boolean) => void
export type SpeechEndCallback = () => void
export type VolumeChangeCallback = (volume: number) => void

export type VoiceContext = "orb" | "music" | "chat"

class VoiceInputManager {
  private static instance: VoiceInputManager | null = null
  private audioContext: AudioContext | null = null
  private musicGainNode: GainNode | null = null
  private mediaStream: MediaStream | null = null
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private isInitialized = false
  private isListening = false
  private isRecording = false

  // Medição de volume em tempo real (RMS Analyzer)
  private analyserNode: AnalyserNode | null = null
  private animationFrameId: number | null = null
  private onVolumeChangeCallback: VolumeChangeCallback | null = null

  // Arbitragem de contexto ativo
  private activeContext: VoiceContext | null = null
  private contextCallbacks: Map<VoiceContext, WakeWordCallback> = new Map()

  // STT Nativo (Web Speech API como prévia rápida quando disponível)
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

  public setActiveContext(context: VoiceContext | null): void {
    this.activeContext = context
    console.log(`[VoiceInputManager] Contexto ativo: ${context}`)
  }

  public getActiveContext(): VoiceContext | null {
    return this.activeContext
  }

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

  public onWakeWord(callback: WakeWordCallback, context: VoiceContext = "orb"): () => void {
    return this.registerWakeWordHandler(context, callback)
  }

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
   * Inicia a captura universal de áudio do microfone via MediaRecorder com analisador de volume.
   */
  public async startRecording(onVolumeChange?: VolumeChangeCallback): Promise<boolean> {
    if (typeof window === "undefined") return false
    this.unlockAudio()
    this.duckAudio(0.15)

    this.onVolumeChangeCallback = onVolumeChange || null
    this.audioChunks = []

    try {
      // 1. Obtém permissão do microfone via getUserMedia
      if (!this.mediaStream || !this.mediaStream.active) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })
      }

      // 2. Conecta AudioContext ao AnalyserNode para medir volume em tempo real
      const ctx = this.getAudioContext()
      if (ctx && this.mediaStream) {
        try {
          const source = ctx.createMediaStreamSource(this.mediaStream)
          this.analyserNode = ctx.createAnalyser()
          this.analyserNode.fftSize = 256
          source.connect(this.analyserNode)
          this.startVolumeMonitoring()
        } catch (e) {
          console.warn("[VoiceInputManager] Não foi possível conectar analyser:", e)
        }
      }

      // 3. Inicializa MediaRecorder com o formato mais compatível
      const mimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac", "audio/ogg"]
      let selectedMime = ""
      for (const m of mimeTypes) {
        if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) {
          selectedMime = m
          break
        }
      }

      const options = selectedMime ? { mimeType: selectedMime } : undefined
      this.mediaRecorder = new MediaRecorder(this.mediaStream, options)

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.start(100) // Coleta chunks a cada 100ms
      this.isRecording = true
      this.isListening = true

      return true
    } catch (err) {
      console.error("[VoiceInputManager] Erro ao acessar microfone:", err)
      this.restoreAudio()
      return false
    }
  }

  /**
   * Monitora o volume do áudio do microfone em tempo real e dispara callbacks.
   */
  private startVolumeMonitoring() {
    if (!this.analyserNode) return

    const bufferLength = this.analyserNode.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const update = () => {
      if (!this.isRecording || !this.analyserNode) return

      this.analyserNode.getByteFrequencyData(dataArray)
      let sum = 0
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i]
      }
      const average = sum / bufferLength
      const normalizedVolume = Math.min(1.0, average / 128.0)

      if (this.onVolumeChangeCallback) {
        this.onVolumeChangeCallback(normalizedVolume)
      }

      this.animationFrameId = requestAnimationFrame(update)
    }

    this.animationFrameId = requestAnimationFrame(update)
  }

  /**
   * Finaliza a gravação e retorna o Blob de áudio gravado pronto para envio ao Whisper STT.
   */
  public async stopRecording(): Promise<Blob | null> {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    this.restoreAudio()
    this.isRecording = false
    this.isListening = false

    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
        resolve(this.audioChunks.length > 0 ? new Blob(this.audioChunks, { type: "audio/webm" }) : null)
        return
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || "audio/webm"
        const blob = new Blob(this.audioChunks, { type: mimeType })
        this.audioChunks = []
        resolve(blob.size > 200 ? blob : null)
      }

      try {
        this.mediaRecorder.stop()
      } catch {
        resolve(null)
      }
    })
  }

  public isCurrentlyRecording(): boolean {
    return this.isRecording
  }

  /**
   * Inicia o reconhecimento de fala Web Speech API nativo (modo híbrido para prévias).
   */
  public startSpeechRecognition(
    onResult: SpeechResultCallback,
    onEnd?: SpeechEndCallback,
    continuous = true
  ): boolean {
    if (typeof window === "undefined") return false

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
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

      this.recognition.onerror = () => {}

      this.recognition.onend = () => {
        this.isRecognitionActive = false
        if (this.onSpeechEndCallback) {
          this.onSpeechEndCallback()
        }
      }

      this.recognition.start()
      this.isRecognitionActive = true
      return true
    } catch {
      this.isRecognitionActive = false
      return false
    }
  }

  public stopSpeechRecognition(): void {
    if (this.recognition && this.isRecognitionActive) {
      try {
        this.recognition.stop()
      } catch {}
    }
    this.recognition = null
    this.isRecognitionActive = false
  }

  public duckAudio(targetLevel = 0.15, rampMs = 150): void {
    try {
      const ctx = this.getAudioContext()
      const gainNode = this.getMusicGainNode()
      const now = ctx.currentTime
      gainNode.gain.cancelScheduledValues(now)
      gainNode.gain.setValueAtTime(gainNode.gain.value, now)
      gainNode.gain.linearRampToValueAtTime(targetLevel, now + rampMs / 1000)
    } catch {}
  }

  public restoreAudio(rampMs = 150): void {
    try {
      const ctx = this.getAudioContext()
      const gainNode = this.getMusicGainNode()
      const now = ctx.currentTime
      gainNode.gain.cancelScheduledValues(now)
      gainNode.gain.setValueAtTime(gainNode.gain.value, now)
      gainNode.gain.linearRampToValueAtTime(1.0, now + rampMs / 1000)
    } catch {}
  }

  public async stop(): Promise<void> {
    this.stopSpeechRecognition()
    await this.stopRecording()
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop())
      this.mediaStream = null
    }
    this.isListening = false
    this.isInitialized = false
  }
}

export function getVoiceInputManager(): VoiceInputManager {
  return VoiceInputManager.getInstance()
}

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
