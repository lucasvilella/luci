/**
 * ITTSProvider.ts
 *
 * Contract for all TTS Providers (Gemini, Qwen, ElevenLabs, etc.)
 */

export interface TTSRequestOptions {
  requestId: string;
  responseId?: string;
  chunkId?: number;
  text: string;
  signal?: AbortSignal;
}

export interface TTSAudioResult {
  requestId: string;
  chunkId?: number;
  audioBuffer: ArrayBuffer | Buffer;
  mimeType: string;
  timeToFirstAudioMs: number;
  totalLatencyMs: number;
  providerName: string;
}

export interface ITTSProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  synthesize(options: TTSRequestOptions): Promise<TTSAudioResult>;
  cancel(requestId: string): void;
}
