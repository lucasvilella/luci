"""
Finance & Economy Tool: Cotações B3/Internacionais (yfinance) e Moedas/Cripto (AwesomeAPI).
"""

import asyncio
from typing import Dict, Any, List
import httpx
from app.core.cache import global_cache

TIMEOUT = 5.0

def _fetch_yfinance_quote(ticker: str) -> Dict[str, Any]:
    try:
        import yfinance as yf
        t = yf.Ticker(ticker)
        info = t.info or {}
        price = (
            info.get("currentPrice")
            or info.get("regularMarketPrice")
            or info.get("previousClose")
        )
        return {
            "sucesso": True if price else False,
            "ticker": ticker.upper(),
            "nome": info.get("shortName") or info.get("longName") or ticker,
            "moeda": info.get("currency", "BRL" if ".SA" in ticker.upper() else "USD"),
            "preco_atual": price,
            "variacao_percentual": info.get("regularMarketChangePercent"),
            "maxima_dia": info.get("dayHigh"),
            "minima_dia": info.get("dayLow"),
        }
    except Exception as e:
        return {"sucesso": False, "mensagem": f"Erro yfinance: {str(e)}"}

async def get_stock_quote(ticker: str) -> Dict[str, Any]:
    """
    Obtém a cotação de ações da B3 (ex: PETR4.SA, VALE3.SA) ou bolsas internacionais (ex: AAPL, NVDA, TSLA).
    """
    sym = ticker.strip().upper()
    cache_key = f"stock:{sym}"
    cached = global_cache.get(cache_key)
    if cached:
        cached["cached"] = True
        return cached

    data = await asyncio.to_thread(_fetch_yfinance_quote, sym)
    if data.get("sucesso"):
        data["cached"] = False
        global_cache.set(cache_key, data, ttl_seconds=180) # 3 min TTL
    return data

async def get_currency_rates(pairs: str = "USD-BRL,EUR-BRL,BTC-BRL,ETH-BRL") -> Dict[str, Any]:
    """
    Obtém a cotação em tempo real de moedas e criptomoedas via AwesomeAPI.
    """
    cache_key = f"currency:{pairs}"
    cached = global_cache.get(cache_key)
    if cached:
        cached["cached"] = True
        return cached

    url = f"https://economia.awesomeapi.com.br/last/{pairs}"
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            res = await client.get(url)
            if res.status_code == 200:
                data = res.json()
                parsed = {}
                for key, item in data.items():
                    parsed[key] = {
                        "nome": item.get("name"),
                        "cotacao_compra": float(item.get("bid", 0)),
                        "cotacao_venda": float(item.get("ask", 0)),
                        "variacao": float(item.get("varBid", 0)),
                        "porcentagem_variacao": f"{item.get('pctChange')}%",
                        "maxima": float(item.get("high", 0)),
                        "minima": float(item.get("low", 0)),
                        "atualizacao": item.get("create_date"),
                    }
                result = {"sucesso": True, "cotacoes": parsed, "cached": False}
                global_cache.set(cache_key, result, ttl_seconds=60) # 1 min TTL
                return result
            return {"sucesso": False, "mensagem": f"AwesomeAPI HTTP {res.status_code}"}
    except Exception as e:
        return {"sucesso": False, "mensagem": f"Falha ao consultar cotações: {str(e)}"}
