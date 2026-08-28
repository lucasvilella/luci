"""
Registry de Provedores de Música da Luci.
Orquestra MetadataProvider (Primário: MusicBrainz -> Fallback: YT Music) e AudioSourceProvider.
Garante resolução e matching transparente de IDs para o player.
"""

import re
import logging
from typing import Dict, Any, Optional, List

from app.services.music_providers.base import MetadataProvider, AudioSourceProvider
from app.services.music_providers.metadata_musicbrainz import MusicBrainzMetadataProvider
from app.services.music_providers.metadata_ytmusic import YTMusicMetadataProvider
from app.services.music_providers.audio_ytmusic import YTMusicAudioProvider

logger = logging.getLogger("LuciMusic.ProviderRegistry")

class MusicProviderRegistry:
    def __init__(self):
        # YouTube Music direto como provedor primário para busca rica, rápida, com capas reais e playlists
        self.metadata_primary: MetadataProvider = YTMusicMetadataProvider()
        self.metadata_fallback: MetadataProvider = MusicBrainzMetadataProvider()
        self.audio_source: AudioSourceProvider = YTMusicAudioProvider()

    def _normalize_string(self, text: str) -> str:
        """Remove pontuações e caracteres especiais para matching tolerante."""
        clean = re.sub(r'[^\w\s]', '', text.lower())
        return " ".join(clean.split())

    async def search(self, query: str, limit: int = 20, filter_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Executa busca inteligente rápida com desduplicação de faixas e ranking de relevância.
        """
        try:
            results = await self.metadata_primary.search(query, limit=limit, filter_type=filter_type)
            if results and (results.get("songs") or results.get("artists") or results.get("albums") or results.get("playlists")):
                return results
        except Exception as e:
            logger.warning(f"[MusicProviderRegistry] Provedor primário falhou ({e}), tentando secundário...")

        return await self.metadata_fallback.search(query, limit=limit)

    async def resolve_audio_stream(self, track_id: str, title: Optional[str] = None, artist: Optional[str] = None) -> Dict[str, Any]:
        """
        Resolve o stream de áudio. Se o track_id for do MusicBrainz (mb_...), 
        faz matching com o catálogo de áudio para encontrar a melhor faixa.
        """
        resolved_track_id = track_id
        if track_id.startswith("mb_"):
            # Matching por título + artista no YT Music para obter o videoId correspondente
            search_q = f"{title or ''} {artist or ''}".strip()
            if search_q:
                try:
                    yt_match = await self.metadata_fallback.search(search_q, limit=1)
                    songs = yt_match.get("songs", [])
                    if songs and songs[0].get("id"):
                        resolved_track_id = songs[0]["id"]
                        logger.info(f"[MusicProviderRegistry] Matched MusicBrainz track '{search_q}' -> YouTube ID: {resolved_track_id}")
                except Exception as ex:
                    logger.warning(f"[MusicProviderRegistry] Falha no matching do track MB '{track_id}': {ex}")

        return await self.audio_source.resolve_stream(resolved_track_id, title=title, artist=artist)

# Instância Singleton
provider_registry = MusicProviderRegistry()
