/**
 * EdgeTTSProvider.ts
 *
 * Microsoft Edge Neural TTS Provider for Luci
 * Ultra-fluent, natural, 100% native Brazilian Portuguese voice engine.
 * Zero cost, no API keys, fast response times.
 */

import dotenv from 'dotenv';
import { ITTSProvider, TTSRequestOptions, TTSAudioResult } from './ITTSProvider';
import { EdgeTTS } from 'node-edge-tts';
import fs from 'fs';
import path from 'path';
import os from 'os';

export class EdgeTTSProvider implements ITTSProvider {
  public name = 'EdgeTTS';
  private activeRequests: Map<string, AbortController> = new Map();

  public async isAvailable(): Promise<boolean> {
    return true; // Always available online
  }

  public async synthesize(options: TTSRequestOptions): Promise<TTSAudioResult> {
    dotenv.config({ override: true });
    const startTime = Date.now();
    const controller = new AbortController();
    this.activeRequests.set(options.requestId, controller);

    const voice = process.env.EDGE_VOICE || 'pt-BR-FranciscaNeural'; // Premium Brazilian Female Voice (Francisca Fallback)
    const tempFile = path.join(os.tmpdir(), `edge_tts_${options.requestId}_${Date.now()}.mp3`);

    try {
      const cleanText = options.text
        .replace(/[*_#`~>]/g, '')
        .replace(/L\.U\.C\.I\./gi, 'Lucy')
        .replace(/L\.U\.C\.I/gi, 'Lucy')
        .replace(/\bLuci\b/gi, 'Lucy')
        .trim();

      const ttfaStart = Date.now();

      const rate = process.env.EDGE_RATE || '+0%';     // Ex: '+10%', '-5%'
      const pitch = process.env.EDGE_PITCH || '+0Hz';   // Ex: '+20Hz', '-15Hz'
      const volume = process.env.EDGE_VOLUME || '+0%';  // Ex: '+10%'

      const tts = new EdgeTTS({
        voice,
        lang: 'pt-BR',
        rate,
        pitch,
        volume,
        outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
      });

      await tts.ttsPromise(cleanText, tempFile);

      if (controller.signal.aborted) {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        throw new Error('Aborted');
      }

      const audioBuffer = fs.readFileSync(tempFile);
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);

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
      if (fs.existsSync(tempFile)) {
        try { fs.unlinkSync(tempFile); } catch { }
      }
      this.activeRequests.delete(options.requestId);
      throw new Error(`[EdgeTTSProvider] Synthesis failed: ${error.message}`);
    }
  }

  public cancel(requestId: string): void {
    const controller = this.activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestId);
      console.log(`[EdgeTTSProvider] Request ${requestId} cancelled.`);
    }
  }
}
