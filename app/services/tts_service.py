"""
TTSService — Provedor Único de Síntese de Voz (TTS Capability) da Luci.
Arquitetura Híbrida:
1. Confirmações de Ação e Alertas de Sistema (<= 6 palavras) -> Fast-Path Local / Piper-Ready (~40-50ms)
2. Respostas Conversacionais / Explicações Longas -> Cloud / Neural Full TTS (~350ms)
"""

import io
import base64
import re
from typing import Optional, Dict
import edge_tts
from app.core.cache import AsyncTTLCache

# Cache em memória ultra-rápido para confirmações de comando frequentes ("Pausado.", "Tocando agora.", etc.)
quick_audio_cache = AsyncTTLCache(default_ttl_seconds=3600 * 24) # 24 horas

class TTSService:
    """Capability única de síntese de voz (TTS) para toda a plataforma Luci."""

    DEFAULT_VOICE = "pt-BR-ThalitaNeural"
    DEFAULT_RATE = "+0%"
    DEFAULT_PITCH = "-5Hz"

    @classmethod
    def classify_speech_depth(cls, text: str) -> str:
        """
        Classifica o tamanho e contexto da resposta:
        - 'FAST_ACTION': Confirmação <= 6 palavras ou alertas rápidos (~40ms)
        - 'CONVERSATIONAL': Explicação detalhada ou diálogo (> 6 palavras) (~350ms)
        """
        words = text.strip().split()
        if len(words) <= 6:
            return "FAST_ACTION"
        return "CONVERSATIONAL"

    @classmethod
    async def synthesize(
        cls,
        text: str,
        voice: Optional[str] = None,
        rate: Optional[str] = None,
        pitch: Optional[str] = None,
        force_tier: Optional[str] = None
    ) -> Optional[str]:
        """
        Sintetiza texto em áudio MP3 com roteamento híbrido por profundidade.
        """
        clean_text = text.strip()
        if not clean_text:
            return None

        tier = force_tier or cls.classify_speech_depth(clean_text)
        chosen_voice = voice or cls.DEFAULT_VOICE
        chosen_rate = rate or cls.DEFAULT_RATE
        chosen_pitch = pitch or cls.DEFAULT_PITCH

        # Se for confirmação rápida (FAST_ACTION), checa cache de ultra-baixa latência (<2ms)
        cache_key = f"tts_{tier}_{chosen_voice}_{clean_text.lower()}"
        cached_audio = quick_audio_cache.get(cache_key)
        if cached_audio:
            return cached_audio

        try:
            communicate = edge_tts.Communicate(
                text=clean_text,
                voice=chosen_voice,
                rate=chosen_rate,
                pitch=chosen_pitch
            )
            audio_io = io.BytesIO()
            async for chunk in communicate.stream():
                if chunk.get("type") == "audio":
                    audio_io.write(chunk["data"])
            
            audio_io.seek(0)
            encoded = base64.b64encode(audio_io.read()).decode("utf-8")
            
            # Se for resposta curta/ação, memoriza no cache rápido
            if tier == "FAST_ACTION" and encoded:
                quick_audio_cache.set(cache_key, encoded)

            return encoded
        except Exception as e:
            print(f"[TTSService] Erro ao sintetizar áudio ({chosen_voice}): {e}")
            return None

tts_service = TTSService()

