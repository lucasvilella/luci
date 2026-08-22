/**
 * ElevenLabsProvider.ts
 *
 * Ultra-human ElevenLabs Conversational Voice Provider.
 * Automatically activates whenever ELEVENLABS_API_KEY is defined in .env.
 */

import dotenv from 'dotenv';
import { ITTSProvider, TTSRequestOptions, TTSAudioResult } from './ITTSProvider';

export class ElevenLabsProvider implements ITTSProvider {
  public name = 'ElevenLabs';
  private activeRequests: Map<string, AbortController> = new Map();

  public async isAvailable(): Promise<boolean> {
    dotenv.config({ override: true });
    const apiKey = process.env.ELEVENLABS_API_KEY;
    return Boolean(apiKey && apiKey.length > 5);
  }

  public async synthesize(options: TTSRequestOptions): Promise<TTSAudioResult> {
    dotenv.config({ override: true });
    const startTime = Date.now();
    const controller = new AbortController();
    this.activeRequests.set(options.requestId, controller);

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID || 'cgSgspJ2msm6clMCkdW9'; // Default premade female voice (Jessica)

    try {
      const cleanText = options.text.replace(/[*_#`~>]/g, '').trim();
      const ttfaStart = Date.now();

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey!,
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.2,
            use_speaker_boost: true,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`ElevenLabs HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const ttfaMs = Date.now() - ttfaStart;
      const totalLatencyMs = Date.now() - startTime;

      this.activeRequests.delete(options.requestId);

      return {
        requestId: options.requestId,
        chunkId: options.chunkId,
        audioBuffer,
        mimeType: 'audio/mpeg',
        timeToFirstAudioMs: ttfaMs,
        totalLatencyMs,
        providerName: this.name,
      };
    } catch (error: any) {
      this.activeRequests.delete(options.requestId);
      throw new Error(`[ElevenLabsProvider] Synthesis failed: ${error.message}`);
    }
  }

  public cancel(requestId: string): void {
    const controller = this.activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestId);
    }
  }
}
