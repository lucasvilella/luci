/**
 * MemoryClassifier
 *
 * Cognitive memory intelligence classifier for L.U.C.I.
 * Analyzes incoming user transcripts and categorizes them into memory layers
 * assigning a confidence score (0.0 to 1.0) before persistence.
 */

export type MemoryCategory = 'IRRELEVANT' | 'SHORT_TERM' | 'EPISODIC' | 'SEMANTIC' | 'DOCUMENT';

export interface MemoryClassificationResult {
  category: MemoryCategory;
  confidence: number; // 0.0 to 1.0
  factContent?: string;
  suggestedAction: 'STORE_PERMANENT' | 'STORE_QUARANTINE' | 'IGNORE';
}

export class MemoryClassifier {
  /**
   * Fast-path heuristic classification for user inputs.
   */
  classify(userInput: string): MemoryClassificationResult {
    const text = userInput.trim();
    const lower = text.toLowerCase();

    // 1. Check for explicit semantic memory triggers ("lembre-se que", "minha cor favorita é", "prefiro")
    const explicitSemanticTriggers = [
      'lembre-se que',
      'lembre-se de',
      'memorize que',
      'salve que',
      'anote que',
      'prefiro',
      'meu nome é',
      'minha cor favorita é',
      'minha idade é',
      'eu tenho',
      'meu projeto atual é',
      'meu sistema operacional é',
      'trabalho com'
    ];

    for (const trigger of explicitSemanticTriggers) {
      if (lower.includes(trigger)) {
        return {
          category: 'SEMANTIC',
          confidence: 0.95,
          factContent: text,
          suggestedAction: 'STORE_PERMANENT',
        };
      }
    }

    // 2. Check for episodic event triggers ("hoje fiz", "ontem terminamos", "semana que vem vamos")
    const episodicTriggers = [
      'hoje fiz',
      'hoje terminamos',
      'ontem',
      'antes de ontem',
      'semana passada',
      'no projeto',
      'reunião de hoje',
      'decidimos que',
      'concluímos'
    ];

    for (const trigger of episodicTriggers) {
      if (lower.includes(trigger)) {
        return {
          category: 'EPISODIC',
          confidence: 0.85,
          factContent: text,
          suggestedAction: 'STORE_PERMANENT',
        };
      }
    }

    // 3. Casual greetings and short chatter -> IRRELEVANT
    const casualTriggers = ['oi', 'olá', 'tudo bem', 'bom dia', 'boa tarde', 'boa noite', 'tchau', 'obrigado', 'valeu', 'ok', 'beleza'];
    if (casualTriggers.includes(lower) || text.length < 5) {
      return {
        category: 'IRRELEVANT',
        confidence: 1.0,
        suggestedAction: 'IGNORE',
      };
    }

    // 4. Questions and commands -> SHORT_TERM / WORKING MEMORY
    if (lower.includes('?') || lower.startsWith('qual') || lower.startsWith('como') || lower.startsWith('abra') || lower.startsWith('procure')) {
      return {
        category: 'SHORT_TERM',
        confidence: 0.7,
        suggestedAction: 'IGNORE',
      };
    }

    // Default: Potential low-confidence episodic observation (quarantine)
    return {
      category: 'EPISODIC',
      confidence: 0.5,
      factContent: text,
      suggestedAction: 'STORE_QUARANTINE',
    };
  }
}
