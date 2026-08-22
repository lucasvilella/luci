/**
 * SmolLMProvider
 *
 * Local lightweight model provider using Ollama's REST API.
 * Runs 100% on CPU and is optimized for low latency (<500ms).
 * Not meant for streaming or long conversations; strictly for
 * single-turn classification and mechanical commands.
 */

export interface SmolLMRequest {
  prompt: string;
  system?: string;
  temperature?: number;
}

export interface SmolLMResponse {
  response: string;
  totalDurationMs: number;
  evalCount: number;
}

export class SmolLMProvider {
  private readonly baseUrl: string;
  private readonly modelName: string;

  constructor(
    baseUrl: string = 'http://127.0.0.1:11434',
    modelName: string = 'smollm2:1.7b' // Default 1.7b parameter model
  ) {
    this.baseUrl = baseUrl;
    this.modelName = modelName;
  }

  /**
   * Executes a prompt locally. Uses fetch for minimal overhead.
   * Disables streaming for lowest latency on small outputs.
   */
  async generate(request: SmolLMRequest): Promise<SmolLMResponse> {
    const startTime = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 400); // 400ms strict SLA so user never waits

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.modelName,
          prompt: request.prompt,
          system: request.system,
          stream: false,
          keep_alive: -1, // Keep model pinned in RAM
          options: {
            temperature: request.temperature ?? 0.0,
            num_ctx: 512, // Small context buffer for fast CPU inference
            num_predict: 25, // Only output small classification tokens
            num_thread: 8, // Use multi-threading
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      const endTime = performance.now();

      return {
        response: data.response.trim(),
        totalDurationMs: endTime - startTime,
        evalCount: data.eval_count ?? 0,
      };
    } catch (error) {
      console.error('[SmolLMProvider] Failed to generate locally:', error);
      throw error;
    }
  }
}
