"""
External APIs Integration Suite for Luci Assistant.
Provides fully typed, resilient, async tools for 10 public APIs with TTL in-memory caching.
"""

import os
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import httpx

from services.cache import global_ttl_cache

DEFAULT_TIMEOUT = 5.0

# ═══════════════════════════════════════════════════════════════════════════
# 1. Clima & Previsão (Open-Meteo & wttr.in)
# ═══════════════════════════════════════════════════════════════════════════

class WeatherCurrent(BaseModel):
    temperature_c: float
    windspeed_kmh: float
    weather_code: int
    is_day: int
    time: str

class OpenMeteoResponse(BaseModel):
    latitude: float
    longitude: float
    timezone: str
    current: WeatherCurrent
    cached: bool = False

async def get_weather_forecast(latitude: float = -23.5505, longitude: float = -46.6333) -> Dict[str, Any]:
    """Obtém temperatura, vento e condições climáticas atuais via Open-Meteo API."""
    cache_key = f"open_meteo:{latitude:.2f}:{longitude:.2f}"
    cached = global_ttl_cache.get(cache_key)
    if cached:
        cached["cached"] = True
        return cached

    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={latitude}&longitude={longitude}"
        f"&current=temperature_2m,wind_speed_10m,weather_code,is_day"
        f"&timezone=auto"
    )

    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            res = await client.get(url)
            if res.status_code == 200:
                data = res.json()
                current = data.get("current", {})
                result = {
                    "latitude": data.get("latitude", latitude),
                    "longitude": data.get("longitude", longitude),
                    "timezone": data.get("timezone", "auto"),
                    "current": {
                        "temperature_c": current.get("temperature_2m"),
                        "windspeed_kmh": current.get("wind_speed_10m"),
                        "weather_code": current.get("weather_code"),
                        "is_day": current.get("is_day"),
                        "time": current.get("time"),
                    },
                    "cached": False,
                }
                global_ttl_cache.set(cache_key, result, ttl_seconds=1800)  # 30 min TTL
                return result
            return {"error": f"Open-Meteo status {res.status_code}", "raw": res.text}
    except Exception as e:
        return {"error": f"Falha na consulta Open-Meteo: {str(e)}"}

async def get_weather_summary_wttr(city_or_location: str = "Sao Paulo") -> Dict[str, Any]:
    """Obtém resumo textual do clima em uma linha ou formato conciso via wttr.in."""
    cache_key = f"wttr:{city_or_location.lower().strip()}"
    cached = global_ttl_cache.get(cache_key)
    if cached:
        return {"summary": cached, "location": city_or_location, "cached": True}

    url = f"https://wttr.in/{city_or_location}?format=%l:+%c+%t,+vento+%w,+umidade+%h"

    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT, headers={"User-Agent": "curl/7.68.0"}) as client:
            res = await client.get(url)
            if res.status_code == 200:
                text = res.text.strip()
                global_ttl_cache.set(cache_key, text, ttl_seconds=1800)  # 30 min TTL
                return {"summary": text, "location": city_or_location, "cached": False}
            return {"error": f"wttr.in status {res.status_code}"}
    except Exception as e:
        return {"error": f"Falha na consulta wttr.in: {str(e)}"}

# ═══════════════════════════════════════════════════════════════════════════
# 2. Datas, Feriados & Planejamento (BrasilAPI)
# ═══════════════════════════════════════════════════════════════════════════

class HolidayItem(BaseModel):
    date: str
    name: str
    type: str

async def get_brazil_holidays(year: int = 2026) -> Dict[str, Any]:
    """Lista feriados nacionais do Brasil e dias de folga no ano especificado."""
    cache_key = f"holidays_br:{year}"
    cached = global_ttl_cache.get(cache_key)
    if cached:
        return {"year": year, "holidays": cached, "cached": True}

    url = f"https://brasilapi.com.br/api/feriados/v1/{year}"

    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            res = await client.get(url)
            if res.status_code == 200:
                holidays = res.json()
                global_ttl_cache.set(cache_key, holidays, ttl_seconds=86400)  # 24h TTL
                return {"year": year, "holidays": holidays, "cached": False}
            return {"error": f"BrasilAPI status {res.status_code}"}
    except Exception as e:
        return {"error": f"Falha ao consultar feriados: {str(e)}"}

# ═══════════════════════════════════════════════════════════════════════════
# 3. Câmbio & Economia (AwesomeAPI)
# ═══════════════════════════════════════════════════════════════════════════

