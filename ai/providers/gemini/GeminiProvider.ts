/**
 * GeminiProvider
 *
 * Cloud model provider using Gemini API.
 * Implements streaming (phrase-by-phrase) with automatic candidate fallback.
 */

import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

export interface GeminiRequest {
  prompt: string;
  system?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export class GeminiProvider {
  private ai: GoogleGenAI;
  
  // List of active valid models for Gemini API v2 / v2.5
  private readonly modelCandidates = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
  ];

  constructor(apiKey?: string) {
    dotenv.config({ override: true });
    this.ai = new GoogleGenAI({ apiKey: apiKey || process.env.GEMINI_API_KEY });
  }

  /**
   * Generates a streaming response with automatic candidate fallback.
   */
  async *generateStream(request: GeminiRequest): AsyncGenerator<string, void, unknown> {
    let quotaErrorEncountered = false;
    let lastError: any = null;

    const contents: any[] = [];
    if (request.history && request.history.length > 0) {
      for (const msg of request.history) {
        if (msg.content && msg.content.trim().length > 0) {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content.trim() }]
          });
        }
      }
    }
    if (request.prompt && request.prompt.trim().length > 0) {
      contents.push({
        role: 'user',
        parts: [{ text: request.prompt.trim() }]
      });
    }

    for (const modelName of this.modelCandidates) {
      try {
        console.log(`[GeminiProvider] Stream with model: ${modelName}`);
        const responseStream = await this.ai.models.generateContentStream({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction: request.system,
          },
        });

        let hasYielded = false;
        for await (const chunk of responseStream) {
          if (chunk.text) {
            hasYielded = true;
            yield chunk.text;
          }
        }

        if (hasYielded) {
          return;
        }
      } catch (error: any) {
        console.warn(`[GeminiProvider] Model '${modelName}' failed (${error?.status || error?.message}).`);
        lastError = error;
        if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
          quotaErrorEncountered = true;
        }
      }
    }

    // If quota rate limit was hit on primary models, throw error so ModelRouter falls back to Groq
    if (quotaErrorEncountered) {
      throw new Error('429 RESOURCE_EXHAUSTED Quota Limit');
    } else {
      throw lastError || new Error('Gemini models unavailable');
    }
  }

  /**
   * Generates a complete response (non-streaming) with fallback.
   */
  async generate(request: GeminiRequest): Promise<string> {
    let lastError: any = null;

    for (const modelName of this.modelCandidates) {
      try {
        const response = await this.ai.models.generateContent({
          model: modelName,
          contents: request.prompt,
          config: {
            systemInstruction: request.system,
          },
        });
        if (response.text) {
          return response.text;
        }
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('All Gemini model candidates failed.');
  }
}
