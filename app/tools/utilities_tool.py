"""
Utilities Tool: Metadados de Links (Microlink API) e Validação de Telefones (phonenumbers).
"""

from typing import Dict, Any, Optional
import httpx
from app.core.cache import global_cache

TIMEOUT = 6.0

async def get_link_preview_metadata(url: str) -> Dict[str, Any]:
    """
    Extrai metadados completos de preview (título, descrição, autor, imagem/capa) de qualquer link da web via Microlink.
    """
    clean_url = url.strip()
    cache_key = f"link_meta:{clean_url}"
    cached = global_cache.get(cache_key)
    if cached:
        cached["cached"] = True
        return cached

    endpoint = f"https://api.microlink.io?url={clean_url}"
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            res = await client.get(endpoint)
            if res.status_code == 200:
                body = res.json()
                data = body.get("data", {})
                result = {
                    "sucesso": True,
                    "url": clean_url,
                    "titulo": data.get("title"),
                    "descricao": data.get("description"),
                    "autor": data.get("author"),
                    "editora": data.get("publisher"),
                    "imagem": data.get("image", {}).get("url") if isinstance(data.get("image"), dict) else None,
                    "logo": data.get("logo", {}).get("url") if isinstance(data.get("logo"), dict) else None,
                    "cached": False,
                }
                global_cache.set(cache_key, result, ttl_seconds=3600) # 1 hora
                return result
            return {"sucesso": False, "mensagem": f"Microlink HTTP {res.status_code}"}
    except Exception as e:
        return {"sucesso": False, "mensagem": f"Falha ao extrair metadados do link: {str(e)}"}

def validate_and_format_phone(phone_number_str: str, default_country: str = "BR") -> Dict[str, Any]:
    """
    Valida e formata números de telefone locais e internacionais usando a biblioteca phonenumbers (Google libphonenumber).
    """
    try:
        import phonenumbers
        from phonenumbers import geocoder, carrier
        
        parsed = phonenumbers.parse(phone_number_str.strip(), default_country.upper())
        is_valid = phonenumbers.is_valid_number(parsed)
        is_possible = phonenumbers.is_possible_number(parsed)
        
        if not is_possible:
            return {"sucesso": False, "mensagem": "Número de telefone inválido ou formato impossível."}

        formatted_intl = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.INTERNATIONAL)
        formatted_e164 = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
        formatted_national = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.NATIONAL)
        
        region = geocoder.description_for_number(parsed, "pt-BR") or "Brasil"
        operadora = carrier.name_for_number(parsed, "pt-BR") or None

        return {
            "sucesso": True,
            "valido": is_valid,
            "formato_internacional": formatted_intl,
            "formato_e164": formatted_e164,
            "formato_nacional": formatted_national,
            "codigo_pais": parsed.country_code,
            "ddd_ou_regiao": region,
            "operadora": operadora,
        }
    except ImportError:
        # Fallback caso phonenumbers não esteja instalado
        clean_digits = "".join(filter(str.isdigit, phone_number_str))
        return {
            "sucesso": True,
            "valido": len(clean_digits) in (10, 11, 12, 13),
            "formato_nacional": phone_number_str,
            "aviso": "Validação simplificada (módulo phonenumbers ausente).",
        }
    except Exception as e:
        return {"sucesso": False, "mensagem": f"Erro na validação do telefone: {str(e)}"}
