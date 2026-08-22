/**
 * QwenTTSProvider.ts
 *
 * Local Qwen3-TTS 0.6B HTTP/WebSocket Client Provider with Voice Cloning Reference.
 */

import { ITTSProvider, TTSRequestOptions, TTSAudioResult } from './ITTSProvider';
import { LUCI_VOICE_PROFILE } from '../LuciVoiceProfile';

export class QwenTTSProvider implements ITTSProvider {
  public name = 'Qwen3-TTS-0.6B';
  private host: string;
  private port: number;
  private activeRequests: Map<string, AbortController> = new Map();

  constructor(host?: string, port?: number) {
    this.host = host || process.env.QWEN_TTS_HOST || '127.0.0.1';
    this.port = port || Number(process.env.QWEN_TTS_PORT) || 8001;
  }

  public get baseUrl(): string {
    return `http://${this.host}:${this.port}`;
  }

  public async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { signal: AbortSignal.timeout(1000) });
      if (res.ok) {
        const data = await res.json();
        return data.status === 'ok';
      }
      return false;
    } catch {
      return false;
    }
  }

  public async synthesize(options: TTSRequestOptions): Promise<TTSAudioResult> {
    const startTime = Date.now();
    const controller = new AbortController();
    this.activeRequests.set(options.requestId, controller);

    try {
      const cleanText = options.text
        .replace(/[*_#`~>]/g, '')
        .replace(/L\.U\.C\.I\./gi, 'Lucy')
        .replace(/L\.U\.C\.I/gi, 'Lucy')
        .replace(/\bLuci\b/gi, 'Lucy')
        .trim();

      const ttfaStart = Date.now();

      const response = await fetch(`${this.baseUrl}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          language: LUCI_VOICE_PROFILE.language,
          speaker: LUCI_VOICE_PROFILE.qwen.speaker,
          rate: LUCI_VOICE_PROFILE.rate,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Qwen HTTP ${response.status}: ${response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const ttfaMs = Date.now() - ttfaStart;
      const totalLatencyMs = Date.now() - startTime;

      this.activeRequests.delete(options.requestId);

      return {
        requestId: options.requestId,
        chunkId: options.chunkId,
        audioBuffer,
        mimeType: 'audio/wav',
        timeToFirstAudioMs: ttfaMs,
        totalLatencyMs,
        providerName: this.name,
      };
    } catch (error: any) {
      this.activeRequests.delete(options.requestId);
      throw new Error(`[QwenTTSProvider] Local synthesis failed: ${error.message}`);
    }
  }

  public cancel(requestId: string): void {
    const controller = this.activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestId);
      console.log(`[QwenTTSProvider] Request ${requestId} cancelled.`);
    }
  }
}
