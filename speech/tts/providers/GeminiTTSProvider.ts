/**
 * GeminiTTSProvider.ts
 *
 * Cloud Gemini TTS Provider with latency tracking, cancellation, and error handling.
 */

import { ITTSProvider, TTSRequestOptions, TTSAudioResult } from './ITTSProvider';
import { LUCI_VOICE_PROFILE } from '../LuciVoiceProfile';
// @ts-ignore
import gTTS from 'node-gtts';

export class GeminiTTSProvider implements ITTSProvider {
  public name = 'GeminiTTS';
  private activeRequests: Map<string, AbortController> = new Map();

  public async isAvailable(): Promise<boolean> {
    const apiKey = process.env.GEMINI_API_KEY;
    return Boolean(apiKey && apiKey.length > 5);
  }

  public async synthesize(options: TTSRequestOptions): Promise<TTSAudioResult> {
    const startTime = Date.now();
    const abortController = new AbortController();
    this.activeRequests.set(options.requestId, abortController);

    try {
      const cleanText = options.text
        .replace(/[*_#`~>]/g, '')
        .replace(/L\.U\.C\.I\./gi, 'Lucy')
        .replace(/L\.U\.C\.I/gi, 'Lucy')
        .replace(/\bLuci\b/gi, 'Lucy')
        .trim();

      // Measure Time To First Audio (TTFA)
      const ttfaStart = Date.now();
      
      const audioBuffer = await this.fetchGeminiAudio(cleanText, abortController.signal);
      
      const ttfaMs = Date.now() - ttfaStart;
      const totalLatencyMs = Date.now() - startTime;

      this.activeRequests.delete(options.requestId);

      return {
        requestId: options.requestId,
        chunkId: options.chunkId,
        audioBuffer,
        mimeType: 'audio/mp3',
        timeToFirstAudioMs: ttfaMs,
        totalLatencyMs,
        providerName: this.name,
      };
    } catch (error: any) {
      this.activeRequests.delete(options.requestId);
      throw new Error(`[GeminiTTSProvider] Synthesis failed: ${error.message}`);
    }
  }

  public cancel(requestId: string): void {
    const controller = this.activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestId);
      console.log(`[GeminiTTSProvider] Request ${requestId} cancelled.`);
    }
  }

  private async fetchGeminiAudio(text: string, signal: AbortSignal): Promise<Buffer> {
    const googleTTS = await import('google-tts-api');
    
    if (signal.aborted) {
      throw new Error('Aborted');
    }

    const results = await googleTTS.getAllAudioBase64(text, {
      lang: 'pt',
      slow: false,
      host: 'https://translate.google.com',
      timeout: 10000,
    });

    const buffers = results.map(item => Buffer.from(item.base64, 'base64'));
    return Buffer.concat(buffers);
  }
}
