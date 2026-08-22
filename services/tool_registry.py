"""
Tool Registry for LLM Function Calling (Gemini / Groq / OpenAI format).
Declares metadata schema for all 10 tools and dispatches execution dynamically.
"""

from typing import Dict, Any, List, Callable, Awaitable
from services.external_apis import (
    get_weather_forecast,
    get_weather_summary_wttr,
    get_brazil_holidays,
    get_currency_rates,
    get_hacker_news_top,
    get_wikipedia_summary,
    search_radio_stations,
    search_anime,
    search_tmdb_movies,
    extract_url_metadata,
    send_ntfy_push,
)

# ═══════════════════════════════════════════════════════════════════════════
# Gemini Tool Declarations (Function Declarations Schema)
# ═══════════════════════════════════════════════════════════════════════════

GEMINI_TOOL_DECLARATIONS: List[Dict[str, Any]] = [
    {
        "name": "get_weather_forecast",
        "description": "Obtém temperatura atual, velocidade do vento e código meteorológico de alta precisão via Open-Meteo usando latitude e longitude.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "latitude": {
                    "type": "NUMBER",
                    "description": "Latitude do local (padrão São Paulo: -23.5505)",
                },
                "longitude": {
                    "type": "NUMBER",
                    "description": "Longitude do local (padrão São Paulo: -46.6333)",
                },
            },
        },
    },
    {
        "name": "get_weather_summary_wttr",
        "description": "Retorna um resumo de clima ultra-rápido e formatado em texto para qualquer cidade do mundo via wttr.in.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "city_or_location": {
                    "type": "STRING",
                    "description": "Nome da cidade ou localização (ex: 'Sao Paulo', 'Rio de Janeiro', 'Curitiba')",
                },
            },
            "required": ["city_or_location"],
        },
    },
    {
        "name": "get_brazil_holidays",
        "description": "Lista todos os feriados nacionais oficiais do Brasil no ano especificado via BrasilAPI para planejamento de agenda.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "year": {
                    "type": "INTEGER",
                    "description": "Ano de consulta dos feriados (padrão 2026)",
                },
            },
        },
    },
    {
        "name": "get_currency_rates",
        "description": "Obtém cotações em tempo real de moedas e criptomoedas em BRL (Dólar, Euro, Bitcoin, etc) via AwesomeAPI.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "pairs": {
                    "type": "STRING",
                    "description": "Pares separados por vírgula (ex: 'USD-BRL,EUR-BRL,BTC-BRL')",
                },
            },
        },
    },
    {
        "name": "get_hacker_news_top",
        "description": "Obtém as notícias mais votadas e tendências de tecnologia e programação do Hacker News.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "limit": {
                    "type": "INTEGER",
                    "description": "Número de notícias a retornar (padrão: 5)",
                },
            },
        },
    },
    {
        "name": "get_wikipedia_summary",
        "description": "Busca o resumo enciclopédico, descrição factual e imagem de destaque de um tópico na Wikipedia.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "term": {
                    "type": "STRING",
                    "description": "Termo, conceito, pessoa ou lugar a pesquisar (ex: 'Inteligencia_artificial')",
                },
                "lang": {
                    "type": "STRING",
                    "description": "Código do idioma ('pt' para português, 'en' para inglês)",
                },
            },
            "required": ["term"],
        },
    },
    {
        "name": "search_radio_stations",
        "description": "Busca estações de rádio online por estilo musical para tocar no player de mídia da Luci.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "tag": {
                    "type": "STRING",
                    "description": "Gênero ou estilo musical (ex: 'lofi', 'jazz', 'synthwave', 'classical')",
                },
                "limit": {
                    "type": "INTEGER",
                    "description": "Quantidade máxima de rádios (padrão: 6)",
                },
            },
            "required": ["tag"],
        },
    },
    {
        "name": "search_anime",
        "description": "Busca animes, sinopses, notas e pôsteres no banco de dados do MyAnimeList via Jikan API.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "query": {
                    "type": "STRING",
                    "description": "Nome do anime (ex: 'Death Note', 'Solo Leveling', 'Attack on Titan')",
                },
                "limit": {
                    "type": "INTEGER",
                    "description": "Quantidade máxima de resultados (padrão: 5)",
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "search_tmdb_movies",
        "description": "Busca filmes e séries com sinopse, nota e poster via The Movie Database (TMDB).",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "query": {
                    "type": "STRING",
                    "description": "Título do filme ou série",
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "extract_url_metadata",
        "description": "Extrai informações ricas (título, descrição, autor, thumbnail) de qualquer link web via Microlink.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "target_url": {
                    "type": "STRING",
                    "description": "URL completa do link (ex: 'https://github.com')",
                },
            },
            "required": ["target_url"],
        },
    },
    {
        "name": "send_ntfy_push",
        "description": "Envia notificações push instantâneas para celular ou desktop do usuário via Ntfy.sh.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "topic": {
                    "type": "STRING",
                    "description": "Tópico do canal no ntfy.sh (ex: 'luci_alerts')",
                },
                "message": {
                    "type": "STRING",
                    "description": "Mensagem da notificação",
                },
                "title": {
                    "type": "STRING",
                    "description": "Título da notificação",
                },
                "priority": {
                    "type": "INTEGER",
                    "description": "Prioridade de 1 (mínima) a 5 (máxima)",
                },
            },
            "required": ["message"],
        },
    },
    {
        "name": "salvar_memoria",
        "description": "Salva fatos importantes, preferências do usuário, notas de projeto, dados pessoais ou contexto no banco vetorial de longo prazo da Luci.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "chave": {
                    "type": "STRING",
                    "description": "Identificador ou resumo curto do tópico (ex: 'preferencia_tema', 'projeto_policryl')",
                },
                "conteudo": {
                    "type": "STRING",
                    "description": "Conteúdo factual completo a ser lembrado",
                },
                "categoria": {
                    "type": "STRING",
                    "description": "Categoria da memória (ex: 'preferencia', 'trabalho', 'pessoal', 'engenharia')",
                },
            },
            "required": ["chave", "conteudo"],
        },
    },
    {
        "name": "recuperar_memoria",
        "description": "Busca semântica por proximidade vetorial no histórico de memórias e preferências salvas da Luci.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "busca_semantica": {
                    "type": "STRING",
                    "description": "Termo de busca ou pergunta para encontrar contexto relevante",
                },
                "limite": {
                    "type": "INTEGER",
                    "description": "Quantidade máxima de memórias a recuperar (padrão: 3)",
                },
            },
            "required": ["busca_semantica"],
        },
    },
    {
        "name": "get_stock_quote",
        "description": "Obtém a cotação atual, variação percentual e dados financeiros de ações da B3 ou bolsas globais via yfinance. Ex: 'PETR4.SA', 'VALE3.SA', 'AAPL', 'NVDA'.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "ticker": {
                    "type": "STRING",
                    "description": "Código do ticker da ação (ex: 'PETR4.SA', 'AAPL')",
                },
            },
            "required": ["ticker"],
        },
    },
    {
        "name": "validate_and_format_phone",
        "description": "Valida, extrai operadora, região e formata números de telefone no padrão nacional e internacional (E.164) usando a lib phonenumbers.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "raw_number": {
                    "type": "STRING",
                    "description": "Número de telefone informado pelo usuário (ex: '11999998888', '+55 11 98888-7777')",
                },
            },
            "required": ["raw_number"],
        },
    },
    {
        "name": "get_link_preview_and_screenshot",
        "description": "Captura metadados ricos (título, descrição, autor, imagem) e gera URL de screenshot visual da página web via Microlink.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "target_url": {
                    "type": "STRING",
                    "description": "URL completa do site",
                },
            },
            "required": ["target_url"],
        },
    },
    {
        "name": "search_open_library_books",
        "description": "Busca livros, autores, primeiro ano de publicação e capas no acervo público global da Open Library.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "query": {
                    "type": "STRING",
                    "description": "Título do livro, autor ou assunto a buscar (ex: 'Clean Code', 'Machado de Assis')",
                },
                "limit": {
                    "type": "INTEGER",
                    "description": "Quantidade máxima de livros a retornar (padrão: 4)",
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "get_color_scheme_info",
        "description": "Obtém nome oficial da cor, código RGB, HSL, contraste e dados visuais a partir de um código HEX via The Color API.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "hex_code": {
                    "type": "STRING",
                    "description": "Código hexadecimal da cor (ex: '00F2FE', '#FF5733')",
                },
            },
            "required": ["hex_code"],
        },
    },
    {
        "name": "search_duckduckgo",
        "description": "Realiza busca na web em tempo real (Google/DuckDuckGo) sem chave de API, retornando títulos, URLs e resumos.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "query": {
                    "type": "STRING",
                    "description": "Termo de busca na web",
                },
                "max_results": {
                    "type": "INTEGER",
                    "description": "Quantidade máxima de resultados (padrão: 5)",
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "track_flights_opensky",
        "description": "Rastreia voos, aviões e tráfego aéreo ao vivo em coordenadas geográficas via OpenSky Network pública.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "lamin": {"type": "NUMBER", "description": "Latitude mínima da caixa delimitadora (padrão SP: -24.5)"},
                "lamax": {"type": "NUMBER", "description": "Latitude máxima da caixa delimitadora (padrão SP: -22.5)"},
                "lomin": {"type": "NUMBER", "description": "Longitude mínima da caixa delimitadora (padrão SP: -47.5)"},
                "lomax": {"type": "NUMBER", "description": "Longitude máxima da caixa delimitadora (padrão SP: -45.5)"},
                "limit": {"type": "INTEGER", "description": "Limite de aeronaves a retornar (padrão: 5)"},
            },
        },
    },
    {
        "name": "get_worldwide_holidays",
        "description": "Lista feriados oficiais de qualquer país do mundo (US, CN, GB, DE, JP, etc.) no ano especificado via Nager.Date.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "country_code": {
                    "type": "STRING",
                    "description": "Código ISO do país com 2 letras (ex: 'US', 'CN', 'GB', 'DE', 'JP')",
                },
                "year": {
                    "type": "INTEGER",
                    "description": "Ano da consulta (padrão 2026)",
                },
            },
            "required": ["country_code"],
        },
    },
    {
        "name": "get_quran_ayah",
        "description": "Consulta versículos do Alcorão em Árabe e tradução oficial em Inglês via AlQuran Cloud.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "surah_ayah": {
                    "type": "STRING",
                    "description": "Referência do Surah e Ayah (ex: '1:1', '2:255')",
                },
            },
            "required": ["surah_ayah"],
        },
    },
]

