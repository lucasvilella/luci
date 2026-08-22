/**
 * XTTSProvider.ts
 *
 * Official Primary Voice Provider for Luci (Cloned Lucy Voice - XTTS-v2).
 *
 * Architecture:
 *   1. Primary: HTTP service (xtts_server.py on port 8002) with preloaded model
 *   2. Supports pipelined sentence-by-sentence synthesis via /tts/sentence
 *   3. Supports SSE streaming via /tts/stream for instant TTFA
 *   4. Fallback: Direct Python runner (slow, only for offline/emergency)
 */

import dotenv from 'dotenv';
import { ITTSProvider, TTSRequestOptions, TTSAudioResult } from './ITTSProvider';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export interface XTTSSentenceResult {
  index: number;
  total: number;
  text: string;
  audioBuffer: Buffer;
  synthesisMs: number;
  cached: boolean;
}

export class XTTSProvider implements ITTSProvider {
  public name = 'XTTS';
  private activeRequests: Map<string, AbortController> = new Map();
  private baseUrl: string = '';

  private getBaseUrl(): string {
    if (!this.baseUrl) {
      dotenv.config({ override: true });
      this.baseUrl = process.env.XTTS_URL || 'http://localhost:8002';
    }
    return this.baseUrl;
  }

  public async isAvailable(): Promise<boolean> {
    const url = this.getBaseUrl();

    // 1. Check HTTP server first (fast path)
    try {
      const res = await fetch(`${url}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) {
        const data = await res.json() as any;
        return data.preloaded === true;
      }
    } catch {
      // Server not running
    }

    // 2. Check local Python engine fallback
    dotenv.config({ override: true });
    const pythonPath = process.env.PYTHON_PATH || 'E:\\system\\python310\\python.exe';
    const refPath = path.resolve(process.cwd(), 'lucy_best_ref_24k.wav');
    return fs.existsSync(pythonPath) && fs.existsSync(refPath);
  }

  /**
   * Standard synthesis — sends full text to /tts endpoint.
   * For streaming, use synthesizeStreaming() instead.
   */
  public async synthesize(options: TTSRequestOptions): Promise<TTSAudioResult> {
    const startTime = Date.now();
    const controller = new AbortController();
    this.activeRequests.set(options.requestId, controller);
    const url = this.getBaseUrl();

    try {
      const cleanText = this.cleanText(options.text);
      const ttfaStart = Date.now();

      // Try HTTP Service first
      try {
        const response = await fetch(`${url}/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleanText,
            speed: 1.13,
            temperature: 0.65,
            repetition_penalty: 3.5,
            top_k: 50,
            top_p: 0.70,
          }),
          signal: controller.signal,
        });

        if (response.ok) {
          const arrayBuf = await response.arrayBuffer();
          const audioBuffer = Buffer.from(arrayBuf);
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
        }
      } catch {
        // Fallback to direct Python runner
      }

      // Direct Python Runner Fallback (slow, emergency only)
      return await this.synthesizeViaPython(options, startTime, ttfaStart);
    } catch (error: any) {
      this.activeRequests.delete(options.requestId);
      throw new Error(`[XTTSProvider] Synthesis failed: ${error.message}`);
    }
  }

  /**
   * Pipelined sentence-by-sentence synthesis via /tts/sentence.
   * Calls onSentenceReady() for each sentence as soon as it's synthesized.
   * The caller can start playing audio immediately while the next sentence is being synthesized.
   */
  public async synthesizePipelined(
    text: string,
    requestId: string,
    onSentenceReady: (result: XTTSSentenceResult) => void,
  ): Promise<void> {
    const url = this.getBaseUrl();
    const cleanText = this.cleanText(text);

    // Split into sentences (mirrors server-side logic)
    const sentences = this.splitIntoSentences(cleanText);

    for (let idx = 0; idx < sentences.length; idx++) {
      const sentence = sentences[idx];
      const isLast = idx === sentences.length - 1;
      const start = Date.now();

      const response = await fetch(`${url}/tts/sentence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sentence,
          speed: 1.13,
          temperature: 0.65,
          repetition_penalty: 3.5,
          top_k: 50,
          top_p: 0.70,
          is_last: isLast,
        }),
      });

      if (!response.ok) {
        throw new Error(`[XTTSProvider] Sentence synthesis HTTP ${response.status}`);
      }

      const arrayBuf = await response.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuf);

      onSentenceReady({
        index: idx,
        total: sentences.length,
        text: sentence,
        audioBuffer,
        synthesisMs: Date.now() - start,
        cached: false,
      });
    }
  }

  /**
   * Request warmup of common phrases into the server's cache.
   * Call this once after the XTTS server is confirmed available.
   */
  public async warmupCache(phrases?: string[]): Promise<void> {
    const url = this.getBaseUrl();
    try {
      await fetch(`${url}/tts/warmup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phrases: phrases || [
            'Hum.',
            'Sei.',
            'Ah, sim.',
            'Entendido.',
            'Certo.',
            'Um momento.',
            'Deixa eu ver.',
            'Com certeza.',
            'Pronto.',
            'Perfeito.',
          ],
        }),
      });
      console.log('[XTTSProvider] ✅ Warmup cache request sent for conversational backchannels.');
    } catch {
      console.warn('[XTTSProvider] Warmup cache failed (server may not be running).');
    }
  }

  public cancel(requestId: string): void {
    const controller = this.activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestId);
      console.log(`[XTTSProvider] Request ${requestId} cancelled.`);
    }
  }

  // ─── Private Helpers ───

  private cleanText(text: string): string {
    return text
      .replace(/[*_#`~>]/g, '')
      .replace(/L\.U\.C\.I\./gi, 'Luci')
      .replace(/L\.U\.C\.I/gi, 'Luci')
      .trim();
  }

  private splitIntoSentences(text: string): string[] {
    const raw = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
    const merged: string[] = [];
    let buffer = '';

    for (const s of raw) {
      buffer = buffer ? `${buffer} ${s}` : s;
      if (buffer.split(/\s+/).length >= 3 && buffer.length >= 14) {
        merged.push(buffer);
        buffer = '';
      }
    }

    if (buffer) {
      if (merged.length > 0) {
        merged[merged.length - 1] = `${merged[merged.length - 1]} ${buffer}`;
      } else {
        merged.push(buffer);
      }
    }

    return merged;
  }

  private async synthesizeViaPython(
    options: TTSRequestOptions,
    startTime: number,
    ttfaStart: number,
  ): Promise<TTSAudioResult> {
    dotenv.config({ override: true });
    const pythonPath = process.env.PYTHON_PATH || 'E:\\system\\python310\\python.exe';
    const scriptPath = path.resolve(process.cwd(), 'gerar_voz_luci.py');

    const cmd = `"${pythonPath}" "${scriptPath}"`;
    await execAsync(cmd, { cwd: process.cwd(), timeout: 120000 });

    const resultFile = path.resolve(process.cwd(), 'luci_resultado.wav');
    if (fs.existsSync(resultFile)) {
      const audioBuffer = fs.readFileSync(resultFile);
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
        providerName: `${this.name} (Python Fallback)`,
      };
    }

    throw new Error('XTTS direct generation output file not found');
  }
}
