"""
Holidays & Calendar Tool: Feriados nacionais e cálculo de dias úteis via BrasilAPI.
"""

from typing import Dict, Any, List
from datetime import datetime, date, timedelta
import httpx
from app.core.cache import global_cache

TIMEOUT = 5.0

async def get_national_holidays(ano: int = datetime.now().year) -> Dict[str, Any]:
    """
    Lista todos os feriados nacionais oficiais do Brasil para o ano especificado via BrasilAPI.
    """
    cache_key = f"holidays:{ano}"
    cached = global_cache.get(cache_key)
    if cached:
        cached["cached"] = True
        return cached

    url = f"https://brasilapi.com.br/api/feriados/v1/{ano}"
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            res = await client.get(url)
            if res.status_code == 200:
                feriados = res.json()
                result = {
                    "sucesso": True,
                    "ano": ano,
                    "total_feriados": len(feriados),
                    "feriados": feriados,
                    "cached": False,
                }
                global_cache.set(cache_key, result, ttl_seconds=86400) # 24 horas
                return result
            return {"sucesso": False, "mensagem": f"BrasilAPI HTTP {res.status_code}"}
    except Exception as e:
        return {"sucesso": False, "mensagem": f"Falha ao consultar feriados: {str(e)}"}

async def check_is_business_day(data_str: str) -> Dict[str, Any]:
    """
    Verifica se uma data específica (formato YYYY-MM-DD) é dia útil ou feriado/final de semana no Brasil.
    """
    try:
        target_date = datetime.strptime(data_str.strip(), "%Y-%m-%d").date()
    except ValueError:
        return {"sucesso": False, "mensagem": "Formato de data inválido. Use YYYY-MM-DD."}

    # Final de semana
    if target_date.weekday() in (5, 6): # 5 = Sábado, 6 = Domingo
        dia_nome = "Sábado" if target_date.weekday() == 5 else "Domingo"
        return {
            "sucesso": True,
            "data": data_str,
            "dia_util": False,
            "motivo": f"Final de semana ({dia_nome})",
        }

    # Verifica feriados nacionais do ano
    holidays_data = await get_national_holidays(target_date.year)
    if holidays_data.get("sucesso"):
        for f in holidays_data.get("feriados", []):
            if f.get("date") == data_str:
                return {
                    "sucesso": True,
                    "data": data_str,
                    "dia_util": False,
                    "motivo": f"Feriado Nacional: {f.get('name')}",
                }

    return {
        "sucesso": True,
        "data": data_str,
        "dia_util": True,
        "motivo": "Dia útil regular",
    }