async def get_currency_rates(pairs: str = "USD-BRL,EUR-BRL,BTC-BRL") -> Dict[str, Any]:
    """Obtém cotações atuais de moedas e criptoativos em BRL via AwesomeAPI."""
    cache_key = f"currency:{pairs}"
    cached = global_ttl_cache.get(cache_key)
    if cached:
        return {"rates": cached, "cached": True}

    url = f"https://economia.awesomeapi.com.br/last/{pairs}"

    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            res = await client.get(url)
            if res.status_code == 200:
                data = res.json()
                # Simplified representation
                formatted = {}
                for k, v in data.items():
                    formatted[k] = {
                        "name": v.get("name"),
                        "bid": float(v.get("bid", 0)),
                        "ask": float(v.get("ask", 0)),
                        "pctChange": float(v.get("pctChange", 0)),
                        "high": float(v.get("high", 0)),
                        "low": float(v.get("low", 0)),
                        "create_date": v.get("create_date"),
                    }
                global_ttl_cache.set(cache_key, formatted, ttl_seconds=300)  # 5 min TTL
                return {"rates": formatted, "cached": False}
            return {"error": f"AwesomeAPI status {res.status_code}"}
    except Exception as e:
        return {"error": f"Falha na consulta de cotações: {str(e)}"}

# ═══════════════════════════════════════════════════════════════════════════
# 4. Notícias, Conhecimento & Referências (Hacker News & Wikipedia)
# ═══════════════════════════════════════════════════════════════════════════

async def get_hacker_news_top(limit: int = 5) -> Dict[str, Any]:
    """Busca as principais notícias e trending tech no Hacker News."""
    cache_key = f"hn_top:{limit}"
    cached = global_ttl_cache.get(cache_key)
    if cached:
        return {"stories": cached, "cached": True}

    top_ids_url = "https://hacker-news.firebaseio.com/v0/topstories.json"

    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            res = await client.get(top_ids_url)
            if res.status_code != 200:
                return {"error": "Failed to fetch top story IDs"}
            ids: List[int] = res.json()[:limit]

            stories = []
            for item_id in ids:
                item_res = await client.get(f"https://hacker-news.firebaseio.com/v0/item/{item_id}.json")
                if item_res.status_code == 200:
                    item_data = item_res.json()
                    stories.append({
                        "id": item_id,
                        "title": item_data.get("title"),
                        "url": item_data.get("url") or f"https://news.ycombinator.com/item?id={item_id}",
                        "score": item_data.get("score"),
                        "by": item_data.get("by"),
                        "comments_count": item_data.get("descendants", 0),
                    })

            global_ttl_cache.set(cache_key, stories, ttl_seconds=300)  # 5 min TTL
            return {"stories": stories, "cached": False}
    except Exception as e:
        return {"error": f"Falha ao consultar Hacker News: {str(e)}"}

async def get_wikipedia_summary(term: str, lang: str = "pt") -> Dict[str, Any]:
    """Busca resumo enciclopédico e imagem principal de um termo na Wikipedia."""
    cache_key = f"wiki:{lang}:{term.lower().strip()}"
    cached = global_ttl_cache.get(cache_key)
    if cached:
        return {"summary": cached, "cached": True}

    url = f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{term}"

    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT, headers={"User-Agent": "LuciAssistant/2.0"}) as client:
            res = await client.get(url)
            if res.status_code == 200:
                data = res.json()
                result = {
                    "title": data.get("title"),
                    "extract": data.get("extract"),
                    "description": data.get("description"),
                    "thumbnail": data.get("thumbnail", {}).get("source") if data.get("thumbnail") else None,
                    "url": data.get("content_urls", {}).get("desktop", {}).get("page"),
                }
                global_ttl_cache.set(cache_key, result, ttl_seconds=86400)  # 24h TTL
                return {"summary": result, "cached": False}
            return {"error": f"Wikipedia status {res.status_code} - Termo não encontrado"}
    except Exception as e:
        return {"error": f"Falha na consulta Wikipedia: {str(e)}"}

# ═══════════════════════════════════════════════════════════════════════════
# 5. Mídia, Streaming & Entretenimento (Radio Browser, Jikan Anime, TMDB)
# ═══════════════════════════════════════════════════════════════════════════

async def search_radio_stations(tag: str = "lofi", limit: int = 6) -> Dict[str, Any]:
    """Busca estações de rádio online por gênero/tag (lofi, jazz, synthwave, etc)."""
    cache_key = f"radio:{tag}:{limit}"
    cached = global_ttl_cache.get(cache_key)
    if cached:
        return {"stations": cached, "cached": True}

    url = f"https://de1.api.radio-browser.info/json/stations/bytag/{tag}?limit={limit}&order=votes&reverse=true"

    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            res = await client.get(url)
            if res.status_code == 200:
                raw_stations = res.json()
                stations = [
                    {
                        "name": st.get("name"),
                        "stream_url": st.get("url_resolved") or st.get("url"),
                        "homepage": st.get("homepage"),
                        "favicon": st.get("favicon"),
                        "tags": st.get("tags"),
                        "country": st.get("country"),
                        "votes": st.get("votes"),
                    }
                    for st in raw_stations
                ]
                global_ttl_cache.set(cache_key, stations, ttl_seconds=3600)  # 1h TTL
                return {"stations": stations, "cached": False}
            return {"error": f"Radio Browser status {res.status_code}"}
    except Exception as e:
        return {"error": f"Falha na busca de rádios: {str(e)}"}

