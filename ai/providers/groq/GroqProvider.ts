/**
 * GroqProvider
 *
 * Cloud provider using Groq LPU acceleration.
 * Supports multi-turn message history for rich conversation context.
 */

import dotenv from 'dotenv';

export interface MessageItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GroqRequest {
  prompt: string;
  system?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export class GroqProvider {
  private apiKey: string;
  private readonly baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly modelCandidates = [
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.6-27b',
    'groq/compound'
  ];

  constructor(apiKey?: string) {
    dotenv.config({ override: true });
    this.apiKey = apiKey || process.env.GROQ_API_KEY || '';
  }

  /**
   * Generates a streaming response with full conversation history.
   */
  async *generateStream(request: GroqRequest): AsyncGenerator<string, void, unknown> {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    const payloadMessages: MessageItem[] = [
      ...(request.system ? [{ role: 'system' as const, content: request.system }] : []),
      ...(request.history ? request.history.map(h => ({ role: h.role, content: h.content })) : []),
      { role: 'user' as const, content: request.prompt }
    ];

    let lastError: any = null;

    for (const model of this.modelCandidates) {
      try {
        console.log(`[GroqProvider] Streaming with model: ${model} (History length: ${payloadMessages.length})`);
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            messages: payloadMessages,
            stream: true,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Groq API Error (${response.status}): ${errText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let hasYielded = false;

        if (reader) {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunkStr = decoder.decode(value, { stream: true });
            const lines = chunkStr.split('\n');

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                const data = trimmed.replace('data: ', '').trim();
                if (data === '[DONE]') break;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    hasYielded = true;
                    yield content;
                  }
                } catch {
                  // ignore non-json SSE lines
                }
              }
            }
          }
        }

        if (hasYielded) {
          return;
        }
      } catch (error: any) {
        console.warn(`[GroqProvider] Model ${model} failed:`, error?.message || error);
        lastError = error;
      }
    }

    throw lastError || new Error('All Groq models failed.');
  }
}
