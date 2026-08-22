"""
General Utilities Tools (Zero-Auth / Sem Chave de API).
- Validação e formatação de números de telefone (phonenumbers).
- Captura de screenshot e metadados de links (Microlink).
- Busca factual de livros e autores (Open Library).
- Feriados nacionais e locais (BrasilAPI).
"""

from typing import Dict, Any, List, Optional
import httpx
import phonenumbers
from phonenumbers import geocoder, carrier

from services.cache import global_ttl_cache

TIMEOUT = 4.0

def validate_and_format_phone(raw_number: str, default_region: str = "BR") -> Dict[str, Any]:
    """Valida, formata e extrai operadora/localidade de um número de telefone com a lib phonenumbers."""
    try:
        parsed = phonenumbers.parse(raw_number, default_region)
        is_valid = phonenumbers.is_valid_number(parsed)
        if not is_valid:
            return {"valido": False, "mensagem": f"O número '{raw_number}' é inválido."}

        formatted_intl = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.INTERNATIONAL)
        formatted_national = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.NATIONAL)
        formatted_e164 = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
        
        region_desc = geocoder.description_for_number(parsed, "pt")
        carrier_name = carrier.name_for_number(parsed, "pt")

        return {
            "valido": True,
            "numero_e164": formatted_e164,
            "formato_nacional": formatted_national,
            "formato_internacional": formatted_intl,
            "codigo_pais": parsed.country_code,
            "regiao": region_desc or default_region,
            "operadora": carrier_name or "Desconhecida",
        }
    except Exception as e:
        return {"valido": False, "mensagem": f"Erro ao analisar telefone: {str(e)}"}

async def get_link_preview_and_screenshot(target_url: str) -> Dict[str, Any]:
    """Captura metadados ricos e screenshot da página web via Microlink API."""
    cache_key = f"link_screenshot:{target_url}"
    cached = global_ttl_cache.get(cache_key)
    if cached:
        cached["cached"] = True
        return cached

    url = f"https://api.microlink.io?url={target_url}&screenshot=true"

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            res = await client.get(url)
            if res.status_code == 200:
                data = res.json().get("data", {})
                result = {
                    "encontrado": True,
                    "url": data.get("url"),
                    "titulo": data.get("title"),
                    "descricao": data.get("description"),
                    "autor": data.get("author"),
                    "imagem_capa": data.get("image", {}).get("url") if data.get("image") else None,
                    "screenshot_url": data.get("screenshot", {}).get("url") if data.get("screenshot") else None,
                    "cached": False,
                }
                global_ttl_cache.set(cache_key, result, ttl_seconds=86400)
                return result
            return {"encontrado": False, "mensagem": f"Microlink status {res.status_code}"}
    except Exception as e:
        return {"encontrado": False, "mensagem": f"Falha ao extrair dados do link: {str(e)}"}

async def search_open_library_books(query: str, limit: int = 4) -> Dict[str, Any]:
    """Busca livros, autores, ano de publicação e capas no acervo público do Open Library."""
    cache_key = f"openlibrary:{query.lower().strip()}:{limit}"
    cached = global_ttl_cache.get(cache_key)
    if cached:
        return {"encontrado": True, "livros": cached, "cached": True}

    url = f"https://openlibrary.org/search.json?q={query}&limit={limit}"

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            res = await client.get(url)
            if res.status_code == 200:
                docs = res.json().get("docs", [])
                books = []
                for b in docs:
                    cover_id = b.get("cover_i")
                    books.append({
                        "titulo": b.get("title"),
                        "autores": b.get("author_name", []),
                        "primeiro_ano_publicacao": b.get("first_publish_year"),
                        "edicoes_count": b.get("edition_count"),
                        "capa_url": f"https://covers.openlibrary.org/b/id/{cover_id}-M.jpg" if cover_id else None,
                        "key": b.get("key"),
                    })
                global_ttl_cache.set(cache_key, books, ttl_seconds=86400)
                return {"encontrado": True, "total": len(books), "livros": books, "cached": False}
            return {"encontrado": False, "mensagem": f"Open Library status {res.status_code}"}
    except Exception as e:
        return {"encontrado": False, "mensagem": f"Erro na consulta Open Library: {str(e)}"}

async def get_brazil_holidays_tool(year: int = 2026) -> Dict[str, Any]:
    """Lista feriados nacionais do Brasil no ano especificado via BrasilAPI."""
    cache_key = f"holidays_v2:{year}"
    cached = global_ttl_cache.get(cache_key)
    if cached:
        return {"encontrado": True, "ano": year, "feriados": cached, "cached": True}

    url = f"https://brasilapi.com.br/api/feriados/v1/{year}"

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            res = await client.get(url)
            if res.status_code == 200:
                feriados = res.json()
                global_ttl_cache.set(cache_key, feriados, ttl_seconds=86400)
                return {"encontrado": True, "ano": year, "feriados": feriados, "cached": False}
            return {"encontrado": False, "mensagem": f"BrasilAPI status {res.status_code}"}
    except Exception as e:
        return {"encontrado": False, "mensagem": f"Erro ao consultar feriados: {str(e)}"}

async def get_worldwide_holidays(country_code: str = "US", year: int = 2026) -> Dict[str, Any]:
    """Lista feriados públicos de qualquer país do mundo (US, CN, GB, DE, JP, etc.) via Nager.Date."""
    country = country_code.strip().upper()
    cache_key = f"nager_holidays:{country}:{year}"
    cached = global_ttl_cache.get(cache_key)
    if cached:
        return {"encontrado": True, "pais": country, "ano": year, "feriados": cached, "cached": True}

    url = f"https://date.nager.at/api/v3/PublicHolidays/{year}/{country}"

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            res = await client.get(url)
            if res.status_code == 200:
                holidays = res.json()
                formatted = [
                    {
                        "data": h.get("date"),
                        "nome_local": h.get("localName"),
                        "nome_ingles": h.get("name"),
                        "tipo": h.get("types", ["Public"])[0] if h.get("types") else "Public",
                    }
                    for h in holidays
                ]
                global_ttl_cache.set(cache_key, formatted, ttl_seconds=86400)
                return {"encontrado": True, "pais": country, "ano": year, "feriados": formatted, "cached": False}
            return {"encontrado": False, "mensagem": f"Nager.Date status {res.status_code}"}
    except Exception as e:
        return {"encontrado": False, "mensagem": f"Erro na consulta de feriados internacionais: {str(e)}"}
