"""
FastAPI Tools & External APIs Router for Luci Assistant.
Exposes endpoints to list and invoke any registered function tool directly.
"""

from typing import Dict, Any, Optional
from fastapi import FastAPI, APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from services.tool_registry import ToolRegistry, GEMINI_TOOL_DECLARATIONS

tools_router = APIRouter(prefix="/api/v1/tools", tags=["Luci External Tools"])

class ToolExecuteRequest(BaseModel):
    tool_name: str = Field(..., description="Nome da ferramenta cadastrada no ToolRegistry")
    arguments: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Parâmetros de entrada")

class ToolExecuteResponse(BaseModel):
    success: bool
    tool_name: str
    result: Any
    error: Optional[str] = None

@tools_router.get("/declarations", summary="Listar Function Declarations para LLMs")
async def list_tool_declarations():
    """Retorna o schema JSON de todas as ferramentas disponíveis para Gemini/Groq."""
    return {
        "count": len(GEMINI_TOOL_DECLARATIONS),
        "tools": ToolRegistry.get_declarations(),
    }

@tools_router.post("/execute", response_model=ToolExecuteResponse, summary="Executar Ferramenta Diretamente")
async def execute_tool(req: ToolExecuteRequest):
    """Executa a ferramenta solicitada com cache em memória e retorna o resultado estruturado."""
    result = await ToolRegistry.execute(req.tool_name, req.arguments or {})
    if "error" in result and len(result) == 1:
        return ToolExecuteResponse(
            success=False,
            tool_name=req.tool_name,
            result=None,
            error=result["error"],
        )
    return ToolExecuteResponse(
        success=True,
        tool_name=req.tool_name,
        result=result,
        error=None,
    )

@tools_router.get("/weather", summary="Atalho Rápido: Clima Atual")
async def quick_weather(city: str = Query("Sao Paulo", description="Nome da cidade")):
    return await ToolRegistry.execute("get_weather_summary_wttr", {"city_or_location": city})

@tools_router.get("/currency", summary="Atalho Rápido: Cotações de Câmbio")
async def quick_currency(pairs: str = Query("USD-BRL,EUR-BRL,BTC-BRL")):
    return await ToolRegistry.execute("get_currency_rates", {"pairs": pairs})

@tools_router.get("/holidays", summary="Atalho Rápido: Feriados Nacionais")
async def quick_holidays(year: int = Query(2026)):
    return await ToolRegistry.execute("get_brazil_holidays", {"year": year})

@tools_router.get("/tech-news", summary="Atalho Rápido: Hacker News Tech")
async def quick_hn(limit: int = Query(5)):
    return await ToolRegistry.execute("get_hacker_news_top", {"limit": limit})

@tools_router.get("/radios", summary="Atalho Rápido: Buscar Rádios Online")
async def quick_radios(tag: str = Query("lofi"), limit: int = Query(6)):
    return await ToolRegistry.execute("search_radio_stations", {"tag": tag, "limit": limit})

from fastapi import UploadFile, File
from tools.music_recognizer import reconhecer_musica_ambiente

@tools_router.post("/identify-music", summary="Identificar Música do Ambiente via Áudio")
async def identify_music_endpoint(file: UploadFile = File(...)):
    """Recebe arquivo de áudio capturado (5-10s) e retorna título, artista e metadados."""
    content = await file.read()
    return await reconhecer_musica_ambiente(content)
