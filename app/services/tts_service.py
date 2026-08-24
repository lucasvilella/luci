"""
TTSService — Provedor Único de Síntese de Voz (TTS Capability) da Luci.
Conforme diretrizes arquiteturais:
- Apenas UM ponto de síntese de voz existe no sistema inteiro.
- Padronizado em Edge-TTS (pt-BR-ThalitaNeural), de alta performance e sem custos.
- ElevenLabs foi avaliado e descartado por latência e custos desnecessários em ambiente self-hosted/móvel.
"""

import io
import base64
from typing import Optional
import edge_tts

class TTSService:
    """Capability única de síntese de voz (TTS) para toda a plataforma Luci."""

    DEFAULT_VOICE = "pt-BR-ThalitaNeural"
    DEFAULT_RATE = "-5%"
    DEFAULT_PITCH = "-10Hz"

    @classmethod
    async def synthesize(
        cls,
        text: str,
        voice: Optional[str] = None,
        rate: Optional[str] = None,
        pitch: Optional[str] = None
    ) -> Optional[str]:
        """
        Sintetiza texto em áudio MP3 via Edge-TTS e retorna a string codificada em Base64.
        """
        clean_text = text.strip()
        if not clean_text:
            return None

        chosen_voice = voice or cls.DEFAULT_VOICE
        chosen_rate = rate or cls.DEFAULT_RATE
        chosen_pitch = pitch or cls.DEFAULT_PITCH

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
            return encoded
        except Exception as e:
            print(f"[TTSService] Erro ao sintetizar áudio com Edge-TTS ({chosen_voice}): {e}")
            return None

tts_service = TTSService()
