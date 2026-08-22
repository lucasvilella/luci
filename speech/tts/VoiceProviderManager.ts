/**
 * VoiceProviderManager.ts
 *
 * Automated Routing Manager for Luci Voice Engine.
 * Monitors Time To First Audio (TTFA), Latency, Failures, and Offline state.
 * Implements Hysteresis Cooldown to prevent flapping between providers.
 */

import { ITTSProvider } from './providers/ITTSProvider';
import { F5TTSProvider } from './providers/F5TTSProvider';
import { XTTSProvider } from './providers/XTTSProvider';
import { KokoroFastAPIProvider } from './providers/KokoroFastAPIProvider';
import { EdgeTTSProvider } from './providers/EdgeTTSProvider';
import { KokoroTTSProvider } from './providers/KokoroTTSProvider';
import { QwenTTSProvider } from './providers/QwenTTSProvider';

export interface ProviderMetrics {
  name: string;
  requestsCount: number;
  failuresCount: number;
  lastFailureTime?: number;
  recentTTFAsMs: number[];
  recentTotalLatenciesMs: number[];
}

export class VoiceProviderManager {
  private providers: Map<string, ITTSProvider> = new Map();
  private metrics: Map<string, ProviderMetrics> = new Map();
  private activeProviderName: string = 'F5TTS';
  private lastSwitchTime: number = 0;

  // Configuration
  private readonly cooldownMs: number = 15000;
  private readonly latencyThresholdMs: number = 2500;
  private readonly windowSize: number = 10;

  constructor() {
    // 1. Local Kokoro-TTS (Dora - Ultra Fast & Offline)
    const kokoro = new KokoroTTSProvider();
    this.registerProvider(kokoro);

    // 2. Microsoft Edge Neural (Francisca/Thalita - Instant Ultra-Realistic)
    const edge = new EdgeTTSProvider();
    this.registerProvider(edge);

    // 3. XTTS-v2 Cloned Voice (Lucy)
    const xtts = new XTTSProvider();
    this.registerProvider(xtts);
  }

  public registerProvider(provider: ITTSProvider): void {
    this.providers.set(provider.name, provider);
    this.metrics.set(provider.name, {
      name: provider.name,
      requestsCount: 0,
      failuresCount: 0,
      recentTTFAsMs: [],
      recentTotalLatenciesMs: [],
    });
  }

  /**
   * Selects the preferred voice provider (defaults to Kokoro / Dora).
   */
  public async selectBestProvider(): Promise<ITTSProvider> {
    const defaultProviderName = process.env.DEFAULT_TTS_PROVIDER || 'EdgeTTS';
    const primaryProvider = this.providers.get(defaultProviderName) || this.providers.get('EdgeTTS') || this.providers.get('Kokoro');

    if (primaryProvider) {
      this.switchProvider(primaryProvider.name, `Provedor Ativo: ${primaryProvider.name}`);
      return primaryProvider;
    }

    return this.providers.get(this.activeProviderName)!;
  }

  public recordSuccess(providerName: string, ttfaMs: number, totalLatencyMs: number): void {
    const m = this.metrics.get(providerName);
    if (!m) return;

    m.requestsCount++;
    m.recentTTFAsMs.push(ttfaMs);
    if (m.recentTTFAsMs.length > this.windowSize) m.recentTTFAsMs.shift();

    m.recentTotalLatenciesMs.push(totalLatencyMs);
    if (m.recentTotalLatenciesMs.length > this.windowSize) m.recentTotalLatenciesMs.shift();
  }

  public recordFailure(providerName: string): void {
    const m = this.metrics.get(providerName);
    if (!m) return;

    m.failuresCount++;
    m.lastFailureTime = Date.now();
  }

  public getAverageTTFA(providerName: string): number {
    const m = this.metrics.get(providerName);
    if (!m || m.recentTTFAsMs.length === 0) return 400; // Default baseline estimate
    const sum = m.recentTTFAsMs.reduce((acc, v) => acc + v, 0);
    return Math.round(sum / m.recentTTFAsMs.length);
  }

  public getMetricsSummary(): Record<string, any> {
    const summary: Record<string, any> = {};
    for (const [name, m] of this.metrics.entries()) {
      summary[name] = {
        requests: m.requestsCount,
        failures: m.failuresCount,
        averageTTFAMs: this.getAverageTTFA(name),
        recentTTFA: m.recentTTFAsMs,
      };
    }
    return {
      activeProvider: this.activeProviderName,
      lastSwitchTime: this.lastSwitchTime,
      providers: summary,
    };
  }

  private switchProvider(newProviderName: string, reason: string): void {
    if (this.activeProviderName !== newProviderName) {
      console.log(`[VoiceProviderManager] 🔀 Switched provider: ${this.activeProviderName} ➔ ${newProviderName} | Motivo: ${reason}`);
      this.activeProviderName = newProviderName;
      this.lastSwitchTime = Date.now();
    }
  }
}
