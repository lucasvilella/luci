/**
 * NightlyConsolidator
 *
 * Autonomous memory cleaning & consolidation engine for Luci
 * Runs during idle periods (or nightly maintenance) to:
 * 1. Consolidate recurring episodic memories into permanent semantic knowledge.
 * 2. Promote quarantined facts that received user reinforcement.
 * 3. Prune outdated noise and low-confidence memories (< 0.4 score).
 */

import { MemoryManager, MemoryEntry } from './MemoryManager';

export interface ConsolidationReport {
  timestamp: number;
  promotedToSemanticCount: number;
  promotedToPermanentCount: number;
  prunedCount: number;
  summary: string;
}

export class NightlyConsolidator {
  private memoryManager: MemoryManager;

  constructor(memoryManager: MemoryManager) {
    this.memoryManager = memoryManager;
  }

  /**
   * Runs the memory consolidation and cleanup pipeline.
   */
  runConsolidation(): ConsolidationReport {
    console.log('\n[NightlyConsolidator] 🌙 Starting Nightly Memory Consolidation Job...');
    const startTime = Date.now();

    const data = this.memoryManager.getRawData();
    let episodic = [...data.episodic];
    let semantic = [...data.semantic];

    let promotedToSemanticCount = 0;
    let promotedToPermanentCount = 0;
    let prunedCount = 0;

    const newEpisodic: MemoryEntry[] = [];

    for (const entry of episodic) {
      // 1. Prune low confidence noise (< 0.4)
      if (entry.confidence < 0.4) {
        prunedCount++;
        console.log(`[NightlyConsolidator] 🗑️ Pruned noise memory: "${entry.content}"`);
        continue;
      }

      // 2. Promote Quarantined items with confidence >= 0.7 to PERMANENT
      if (entry.status === 'QUARANTINE' && entry.confidence >= 0.7) {
        entry.status = 'PERMANENT';
        promotedToPermanentCount++;
        console.log(`[NightlyConsolidator] ⬆️ Promoted quarantine to PERMANENT: "${entry.content}"`);
      }

      // 3. Promote recurring user preference facts from EPISODIC to SEMANTIC
      const lower = entry.content.toLowerCase();
      if (lower.includes('prefiro') || lower.includes('gosto de') || lower.includes('sempre')) {
        const existsInSemantic = semantic.some(
          (s) => s.userId.toLowerCase() === entry.userId.toLowerCase() && s.content.toLowerCase() === entry.content.toLowerCase()
        );
        if (!existsInSemantic) {
          semantic.push({
            ...entry,
            category: 'SEMANTIC',
            status: 'PERMANENT',
            confidence: 0.95,
          });
          promotedToSemanticCount++;
          console.log(`[NightlyConsolidator] 🧠 Consolidated EPISODIC -> SEMANTIC: "${entry.content}"`);
          continue; // Move out of episodic into semantic
        }
      }

      newEpisodic.push(entry);
    }

    // Save updated consolidated memory states back to storage
    this.memoryManager.updateConsolidatedData(newEpisodic, semantic);

    const report: ConsolidationReport = {
      timestamp: Date.now(),
      promotedToSemanticCount,
      promotedToPermanentCount,
      prunedCount,
      summary: `Faxina concluída em ${Date.now() - startTime}ms. Promovidos para Semântico: ${promotedToSemanticCount}, Promovidos para Permanente: ${promotedToPermanentCount}, Purgados: ${prunedCount}.`,
    };

    console.log(`[NightlyConsolidator] ✅ ${report.summary}\n`);
    return report;
  }
}
