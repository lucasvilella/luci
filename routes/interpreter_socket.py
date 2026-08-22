"""
FastAPI WebSocket Gateway for Luci Dynamic Interpreter (Voice/Gender Pairing).
Streams full-duplex binary/json PCM audio with real-time speaker adaptation.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Optional
import asyncio
import json
import base64

from services.interpreter_service import DynamicVoiceLiveSession

interpreter_ws_router = APIRouter(prefix="/api/v1/interpreter", tags=["Luci Dynamic Interpreter"])

@interpreter_ws_router.websocket("/ws")
async def dynamic_interpreter_ws(
    websocket: WebSocket,
    male_voice: Optional[str] = Query("Puck", description="Voz masculina para tradução (Puck/Fenrir)"),
    female_voice: Optional[str] = Query("Aoede", description="Voz feminina para tradução (Aoede/Kore)"),
):
    """
    WebSocket Full-Duplex para Interpretação Simultânea com Preservação de Gênero Vocal:
    - Homem (PT) -> Tradução em Mandarim com Voz Masculina ('Puck')
    - Mulher (Mandarim) -> Tradução em Português com Voz Feminina ('Aoede')
    """
    await websocket.accept()

    session = None
    try:
        session = DynamicVoiceLiveSession(
            male_voice=male_voice or "Puck",
            female_voice=female_voice or "Aoede",
        )
        await session.connect()
        await websocket.send_json({
            "status": "connected",
            "mode": "Dynamic Speaker & Gender Adaptive Interpreter",
            "voices": {
                "male": male_voice or "Puck",
                "female": female_voice or "Aoede",
            },
        })

        # Task de Leitura Gemini -> Envio ao Cliente
        async def downstream_task():
            try:
                async for chunk in session.receive_stream():
                    if chunk["type"] == "audio":
                        # Áudio puro PCM 24kHz
                        await websocket.send_bytes(chunk["data"])
                    elif chunk["type"] == "text":
                        # Metadado de transcrição/texto
                        await websocket.send_json({"type": "transcript", "text": chunk["text"]})
                    elif chunk["type"] == "interrupted":
                        await websocket.send_json({"type": "event", "event": "interrupted"})
                    elif chunk["type"] == "turnComplete":
                        await websocket.send_json({"type": "event", "event": "turnComplete"})
            except Exception as ex:
                print(f"[InterpreterWS] Downstream exception: {ex}")

        reader_task = asyncio.create_task(downstream_task())

        # Loop de Upstream: Microfone do Cliente -> Gemini Live
        while True:
            message = await websocket.receive()
            if "bytes" in message and message["bytes"]:
                await session.send_audio_chunk(message["bytes"])
            elif "text" in message and message["text"]:
                try:
                    payload = json.loads(message["text"])
                    if "audio_base64" in payload:
                        raw_pcm = base64.b64decode(payload["audio_base64"])
                        await session.send_audio_chunk(raw_pcm)
                    elif payload.get("action") == "stop":
                        break
                except Exception:
                    pass

    except WebSocketDisconnect:
        print("[InterpreterWS] Cliente desconectou normalmente.")
    except Exception as e:
        print(f"[InterpreterWS] Erro de sessão: {e}")
        try:
            await websocket.send_json({"error": str(e)})
        except Exception:
            pass
    finally:
        if session:
            await session.close()
        try:
            await websocket.close()
        except Exception:
            pass
