"""
Configurações globais da aplicação Luci (compatível com Linux/Android Termux ARM64 e Windows).
"""

import os
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

class AppSettings(BaseModel):
    app_name: str = "Luci AI Super App"
    app_version: str = "3.0.0"
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    tavily_api_key: str = os.getenv("TAVILY_API_KEY", "")
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    default_tts_provider: str = os.getenv("DEFAULT_TTS_PROVIDER", "EdgeTTS")
    edge_voice: str = os.getenv("EDGE_VOICE", "pt-BR-FranciscaNeural")
    luci_api_secret: str = os.getenv("LUCI_API_SECRET") or os.getenv("LUCI_SECRET_TOKEN") or "luci-secret-token-2026"

settings = AppSettings()

