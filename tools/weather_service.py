"""
Weather Service Tool (Zero-Auth / Open-Meteo).
Retrieves real-time weather, hourly forecast, humidity and wind with sub-second caching.
"""

from typing import Dict, Any, Optional
import httpx
from services.cache import global_ttl_cache

TIMEOUT = 4.0

async def get_open_meteo_weather(
    latitude: float = -23.5505,
    longitude: float = -46.6333,
    city_name: Optional[str] = "São Paulo",
) -> Dict[str, Any]:
    """
    Obtém temperatura atual, umidade relativa, velocidade do vento e código de clima via Open-Meteo API.
    """
    cache_key = f"open_meteo_v2:{latitude:.2f}:{longitude:.2f}"
    cached = global_ttl_cache.get(cache_key)
    if cached:
        cached["cached"] = True
        return cached

    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={latitude}&longitude={longitude}"
        f"&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m"
        f"&timezone=auto"
    )

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            res = await client.get(url)
            if res.status_code == 200:
                data = res.json()
                cur = data.get("current", {})
                result = {
                    "encontrado": True,
                    "local": city_name or f"{latitude}, {longitude}",
                    "latitude": data.get("latitude", latitude),
                    "longitude": data.get("longitude", longitude),
                    "temperatura_c": cur.get("temperature_2m"),
                    "sensacao_termica_c": cur.get("apparent_temperature"),
                    "umidade_pct": cur.get("relative_humidity_2m"),
                    "vento_kmh": cur.get("wind_speed_10m"),
                    "precipitacao_mm": cur.get("precipitation"),
                    "codigo_clima": cur.get("weather_code"),
                    "cached": False,
                }
                global_ttl_cache.set(cache_key, result, ttl_seconds=1800)  # 30 min TTL
                return result
            return {"encontrado": False, "mensagem": f"Open-Meteo status {res.status_code}"}
    except Exception as e:
        return {"encontrado": False, "mensagem": f"Falha ao consultar clima Open-Meteo: {str(e)}"}
