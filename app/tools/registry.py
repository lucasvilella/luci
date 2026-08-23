"""
Central Tool Registry & Function Calling Schema Exporter.
Gera os schemas JSON para chamada autônoma de ferramentas por modelos de linguagem (Gemini, Groq, Llama).
"""

from typing import List, Dict, Any, Callable
from app.tools.weather_tool import get_weather_forecast, get_weather_summary_text
from app.tools.finance_tool import get_stock_quote, get_currency_rates
from app.tools.holidays_tool import get_national_holidays, check_is_business_day
from app.tools.radio_tool import search_radio_stations
from app.tools.utilities_tool import get_link_preview_metadata, validate_and_format_phone

TOOL_DEFINITIONS = [
    {
        "name": "get_weather_forecast",
        "description": "Obtém dados meteorológicos detalhados (temperatura, umidade, vento, chuva) via Open-Meteo.",
        "parameters": {
            "type": "object",
            "properties": {
                "latitude": {"type": "number", "description": "Latitude geográfica da localidade."},
                "longitude": {"type": "number", "description": "Longitude geográfica da localidade."},
                "city_name": {"type": "string", "description": "Nome da cidade para exibição."},
            },
            "required": ["latitude", "longitude"],
        },
        "handler": get_weather_forecast,
    },
    {
        "name": "get_weather_summary_text",
        "description": "Obtém um resumo textual rápido do clima atual para qualquer cidade do mundo via wttr.in.",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {"type": "string", "description": "Nome da cidade (ex: 'Sao Paulo', 'Brasilia', 'Tokyo')."},
            },
            "required": ["location"],
        },
        "handler": get_weather_summary_text,
    },
    {
        "name": "get_stock_quote",
        "description": "Obtém a cotação em tempo real de ações na B3 (ex: PETR4.SA, VALE3.SA) ou exterior (AAPL, NVDA).",
        "parameters": {
            "type": "object",
            "properties": {
                "ticker": {"type": "string", "description": "Símbolo do ticker da ação (ex: PETR4.SA, AAPL, NVDA)."},
            },
            "required": ["ticker"],
        },
        "handler": get_stock_quote,
    },
    {
        "name": "get_currency_rates",
        "description": "Obtém as cotações oficiais e tempo real de moedas e criptoativos (Dólar, Euro, Bitcoin, Ethereum em Reais).",
        "parameters": {
            "type": "object",
            "properties": {
                "pairs": {"type": "string", "description": "Pares separados por vírgula (padrão: 'USD-BRL,EUR-BRL,BTC-BRL,ETH-BRL')."},
            },
        },
        "handler": get_currency_rates,
    },
    {
        "name": "get_national_holidays",
        "description": "Lista os feriados nacionais oficiais do Brasil no ano selecionado.",
        "parameters": {
            "type": "object",
            "properties": {
                "ano": {"type": "integer", "description": "Ano de consulta (ex: 2026)."},
            },
        },
        "handler": get_national_holidays,
    },
    {
        "name": "check_is_business_day",
        "description": "Verifica se uma data específica é dia útil ou feriado/final de semana no Brasil.",
        "parameters": {
            "type": "object",
            "properties": {
                "data_str": {"type": "string", "description": "Data no formato YYYY-MM-DD (ex: '2026-12-25')."},
            },
            "required": ["data_str"],
        },
        "handler": check_is_business_day,
    },
    {
        "name": "search_radio_stations",
        "description": "Busca estações de rádio públicas online para streaming (lofi, jazz, classical, rock, news).",
        "parameters": {
            "type": "object",
            "properties": {
                "tag": {"type": "string", "description": "Gênero musical ou tag da rádio (ex: 'lofi', 'jazz')."},
                "country": {"type": "string", "description": "País da estação (opcional)."},
                "limit": {"type": "integer", "description": "Quantidade máxima de estações (padrão: 10)."},
            },
            "required": ["tag"],
        },
        "handler": search_radio_stations,
    },
    {
        "name": "get_link_preview_metadata",
        "description": "Extrai metadados completos de preview (título, descrição, autor, imagem) de qualquer link da web.",
        "parameters": {
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "URL completa do link para preview."},
            },
            "required": ["url"],
        },
        "handler": get_link_preview_metadata,
    },
    {
        "name": "validate_and_format_phone",
        "description": "Valida e formata números de telefone celulares e fixos nacionais e internacionais.",
        "parameters": {
            "type": "object",
            "properties": {
                "phone_number_str": {"type": "string", "description": "Número de telefone com DDD (ex: '11999998888')."},
                "default_country": {"type": "string", "description": "Código do país ISO 2 letras (padrão: 'BR')."},
            },
            "required": ["phone_number_str"],
        },
        "handler": validate_and_format_phone,
    },
]

class ToolRegistry:
    def __init__(self):
        self._tools = {tool["name"]: tool for tool in TOOL_DEFINITIONS}

    def register(self, name: str, description: str, parameters: Dict[str, Any]):
        """Decorator para registrar dinamicamente uma nova ferramenta no registry."""
        def decorator(handler: Callable):
            self._tools[name] = {
                "name": name,
                "description": description,
                "parameters": parameters,
                "handler": handler
            }
            return handler
        return decorator

    def get_declarations_for_llm(self) -> List[Dict[str, Any]]:
        """Exporta a lista de esquemas compatível com Function Calling."""
        return [
            {
                "name": t["name"],
                "description": t["description"],
                "parameters": t["parameters"],
            }
            for t in self._tools.values()
        ]

    async def execute(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        """Executa a ferramenta correspondente com os argumentos fornecidos."""
        tool = self._tools.get(tool_name)
        if not tool:
            return {"sucesso": False, "mensagem": f"Ferramenta '{tool_name}' não encontrada."}
        
        handler = tool["handler"]
        try:
            return await handler(arguments) if "arguments" in handler.__code__.co_varnames else await handler(**arguments)
        except Exception as e:
            return {"sucesso": False, "mensagem": f"Erro na execução da ferramenta: {str(e)}"}

tool_registry = ToolRegistry()
