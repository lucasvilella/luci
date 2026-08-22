import fs from 'fs';
import path from 'path';

export interface Fact {
  id: string;
  userId: string; // Person name used as Workspace ID (e.g. 'Lucas')
  content: string;
  category: 'preference' | 'user_info' | 'general';
  timestamp: number;
}

export interface UserSession {
  userId: string;
  lastSeenTimestamp: number;
}

export class MemoryStore {
  private filePath: string;
  private sessionsFilePath: string;
  private facts: Fact[] = [];
  private sessions: Record<string, number> = {}; // userId -> lastSeenTimestamp

  constructor() {
    const storageDir = path.resolve(process.cwd(), 'storage');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    this.filePath = path.join(storageDir, 'memory_facts.json');
    this.sessionsFilePath = path.join(storageDir, 'user_sessions.json');
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8');
        this.facts = JSON.parse(data);
      } else {
        this.facts = [];
        this.save();
      }

      if (fs.existsSync(this.sessionsFilePath)) {
        const sessionData = fs.readFileSync(this.sessionsFilePath, 'utf-8');
        this.sessions = JSON.parse(sessionData);
      } else {
        this.sessions = {};
        this.saveSessions();
      }
    } catch (error) {
      console.error('[MemoryStore] Failed to load data:', error);
      this.facts = [];
      this.sessions = {};
    }
  }

  private save(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.facts, null, 2), 'utf-8');
    } catch (error) {
      console.error('[MemoryStore] Failed to save facts:', error);
    }
  }

  private saveSessions(): void {
    try {
      fs.writeFileSync(this.sessionsFilePath, JSON.stringify(this.sessions, null, 2), 'utf-8');
    } catch (error) {
      console.error('[MemoryStore] Failed to save sessions:', error);
    }
  }

  /**
   * Updates last interaction timestamp for a person's workspace.
   */
  updateLastSeen(userId = 'Lucas'): void {
    const key = userId.trim().toLowerCase();
    this.sessions[key] = Date.now();
    this.saveSessions();
  }

  /**
   * Returns human-readable temporal awareness context for a person workspace.
   */
  getTemporalContext(userId = 'Lucas'): string {
    const key = userId.trim().toLowerCase();
    const lastSeen = this.sessions[key];
    const now = Date.now();

    if (!lastSeen) {
      // First interaction
      this.updateLastSeen(userId);
      return `\n\n[CONSCIÊNCIA TEMPORAL DE SESSÃO DO USUÁRIO]\nEsta é a primeira conversa registrada com ${userId}.`;
    }

    const diffMs = now - lastSeen;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const lastSeenDate = new Date(lastSeen).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    let description = '';
    if (diffHours < 1) {
      description = 'poucos minutos atrás (sessão contínua em andamento)';
    } else if (diffHours < 18) {
      description = `hoje mais cedo (${diffHours} horas atrás)`;
    } else if (diffDays === 1 || (diffHours >= 18 && diffHours < 42)) {
      description = 'ontem (há 1 dia)';
    } else if (diffDays === 2 || (diffHours >= 42 && diffHours < 66)) {
      description = `antes de ontem (há 2 dias, em ${lastSeenDate})`;
    } else {
      description = `há ${diffDays} dias (em ${lastSeenDate})`;
    }

    // Update timestamp for current interaction
    this.updateLastSeen(userId);

    return `\n\n[CONSCIÊNCIA TEMPORAL E RELÓGIO DE SESSÃO DA LUCI]
Última interação com ${userId}: ${description}.
Instrução Temporal: Se o usuário perguntar quando se falaram pela última vez ou ao fazer saudações, você tem plena consciência temporal de que se falaram ${description}.`;
  }

  /**
   * Saves a new fact into a person's isolated Cognitive Workspace using their name as userId.
   */
  remember(content: string, userId = 'Lucas', category: 'preference' | 'user_info' | 'general' = 'general'): Fact {
    const trimmed = content.trim();
    const cleanUserId = userId.trim();

    const existing = this.facts.find(
      (f) => (f.userId || 'Lucas').toLowerCase() === cleanUserId.toLowerCase() && f.content.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      return existing;
    }

    const fact: Fact = {
      id: `fact-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: cleanUserId,
      content: trimmed,
      category,
      timestamp: Date.now(),
    };

    this.facts.push(fact);
    this.save();
    console.log(`[MemoryStore] Fact remembered for Workspace [${cleanUserId}]: "${fact.content}"`);
    return fact;
  }

  /**
   * Automatically detects memorization triggers in user input for the active person's workspace.
   */
  detectAndRemember(userInput: string, userId = 'Lucas'): string | null {
    const lower = userInput.toLowerCase().trim();

    const triggers = [
      'lembre-se que ',
      'lembre-se de ',
      'memorize que ',
      'salve que ',
      'anote que ',
      'prefiro ',
      'meu nome é ',
      'minha cor favorita é ',
      'meu projeto é ',
      'meu projeto atual é '
    ];

    for (const trigger of triggers) {
      if (lower.includes(trigger)) {
        const factContent = userInput.substring(lower.indexOf(trigger) + trigger.length).trim();
        if (factContent.length > 2) {
          this.remember(userInput, userId);
          return `Fato registrado no Workspace de [${userId}]: "${userInput}"`;
        }
      }
    }

    return null;
  }

  /**
   * Searches facts isolated strictly by person workspace (userId).
   */
  search(query: string, userId = 'Lucas', maxResults = 5): Fact[] {
    const cleanUserId = userId.trim().toLowerCase();
    const userFacts = this.facts.filter((f) => (f.userId || 'Lucas').toLowerCase() === cleanUserId);

    const queryTokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    if (queryTokens.length === 0) return userFacts.slice(-maxResults);

    const scored = userFacts.map((fact) => {
      const factTokens = fact.content.toLowerCase().split(/\s+/);
      let score = 0;
      for (const token of queryTokens) {
        if (factTokens.some((ft) => ft.includes(token) || token.includes(ft))) {
          score += 1;
        }
      }
      return { fact, score };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map((s) => s.fact);
  }

  /**
   * Formats isolated memory facts for a specific person into System Prompt Memory Context.
   */
  getMemoryContext(query: string, userId = 'Lucas'): string {
    const cleanUserId = userId.trim();
    const relevant = this.search(query, cleanUserId, 5);
    const userFacts = this.facts.filter((f) => (f.userId || 'Lucas').toLowerCase() === cleanUserId.toLowerCase());
    const combined = Array.from(new Set([...relevant, ...userFacts.slice(-8)]));

    if (combined.length === 0) {
      return `\n\n[COGNITIVE WORKSPACE DA PESSOA: ${cleanUserId}]\nNenhum fato específico registrado ainda para ${cleanUserId}.`;
    }

    const factsFormatted = combined.map((f) => `- ${f.content}`).join('\n');
    return `\n\n[MEMÓRIA DO WORKSPACE ISOLADO DA PESSOA: ${cleanUserId}]\nVocê possui os seguintes fatos e preferências registrados sobre a pessoa (${cleanUserId}):\n${factsFormatted}\nUse estes fatos para personalizar suas respostas para ${cleanUserId} de forma natural.`;
  }

  /**
   * Returns all facts for a person's workspace.
   */
  getPersonFacts(userId = 'Lucas'): Fact[] {
    const cleanUserId = userId.trim().toLowerCase();
    return this.facts.filter((f) => (f.userId || 'Lucas').toLowerCase() === cleanUserId);
  }
}
