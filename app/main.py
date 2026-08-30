"""
FastAPI Main Application — Luci AI Super App (Modular, Fast, Android/Termux & Local Ready).
Integrates:
- Multi-Tool API Endpoints (/api/v1/tools)
- Universal Interpreter WebSocket (/ws/interpreter)
- Acoustic Music Recognition (/api/v1/music/recognize)
- Static Mobile Interface (Next.js Export)
"""

import os
import sys
from pathlib import Path

# Adiciona a raiz do projeto ao sys.path para garantir execução no Termux, Docker ou Local
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import asyncio
from contextlib import asynccontextmanager
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, UploadFile, File, HTTPException, Request, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app.core.config import settings
from app.tools.registry import tool_registry
import app.tools.music_tools  # Registra as 3 tools de IA: play_music, search_semantic_history, manage_playlist
from app.tools.music_recognizer import recognize_ambient_music
from app.services.interpreter_service import UniversalInterpreterSession
from app.routers.lucimusic import router as lucimusic_router
from app.routers.chat import router as chat_router
from app.routers.ws_hub import router as ws_hub_router
from app.services.brain_service import brain_service

# Caminho dos arquivos estáticos da interface mobile
STATIC_DIR = Path(__file__).parent / "static"

# ─── Middleware de Autenticação Segura (Bearer Token / X-API-Key) ───
async def verify_api_secret(request: Request = None):
    """Verifica se a requisição possui a chave secreta da Luci."""
    if request is None:
        return True

    path = getattr(request.url, "path", "")
    public_paths = ["/health", "/docs", "/openapi.json", "/favicon.ico"]
    if path in public_paths or path == "/" or path.startswith("/_next") or path.startswith("/static") or path.startswith("/api/v1/music") or path.startswith("/api/v1/lucimusic") or path.startswith("/api/v1/chat") or path.startswith("/ws"):
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
        detail="Acesso Negado: Chave Secreta da Luci inválida ou ausente.",
        headers={"WWW-Authenticate": "Bearer"},
    )

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"[Luci Core] Inicializada com sucesso na porta {settings.port}")
    print(f"[Security] Protecao por Chave Secreta de API Ativa.")
    # Pré-aquecimento assíncrono da curadoria do LuciMusic
    async def _warmup_music():
        try:
            from app.services.music_intelligence_engine import music_intelligence_engine
            from app.services.lucimusic_service import lucimusic_service
            curation = await music_intelligence_engine.get_home_curation("lucasmvilella")
            await lucimusic_service.resolve_home_curation(curation, "lucasmvilella")
        except Exception as e:
            print(f"[Warmup] Aviso ao pre-aquecer musica: {e}")

    asyncio.create_task(_warmup_music())
    yield
    print("[Luci Core] Desligamento seguro concluido.")

app = FastAPI(
    title=settings.app_name,
    description="Backend de Ferramentas Zero-Auth, Intérprete Simultâneo Universal e Reconhecimento Acústico.",
    version=settings.app_version,
    lifespan=lifespan,
    dependencies=[Depends(verify_api_secret)],
)

# CORS universal para React Desktop, Next.js e Mobile App
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ───
app.include_router(lucimusic_router)
app.include_router(chat_router)
app.include_router(ws_hub_router)

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

# ─── Home Automation Endpoints ───
@app.get("/api/v1/home/devices")
async def get_home_devices():
    """Retorna dispositivos simulados da casa inteligente."""
    return [
        {"id": "dev_1", "name": "Luz da Sala", "type": "light", "state": "on", "brightness": 80, "room": "Sala de Estar"},
        {"id": "dev_2", "name": "Ar Condicionado", "type": "climate", "state": "on", "temperature": 22, "room": "Quarto"},
        {"id": "dev_3", "name": "Fechadura Principal", "type": "lock", "state": "locked", "room": "Entrada"},
        {"id": "dev_4", "name": "Caixa de Som Luci", "type": "speaker", "state": "playing", "volume": 65, "room": "Geral"}
    ]

# ─── 3. Chat Endpoint (Proxy para Gemini) ───
class ChatRequest(BaseModel):
    message: str
    userId: str = "user"
    history: List[Dict[str, str]] = []

@app.post("/api/v1/chat")
async def chat_endpoint(req: ChatRequest):
    """Endpoint de chat que processa mensagens via ferramentas registradas."""
    # Por enquanto, executa a tool de weather como demo
    # TODO: Integrar com Gemini para roteamento inteligente
    return JSONResponse(content={
        "content": f"Olá! Recebi sua mensagem: '{req.message}'. Estou processando com as {len(tool_registry._tools)} ferramentas disponíveis. Em breve terei respostas completas via Gemini!",
    })

# ─── 4. TTS Endpoint ───
class TTSRequest(BaseModel):
    text: str
    voice: str = "pt-BR-ThalitaNeural"

@app.post("/api/v1/tts/speak")
async def tts_speak(req: TTSRequest):
    """Sintetiza texto em áudio usando Edge TTS."""
    try:
        import edge_tts
        import io
        communicate = edge_tts.Communicate(req.text, req.voice)
        audio_data = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data.write(chunk["data"])
        audio_data.seek(0)
        from fastapi.responses import StreamingResponse
        return StreamingResponse(
            audio_data,
            media_type="audio/mpeg",
            headers={"X-TTS-Provider": "EdgeTTS"}
        )
    except ImportError:
        raise HTTPException(status_code=501, detail="edge-tts não instalado no servidor.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── 5. Acoustic Music Recognition ───
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
                        # Grava transcrição passiva no Cérebro da Luci
                        asyncio.create_task(brain_service.record_interpreter_turn(
                            user_id="lucas",
                            speaker="Intérprete",
                            original_text="Áudio em tempo real",
                            translated_text=chunk["text"]
                        ))
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

# ─── Interface Mobile Estática ───
# Servir a interface Next.js exportada como arquivos estáticos
if STATIC_DIR.exists() and (STATIC_DIR / "index.html").exists():
    @app.get("/")
    async def serve_index():
        return FileResponse(STATIC_DIR / "index.html")

    # Montar arquivos estáticos (CSS, JS, imagens)
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static-mobile")
else:
    @app.get("/")
    async def root_redirect():
        return JSONResponse(content={
            "message": "Luci AI Backend ativo. Interface mobile não encontrada.",
            "docs": "/docs",
            "health": "/health",
        })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=True)
