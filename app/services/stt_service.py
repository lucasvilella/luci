"""
Serviço Unificado de Transcrição de Fala para Texto (STT) da Luci AI.
Utiliza o modelo Whisper Large v3 Turbo via Groq com latência ultra-baixa (<200ms)
e fallback automático para Gemini Multimodal Audio.
"""

import io
import os
import httpx
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger("LuciAI.STTService")

class STTService:
    def __init__(self):
        self.groq_api_key = settings.groq_api_key or os.getenv("GROQ_API_KEY")
        self.gemini_api_key = settings.gemini_api_key or os.getenv("GEMINI_API_KEY")

    async def transcribe(self, audio_bytes: bytes, filename: str = "audio.webm", content_type: str = "audio/webm") -> str:
        """
        Transcreve o áudio gravado (WebM, WAV, MP4, M4A, OGG) para texto em Português do Brasil.
        """
        if not audio_bytes or len(audio_bytes) < 100:
            logger.warning("[STTService] Áudio vazio ou corrompido recebido.")
            return ""

        # 1. Tentativa Primária: Groq Whisper Large v3 Turbo (Ultra-Fast)
        if self.groq_api_key:
            try:
                files = {"file": (filename or "audio.webm", audio_bytes, content_type or "audio/webm")}
                data = {
                    "model": "whisper-large-v3-turbo",
                    "language": "pt",
                    "temperature": "0.0",
                    "response_format": "json"
                }
                headers = {"Authorization": f"Bearer {self.groq_api_key}"}

                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.post(
                        "https://api.groq.com/openai/v1/audio/transcriptions",
                        files=files,
                        data=data,
                        headers=headers
                    )
                    if res.status_code == 200:
                        res_json = res.json()
                        text = res_json.get("text", "").strip()
                        if text:
                            logger.info(f"[STTService] Transcrição Whisper Groq bem-sucedida: '{text}'")
                            return text
                    else:
                        logger.warning(f"[STTService] Groq Whisper retornou {res.status_code}: {res.text}")
            except Exception as e:
                logger.warning(f"[STTService] Falha no Groq Whisper: {e}")

        # 2. Fallback Secundário: Gemini Multimodal Audio Transcription
        if self.gemini_api_key:
            try:
                import base64
                b64_audio = base64.b64encode(audio_bytes).decode("utf-8")
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_api_key}"
                payload = {
                    "contents": [{
                        "parts": [
                            {"text": "Transcreva o áudio a seguir com exatidão em Português do Brasil. Retorne APENAS o texto falado, sem comentários adicionais."},
                            {
                                "inline_data": {
                                    "mime_type": content_type or "audio/webm",
                                    "data": b64_audio
                                }
                            }
                        ]
                    }]
                }
                async with httpx.AsyncClient(timeout=12.0) as client:
                    res = await client.post(url, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                text = parts[0].get("text", "").strip()
                                logger.info(f"[STTService] Transcrição Gemini bem-sucedida: '{text}'")
                                return text
            except Exception as e:
                logger.error(f"[STTService] Falha no fallback Gemini: {e}")

        return ""

stt_service = STTService()
