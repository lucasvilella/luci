/**
 * KokoroFastAPIProvider.ts
 *
 * Integration with Kokoro-FastAPI (https://github.com/remsky/Kokoro-FastAPI).
 * Full support for Portuguese (pf_dora, pm_alex, etc.) with OpenAI-compatible API.
 */

import dotenv from 'dotenv';
import { ITTSProvider, TTSRequestOptions, TTSAudioResult } from './ITTSProvider';

export class KokoroFastAPIProvider implements ITTSProvider {
  public name = 'KokoroFastAPI';
  private activeRequests: Map<string, AbortController> = new Map();

  public async isAvailable(): Promise<boolean> {
    dotenv.config({ override: true });
    const baseUrl = process.env.KOKORO_FASTAPI_URL || 'http://localhost:8880';
    try {
      const res = await fetch(`${baseUrl}/v1/models`, { method: 'GET', signal: AbortSignal.timeout(2000) });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async synthesize(options: TTSRequestOptions): Promise<TTSAudioResult> {
    dotenv.config({ override: true });
    const startTime = Date.now();
    const controller = new AbortController();
    this.activeRequests.set(options.requestId, controller);

    const baseUrl = process.env.KOKORO_FASTAPI_URL || 'http://localhost:8880';
    const voice = process.env.KOKORO_VOICE || 'pf_dora'; // Default to Brazilian Portuguese Dora

    try {
      const cleanText = options.text
        .replace(/[*_#`~>]/g, '')
        .replace(/L\.U\.C\.I\./gi, 'Lucy')
        .replace(/L\.U\.C\.I/gi, 'Lucy')
        .replace(/\bLuci\b/gi, 'Lucy')
        .trim();

      const ttfaStart = Date.now();

      const response = await fetch(`${baseUrl}/v1/audio/speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'kokoro',
          input: cleanText,
          voice,
          response_format: 'mp3',
          speed: 1.0,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Kokoro-FastAPI HTTP ${response.status}: ${errorText}`);
      }

      const arrayBuf = await response.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuf);

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
      throw new Error(`[KokoroFastAPIProvider] Synthesis failed: ${error.message}`);
    }
  }

  public cancel(requestId: string): void {
    const controller = this.activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestId);
      console.log(`[KokoroFastAPIProvider] Request ${requestId} cancelled.`);
    }
  }
}
