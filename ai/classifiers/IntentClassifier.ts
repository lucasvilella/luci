/**
 * IntentClassifier
 *
 * Implements a 2-stage Intent Classifier for Luci:
 * 1. Fast-Path Heuristic (<1ms): Instant routing for greetings, chat, and direct action verbs.
 * 2. SmolLM2 Local LLM Classifier: Evaluates ambiguous inputs.
 */

import { SmolLMProvider } from '../providers/ollama/SmolLMProvider';

export type IntentType = 'COMMAND' | 'REASONING';

export interface ClassificationResult {
  type: IntentType;
  confidence: number;
  action?: string;
  latencyMs: number;
}

export class IntentClassifier {
  private smolLM: SmolLMProvider;

  private readonly SYSTEM_PROMPT = `You are the intent router for Luci, a cognitive OS.
Your ONLY job is to classify the user's input.
You must output ONLY valid JSON without Markdown blocks.

Format:
{
  "type": "COMMAND" or "REASONING",
  "confidence": <0-100>,
  "action": "<short verb-noun if COMMAND, null if REASONING>"
}`;

  constructor(provider?: SmolLMProvider) {
    this.smolLM = provider ?? new SmolLMProvider();
  }

  async classify(userInput: string): Promise<ClassificationResult> {
    const startTime = performance.now();
    const cleanInput = userInput.trim().toLowerCase();

    // 1. FAST-PATH HEURISTICS (<1ms latency)
    // Conversational greetings & general chat -> REASONING (Groq / Cloud LLM)
    const isGreetingOrChat = /^(oi|olá|ola|ei|tudo bem|como vai|bom dia|boa tarde|boa noite|quem é você|quem e voce|ajuda|help)[.!?\s]*$/i.test(cleanInput);
    if (isGreetingOrChat) {
      return {
        type: 'REASONING',
        confidence: 100,
        latencyMs: performance.now() - startTime
      };
    }

    // Direct mechanical action verbs -> COMMAND (Local Execution)
    const isDirectCommand = /^(acenda|apague|ligue|desligue|abra|feche|tocar|pausar|silenciar|que horas|qual a data|anote|salve)/i.test(cleanInput);
    if (isDirectCommand) {
      return {
        type: 'COMMAND',
        confidence: 95,
        action: cleanInput,
        latencyMs: performance.now() - startTime
      };
    }

    // 2. SMOL-LM2 CLASSIFICATION for ambiguous inputs
    try {
      const result = await this.smolLM.generate({
        prompt: `User input: "${userInput}"`,
        system: this.SYSTEM_PROMPT,
        temperature: 0.0
      });

      const parsed = this.parseJSON(result.response);
      if (parsed && typeof parsed.confidence === 'number') {
        return {
          type: parsed.type === 'COMMAND' ? 'COMMAND' : 'REASONING',
          confidence: parsed.confidence,
          action: parsed.action,
          latencyMs: performance.now() - startTime
        };
      }
    } catch {
      // Fallback cleanly to REASONING
    }

    return {
      type: 'REASONING',
      confidence: 50,
      latencyMs: performance.now() - startTime
    };
  }

  private parseJSON(text: string): any {
    try {
      const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
}
