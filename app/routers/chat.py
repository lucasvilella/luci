"""
Router de Endpoints de Conversação Unificada (Texto, Voz e Memória Omnichannel).
"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app.services.brain_service import brain_service
from app.database.conversation_db import ConversationDatabase

router = APIRouter(prefix="/api/v1/chat", tags=["Conversation Brain"])

def _get_current_user(request: Request) -> str:
    """Extrai o identificador do usuário da sessão."""
    user_header = request.headers.get("X-User-Id")
    if user_header:
        return user_header
    user_query = request.query_params.get("userId")
    if user_query:
        return user_query
    return "lucas"

class ChatTextRequest(BaseModel):
    message: str
    userId: Optional[str] = "lucas"

class ChatVoiceRequest(BaseModel):
    message: str
    userId: Optional[str] = "lucas"
    voice: Optional[str] = "pt-BR-ThalitaNeural"
    generateAudio: Optional[bool] = True

# ─── 1. Endpoint Chat Texto ───
@router.post("/text")
async def chat_text(req: ChatTextRequest, request: Request):
    """Envia uma mensagem de texto pelo chat e recebe a resposta textual da Luci."""
    user_id = req.userId or _get_current_user(request)
    result = await brain_service.process_chat(
        user_id=user_id,
        message=req.message,
        input_type="text",
        generate_audio=False
    )
    return {
        "reply": result["reply"],
        "user_message": result["user_message"],
        "assistant_message": result["assistant_message"],
    }

# ─── 2. Endpoint Chat Voz ───
@router.post("/voice")
async def chat_voice(req: ChatVoiceRequest, request: Request):
    """Envia uma fala/áudio pelo Voice Orb e recebe a resposta em texto + áudio sintetizado TTS."""
    user_id = req.userId or _get_current_user(request)
    result = await brain_service.process_chat(
        user_id=user_id,
        message=req.message,
        input_type="voice",
        generate_audio=req.generateAudio if req.generateAudio is not None else True,
        voice=req.voice or "pt-BR-ThalitaNeural"
    )
    return {
        "reply": result["reply"],
        "audio_base64": result["audio_base64"],
        "user_message": result["user_message"],
        "assistant_message": result["assistant_message"],
    }

# ─── 3. Timeline / Histórico Unificado ───
@router.get("/history")
async def get_history(request: Request, limit: int = 50):
    """Retorna a timeline unificada de mensagens de Texto, Voz e Intérprete."""
    user_id = _get_current_user(request)
    timeline = ConversationDatabase.get_timeline(user_id, limit=limit)
    return {"messages": timeline}

@router.delete("/history")
async def clear_history(request: Request):
    """Limpa o histórico de conversas do usuário."""
    user_id = _get_current_user(request)
    ConversationDatabase.clear_history(user_id)
    return {"status": "ok", "message": "Histórico limpo com sucesso."}
