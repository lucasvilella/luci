"""
Web Search Tool using DuckDuckGo / DDGS (Zero-Auth).
Performs fast, semantic and non-blocking searches without API keys or scraping fees.
"""

import asyncio
from typing import Dict, Any, List
from duckduckgo_search import DDGS
from services.cache import global_ttl_cache

def _sync_ddg_search(query: str, max_results: int) -> List[Dict[str, Any]]:
    results = DDGS().text(query, max_results=max_results)
    formatted = []
    for r in results:
        formatted.append({
            "titulo": r.get("title"),
            "link": r.get("href"),
            "resumo": r.get("body"),
        })
    return formatted

async def search_duckduckgo(query: str, max_results: int = 5) -> Dict[str, Any]:
    """
    Realiza busca semântica em tempo real na Web via DuckDuckGo sem chave de API.
    Retorna títulos, URLs e resumos dos melhores resultados.
    """
    cache_key = f"ddg_search_v2:{query.strip().lower()}:{max_results}"
    cached = global_ttl_cache.get(cache_key)
    if cached:
        return {"encontrado": True, "query": query, "resultados": cached, "cached": True}

    try:
        results = await asyncio.to_thread(_sync_ddg_search, query, max_results)
        if not results:
            return {"encontrado": False, "mensagem": f"Nenhum resultado encontrado para '{query}'."}

        global_ttl_cache.set(cache_key, results, ttl_seconds=1800)  # 30 min TTL
        return {
            "encontrado": True,
            "query": query,
            "total": len(results),
            "resultados": results,
            "cached": False,
        }
    except Exception as e:
        return {"encontrado": False, "mensagem": f"Erro na busca DuckDuckGo: {str(e)}"}
