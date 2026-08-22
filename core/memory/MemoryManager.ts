/**
 * MemoryManager
 *
 * Central Cognitive Memory Manager for Luci
 * Manages the 4-layer cognitive memory architecture:
 * 1. Working Memory (Short-term context buffer)
 * 2. Episodic Memory (Events with timestamps, confidence scores, quarantine state)
 * 3. Semantic Memory (Consolidated facts & user preferences)
 * 4. Documental Memory (Projects, code, documents RAG)
 */

import fs from 'fs';
import path from 'path';
import { MemoryClassifier, MemoryCategory } from './MemoryClassifier';

export interface MemoryEntry {
  id: string;
  userId: string;
  category: MemoryCategory;
  content: string;
  confidence: number;
  status: 'PERMANENT' | 'QUARANTINE' | 'CONSOLIDATED';
  timestamp: number;
}

export class MemoryManager {
  private storageDir: string;
  private episodicPath: string;
  private semanticPath: string;
  private sessionsPath: string;

  private episodicMemories: MemoryEntry[] = [];
  private semanticMemories: MemoryEntry[] = [];
  private sessions: Record<string, number> = {};
  private classifier: MemoryClassifier;

  constructor() {
    this.storageDir = path.resolve(process.cwd(), 'storage');
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }

    this.episodicPath = path.join(this.storageDir, 'episodic_memory.json');
    this.semanticPath = path.join(this.storageDir, 'semantic_memory.json');
    this.sessionsPath = path.join(this.storageDir, 'user_sessions.json');
    this.classifier = new MemoryClassifier();

    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.episodicPath)) {
        this.episodicMemories = JSON.parse(fs.readFileSync(this.episodicPath, 'utf-8'));
      }
      if (fs.existsSync(this.semanticPath)) {
        this.semanticMemories = JSON.parse(fs.readFileSync(this.semanticPath, 'utf-8'));
      }
      if (fs.existsSync(this.sessionsPath)) {
        this.sessions = JSON.parse(fs.readFileSync(this.sessionsPath, 'utf-8'));
      }
    } catch (e) {
      console.error('[MemoryManager] Failed to load memory stores:', e);
    }
  }

  private save(): void {
    try {
      fs.writeFileSync(this.episodicPath, JSON.stringify(this.episodicMemories, null, 2), 'utf-8');
      fs.writeFileSync(this.semanticPath, JSON.stringify(this.semanticMemories, null, 2), 'utf-8');
      fs.writeFileSync(this.sessionsPath, JSON.stringify(this.sessions, null, 2), 'utf-8');
    } catch (e) {
      console.error('[MemoryManager] Failed to save memory stores:', e);
    }
  }

  /**
   * Process incoming transcript, classify it, and route to appropriate memory layer.
   */
  processInput(userInput: string, userId = 'Lucas'): string | null {
    const cleanUserId = userId.trim();
    const result = this.classifier.classify(userInput);

    if (result.suggestedAction === 'IGNORE') {
      return null;
    }

    const entry: MemoryEntry = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: cleanUserId,
      category: result.category,
      content: result.factContent || userInput,
      confidence: result.confidence,
      status: result.confidence >= 0.8 ? 'PERMANENT' : 'QUARANTINE',
      timestamp: Date.now(),
    };

    if (result.category === 'SEMANTIC') {
      // Check for duplicate
      const existing = this.semanticMemories.find(
        (m) => m.userId.toLowerCase() === cleanUserId.toLowerCase() && m.content.toLowerCase() === entry.content.toLowerCase()
      );
      if (!existing) {
        this.semanticMemories.push(entry);
        this.save();
        console.log(`[MemoryManager] Saved SEMANTIC memory for [${cleanUserId}]: "${entry.content}" (Confidence: ${entry.confidence})`);
        return `Memória semântica registrada para [${cleanUserId}]: "${entry.content}"`;
      }
    } else if (result.category === 'EPISODIC') {
      this.episodicMemories.push(entry);
      this.save();
      console.log(`[MemoryManager] Saved EPISODIC memory for [${cleanUserId}]: "${entry.content}" (Status: ${entry.status})`);
      return `Evento registrado na memória episódica de [${cleanUserId}].`;
    }

    return null;
  }

  /**
   * Temporal Awareness: updates and returns human temporal context for session.
   */
  getTemporalContext(userId = 'Lucas'): string {
    const key = userId.trim().toLowerCase();
    const lastSeen = this.sessions[key];
    const now = Date.now();

    this.sessions[key] = now;
    this.save();

    if (!lastSeen) {
      return `\n\n[CONSCIÊNCIA TEMPORAL DA LUCI]\nPrimeira interação registrada com ${userId}.`;
    }

    const diffMs = now - lastSeen;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const lastSeenDate = new Date(lastSeen).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    let timePhrase = '';
    if (diffHours < 1) {
      timePhrase = 'poucos minutos atrás (sessão contínua em andamento)';
    } else if (diffHours < 18) {
      timePhrase = `hoje mais cedo (${diffHours} horas atrás)`;
    } else if (diffDays === 1 || (diffHours >= 18 && diffHours < 42)) {
      timePhrase = 'ontem (há 1 dia)';
    } else if (diffDays === 2 || (diffHours >= 42 && diffHours < 66)) {
      timePhrase = `antes de ontem (há 2 dias, em ${lastSeenDate})`;
    } else {
      timePhrase = `há ${diffDays} dias (em ${lastSeenDate})`;
    }

    return `\n\n[CONSCIÊNCIA TEMPORAL E RELÓGIO DE SESSÃO DA LUCI]
Última conversa com ${userId}: ${timePhrase}.
Instrução Temporal: Se for perguntada sobre quando se falaram ou ao saudar o usuário, você sabe exatamente que se falaram ${timePhrase}.`;
  }

  /**
   * Builds the System Prompt Memory Context from Semantic and Episodic memories.
   */
  getSystemPromptMemoryContext(userInput: string, userId = 'Lucas'): string {
    const cleanUserId = userId.trim().toLowerCase();

    const userSemantics = this.semanticMemories.filter((m) => m.userId.toLowerCase() === cleanUserId);
    const userEpisodics = this.episodicMemories
      .filter((m) => m.userId.toLowerCase() === cleanUserId && m.status === 'PERMANENT')
      .slice(-5);

    if (userSemantics.length === 0 && userEpisodics.length === 0) {
      return `\n\n[MEMÓRIA COGNITIVA DA PESSOA: ${userId}]\nNenhuma preferência ou fato gravado ainda.`;
    }

    const semanticsText = userSemantics.map((m) => `- [Semântica] ${m.content}`).join('\n');
    const episodicsText = userEpisodics.map((m) => `- [Episódica ${new Date(m.timestamp).toLocaleDateString('pt-BR')}] ${m.content}`).join('\n');

    return `\n\n[MEMÓRIA COGNITIVA DA PESSOA: ${userId}]
Preferências e Fatos Consolidados:
${semanticsText || '- Nenhuma preferência gravada.'}

Eventos e Histórico Recente:
${episodicsText || '- Nenhum evento recente registrado.'}`;
  }

  /**
   * Memory Audit: Returns all memories for a user for inspection.
   */
  audit(userId = 'Lucas') {
    const cleanUserId = userId.trim().toLowerCase();
    return {
      semantic: this.semanticMemories.filter((m) => m.userId.toLowerCase() === cleanUserId),
      episodic: this.episodicMemories.filter((m) => m.userId.toLowerCase() === cleanUserId),
    };
  }

  /**
   * User command to explicitly forget a topic or entry.
   */
  forget(query: string, userId = 'Lucas'): number {
    const cleanUserId = userId.trim().toLowerCase();
    const term = query.trim().toLowerCase();

    const initialCount = this.semanticMemories.length + this.episodicMemories.length;

    this.semanticMemories = this.semanticMemories.filter(
      (m) => !(m.userId.toLowerCase() === cleanUserId && m.content.toLowerCase().includes(term))
    );
    this.episodicMemories = this.episodicMemories.filter(
      (m) => !(m.userId.toLowerCase() === cleanUserId && m.content.toLowerCase().includes(term))
    );

    const deletedCount = initialCount - (this.semanticMemories.length + this.episodicMemories.length);
    if (deletedCount > 0) {
      this.save();
    }
    return deletedCount;
  }

  /**
   * Getter for NightlyConsolidator.
   */
  getRawData() {
    return {
      episodic: this.episodicMemories,
      semantic: this.semanticMemories,
    };
  }

  /**
   * Setter for NightlyConsolidator after consolidation job.
   */
  updateConsolidatedData(episodic: MemoryEntry[], semantic: MemoryEntry[]) {
    this.episodicMemories = episodic;
    this.semanticMemories = semantic;
    this.save();
  }
}
