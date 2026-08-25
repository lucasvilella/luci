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
        self.metadata_primary: MetadataProvider = MusicBrainzMetadataProvider()
        self.metadata_fallback: MetadataProvider = YTMusicMetadataProvider()
        self.audio_source: AudioSourceProvider = YTMusicAudioProvider()

    def _normalize_string(self, text: str) -> str:
        """Remove pontuações e caracteres especiais para matching tolerante."""
        clean = re.sub(r'[^\w\s]', '', text.lower())
        return " ".join(clean.split())

    async def search(self, query: str, limit: int = 20, filter_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Executa busca com arquitetura de fallback transparente:
        1. Tenta catálogo do MusicBrainz/ListenBrainz (Primário)
        2. Em caso de vazio ou erro -> Recorre ao YouTube Music (Fallback)
        """
        # Se for filtro específico de playlists, consulta direto YT Music (MusicBrainz é focado em recordings/releases)
        if filter_type in ["playlists", "albums", "artists"]:
            return await self.metadata_fallback.search(query, limit=limit, filter_type=filter_type)

        try:
            mb_results = await self.metadata_primary.search(query, limit=limit)
            if mb_results and mb_results.get("songs"):
                logger.info(f"[MusicProviderRegistry] Busca '{query}' atendida pelo PRIMÁRIO ({self.metadata_primary.name}) com {len(mb_results['songs'])} faixas.")
                
                # Complementa com artistas/álbuns do fallback caso MusicBrainz retorne vazio nas seções secundárias
                fallback_secondary = await self.metadata_fallback.search(query, limit=limit)
                mb_results["artists"] = fallback_secondary.get("artists", [])
                mb_results["albums"] = fallback_secondary.get("albums", [])
                mb_results["playlists"] = fallback_secondary.get("playlists", [])
                return mb_results
        except Exception as e:
            logger.warning(f"[MusicProviderRegistry] MusicBrainz indisponível ou falhou ({e}), ativando fallback...")

        # Fallback para YouTube Music
        logger.info(f"[MusicProviderRegistry] Busca '{query}' atendida pelo FALLBACK ({self.metadata_fallback.name}).")
        return await self.metadata_fallback.search(query, limit=limit, filter_type=filter_type)

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
