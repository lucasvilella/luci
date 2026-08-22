/**
 * KokoroTTSProvider.ts
 *
 * Local ONNX Kokoro-82M Text-To-Speech Provider for Luci
 * Runs 100% offline with zero cloud API dependencies.
 */

import dotenv from 'dotenv';
import { ITTSProvider, TTSRequestOptions, TTSAudioResult } from './ITTSProvider';

function encodeWAV(samples: Float32Array, sampleRate: number = 24000): Buffer {
  const buffer = Buffer.alloc(44 + samples.length * 2);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + samples.length * 2, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // Mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples.length * 2, 40);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(s < 0 ? s * 0x8000 : s * 0x7fff, offset);
  }

  return buffer;
}

export class KokoroTTSProvider implements ITTSProvider {
  public name = 'Kokoro';
  private activeRequests: Map<string, AbortController> = new Map();
  private ttsInstancePromise: Promise<any> | null = null;

  public async isAvailable(): Promise<boolean> {
    return true; // Always available locally
  }

  private async getTTSInstance(): Promise<any> {
    if (!this.ttsInstancePromise) {
      this.ttsInstancePromise = (async () => {
        console.log('[KokoroTTSProvider] Loading Kokoro-82M ONNX model...');
        const { KokoroTTS } = await import('kokoro-js');
        const modelId = process.env.KOKORO_MODEL_ID || 'onnx-community/Kokoro-82M-v1.0-ONNX';
        const instance = await KokoroTTS.from_pretrained(modelId, {
          dtype: 'fp32',
        });
        console.log('[KokoroTTSProvider] Kokoro-82M model ready!');
        return instance;
      })();
    }
    return this.ttsInstancePromise;
  }

  public async synthesize(options: TTSRequestOptions): Promise<TTSAudioResult> {
    dotenv.config({ override: true });
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
      const tts = await this.getTTSInstance();

      if (controller.signal.aborted) {
        throw new Error('Synthesis aborted');
      }

      const voice = process.env.KOKORO_VOICE || 'pf_dora';
      const speed = parseFloat(process.env.KOKORO_SPEED || '1.05');

      const audioOutput = await tts.generate(cleanText, {
        voice,
        speed,
      });

      const samples: Float32Array = audioOutput.audio || audioOutput;
      const sampleRate: number = audioOutput.sampling_rate || 24000;

      const wavBuffer = encodeWAV(samples, sampleRate);

      const ttfaMs = Date.now() - ttfaStart;
      const totalLatencyMs = Date.now() - startTime;

      this.activeRequests.delete(options.requestId);

      return {
        requestId: options.requestId,
        chunkId: options.chunkId,
        audioBuffer: wavBuffer,
        mimeType: 'audio/wav',
        timeToFirstAudioMs: ttfaMs,
        totalLatencyMs,
        providerName: this.name,
      };
    } catch (error: any) {
      this.activeRequests.delete(options.requestId);
      throw new Error(`[KokoroTTSProvider] Synthesis failed: ${error.message}`);
    }
  }

  public cancel(requestId: string): void {
    const controller = this.activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestId);
      console.log(`[KokoroTTSProvider] Request ${requestId} cancelled.`);
    }
  }
}
