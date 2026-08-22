/**
 * TavilyWebSearch — Real-Time Internet Perception Skill
 *
 * Connects Luci to the live web via Tavily AI API.
 * Fetches search results, news, real-time facts, stock quotes, and weather.
 */

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
}

export class TavilyWebSearch {
  private apiKey: string;
  private readonly apiUrl = 'https://api.tavily.com/search';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.TAVILY_API_KEY || '';
  }

  /**
   * Evaluates if a query requires live web search.
   */
  needsWebSearch(userInput: string): boolean {
    const clean = userInput.toLowerCase();

    // Expanded trigger keywords for live web perception
    const webTriggers = [
      'pesquis', 'busqu', 'procur', 'notícia', 'noticia', 'hoje', 'ontem',
      'cotação', 'cotacao', 'dólar', 'dolar', 'euro', 'bitcoin', 'clima', 'tempo',
      'temperatura', 'previsão', 'previsao', 'chover', 'chuva', 'graus',
      'ganhou', 'jogo', 'futebol', 'placar', 'últim', 'ultim', 'aconteceu',
      'quem é', 'quem e', 'onde fica', 'quanto tá', 'quanto ta', 'qual o preço',
      'qual o preco', 'resultado', 'eleição', 'eleicao', 'lançamento', 'lancamento'
    ];

    return webTriggers.some((trigger) => clean.includes(trigger));
  }

  /**
   * Executes a web search via Tavily REST API and returns formatted markdown context.
   */
  async search(query: string, maxResults = 4): Promise<string> {
    if (!this.apiKey) {
      console.warn('[TavilyWebSearch] TAVILY_API_KEY is not configured in .env');
      return '[PESQUISA WEB INDISPONÍVEL: TAVILY_API_KEY não configurada]';
    }

    try {
      console.log(`[TavilyWebSearch] Searching web for: "${query}"...`);
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          query,
          search_depth: 'basic',
          max_results: maxResults,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily API status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const results: TavilyResult[] = data.results || [];

      if (results.length === 0) {
        return `[PESQUISA WEB: Nenhum resultado retornado para "${query}"]`;
      }

      const formatted = results
        .map((r) => `- **${r.title}** (${r.url}):\n  ${r.content}`)
        .join('\n\n');

      console.log(`[TavilyWebSearch] Successfully retrieved ${results.length} search results.`);
      return `\n\n[INFORMAÇÕES EM TEMPO REAL DA INTERNET VIA TAVILY]\n${formatted}\nUse as informações acima para responder com precisão e citar os fatos atualizados ao usuário.`;
    } catch (error: any) {
      console.error('[TavilyWebSearch] Search failed:', error?.message || error);
      return `[FALHA NA BUSCA WEB: ${error?.message || 'Erro de conexão'}]`;
    }
  }
}
