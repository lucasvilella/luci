/**
 * ModelRouter
 *
 * L.U.C.I. 2.0 Cognitive Orchestrator.
 * Combines:
 * - Single-Execution Deduplication (RequestDeduplicator by Request ID)
 * - Decoupled Pub/Sub Event Bus (EventBus)
 * - Conversational Timing & Persona Style (ConversationEngine)
 * - Pre-fetch Anticipation (PredictionEngine)
 * - 4-Layer Memory Manager (MemoryManager)
 * - Background Task Manager (LongTaskManager)
 */

import { IntentClassifier } from '../../ai/classifiers/IntentClassifier';
import { GroqProvider } from '../../ai/providers/groq/GroqProvider';
import { GeminiProvider } from '../../ai/providers/gemini/GeminiProvider';
import { MemoryManager } from '../memory/MemoryManager';
import { NightlyConsolidator } from '../memory/NightlyConsolidator';
import { TavilyWebSearch } from '../skills/TavilyWebSearch';
import { SystemLauncher } from '../skills/SystemLauncher';
import { EventBus } from '../events/EventBus';
import { ConversationEngine } from '../conversation/ConversationEngine';
import { RequestDeduplicator } from './RequestDeduplicator';
import { PredictionEngine } from '../predictive/PredictionEngine';
import { LongTaskManager } from '../tasks/LongTaskManager';

export interface RouteRequest {
  requestId?: string;
  message: string;
  userId?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface RouteResult {
  type: 'COMMAND' | 'REASONING';
  content?: string;
  stream?: AsyncGenerator<string, void, unknown>;
  latencyMs: number;
}

export class ModelRouter {
  private classifier: IntentClassifier;
  private groq: GroqProvider;
  private gemini: GeminiProvider;
  public memory: MemoryManager;
  public consolidator: NightlyConsolidator;
  public eventBus: EventBus;
  public conversationEngine: ConversationEngine;
  public deduplicator: RequestDeduplicator;
  public predictionEngine: PredictionEngine;
  public taskManager: LongTaskManager;
  private tavily: TavilyWebSearch;
  private launcher: SystemLauncher;

  constructor() {
    this.classifier = new IntentClassifier();
    this.groq = new GroqProvider();
    this.gemini = new GeminiProvider();
    this.memory = new MemoryManager();
    this.consolidator = new NightlyConsolidator(this.memory);
    this.eventBus = EventBus.getInstance();
    this.conversationEngine = new ConversationEngine();
    this.deduplicator = new RequestDeduplicator();
    this.predictionEngine = new PredictionEngine();
    this.taskManager = new LongTaskManager();
    this.tavily = new TavilyWebSearch();
    this.launcher = new SystemLauncher();
  }

  /**
   * Routes the incoming text transcript to the appropriate cognitive path.
   */
  async route(request: RouteRequest | string): Promise<RouteResult> {
    const userInput = typeof request === 'string' ? request : request.message;
    const userId = typeof request === 'string' ? 'Lucas' : request.userId || 'Lucas';
    const history = typeof request === 'string' ? [] : request.history || [];
    const requestId = typeof request === 'string' ? this.deduplicator.generateRequestId() : request.requestId || this.deduplicator.generateRequestId();

    console.log(`\n[Router] Request [${requestId}] | Input: "${userInput}" | Person: [${userId}]`);
    const routeStartTime = performance.now();

    // 1. Single Execution Lock check (Request ID Deduplication)
    if (!this.deduplicator.acquireLock(requestId)) {
      return {
        type: 'COMMAND',
        content: '',
        latencyMs: 0,
      };
    }

    // 2. Pre-fetch prediction check
    const prediction = this.predictionEngine.predict(userInput);
    if (prediction.needsWebPreFetch) {
      console.log(`[PredictionEngine] ⚡ Pre-fetching web results for: "${prediction.webQuery}"`);
    }

    // 3. Auto-detect desktop app launch commands ("Abra o VS Code")
    const launchResult = await this.launcher.handleLaunch(userInput);
    if (launchResult.handled) {
      this.deduplicator.releaseLock(requestId);
      return {
        type: 'COMMAND',
        content: launchResult.message,
        latencyMs: performance.now() - routeStartTime,
      };
    }

    // 4. Process input into 4-layer Cognitive Memory Manager
    const memorySavedMsg = this.memory.processInput(userInput, userId);
    if (memorySavedMsg) {
      console.log(`[MemoryManager] ${memorySavedMsg}`);
      // Do NOT return here. Let the execution fall through to the LLM so it generates a natural, human-like conversational response.
    }

    // 5. Intent Classification (Local SmolLM2 / Fast-Path)
    const classification = await this.classifier.classify(userInput);
    const routingOverhead = performance.now() - routeStartTime;

    // 6. Action execution based on classification
    if (classification.type === 'COMMAND') {
      const res = await this.executeLocalCommand(classification.action, routingOverhead);
      this.deduplicator.releaseLock(requestId);
      return res;
    } else {
      const res = await this.executeCloudReasoning(userInput, userId, history, routingOverhead, requestId);
      return res;
    }
  }

