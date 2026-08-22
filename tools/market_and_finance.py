"""
Market & Financial Tools (Zero-Auth / Sem Chave de API).
- Cotações globais e B3 (PETR4.SA, VALE3.SA, AAPL, NVDA, TSLA) via yfinance (async to_thread).
- Câmbio e Cripto em tempo real via AwesomeAPI.
"""

import asyncio
from typing import Dict, Any, List, Optional
import httpx
import yfinance as yf

from services.cache import global_ttl_cache

TIMEOUT = 4.0

def _get_yfinance_sync(ticker_symbol: str) -> Dict[str, Any]:
    ticker = yf.Ticker(ticker_symbol)
    info = ticker.info or {}
    
    # Preço atual com fallback para regularMarketPrice / previousClose
    current_price = (
        info.get("currentPrice") 
        or info.get("regularMarketPrice") 
        or info.get("previousClose")
    )
    
    return {
        "symbol": ticker_symbol.upper(),
        "shortName": info.get("shortName") or info.get("longName") or ticker_symbol,
        "currency": info.get("currency", "BRL" if ".SA" in ticker_symbol.upper() else "USD"),
        "currentPrice": current_price,
        "regularMarketChangePercent": round(info.get("regularMarketChangePercent", 0), 2) if info.get("regularMarketChangePercent") is not None else None,
        "dayHigh": info.get("dayHigh"),
        "dayLow": info.get("dayLow"),
        "marketCap": info.get("marketCap"),
        "fiftyTwoWeekHigh": info.get("fiftyTwoWeekHigh"),
        "fiftyTwoWeekLow": info.get("fiftyTwoWeekLow"),
    }

async def get_stock_quote(ticker: str) -> Dict[str, Any]:
    """
    Obtém a cotação atual, variação e resumo financeiro de uma ação na B3 ou bolsas globais.
    Exemplos: 'PETR4.SA', 'VALE3.SA', 'AAPL', 'NVDA', 'TSLA'.
    """
    symbol = ticker.strip().upper()
    cache_key = f"stock:{symbol}"
    cached = global_ttl_cache.get(cache_key)
    if cached:
        cached["cached"] = True
        return cached

    try:
        data = await asyncio.to_thread(_get_yfinance_sync, symbol)
        if data.get("currentPrice") is None:
            return {"encontrado": False, "mensagem": f"Não foi possível obter dados para o ticker '{symbol}'."}
        
        data["encontrado"] = True
        data["cached"] = False
        global_ttl_cache.set(cache_key, data, ttl_seconds=180)  # 3 min TTL
        return data
    except Exception as e:
        return {"encontrado": False, "mensagem": f"Falha ao consultar ticker '{symbol}': {str(e)}"}

async def get_currency_and_crypto(pairs: str = "USD-BRL,EUR-BRL,BTC-BRL") -> Dict[str, Any]:
    """Obtém cotações em tempo real de moedas e criptomoedas em BRL via AwesomeAPI."""
    cache_key = f"awesome_rates:{pairs}"
    cached = global_ttl_cache.get(cache_key)
    if cached:
        return {"encontrado": True, "rates": cached, "cached": True}

    url = f"https://economia.awesomeapi.com.br/last/{pairs}"

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            res = await client.get(url)
            if res.status_code == 200:
                raw = res.json()
                formatted = {}
                for k, v in raw.items():
                    formatted[k] = {
                        "nome": v.get("name"),
                        "compra": float(v.get("bid", 0)),
                        "venda": float(v.get("ask", 0)),
                        "variacao_pct": float(v.get("pctChange", 0)),
                        "maximo": float(v.get("high", 0)),
                        "minimo": float(v.get("low", 0)),
                        "atualizado_em": v.get("create_date"),
                    }
                global_ttl_cache.set(cache_key, formatted, ttl_seconds=180)  # 3 min TTL
                return {"encontrado": True, "rates": formatted, "cached": False}
            return {"encontrado": False, "mensagem": f"AwesomeAPI retornou status {res.status_code}"}
    except Exception as e:
        return {"encontrado": False, "mensagem": f"Erro na consulta de cotações: {str(e)}"}
