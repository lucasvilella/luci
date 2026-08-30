"""
Router de Endpoints de Conversação Unificada (Texto, Voz e Memória Omnichannel).
"""

import uuid
from pathlib import Path
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form
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
        "intent": result.get("intent"),
    }

# ─── 2. Endpoint Chat Voz (Texto -> LLM -> TTS) ───
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
        "intent": result.get("intent"),
    }

# ─── 2.1 Endpoint Chat Áudio Direto (Gravação Binária -> Whisper STT -> LLM -> TTS) ───
@router.post("/audio")
async def chat_audio(
    request: Request,
    file: UploadFile = File(...),
    userId: Optional[str] = Form(None),
    voice: Optional[str] = Form("pt-BR-ThalitaNeural")
):
    """Recebe o arquivo de áudio gravado diretamente do microfone (Push-To-Talk / Orb), transcreve via Whisper e processa na Luci."""
    from app.services.stt_service import stt_service
    user_id = userId or _get_current_user(request)

    audio_bytes = await file.read()
    transcribed_text = await stt_service.transcribe(
        audio_bytes=audio_bytes,
        filename=file.filename or "recording.webm",
        content_type=file.content_type or "audio/webm"
    )

    if not transcribed_text:
        return {
            "transcription": "",
            "reply": "Não consegui ouvir com clareza. Pode repetir, por favor?",
            "audio_base64": None,
            "user_message": None,
            "assistant_message": None,
            "intent": None
        }

    result = await brain_service.process_chat(
        user_id=user_id,
        message=transcribed_text,
        input_type="voice",
        generate_audio=True,
        voice=voice or "pt-BR-ThalitaNeural"
    )

    return {
        "transcription": transcribed_text,
        "reply": result["reply"],
        "audio_base64": result["audio_base64"],
        "user_message": result["user_message"],
        "assistant_message": result["assistant_message"],
        "intent": result.get("intent"),
    }

# ─── 2.2 Endpoint Transcrição Pura ───
@router.post("/transcribe")
async def transcribe_only(file: UploadFile = File(...)):
    """Apenas transcreve o arquivo de áudio sem enviar para o LLM."""
    from app.services.stt_service import stt_service
    audio_bytes = await file.read()
    transcribed_text = await stt_service.transcribe(
        audio_bytes=audio_bytes,
        filename=file.filename or "recording.webm",
        content_type=file.content_type or "audio/webm"
    )
    return {"transcription": transcribed_text}


# ─── 3. Endpoint Upload de Arquivo / Multimodal ───
@router.post("/upload")
async def chat_upload(
    request: Request,
    file: UploadFile = File(...),
    message: Optional[str] = Form("Analise o arquivo anexo."),
    userId: Optional[str] = Form(None)
):
    """Recebe um arquivo (imagem, documento, pdf), salva temporariamente e envia ao Cérebro da Luci."""
    user_id = userId or _get_current_user(request)
    
    upload_dir = Path(__file__).resolve().parent.parent.parent / "storage" / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    clean_filename = f"{uuid.uuid4().hex[:8]}_{file.filename}"
    file_path = upload_dir / clean_filename
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
        
    full_message = f"{message} (Arquivo: {file.filename})"
    result = await brain_service.process_chat(
        user_id=user_id,
        message=full_message,
        input_type="text",
        generate_audio=False,
        attachment_path=str(file_path)
    )
    return {
        "reply": result["reply"],
        "user_message": result["user_message"],
        "assistant_message": result["assistant_message"],
        "filename": file.filename
    }

class TTSDirectRequest(BaseModel):
    text: str
    voice: Optional[str] = "pt-BR-ThalitaNeural"
    rate: Optional[str] = "+0%"
    pitch: Optional[str] = "-5Hz"

# ─── 4. Endpoint Síntese Direta de Voz (TTS) ───
@router.post("/tts")
async def direct_tts(req: TTSDirectRequest):
    """Sintetiza uma frase direta em áudio MP3 (retorna stream binário de áudio)."""
    from fastapi.responses import Response
    from app.services.tts_service import tts_service
    import base64

    b64_audio = await tts_service.synthesize(
        text=req.text,
        voice=req.voice or "pt-BR-ThalitaNeural",
        rate=req.rate or "+0%",
        pitch=req.pitch or "-5Hz"
    )

    if not b64_audio:
        raise HTTPException(status_code=500, detail="Erro na síntese de voz TTS.")

    raw_bytes = base64.b64decode(b64_audio)
    return Response(content=raw_bytes, media_type="audio/mpeg")

# ─── 5. Timeline / Histórico Unificado ───
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

