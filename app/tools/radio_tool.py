"""
Radio Streaming Tool: Busca de estações de rádio web gratuitas via Radio Browser API.
"""

from typing import Dict, Any, List
import httpx
from app.core.cache import global_cache

TIMEOUT = 6.0

async def search_radio_stations(
    tag: str = "lofi",
    country: str = "",
    limit: int = 10
) -> Dict[str, Any]:
    """
    Busca estações de rádio streaming públicas por gênero (lofi, jazz, classical, rock, news, etc.).
    """
    cache_key = f"radio:{tag}:{country}:{limit}"
    cached = global_cache.get(cache_key)
    if cached:
        cached["cached"] = True
        return cached

    url = "https://de1.api.radio-browser.info/json/stations/search"
    params = {
        "tag": tag.strip().lower(),
        "limit": limit,
        "order": "votes",
        "reverse": "true",
        "hidebroken": "true",
    }
    if country:
        params["country"] = country.strip()

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            headers = {"User-Agent": "LuciAssistant/3.0"}
            res = await client.get(url, params=params, headers=headers)
            if res.status_code == 200:
                stations = res.json()
                parsed = []
                for s in stations:
                    parsed.append({
                        "id": s.get("stationuuid"),
                        "nome": s.get("name", "").strip(),
                        "url_stream": s.get("url_resolved") or s.get("url"),
                        "tags": s.get("tags", "").split(",")[:5],
                        "pais": s.get("country"),
                        "codec": s.get("codec"),
                        "bitrate": s.get("bitrate"),
                        "icone": s.get("favicon"),
                    })
                result = {
                    "sucesso": True,
                    "tag_pesquisada": tag,
                    "total_encontrado": len(parsed),
                    "estacoes": parsed,
                    "cached": False,
                }
                global_cache.set(cache_key, result, ttl_seconds=600) # 10 min
                return result
            return {"sucesso": False, "mensagem": f"RadioBrowser HTTP {res.status_code}"}
    except Exception as e:
        return {"sucesso": False, "mensagem": f"Falha ao buscar rádios: {str(e)}"}
