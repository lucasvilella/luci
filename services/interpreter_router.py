"""
FastAPI WebSocket Gateway for Luci Interpreter Mode.
Receives continuous PCM audio from client mic, relays to Gemini Live, and streams back translated audio.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Optional
import asyncio
import json
import base64

from services.interpreter_service import GeminiLiveInterpreterSession

interpreter_router = APIRouter(prefix="/api/v1/interpreter", tags=["Luci Interpreter"])

@interpreter_router.websocket("/ws")
async def interpreter_websocket_endpoint(
    websocket: WebSocket,
    source_lang: Optional[str] = Query("pt", description="Idioma base do usuário local"),
    target_lang: Optional[str] = Query("zh", description="Idioma alvo para tradução simultânea"),
    voice: Optional[str] = Query("Aoede", description="Voz da IA: Aoede, Puck, Charon, Fenrir, Kore"),
):
    """
    Endpoint WebSocket bidirecional para áudio ao vivo (Full-Duplex):
    - Cliente envia: chunks binários de áudio PCM 16kHz ou JSON {'audio': base64}
    - Servidor responde: chunks de áudio traduzido PCM 24kHz com baixa latência
    """
    await websocket.accept()

    session = None
    try:
        session = GeminiLiveInterpreterSession(voice_name=voice or "Aoede")
        await session.connect()
        await websocket.send_json({"status": "ready", "message": "Modo Intérprete Conectado ao Gemini Live."})

        # Task de Recepção do Gemini -> Envio para o Cliente
        async def stream_from_gemini_to_client():
            try:
                async for chunk in session.receive_stream():
                    if chunk["type"] == "audio":
                        # Envia chunk de áudio em formato binário ou base64
                        await websocket.send_bytes(chunk["data"])
                    elif chunk["type"] == "interrupted":
                        await websocket.send_json({"event": "interrupted"})
                    elif chunk["type"] == "turnComplete":
                        await websocket.send_json({"event": "turnComplete"})
            except Exception as e:
                print(f"[InterpreterWS] Erro no stream downstream: {e}")

        gemini_reader_task = asyncio.create_task(stream_from_gemini_to_client())

        # Loop de Recepção do Cliente -> Envio para o Gemini
        while True:
            message = await websocket.receive()
            if "bytes" in message and message["bytes"]:
                # Áudio binário direto (PCM 16kHz)
                await session.send_audio_chunk(message["bytes"])
            elif "text" in message and message["text"]:
                try:
                    payload = json.loads(message["text"])
                    if "audio_base64" in payload:
                        pcm_data = base64.b64decode(payload["audio_base64"])
                        await session.send_audio_chunk(pcm_data)
                    elif payload.get("action") == "stop":
                        break
                except Exception:
                    pass

    except WebSocketDisconnect:
        print("[InterpreterWS] Cliente desconectado.")
    except Exception as err:
        print(f"[InterpreterWS] Erro na sessão de interpretação: {err}")
        try:
            await websocket.send_json({"error": str(err)})
        except Exception:
            pass
    finally:
        if session:
            await session.close()
        try:
            await websocket.close()
        except Exception:
            pass
