"""
Serviço de Normalização de Loudness (LUFS / ReplayGain Style).
Mede LUFS integrado via ffmpeg loudnorm em background e calcula o multiplicador de ganho
compatível com YouTube Player API (`setVolume()`).
"""

import asyncio
import json
import logging
import re
import subprocess
from typing import Dict, Any, Optional

from app.database.music_db import MusicDatabase

logger = logging.getLogger("LuciMusic.LoudnessService")

# Padrão da indústria para streaming moderno (YouTube/Spotify/Apple Music)
TARGET_LUFS = -14.0

# Limites de segurança para ajuste de ganho linear
MIN_GAIN_ADJUSTMENT = 0.35   # Redução máxima para faixas extremamente estridentes (-5 LUFS)
MAX_GAIN_ADJUSTMENT = 1.60   # Amplificação máxima para não estourar/distorcer faixas antigas baixas

class LoudnessService:
    def __init__(self, target_lufs: float = TARGET_LUFS):
        self.target_lufs = target_lufs

    def calculate_gain(self, measured_lufs: float) -> float:
        """
        Calcula o fator de correção linear a partir do delta em dB:
        delta_db = target_lufs - measured_lufs
        linear_gain = 10 ** (delta_db / 20)
        """
        delta_db = self.target_lufs - measured_lufs
        linear_gain = 10.0 ** (delta_db / 20.0)
        
        # Aplica teto de segurança
        clamped_gain = max(MIN_GAIN_ADJUSTMENT, min(MAX_GAIN_ADJUSTMENT, linear_gain))
        return clamped_gain

    def _measure_lufs_sync(self, stream_url: str, duration_sec: int = 35) -> Optional[float]:
        """Executa FFmpeg loudnorm nos primeiros segundos da faixa."""
        if not stream_url or not stream_url.startswith("http"):
            return None
        try:
            cmd = [
                "ffmpeg",
                "-t", str(duration_sec),
                "-i", stream_url,
                "-af", "loudnorm=print_format=json",
                "-f", "null",
                "-"
            ]
            res = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=25
            )
            # O filtro loudnorm cospe as estatísticas em JSON no stderr
            match = re.search(r'\{\s*"input_i"\s*:\s*"-?[\d.]+".*?\}', res.stderr, re.DOTALL)
            if match:
                data = json.loads(match.group(0))
                return float(data.get("input_i", -14.0))
        except Exception as e:
            logger.warning(f"Erro ao medir LUFS com FFmpeg: {e}")
        return None

    async def get_or_analyze(self, track_id: str, stream_url: Optional[str] = None) -> Dict[str, Any]:
        """
        Retorna o loudness em cache. Se não existir e houver stream_url,
        dispara a medição em background sem bloquear o chamador.
        """
        if not track_id:
            return {"track_id": "", "lufs": self.target_lufs, "gain_adjustment": 1.0, "is_cached": False}

        cached = MusicDatabase.get_loudness(track_id)
        if cached:
            return {
                "track_id": track_id,
                "lufs": cached["lufs_integrated"],
                "gain_adjustment": cached["gain_adjustment"],
                "is_cached": True
            }

        # Se temos stream_url, dispara análise assíncrona em background
        if stream_url:
            asyncio.create_task(self._analyze_and_save_bg(track_id, stream_url))

        # Retorna padrão neutro enquanto a análise roda
        return {
            "track_id": track_id,
            "lufs": self.target_lufs,
            "gain_adjustment": 1.0,
            "is_cached": False
        }

    async def _analyze_and_save_bg(self, track_id: str, stream_url: str):
        """Worker em background para medir e persistir no SQLite."""
        loop = asyncio.get_running_loop()
        lufs = await loop.run_in_executor(None, self._measure_lufs_sync, stream_url)
        if lufs is not None:
            gain = self.calculate_gain(lufs)
            MusicDatabase.save_loudness(track_id, lufs, gain)
            logger.info(f"[LoudnessService] Faixa {track_id} analisada: {lufs:.2f} LUFS -> Gain {gain:.3f}x")

loudness_service = LoudnessService()
