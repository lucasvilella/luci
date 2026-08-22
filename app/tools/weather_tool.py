"""
Weather Tool: Integração Open-Meteo de Alta Precisão (Zero-Auth / Sem Chave de API).
Geocoding automático por cidade e dados meteorológicos em tempo real.
"""

from typing import Dict, Any, Optional
import httpx
from app.core.cache import global_cache

TIMEOUT = 6.0

CITY_COORDINATES = {
    "sao paulo": (-23.5505, -46.6333, "São Paulo"),
    "são paulo": (-23.5505, -46.6333, "São Paulo"),
    "rio de janeiro": (-22.9068, -43.1729, "Rio de Janeiro"),
    "brasilia": (-15.7975, -47.8919, "Brasília"),
    "brasília": (-15.7975, -47.8919, "Brasília"),
    "curitiba": (-25.4284, -49.2733, "Curitiba"),
    "belo horizonte": (-19.9167, -43.9345, "Belo Horizonte"),
    "salvador": (-12.9777, -38.5016, "Salvador"),
    "porto alegre": (-30.0346, -51.2177, "Porto Alegre"),
    "fortaleza": (-3.7319, -38.5267, "Fortaleza"),
    "recife": (-8.0476, -34.8770, "Recife"),
    "campinas": (-22.9056, -47.0608, "Campinas"),
}

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
                temp = current.get("temperature_2m", 0)
                apparent = current.get("apparent_temperature", temp)
                humidity = current.get("relative_humidity_2m", 0)
                wind = current.get("wind_speed_10m", 0)
                precip = current.get("precipitation", 0)
                
                result = {
                    "sucesso": True,
                    "cidade": city_name,
                    "temperatura_atual": f"{round(temp)}°C",
                    "sensacao_termica": f"{round(apparent)}°C",
                    "umidade_relativa": f"{humidity}%",
                    "velocidade_vento": f"{round(wind)} km/h",
                    "precipitacao": f"{precip} mm",
                    "resumo": f"{city_name}: {round(temp)}°C (sensação {round(apparent)}°C), Umidade: {humidity}%, Vento: {round(wind)} km/h",
                    "cached": False,
                }
                global_cache.set(cache_key, result, ttl_seconds=300) # 5 minutos
                return result
            return {"sucesso": False, "mensagem": f"Open-Meteo HTTP {res.status_code}"}
    except Exception as e:
        return {"sucesso": False, "mensagem": f"Falha na consulta meteorológica: {str(e)}"}

async def get_weather_summary_text(location: str = "São Paulo") -> Dict[str, Any]:
    """
    Obtém o clima e temperatura em tempo real com alta precisão usando Open-Meteo Geocoding.
    """
    clean_loc = location.lower().strip()
    
    # Se estiver no dicionário rápido
    if clean_loc in CITY_COORDINATES:
        lat, lon, name = CITY_COORDINATES[clean_loc]
        return await get_weather_forecast(lat, lon, name)

    # Busca coordenadas geográficas dinâmicas via Open-Meteo Geocoding API
    geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={clean_loc}&count=1&language=pt&format=json"
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            geo_res = await client.get(geo_url)
            if geo_res.status_code == 200:
                geo_data = geo_res.json()
                results = geo_data.get("results", [])
                if results:
                    best = results[0]
                    lat = best.get("latitude")
                    lon = best.get("longitude")
                    c_name = best.get("name", location)
                    admin = best.get("admin1", "")
                    full_name = f"{c_name}, {admin}" if admin else c_name
                    return await get_weather_forecast(lat, lon, full_name)
    except Exception as e:
        print(f"[Weather] Erro no geocoding: {e}")

    # Fallback para São Paulo
    return await get_weather_forecast(-23.5505, -46.6333, location)