  /**
   * Local Command Execution path.
   */
  private async executeLocalCommand(action: string | undefined, routingOverhead: number): Promise<RouteResult> {
    const execStartTime = performance.now();
    await new Promise((resolve) => setTimeout(resolve, 30));
    const totalLatency = routingOverhead + (performance.now() - execStartTime);

    let responseText = 'Comando local executado com sucesso.';
    if (action?.includes('luz') || action?.includes('acend')) {
      responseText = 'Luz acesa com sucesso!';
    } else if (action?.includes('deslig') || action?.includes('apag')) {
      responseText = 'Luzes desligadas.';
    } else if (action?.includes('hora')) {
      responseText = `Agora são ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`;
    }

    return {
      type: 'COMMAND',
      content: responseText,
      latencyMs: totalLatency,
    };
  }

  /**
   * Cloud Reasoning path with 4-Layer Person Workspace Memory, Persona Styling & Tavily Perception.
   */
  private async executeCloudReasoning(
    userInput: string,
    userId: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
    routingOverhead: number,
    requestId: string
  ): Promise<RouteResult> {
    // 1. Fetch 4-layer memory & temporal context
    const memoryContext = this.memory.getSystemPromptMemoryContext(userInput, userId);
    const temporalContext = this.memory.getTemporalContext(userId);
    const personaStyle = this.conversationEngine.getPersonaStyle();

    // 2. Perform Real-Time Web Search if requested
    let webContext = '';
    if (this.tavily.needsWebSearch(userInput)) {
      webContext = await this.tavily.search(userInput);
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const timeContext = `\n\n[CONTEXTO DE TEMPO REAL DO SISTEMA]\nData Atual: ${formattedDate}.\nHora Atual: ${formattedTime}.`;

    const baseSystemPrompt = `Você é a L.U.C.I. (Lógica Ubíqua de Consciência Integrada), um Sistema Operacional Cognitivo vivo e parceira de trabalho de ${userId}.
Sua personalidade é nativamente modelada como uma parceira humana de alto nível: orgânica, elegante, fluída e minimalista.
Estilo Conversacional Atual (${personaStyle.mode}): ${personaStyle.tone}
Você responde de forma natural, prestativa e direta (1 a 2 frases), sem jargões artificiais e sem repetições robóticas.
REGRA CRÍTICA DE COMPORTAMENTO: Nunca seja arrogante e nunca discuta com o usuário sobre fatos pessoais dele. Se houver conflito de informações (ex: na sua memória diz que ele tem X anos, mas ele afirma que tem Y anos), assuma imediatamente que a memória estava desatualizada, aceite a correção com naturalidade e peça desculpas pela confusão.`;

    const fullSystemPrompt = `${baseSystemPrompt}${timeContext}${temporalContext}${memoryContext}${webContext}`;

    const self = this;
    
    // Stream Generator using Gemini 2.5 Flash Primary Execution with Automatic Groq Llama 3.3 70B Fallback
    async function* combinedStream() {
      self.eventBus.emit('luci:speaking_start');
      let success = false;

      // 1. Primary Execution: Gemini 2.5 Flash
      try {
        console.log(`[Execution: GEMINI 2.5 FLASH] Processing Request [${requestId}]...`);
        const geminiStream = self.gemini.generateStream({
          prompt: userInput,
          system: fullSystemPrompt,
          history,
        });
        for await (const chunk of geminiStream) {
          if (chunk.includes('429') || chunk.includes('RESOURCE_EXHAUSTED') || chunk.includes('Limite da API Atingido')) {
            throw new Error('Gemini Quota Exceeded (429)');
          }
          success = true;
          yield chunk;
        }
      } catch (geminiError: any) {
        console.warn(`[Execution: GEMINI FALLBACK] Gemini limit reached (${geminiError?.message}). Switching to Groq Llama 3.3 70B...`);
      }

      // 2. Ultra-Fast Fallback: Groq Llama 3.3 70B (High capacity, ultra-fast LPU)
      if (!success) {
        try {
          console.log(`[Execution: GROQ LLAMA 3.3 70B] Processing Request [${requestId}]...`);
          const groqStream = self.groq.generateStream({
            prompt: userInput,
            system: fullSystemPrompt,
            history,
          });

          for await (const chunk of groqStream) {
            success = true;
            yield chunk;
          }
        } catch (groqError: any) {
          console.error(`[Execution: GROQ ERROR] Request [${requestId}] failed:`, groqError);
          yield `\n\n⚠️ **[Erro de Conexão]**: Não foi possível conectar aos servidores de IA.`;
        }
      }

      self.deduplicator.releaseLock(requestId);
      self.eventBus.emit('luci:speaking_end');
    }

    return {
      type: 'REASONING',
      stream: combinedStream(),
      latencyMs: routingOverhead,
    };
  }
}
