import os
from typing import List, Dict, Any

export interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * 10 Ferramentas Externas da Luci mapeadas para Gemini / Groq Function Calling
 */
export const LUCI_EXTERNAL_FUNCTION_DECLARATIONS: GeminiFunctionDeclaration[] = [
  {
    name: "get_weather_forecast",
    description: "Obtém temperatura atual, velocidade do vento e código meteorológico de alta precisão via Open-Meteo usando latitude e longitude.",
    parameters: {
      type: "OBJECT",
      properties: {
        latitude: { type: "NUMBER", description: "Latitude do local (padrão São Paulo: -23.5505)" },
        longitude: { type: "NUMBER", description: "Longitude do local (padrão São Paulo: -46.6333)" }
      }
    }
  },
  {
    name: "get_weather_summary_wttr",
    description: "Retorna um resumo de clima ultra-rápido e formatado em texto para qualquer cidade do mundo via wttr.in.",
    parameters: {
      type: "OBJECT",
      properties: {
        city_or_location: { type: "STRING", description: "Nome da cidade ou localização (ex: 'Sao Paulo', 'Rio de Janeiro')" }
      },
      required: ["city_or_location"]
    }
  },
  {
    name: "get_brazil_holidays",
    description: "Lista todos os feriados nacionais oficiais do Brasil no ano especificado via BrasilAPI para planejamento de agenda.",
    parameters: {
      type: "OBJECT",
      properties: {
        year: { type: "INTEGER", description: "Ano de consulta dos feriados (padrão 2026)" }
      }
    }
  },
  {
    name: "get_currency_rates",
    description: "Obtém cotações em tempo real de moedas e criptomoedas em BRL (Dólar, Euro, Bitcoin, etc) via AwesomeAPI.",
    parameters: {
      type: "OBJECT",
      properties: {
        pairs: { type: "STRING", description: "Pares separados por vírgula (ex: 'USD-BRL,EUR-BRL,BTC-BRL')" }
      }
    }
  },
  {
    name: "get_hacker_news_top",
    description: "Obtém as notícias mais votadas e tendências de tecnologia e programação do Hacker News.",
    parameters: {
      type: "OBJECT",
      properties: {
        limit: { type: "INTEGER", description: "Número de notícias a retornar (padrão: 5)" }
      }
    }
  },
  {
    name: "get_wikipedia_summary",
    description: "Busca o resumo enciclopédico, descrição factual e imagem de destaque de um tópico na Wikipedia.",
    parameters: {
      type: "OBJECT",
      properties: {
        term: { type: "STRING", description: "Termo, conceito, pessoa ou lugar a pesquisar (ex: 'Inteligencia_artificial')" },
        lang: { type: "STRING", description: "Código do idioma ('pt' para português, 'en' para inglês)" }
      },
      required: ["term"]
    }
  },
  {
    name: "search_radio_stations",
    description: "Busca estações de rádio online por estilo musical para tocar no player de mídia da Luci.",
    parameters: {
      type: "OBJECT",
      properties: {
        tag: { type: "STRING", description: "Gênero ou estilo musical (ex: 'lofi', 'jazz', 'synthwave', 'classical')" },
        limit: { type: "INTEGER", description: "Quantidade máxima de rádios (padrão: 6)" }
      },
      required: ["tag"]
    }
  },
  {
    name: "search_anime",
    description: "Busca animes, sinopses, notas e pôsteres no banco de dados do MyAnimeList via Jikan API.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Nome do anime (ex: 'Death Note', 'Solo Leveling', 'Attack on Titan')" },
        limit: { type: "INTEGER", description: "Quantidade máxima de resultados (padrão: 5)" }
      },
      required: ["query"]
    }
  },
  {
    name: "search_tmdb_movies",
    description: "Busca filmes e séries com sinopse, nota e poster via The Movie Database (TMDB).",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Título do filme ou série" }
      },
      required: ["query"]
    }
  },
  {
    name: "extract_url_metadata",
    description: "Extrai informações ricas (título, descrição, autor, thumbnail) de qualquer link web via Microlink.",
    parameters: {
      type: "OBJECT",
      properties: {
        target_url: { type: "STRING", description: "URL completa do link (ex: 'https://github.com')" }
      },
      required: ["target_url"]
    }
  },
  {
    name: "send_ntfy_push",
    description: "Envia notificações push instantâneas para celular ou desktop do usuário via Ntfy.sh.",
    parameters: {
      type: "OBJECT",
      properties: {
        topic: { type: "STRING", description: "Tópico do canal no ntfy.sh (ex: 'luci_alerts')" },
        message: { type: "STRING", description: "Mensagem da notificação" },
        title: { type: "STRING", description: "Título da notificação" },
        priority: { type: "INTEGER", description: "Prioridade de 1 (mínima) a 5 (máxima)" }
      },
      required: ["message"]
    }
  }
];
