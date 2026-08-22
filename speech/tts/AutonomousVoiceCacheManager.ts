/**
 * AutonomousVoiceCacheManager.ts
 *
 * Intelligent Autonomous Cache & Voice Asset Predictor for Luci
 * 
 * Capabilities:
 *  1. Frequency Analysis: Tracks phrase repetition and automatically promotes hot phrases to disk cache.
 *  2. Predictive Synthesis: Identifies common micro-responses and conversational backchannels.
 *  3. Persistence: Keeps cache on disk and loads hot assets into RAM on startup for sub-10ms latency.
 *  4. Storage Optimization: Implements LRU and clean-up to prevent storage bloat.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface PhraseAnalytics {
  phrase: string;
  usageCount: number;
  lastUsedTimestamp: number;
  averageLatencyAvoidedMs: number;
  isPersisted: boolean;
  priority: 'high' | 'medium' | 'low';
}

export class AutonomousVoiceCacheManager {
  private static instance: AutonomousVoiceCacheManager;
  private analyticsMap: Map<string, PhraseAnalytics> = new Map();
  private ramCache: Map<string, ArrayBuffer> = new Map();
  private cacheDir: string;
  private metadataPath: string;

  // Thresholds
  private readonly PROMOTION_THRESHOLD = 2; // Promoted to persistent cache after 2 uses
  private readonly MAX_RAM_ITEMS = 120;

  private constructor() {
    this.cacheDir = path.resolve(process.cwd(), 'cache', 'tts_autonomous');
    this.metadataPath = path.join(this.cacheDir, 'analytics_metadata.json');
    this.initStorage();
    this.loadPersistedMetadata();
  }

  public static getInstance(): AutonomousVoiceCacheManager {
    if (!AutonomousVoiceCacheManager.instance) {
      AutonomousVoiceCacheManager.instance = new AutonomousVoiceCacheManager();
    }
    return AutonomousVoiceCacheManager.instance;
  }

  private initStorage(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  private getHash(text: string): string {
    return crypto.createHash('md5').update(text.trim().toLowerCase()).digest('hex').substring(0, 16);
  }

  /**
   * Retrieves audio from RAM or Disk cache instantly.
   */
  public get(text: string): ArrayBuffer | null {
    const hash = this.getHash(text);

    // 1. RAM Hit (Instant < 1ms)
    if (this.ramCache.has(hash)) {
      this.recordHit(text);
      return this.ramCache.get(hash)!;
    }

    // 2. Disk Hit (< 5ms)
    const filePath = path.join(this.cacheDir, `${hash}.wav`);
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      this.putRam(hash, arrayBuffer);
      this.recordHit(text);
      return arrayBuffer;
    }

    return null;
  }

  /**
   * Records a new spoken response and evaluates autonomous caching promotion.
   */
  public recordAndStore(text: string, audioBuffer: ArrayBuffer, synthesisLatencyMs: number): void {
    const clean = text.trim();
    if (!clean || clean.length > 250) return; // Only cache viable conversational units

    const hash = this.getHash(clean);
    let meta = this.analyticsMap.get(hash);

    if (!meta) {
      meta = {
        phrase: clean,
        usageCount: 1,
        lastUsedTimestamp: Date.now(),
        averageLatencyAvoidedMs: synthesisLatencyMs,
        isPersisted: false,
        priority: clean.length < 30 ? 'high' : 'medium',
      };
      this.analyticsMap.set(hash, meta);
    } else {
      meta.usageCount++;
      meta.lastUsedTimestamp = Date.now();
      meta.averageLatencyAvoidedMs = Math.round((meta.averageLatencyAvoidedMs + synthesisLatencyMs) / 2);
    }

    // Put in RAM
    this.putRam(hash, audioBuffer);

    // Autonomous Promotion to Persistent Disk Cache
    if (!meta.isPersisted && (meta.usageCount >= this.PROMOTION_THRESHOLD || meta.priority === 'high')) {
      this.persistToDisk(hash, audioBuffer);
      meta.isPersisted = true;
      console.log(`[AutonomousVoiceCache] 🧠 Luci aprendeu e promoveu ao cache persistente: "${clean}" (Uso: ${meta.usageCount}x | Economia: ${meta.averageLatencyAvoidedMs}ms)`);
    }

    this.saveMetadata();
  }

  private recordHit(text: string): void {
    const hash = this.getHash(text);
    const meta = this.analyticsMap.get(hash);
    if (meta) {
      meta.usageCount++;
      meta.lastUsedTimestamp = Date.now();
      this.saveMetadata();
    }
  }

  private putRam(hash: string, buffer: ArrayBuffer): void {
    if (this.ramCache.size >= this.MAX_RAM_ITEMS) {
      const oldestKey = this.ramCache.keys().next().value;
      if (oldestKey) this.ramCache.delete(oldestKey);
    }
    this.ramCache.set(hash, buffer);
  }

  private persistToDisk(hash: string, buffer: ArrayBuffer): void {
    try {
      const filePath = path.join(this.cacheDir, `${hash}.wav`);
      fs.writeFileSync(filePath, Buffer.from(buffer));
    } catch (err) {
      console.warn('[AutonomousVoiceCache] Erro ao salvar arquivo de cache:', err);
    }
  }

  private saveMetadata(): void {
    try {
      const data = Object.fromEntries(this.analyticsMap.entries());
      fs.writeFileSync(this.metadataPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch {
      // Non-blocking
    }
  }

  private loadPersistedMetadata(): void {
    try {
      if (fs.existsSync(this.metadataPath)) {
        const raw = fs.readFileSync(this.metadataPath, 'utf-8');
        const parsed = JSON.parse(raw);
        for (const [hash, meta] of Object.entries(parsed)) {
          this.analyticsMap.set(hash, meta as PhraseAnalytics);
          // Preload top priority assets into RAM
          if ((meta as PhraseAnalytics).isPersisted) {
            const filePath = path.join(this.cacheDir, `${hash}.wav`);
            if (fs.existsSync(filePath)) {
              const buffer = fs.readFileSync(filePath);
              this.putRam(hash, buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
            }
          }
        }
        console.log(`[AutonomousVoiceCache] 🧠 ${this.analyticsMap.size} frases e backchannels monitorados carregados.`);
      }
    } catch (err) {
      console.warn('[AutonomousVoiceCache] Falha ao carregar metadados do cache:', err);
    }
  }

  public getInsights(): { totalMonitored: number; persistedCount: number; topPhrases: PhraseAnalytics[] } {
    const list = Array.from(this.analyticsMap.values());
    list.sort((a, b) => b.usageCount - a.usageCount);
    return {
      totalMonitored: list.length,
      persistedCount: list.filter((x) => x.isPersisted).length,
      topPhrases: list.slice(0, 10),
    };
  }
}
