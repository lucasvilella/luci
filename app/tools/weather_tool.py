"""
Weather Tool: Integração Open-Meteo e wttr.in (Zero-Auth / Sem Chave de API).
"""

from typing import Dict, Any, Optional
import httpx
from app.core.cache import global_cache

TIMEOUT = 5.0

async def get_weather_forecast(
    latitude: float = -23.5505,
    longitude: float = -46.6333,
    city_name: str = "São Paulo"
) -> Dict[str, Any]:
    """
    Obtém a previsão do tempo meteorológica atual e horária via Open-Meteo.
    """
    cache_key = f"weather:{latitude}:{longitude}"
    cached = global_cache.get(cache_key)
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
                current = data.get("current", {})
                result = {
                    "sucesso": True,
                    "cidade": city_name,
                    "temperatura_atual": f"{current.get('temperature_2m')} °C",
                    "sensacao_termica": f"{current.get('apparent_temperature')} °C",
                    "umidade_relativa": f"{current.get('relative_humidity_2m')}%",
                    "velocidade_vento": f"{current.get('wind_speed_10m')} km/h",
                    "precipitacao": f"{current.get('precipitation')} mm",
                    "cached": False,
                }
                global_cache.set(cache_key, result, ttl_seconds=300) # 5 minutos
                return result
            return {"sucesso": False, "mensagem": f"Open-Meteo HTTP {res.status_code}"}
    except Exception as e:
        return {"sucesso": False, "mensagem": f"Falha na consulta meteorológica: {str(e)}"}

async def get_weather_summary_text(location: str = "Sao_Paulo") -> Dict[str, Any]:
    """
    Obtém um resumo textual condensado das condições climáticas via wttr.in.
    """
    loc = location.replace(" ", "+")
    cache_key = f"wttr:{loc}"
    cached = global_cache.get(cache_key)
    if cached:
        return cached

    url = f"https://wttr.in/{loc}?format=%l:+%c+%t+(sensação:+%f)+Umidade:+%h+Vento:+%w"
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            headers = {"User-Agent": "curl/7.68.0"}
            res = await client.get(url, headers=headers)
            if res.status_code == 200:
                res_text = res.text.strip()
                result = {"sucesso": True, "resumo": res_text, "cached": False}
                global_cache.set(cache_key, result, ttl_seconds=300)
                return result
            return {"sucesso": False, "mensagem": f"wttr.in HTTP {res.status_code}"}
    except Exception as e:
        return {"sucesso": False, "mensagem": f"Falha ao consultar wttr.in: {str(e)}"}
