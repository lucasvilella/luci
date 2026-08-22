"""
Flight Tracker Tool (OpenSky Network API / Zero-Auth).
Tracks live flights, aircraft state vectors, callsigns, altitudes and positions around the world.
"""

from typing import Dict, Any, List, Optional
import httpx
from services.cache import global_ttl_cache

TIMEOUT = 4.5

async def track_flights_opensky(
    lamin: float = -24.5,
    lamax: float = -22.5,
    lomin: float = -47.5,
    lomax: float = -45.5,
    limit: int = 5,
) -> Dict[str, Any]:
    """
    Rastreia voos e aeronaves em tempo real em uma área geográfica (ex: região de São Paulo por padrão)
    usando a API pública aberta do OpenSky Network.
    """
    cache_key = f"opensky:{lamin:.1f}:{lamax:.1f}:{lomin:.1f}:{lomax:.1f}:{limit}"
    cached = global_ttl_cache.get(cache_key)
    if cached:
        return {"encontrado": True, "voos": cached, "cached": True}

    url = f"https://opensky-network.org/api/states/all?lamin={lamin}&lamax={lamax}&lomin={lomin}&lomax={lomax}"

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            res = await client.get(url)
            if res.status_code == 200:
                data = res.json()
                states = data.get("states") or []
                flights = []
                for s in states[:limit]:
                    flights.append({
                        "icao24": s[0],
                        "callsign": s[1].strip() if s[1] else "Desconhecido",
                        "pais_origem": s[2],
                        "longitude": s[5],
                        "latitude": s[6],
                        "altitude_metros": s[7] or s[13],
                        "em_solo": s[8],
                        "velocidade_kmh": round(s[9] * 3.6, 1) if s[9] else None,
                        "rumo_graus": s[10],
                    })
                global_ttl_cache.set(cache_key, flights, ttl_seconds=30)  # 30s TTL para voos ao vivo
                return {
                    "encontrado": True,
                    "total_voos_area": len(states),
                    "voos": flights,
                    "cached": False,
                }
            return {"encontrado": False, "mensagem": f"OpenSky retornou status {res.status_code}"}
    except Exception as e:
        return {"encontrado": False, "mensagem": f"Erro ao rastrear voos: {str(e)}"}
