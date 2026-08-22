/**
 * tool_router.ts
 *
 * Smart Tool Router for L.U.C.I. (Inspired by Jarvis Local Desktop & OpenJarvis)
 *
 * Filters available MCP servers and tools dynamically based on input relevance,
 * preventing context window saturation when hundreds of tools are installed.
 */

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: 'system' | 'web' | 'home_automation' | 'media' | 'custom';
  keywords: string[];
  handler: (args: Record<string, any>) => Promise<any>;
}

export interface ToolMatchResult {
  tool: ToolDefinition;
  score: number;
}

export class SmartToolRouter {
  private registry: Map<string, ToolDefinition> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  /**
   * Register a new tool or MCP server capability.
   */
  public registerTool(tool: ToolDefinition): void {
    this.registry.set(tool.id, tool);
    console.log(`[SmartToolRouter] Registered tool: ${tool.name} [${tool.id}]`);
  }

  /**
   * Unregister a tool.
   */
  public unregisterTool(toolId: string): void {
    this.registry.delete(toolId);
  }

  /**
   * Select top-K most relevant tools for a user prompt.
   */
  public selectTools(query: string, topK: number = 3): ToolMatchResult[] {
    const normalizedQuery = query.toLowerCase();
    const queryTokens = normalizedQuery.split(/\s+/);
    const results: ToolMatchResult[] = [];

    for (const tool of this.registry.values()) {
      let score = 0;

      // Match description keywords
      const descTokens = tool.description.toLowerCase().split(/\s+/);
      for (const token of queryTokens) {
        if (token.length < 3) continue;
        if (descTokens.includes(token)) score += 2;
        if (tool.name.toLowerCase().includes(token)) score += 3;

        for (const kw of tool.keywords) {
          if (kw.toLowerCase().includes(token)) {
            score += 4;
          }
        }
      }

      if (score > 0) {
        results.push({ tool, score });
      }
    }

    // Sort descending by score
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, topK);
  }

  /**
   * Register core system tools.
   */
  private registerDefaultTools(): void {
    this.registerTool({
      id: 'system_launcher',
      name: 'System App Launcher',
      description: 'Abra aplicativos do sistema operacional como VS Code, Navegador, Calculadora.',
      category: 'system',
      keywords: ['abrir', 'executar', 'iniciar', 'vscode', 'navegador', 'chrome'],
      handler: async (args) => ({ status: 'executed', target: args.appName }),
    });

    this.registerTool({
      id: 'web_search',
      name: 'Web Search Tool',
      description: 'Pesquise por notícias, fatos atuais e informações na web em tempo real.',
      category: 'web',
      keywords: ['pesquisar', 'buscar', 'google', 'notícias', 'tempo', 'previsão'],
      handler: async (args) => ({ status: 'searched', query: args.query }),
    });

    this.registerTool({
      id: 'home_automation',
      name: 'Home Automation Switch',
      description: 'Controle lâmpadas, tomadas e dispositivos inteligentes da casa.',
      category: 'home_automation',
      keywords: ['luz', 'lâmpada', 'tomada', 'ar-condicionado', 'casa', 'acender', 'apagar'],
      handler: async (args) => ({ status: 'toggled', device: args.device }),
    });
  }
}