async def search_anime(query: str, limit: int = 5) -> Dict[str, Any]:
    """Busca animes, sinopse, notas e capas via Jikan API (MyAnimeList)."""
    cache_key = f"jikan:{query.lower().strip()}:{limit}"
    cached = global_ttl_cache.get(cache_key)
    if cached:
        return {"anime": cached, "cached": True}

    url = f"https://api.jikan.moe/v4/anime?q={query}&limit={limit}"

    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            res = await client.get(url)
            if res.status_code == 200:
                data = res.json()
                results = [
                    {
                        "title": item.get("title"),
                        "title_english": item.get("title_english"),
                        "score": item.get("score"),
                        "episodes": item.get("episodes"),
                        "status": item.get("status"),
                        "synopsis": item.get("synopsis"),
                        "image": item.get("images", {}).get("jpg", {}).get("large_image_url"),
                    }
                    for item in data.get("data", [])
                ]
                global_ttl_cache.set(cache_key, results, ttl_seconds=3600)  # 1h TTL
                return {"anime": results, "cached": False}
            return {"error": f"Jikan API status {res.status_code}"}
    except Exception as e:
        return {"error": f"Falha na consulta de animes: {str(e)}"}

async def search_tmdb_movies(query: str, api_key: Optional[str] = None) -> Dict[str, Any]:
    """Busca filmes e séries no TMDB com sinopse, avaliação e pôster."""
    key = api_key or os.getenv("TMDB_API_KEY")
    if not key:
        return {
            "error": "TMDB_API_KEY não configurada no .env. Cadastre uma chave gratuita em themoviedb.org."
        }

    cache_key = f"tmdb:{query.lower().strip()}"
    cached = global_ttl_cache.get(cache_key)
    if cached:
        return {"movies": cached, "cached": True}

    url = f"https://api.themoviedb.org/3/search/multi?api_key={key}&query={query}&language=pt-BR"

    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            res = await client.get(url)
            if res.status_code == 200:
                data = res.json()
                results = [
                    {
                        "id": m.get("id"),
                        "title": m.get("title") or m.get("name"),
                        "media_type": m.get("media_type"),
                        "overview": m.get("overview"),
                        "release_date": m.get("release_date") or m.get("first_air_date"),
                        "vote_average": m.get("vote_average"),
                        "poster_url": f"https://image.tmdb.org/t/p/w500{m.get('poster_path')}" if m.get("poster_path") else None,
                    }
                    for m in data.get("results", [])[:5]
                ]
                global_ttl_cache.set(cache_key, results, ttl_seconds=3600)
                return {"movies": results, "cached": False}
            return {"error": f"TMDB status {res.status_code}"}
    except Exception as e:
        return {"error": f"Falha na consulta TMDB: {str(e)}"}

# ═══════════════════════════════════════════════════════════════════════════
# 6. Links, Preview & Notificações (Microlink & Ntfy.sh)
# ═══════════════════════════════════════════════════════════════════════════

async def extract_url_metadata(target_url: str) -> Dict[str, Any]:
    """Extrai metadados ricos (OpenGraph, título, descrição, autor, thumbnail) de uma URL via Microlink."""
    cache_key = f"microlink:{target_url}"
    cached = global_ttl_cache.get(cache_key)
    if cached:
        return {"metadata": cached, "cached": True}

    url = f"https://api.microlink.io/?url={target_url}"

    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            res = await client.get(url)
            if res.status_code == 200:
                data = res.json().get("data", {})
                result = {
                    "title": data.get("title"),
                    "description": data.get("description"),
                    "author": data.get("author"),
                    "publisher": data.get("publisher"),
                    "image": data.get("image", {}).get("url") if data.get("image") else None,
                    "logo": data.get("logo", {}).get("url") if data.get("logo") else None,
                    "url": data.get("url"),
                }
                global_ttl_cache.set(cache_key, result, ttl_seconds=86400)
                return {"metadata": result, "cached": False}
            return {"error": f"Microlink status {res.status_code}"}
    except Exception as e:
        return {"error": f"Falha ao extrair metadados da URL: {str(e)}"}

async def send_ntfy_push(
    topic: str = "luci_alerts",
    message: str = "Notificação de Teste da Luci",
    title: Optional[str] = "Luci Assistente",
    priority: int = 3,
    tags: Optional[str] = "robot,bell",
) -> Dict[str, Any]:
    """Envia notificação push imediata para o celular ou desktop via ntfy.sh."""
    url = f"https://ntfy.sh/{topic}"
    headers = {
        "Title": title or "Luci Assistente",
        "Priority": str(priority),
    }
    if tags:
        headers["Tags"] = tags

    try:
        async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
            res = await client.post(url, content=message.encode("utf-8"), headers=headers)
            if res.status_code in (200, 201):
                return {"success": True, "topic": topic, "status": "Notificação enviada com sucesso"}
            return {"success": False, "error": f"Ntfy status {res.status_code}", "raw": res.text}
    except Exception as e:
        return {"success": False, "error": f"Falha ao enviar push ntfy: {str(e)}"}
