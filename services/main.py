"""
FastAPI Main Application for Luci Super App Services & Interpreter Gateway.
Integrates:
- External Tools API Suite (/api/v1/tools)
- Gemini Live Interpreter WebSocket (/api/v1/interpreter/ws)
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from contextlib import asynccontextmanager
from services.api_router import tools_router
from routes.interpreter_socket import interpreter_ws_router
from services.scheduler_service import global_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Inicia o Scheduler Proativo em segundo plano
    global_scheduler.start()
    yield
    # Shutdown: Encerra o Scheduler de forma segura
    global_scheduler.shutdown()

app = FastAPI(
    title="Luci AI — Core Services & Interpreter Gateway",
    description="Backend de serviços autônomos, Function Calling, Vetor Memory e Gemini Multimodal Live API.",
    version="2.5.0",
    lifespan=lifespan,
)

# Enable CORS for Mobile App and Desktop Interfaces
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Sub-Routers
app.include_router(tools_router)
app.include_router(interpreter_ws_router)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Luci AI Gateway",
        "interpreter_mode": "Gemini Multimodal Live (Audio-to-Audio)",
        "memory": "ChromaDB Long-Term Vector Memory",
        "scheduler": "APScheduler AsyncIOScheduler Active",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