from services.memory_service import salvar_memoria_tool, recuperar_memoria_tool
from tools.market_and_finance import get_stock_quote
from tools.utilities import validate_and_format_phone, get_link_preview_and_screenshot, search_open_library_books, get_worldwide_holidays
from tools.design_colors import get_color_scheme_info
from tools.texts_and_quotes import get_bible_verse, get_quran_ayah
from tools.web_search import search_duckduckgo
from tools.flight_tracker import track_flights_opensky

# ═══════════════════════════════════════════════════════════════════════════
# Tool Dispatcher
# ═══════════════════════════════════════════════════════════════════════════

TOOL_FUNCTION_MAP: Dict[str, Callable[..., Awaitable[Dict[str, Any]]]] = {
    "get_weather_forecast": get_weather_forecast,
    "get_weather_summary_wttr": get_weather_summary_wttr,
    "get_brazil_holidays": get_brazil_holidays,
    "get_currency_rates": get_currency_rates,
    "get_hacker_news_top": get_hacker_news_top,
    "get_wikipedia_summary": get_wikipedia_summary,
    "search_radio_stations": search_radio_stations,
    "search_anime": search_anime,
    "search_tmdb_movies": search_tmdb_movies,
    "extract_url_metadata": extract_url_metadata,
    "send_ntfy_push": send_ntfy_push,
    "salvar_memoria": salvar_memoria_tool,
    "recuperar_memoria": recuperar_memoria_tool,
    "get_stock_quote": get_stock_quote,
    "validate_and_format_phone": lambda raw_number: validate_and_format_phone(raw_number),
    "get_link_preview_and_screenshot": get_link_preview_and_screenshot,
    "search_open_library_books": search_open_library_books,
    "get_color_scheme_info": get_color_scheme_info,
    "get_bible_verse": get_bible_verse,
    "get_quran_ayah": get_quran_ayah,
    "search_duckduckgo": search_duckduckgo,
    "track_flights_opensky": track_flights_opensky,
    "get_worldwide_holidays": get_worldwide_holidays,
}

class ToolRegistry:
    @staticmethod
    def get_declarations() -> List[Dict[str, Any]]:
        """Retorna todas as declarações de ferramentas formatadas para Function Calling."""
        return GEMINI_TOOL_DECLARATIONS

    @staticmethod
    async def execute(tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Executa a ferramenta assíncrona correspondente e retorna os dados brutos."""
        func = TOOL_FUNCTION_MAP.get(tool_name)
        if not func:
            return {"error": f"Ferramenta '{tool_name}' não encontrada no registro."}

        try:
            import inspect
            if inspect.iscoroutinefunction(func):
                return await func(**arguments)
            else:
                res = func(**arguments)
                if inspect.iscoroutine(res):
                    return await res
                return res
        except TypeError as te:
            return {"error": f"Argumentos inválidos para {tool_name}: {str(te)}"}
        except Exception as e:
            return {"error": f"Erro na execução da ferramenta {tool_name}: {str(e)}"}
