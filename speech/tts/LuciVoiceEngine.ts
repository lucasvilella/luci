/**
 * LuciVoiceEngine.ts
 *
 * Master Voice Façade for L.U.C.I. Conversational Assistant.
 * Hides provider complexity behind a single call: LuciVoiceEngine.speak(text, context)
 *
 * Supports two synthesis modes:
 *   1. Standard: Full text → complete WAV (for short responses)
 *   2. Streaming: Sentence-by-sentence pipeline (for long responses, instant TTFA)
 */

import { VoiceProviderManager } from './VoiceProviderManager';
import { SpeechChunker } from './SpeechChunker';
import { ITTSProvider, TTSAudioResult } from './providers/ITTSProvider';
import { XTTSProvider, XTTSSentenceResult } from './providers/XTTSProvider';
import { AutonomousVoiceCacheManager } from './AutonomousVoiceCacheManager';
import { EventBus } from '../../core/events/EventBus';

export interface SpeakOptions {
  text: string;
  requestId?: string;
  isStreamChunk?: boolean;
  isFinalChunk?: boolean;
  /** Use pipelined streaming for instant TTFA (recommended for responses > 1 sentence) */
  streaming?: boolean;
  /** Callback fired each time a sentence audio chunk is ready for playback */
  onChunkReady?: (chunk: TTSAudioResult) => void;
}

/** Threshold (in chars) above which streaming mode is automatically used */
const STREAMING_AUTO_THRESHOLD = 60;

export class LuciVoiceEngine {
  private static instance: LuciVoiceEngine;
  private providerManager: VoiceProviderManager;
  private autoCache: AutonomousVoiceCacheManager;
  private chunker: SpeechChunker;
  private eventBus: EventBus;
  private activeRequestId: string | null = null;
  private warmupDone: boolean = false;

  private constructor() {
    this.providerManager = new VoiceProviderManager();
    this.autoCache = AutonomousVoiceCacheManager.getInstance();
    this.chunker = new SpeechChunker();
    this.eventBus = EventBus.getInstance();
  }

  public static getInstance(): LuciVoiceEngine {
    if (!LuciVoiceEngine.instance) {
      LuciVoiceEngine.instance = new LuciVoiceEngine();
    }
    return LuciVoiceEngine.instance;
  }

  /**
   * Main entry point for conversational speech output.
   *
   * For short texts (< 60 chars): uses standard full synthesis.
   * For longer texts: automatically uses pipelined streaming for instant TTFA.
   * Override with options.streaming = true/false.
   */
  public async speak(text: string, options?: Partial<SpeakOptions>): Promise<TTSAudioResult[]> {
    const requestId = options?.requestId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.activeRequestId = requestId;

    // 1. Check Autonomous Smart Cache (RAM/Disk)
    const cachedBuffer = this.autoCache.get(text);
    if (cachedBuffer) {
      console.log(`[LuciVoiceEngine] ⚡ Áudio servido pelo Cache Autônomo para: "${text.substring(0, 30)}..."`);
      const result: TTSAudioResult = {
        requestId,
        audioBuffer: cachedBuffer,
        mimeType: 'audio/wav',
        timeToFirstAudioMs: 1,
        totalLatencyMs: 1,
        providerName: 'AutonomousVoiceCache',
      };
      options?.onChunkReady?.(result);
      return [result];
    }

    // 2. Select Optimal Provider
    const provider = await this.providerManager.selectBestProvider();

    // 3. Trigger warmup on first XTTS use
    if (!this.warmupDone && provider instanceof XTTSProvider) {
      this.warmupDone = true;
      provider.warmupCache().catch(() => {}); // Fire and forget
    }

    // 4. Decide synthesis mode
    const useStreaming = options?.streaming ?? (
      text.length > STREAMING_AUTO_THRESHOLD && provider instanceof XTTSProvider
    );

    if (useStreaming && provider instanceof XTTSProvider) {
      return this.speakStreaming(provider, text, requestId, options);
    }

    return this.speakStandard(provider, text, requestId, options);
  }

