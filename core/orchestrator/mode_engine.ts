/**
 * mode_engine.ts
 *
 * Execution Mode Engine for Luci (Inspired by Leon 2.0 Execution Modes)
 * 
 * Supports three primary execution modes:
 * 1. CONTROLLED - Fast, deterministic execution of native skills/commands without calling LLM.
 * 2. AGENT - Multi-turn ReAct/CodeAct reasoning loop with tool execution.
 * 3. SMART - Autonomous classification to select between CONTROLLED and AGENT based on query complexity.
 */

export type ExecutionMode = 'CONTROLLED' | 'AGENT' | 'SMART';

export interface ModeEvaluation {
  selectedMode: 'CONTROLLED' | 'AGENT';
  reasoning: string;
  confidence: number;
}

export class ModeEngine {
  private currentDefaultMode: ExecutionMode;

  constructor(defaultMode: ExecutionMode = 'SMART') {
    this.currentDefaultMode = defaultMode;
  }

  /**
   * Set global default mode.
   */
  public setMode(mode: ExecutionMode): void {
    this.currentDefaultMode = mode;
    console.log(`[ModeEngine] Active default mode updated to: ${mode}`);
  }

  /**
   * Get global default mode.
   */
  public getMode(): ExecutionMode {
    return this.currentDefaultMode;
  }

  /**
   * Evaluates input to select execution mode.
   */
  public evaluate(input: string, explicitMode?: ExecutionMode): ModeEvaluation {
    const targetMode = explicitMode || this.currentDefaultMode;

    if (targetMode === 'CONTROLLED') {
      return {
        selectedMode: 'CONTROLLED',
        reasoning: 'Explicitly forced CONTROLLED execution mode.',
        confidence: 1.0,
      };
    }

    if (targetMode === 'AGENT') {
      return {
        selectedMode: 'AGENT',
        reasoning: 'Explicitly forced AGENT execution mode.',
        confidence: 1.0,
      };
    }

    // SMART Mode Logic
    const normalized = input.toLowerCase().trim();

    // Fast-path patterns for CONTROLLED mode (quick triggers, OS app launches, basic queries)
    const controlledTriggers = [
      /^abra\s+/i,
      /^feche\s+/i,
      /^acenda\s+/i,
      /^apague\s+/i,
      /^desligue\s+/i,
      /^ligue\s+/i,
      /^que\s+horas\s+são/i,
      /^qual\s+é\s+a\s+data/i,
      /^tocar\s+/i,
      /^pausar/i,
      /^volume\s+/i,
    ];

    const isControlledMatch = controlledTriggers.some((pattern) => pattern.test(normalized));

    if (isControlledMatch) {
      return {
        selectedMode: 'CONTROLLED',
        reasoning: 'Matched fast-path deterministic pattern in SMART mode.',
        confidence: 0.95,
      };
    }

    // Deep research / multi-step patterns for AGENT mode
    const agentTriggers = [
      /pesquise/i,
      /analise/i,
      /compare/i,
      /crie\s+um\s+relatório/i,
      /escreva\s+um\s+código/i,
      /refatore/i,
      /planeje/i,
      /investigue/i,
    ];

    const isAgentMatch = agentTriggers.some((pattern) => pattern.test(normalized));

    if (isAgentMatch || normalized.split(' ').length > 12) {
      return {
        selectedMode: 'AGENT',
        reasoning: 'Complex query requiring multi-step reasoning or tool orchestration.',
        confidence: 0.88,
      };
    }

    // Default to AGENT for natural multi-turn conversation
    return {
      selectedMode: 'AGENT',
      reasoning: 'Defaulting to AGENT mode for standard natural conversation.',
      confidence: 0.75,
    };
  }
}
