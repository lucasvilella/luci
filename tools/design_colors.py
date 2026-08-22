"""
Design & Colors Tool (The Color API / Zero-Auth).
Returns HEX, RGB, HSL, exact color names and complementary schemes for UI/UX design.
"""

from typing import Dict, Any, Optional
import httpx
from services.cache import global_ttl_cache

TIMEOUT = 4.0

async def get_color_scheme_info(hex_code: str) -> Dict[str, Any]:
    """
    Obtém informações detalhadas de uma cor (nome exato, RGB, HSL, contrastes e harmonias) via The Color API.
    Exemplo: '00F2FE' ou '#00F2FE'.
    """
    clean_hex = hex_code.replace("#", "").strip().upper()
    cache_key = f"color:{clean_hex}"
    cached = global_ttl_cache.get(cache_key)
    if cached:
        cached["cached"] = True
        return cached

    url = f"https://www.thecolorapi.com/id?hex={clean_hex}"

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            res = await client.get(url)
            if res.status_code == 200:
                data = res.json()
                name_info = data.get("name", {})
                result = {
                    "encontrado": True,
                    "hex": data.get("hex", {}).get("value"),
                    "nome": name_info.get("value"),
                    "nome_mais_proximo": name_info.get("closest_named_hex"),
                    "rgb": data.get("rgb", {}).get("value"),
                    "hsl": data.get("hsl", {}).get("value"),
                    "hsv": data.get("hsv", {}).get("value"),
                    "luminancia_cmyk": data.get("cmyk", {}).get("value"),
                    "contraste_texto": data.get("contrast", {}).get("value"),
                    "imagem_badge": data.get("image", {}).get("bare"),
                    "cached": False,
                }
                global_ttl_cache.set(cache_key, result, ttl_seconds=86400)
                return result
            return {"encontrado": False, "mensagem": f"The Color API retornou status {res.status_code}"}
    except Exception as e:
        return {"encontrado": False, "mensagem": f"Falha ao consultar cor: {str(e)}"}