  /**
   * Standard synthesis — full text in one request.
   * Best for short phrases (< 60 chars).
   */
  private async speakStandard(
    provider: ITTSProvider,
    text: string,
    requestId: string,
    options?: Partial<SpeakOptions>,
  ): Promise<TTSAudioResult[]> {
    try {
      this.eventBus.emit('luci:speaking_start', { requestId, provider: provider.name, mode: 'standard' });

      const result = await provider.synthesize({ requestId, text });

      // Record Metrics
      this.providerManager.recordSuccess(provider.name, result.timeToFirstAudioMs, result.totalLatencyMs);

      // Autonomous Learning: Record and evaluate for persistent cache
      this.autoCache.recordAndStore(text, result.audioBuffer as ArrayBuffer, result.totalLatencyMs);

      options?.onChunkReady?.(result);
      this.eventBus.emit('luci:speaking_end', { requestId, provider: provider.name });
      return [result];
    } catch (error: any) {
      console.warn(`[LuciVoiceEngine] Provider ${provider.name} failed:`, error.message);
      this.providerManager.recordFailure(provider.name);

      // Fallback Provider
      const fallbackProvider = await this.providerManager.selectBestProvider();
      if (fallbackProvider.name !== provider.name) {
        console.log(`[LuciVoiceEngine] 🔄 Executing fallback to ${fallbackProvider.name}...`);
        const fallbackResult = await fallbackProvider.synthesize({ requestId, text });
        options?.onChunkReady?.(fallbackResult);
        this.eventBus.emit('luci:speaking_end', { requestId, provider: fallbackProvider.name });
        return [fallbackResult];
      }

      this.eventBus.emit('luci:speaking_end', { requestId, error: error.message });
      throw error;
    }
  }

  /**
   * Pipelined streaming synthesis — sentence by sentence.
   * Each sentence's audio is dispatched to onChunkReady as soon as it's synthesized.
   * TTFA is the time to synthesize just the first sentence (~2-4s GPU, <100ms cached).
   */
  private async speakStreaming(
    provider: XTTSProvider,
    text: string,
    requestId: string,
    options?: Partial<SpeakOptions>,
  ): Promise<TTSAudioResult[]> {
    const results: TTSAudioResult[] = [];
    let firstChunkTime: number | null = null;
    const startTime = Date.now();

    try {
      this.eventBus.emit('luci:speaking_start', { requestId, provider: provider.name, mode: 'streaming' });

      await provider.synthesizePipelined(
        text,
        requestId,
        (sentenceResult: XTTSSentenceResult) => {
          if (firstChunkTime === null) {
            firstChunkTime = Date.now() - startTime;
          }

          const chunkResult: TTSAudioResult = {
            requestId,
            chunkId: sentenceResult.index,
            audioBuffer: sentenceResult.audioBuffer,
            mimeType: 'audio/wav',
            timeToFirstAudioMs: firstChunkTime,
            totalLatencyMs: Date.now() - startTime,
            providerName: provider.name,
          };

          results.push(chunkResult);
          options?.onChunkReady?.(chunkResult);

          // Autonomous Cache: Learn and evaluate individual sentence for future instant playback
          this.autoCache.recordAndStore(sentenceResult.text, sentenceResult.audioBuffer.buffer.slice(sentenceResult.audioBuffer.byteOffset, sentenceResult.audioBuffer.byteOffset + sentenceResult.audioBuffer.byteLength), sentenceResult.synthesisMs);

          this.eventBus.emit('luci:speaking_chunk', {
            requestId,
            chunkIndex: sentenceResult.index,
            totalChunks: sentenceResult.total,
            text: sentenceResult.text,
            synthesisMs: sentenceResult.synthesisMs,
            cached: sentenceResult.cached,
          });
        },
      );

      // Record aggregate metrics
      const totalLatency = Date.now() - startTime;
      this.providerManager.recordSuccess(provider.name, firstChunkTime || totalLatency, totalLatency);

      this.eventBus.emit('luci:speaking_end', {
        requestId,
        provider: provider.name,
        mode: 'streaming',
        ttfaMs: firstChunkTime,
        totalMs: totalLatency,
        chunks: results.length,
      });

      return results;
    } catch (error: any) {
      console.warn(`[LuciVoiceEngine] Streaming synthesis failed:`, error.message);
      this.providerManager.recordFailure(provider.name);

      // Fallback to standard synthesis with a different provider
      const fallbackProvider = await this.providerManager.selectBestProvider();
      if (fallbackProvider.name !== provider.name) {
        console.log(`[LuciVoiceEngine] 🔄 Streaming fallback to ${fallbackProvider.name} (standard)...`);
        return this.speakStandard(fallbackProvider, text, requestId, options);
      }

      this.eventBus.emit('luci:speaking_end', { requestId, error: error.message });
      throw error;
    }
  }

  /**
   * Interrupts active synthesis & audio playback immediately (Barge-in).
   */
  public stop(): void {
    if (this.activeRequestId) {
      console.log(`[LuciVoiceEngine] 🛑 Interrupting active request: ${this.activeRequestId}`);
      this.eventBus.emit('luci:speaking_stop', { requestId: this.activeRequestId });
      this.activeRequestId = null;
    }
    this.chunker.reset();
  }

  public getMetrics(): Record<string, any> {
    return this.providerManager.getMetricsSummary();
  }

  public getCacheInsights(): Record<string, any> {
    return this.autoCache.getInsights();
  }
}
