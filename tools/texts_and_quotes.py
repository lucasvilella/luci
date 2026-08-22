"""
Texts & Religious Quotes Tools (Bible-API & AlQuran Cloud / Zero-Auth).
Fetches biblical and quranic passages with zero authentication.
"""

from typing import Dict, Any, Optional
import httpx
from services.cache import global_ttl_cache

TIMEOUT = 4.0

async def get_bible_verse(reference: str = "john 3:16") -> Dict[str, Any]:
    """
    Busca passagens e versículos bíblicos (texto, livro, capítulo e tradução) via Bible-API.
    Exemplos: 'john 3:16', 'genesis 1:1-3', 'psalms 23:1-6'.
    """
    clean_ref = reference.strip().replace(" ", "+")
    cache_key = f"bible:{clean_ref.lower()}"
    cached = global_ttl_cache.get(cache_key)
    if cached:
        cached["cached"] = True
        return cached

    url = f"https://bible-api.com/{clean_ref}"

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            res = await client.get(url)
            if res.status_code == 200:
                data = res.json()
                result = {
                    "encontrado": True,
                    "referencia": data.get("reference"),
                    "texto": data.get("text", "").strip(),
                    "traducao_nome": data.get("translation_name"),
                    "versiculos_count": len(data.get("verses", [])),
                    "cached": False,
                }
                global_ttl_cache.set(cache_key, result, ttl_seconds=86400)
                return result
            return {"encontrado": False, "mensagem": f"Passagem '{reference}' não encontrada (status {res.status_code})."}
    except Exception as e:
        return {"encontrado": False, "mensagem": f"Erro na consulta do versículo: {str(e)}"}

async def get_quran_ayah(surah_ayah: str = "1:1") -> Dict[str, Any]:
    """
    Consulta versículos do Alcorão (texto em Árabe e tradução em Inglês/Português) via AlQuran Cloud API.
    Exemplo: '1:1', '2:255', '36:1'.
    """
    cache_key = f"quran:{surah_ayah.strip()}"
    cached = global_ttl_cache.get(cache_key)
    if cached:
        cached["cached"] = True
        return cached

    url = f"https://api.alquran.cloud/v1/ayah/{surah_ayah}/editions/quran-uthmani,en.sahih"

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            res = await client.get(url)
            if res.status_code == 200:
                data = res.json()
                items = data.get("data", [])
                arabic_text = items[0].get("text") if len(items) > 0 else ""
                english_text = items[1].get("text") if len(items) > 1 else ""
                surah_info = items[0].get("surah", {}) if len(items) > 0 else {}

                result = {
                    "encontrado": True,
                    "surah_nome": surah_info.get("name"),
                    "surah_nome_ingles": surah_info.get("englishName"),
                    "surah_numero": surah_info.get("number"),
                    "numero_no_surah": items[0].get("numberInSurah") if len(items) > 0 else None,
                    "texto_arabe": arabic_text,
                    "traducao": english_text,
                    "cached": False,
                }
                global_ttl_cache.set(cache_key, result, ttl_seconds=86400)
                return result
            return {"encontrado": False, "mensagem": f"Versículo '{surah_ayah}' não encontrado (status {res.status_code})."}
    except Exception as e:
        return {"encontrado": False, "mensagem": f"Erro na consulta AlQuran Cloud: {str(e)}"}
