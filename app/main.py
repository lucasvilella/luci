"""
FastAPI Main Application — Luci AI Super App (Modular, Fast, Android/Termux & Local Ready).
Integrates:
- Multi-Tool API Endpoints (/api/v1/tools)
- Universal Interpreter WebSocket (/ws/interpreter)
- Acoustic Music Recognition (/api/v1/music/recognize)
"""

import os
from contextlib import asynccontextmanager
from typing import Optional, Dict, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, UploadFile, File, HTTPException, Request, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.core.config import settings
from app.tools.registry import tool_registry
from app.tools.music_recognizer import recognize_ambient_music
from app.services.interpreter_service import UniversalInterpreterSession

# ─── Middleware de Autenticação Segura (Bearer Token / X-API-Key) ───
async def verify_api_secret(request: Request):
    """Verifica se a requisição possui a chave secreta da Luci."""
    # Permite endpoint de health público ou com validação
    if request.url.path in ["/health", "/docs", "/openapi.json"]:
        return True

    auth_header = request.headers.get("Authorization", "")
    custom_key = request.headers.get("X-API-Key", "")
    query_token = request.query_params.get("token", "")

    expected_secret = settings.luci_api_secret

    # 1. Checa Bearer Token
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1].strip()
        if token == expected_secret:
            return True

    # 2. Checa cabeçalho X-API-Key ou query parameter ?token=
    if custom_key == expected_secret or query_token == expected_secret:
        return True

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Acesso Negado: Chave Secreta da L.U.C.I. inválida ou ausente.",
        headers={"WWW-Authenticate": "Bearer"},
    )

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"🚀 [Luci Core] Inicializada com sucesso na porta {settings.port}")
    print(f"🔒 [Security] Proteção por Chave Secreta de API Ativa.")
    yield
    print("🛑 [Luci Core] Desligamento seguro concluído.")

app = FastAPI(
    title=settings.app_name,
    description="Backend de Ferramentas Zero-Auth, Intérprete Simultâneo Universal e Reconhecimento Acústico.",
    version=settings.app_version,
    lifespan=lifespan,
    dependencies=[Depends(verify_api_secret)],
)

# CORS para React Desktop e Mobile App
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── 1. Health Endpoint ───
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
        "interpreter_engine": "Gemini Multimodal Live API (Bidirectional Audio)",
        "tools_registered": len(tool_registry._tools),
    }

# ─── 2. Tools Endpoints ───
@app.get("/api/v1/tools/schemas")
async def get_tool_schemas():
    """Retorna os schemas de Function Calling de todas as ferramentas para a LLM."""
    return {"tools": tool_registry.get_declarations_for_llm()}

class ToolExecuteRequest(BaseModel):
    tool_name: str
    arguments: Dict[str, Any] = {}

@app.post("/api/v1/tools/execute")
async def execute_tool(req: ToolExecuteRequest):
    """Executa uma ferramenta pública diretamente por nome e argumentos."""
    result = await tool_registry.execute(req.tool_name, req.arguments)
    return {"result": result}

# ─── 3. Acoustic Music Recognition ───
@app.post("/api/v1/music/recognize")
async def recognize_music_file(file: UploadFile = File(...)):
    """Recebe um arquivo de áudio gravado no ambiente e retorna os metadados da música (ShazamIO)."""
    audio_bytes = await file.read()
    res = await recognize_ambient_music(audio_bytes)
    return res

# ─── 4. Universal Interpreter WebSocket ───
@app.websocket("/ws/interpreter")
async def interpreter_websocket(
    websocket: WebSocket,
    token: Optional[str] = Query(None, description="Chave Secreta de API da Luci"),
    male_voice: Optional[str] = Query("Puck", description="Voz masculina (Puck/Fenrir)"),
    female_voice: Optional[str] = Query("Aoede", description="Voz feminina (Aoede/Kore)"),
):
    """
    WebSocket Full-Duplex para Interpretação Simultânea Contínua com Preservação de Gênero Vocal.
    """
    # Validação de segurança no handshake WebSocket
    auth_header = websocket.headers.get("Authorization", "").replace("Bearer ", "").strip()
    if token != settings.luci_api_secret and auth_header != settings.luci_api_secret:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Unauthorized: Token Secreto inválido.")
        return

    await websocket.accept()

    session = None
    try:
        session = UniversalInterpreterSession(
            male_voice=male_voice or "Puck",
            female_voice=female_voice or "Aoede",
        )
        await session.connect()
        await websocket.send_json({
            "status": "connected",
            "mode": "Luci Universal Dynamic Interpreter",
            "voices": {"male": male_voice or "Puck", "female": female_voice or "Aoede"},
        })

        import asyncio

        # Downstream: Gemini Live -> Cliente
        async def downstream_task():
            try:
                async for chunk in session.receive_stream():
                    if chunk["type"] == "audio":
                        await websocket.send_bytes(chunk["data"])
                    elif chunk["type"] == "text":
                        await websocket.send_json({"type": "transcript", "text": chunk["text"]})
                    elif chunk["type"] == "interrupted":
                        await websocket.send_json({"type": "event", "event": "interrupted"})
                    elif chunk["type"] == "turnComplete":
                        await websocket.send_json({"type": "event", "event": "turnComplete"})
            except Exception as ex:
                print(f"[InterpreterWS] Downstream exception: {ex}")

        reader_task = asyncio.create_task(downstream_task())

        # Upstream: Microfone do Cliente -> Gemini Live
        while True:
            msg = await websocket.receive()
            if "bytes" in msg and msg["bytes"]:
                await session.send_audio_chunk(msg["bytes"])
            elif "text" in msg and msg["text"]:
                import json
                try:
                    payload = json.loads(msg["text"])
                    if payload.get("action") == "stop":
                        break
                    elif "audio_base64" in payload:
                        import base64
                        raw = base64.b64decode(payload["audio_base64"])
                        await session.send_audio_chunk(raw)
                except Exception:
                    pass

    except WebSocketDisconnect:
        print("[InterpreterWS] Cliente desconectou.")
    except Exception as e:
        print(f"[InterpreterWS] Erro na sessão: {e}")
    finally:
        if session:
            await session.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=True)
