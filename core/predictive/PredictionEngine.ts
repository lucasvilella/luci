/**
 * PredictionEngine
 *
 * Anticipatory Pre-fetch Engine for Luci 2.0.
 * Analyzes partial speech transcripts as the user speaks to pre-warm tools
 * and APIs before speech finishes, reducing SLA latency to zero.
 */

export interface PredictionResult {
  needsWebPreFetch: boolean;
  webQuery?: string;
  predictedTool?: string;
}

export class PredictionEngine {
  /**
   * Pre-fetches intents based on partial input streaming.
   */
  predict(partialInput: string): PredictionResult {
    const lower = partialInput.toLowerCase().trim();

    // 1. Detect web search anticipations
    if (lower.includes('notícia') || lower.includes('cotação') || lower.includes('quem ganhou') || lower.includes('preço do')) {
      return {
        needsWebPreFetch: true,
        webQuery: partialInput,
      };
    }

    // 2. Detect app launcher anticipations
    if (lower.includes('abra o') || lower.includes('abrir')) {
      let toolName = 'browser';
      if (lower.includes('code') || lower.includes('vs')) toolName = 'vscode';
      if (lower.includes('spotify')) toolName = 'spotify';
      if (lower.includes('bloco') || lower.includes('notas')) toolName = 'notepad';

      return {
        needsWebPreFetch: false,
        predictedTool: toolName,
      };
    }

    return {
      needsWebPreFetch: false,
    };
  }
}
