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
        # MusicBrainz como Metadata Provider Primário (Open Music Database / Rate Limited)
        self.metadata_primary: MetadataProvider = MusicBrainzMetadataProvider()
        # YouTube Music como Metadata Provider Fallback (Catálogo nicho/novo e metadados ricos)
        self.metadata_fallback: MetadataProvider = YTMusicMetadataProvider()
        # Audio Source Provider (yt-dlp stream)
        self.audio_source: AudioSourceProvider = YTMusicAudioProvider()

    def _normalize_string(self, text: str) -> str:
        """Remove pontuações e caracteres especiais para matching tolerante."""
        clean = re.sub(r'[^\w\s]', '', text.lower())
        return " ".join(clean.split())

    async def search(self, query: str, limit: int = 20, filter_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Executa busca inteligente com MusicBrainz como primário e fallback automático para YT Music.
        Adiciona campo interno de telemetria '_provider' para observabilidade.
        """
        # Se for filtro específico de playlists ou artistas, usa fallback direto pois MusicBrainz foca em gravações/músicas
        if filter_type in ["playlists"]:
            res = await self.metadata_fallback.search(query, limit=limit, filter_type=filter_type)
            res["_provider"] = self.metadata_fallback.name
            return res

        # 1. Tentativa com Provedor Primário (MusicBrainz)
        try:
            results = await self.metadata_primary.search(query, limit=limit, filter_type=filter_type)
            songs = results.get("songs", [])
            if songs and len(songs) > 0:
                logger.info(f"[MusicProviderRegistry] Busca '{query}' atendida com sucesso pelo provedor primário: {self.metadata_primary.name} ({len(songs)} faixas)")
                results["_provider"] = self.metadata_primary.name
                return results
        except Exception as e:
            logger.warning(f"[MusicProviderRegistry] MusicBrainz indisponível ou erro na busca ('{query}'): {e}. Ativando fallback...")

        # 2. Fallback Automático para YouTube Music
        logger.info(f"[MusicProviderRegistry] Usando fallback ({self.metadata_fallback.name}) para a busca '{query}'...")
        fallback_results = await self.metadata_fallback.search(query, limit=limit, filter_type=filter_type)
        fallback_results["_provider"] = self.metadata_fallback.name
        return fallback_results

    async def get_track_metadata(self, track_id: str) -> Optional[Dict[str, Any]]:
        """Busca enriquecimento de metadados respeitando a hierarquia de providers."""
        if track_id.startswith("mb_"):
            meta = await self.metadata_primary.get_track_metadata(track_id)
            if meta:
                return meta
        return await self.metadata_fallback.get_track_metadata(track_id)

    async def resolve_audio_stream(self, track_id: str, title: Optional[str] = None, artist: Optional[str] = None) -> Dict[str, Any]:
        """
        Resolve o stream de áudio. Se o track_id for do MusicBrainz (mb_...), 
        faz matching tolerante por título + artista com o catálogo do YouTube para obter o stream_url.
        """
        resolved_track_id = track_id
        if track_id.startswith("mb_") or track_id.startswith("pl_") or track_id.startswith("tr_") or track_id.startswith("hero_") or len(track_id) < 10:
            search_q = f"{title or ''} {artist or ''}".strip()
            if not search_q:
                search_q = track_id
            try:
                yt_match = await self.metadata_fallback.search(search_q, limit=1)
                songs = yt_match.get("songs", [])
                if songs and songs[0].get("id"):
                    resolved_track_id = songs[0]["id"]
                    logger.info(f"[MusicProviderRegistry] Matched track '{search_q}' ({track_id}) -> YouTube Video ID: {resolved_track_id}")
            except Exception as ex:
                logger.warning(f"[MusicProviderRegistry] Falha no matching da faixa '{track_id}': {ex}")

        return await self.audio_source.resolve_stream(resolved_track_id, title=title, artist=artist)

    async def get_artist_details(self, artist_query: str) -> Dict[str, Any]:
        """Obtém metadados canônicos do artista do MusicBrainz/ListenBrainz com fallback."""
        if hasattr(self.metadata_primary, "get_artist_details"):
            try:
                mb_details = await self.metadata_primary.get_artist_details(artist_query)
                if mb_details:
                    return mb_details
            except Exception as ex:
                logger.warning(f"[MusicProviderRegistry] get_artist_details falhou no MusicBrainz para '{artist_query}': {ex}")
        return {
            "name": artist_query,
            "avatar": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500",
            "thumbnail": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500",
            "tags": ["Música"],
            "genres": ["Música Brasileira"],
            "listeners": "Artista no radar da Luci"
        }

    async def get_official_cover_art(self, title: str, artist: str, release_id: Optional[str] = None) -> str:
        """Obtém capa oficial 1:1 de estúdio via Cover Art Archive com fallback Deezer/iTunes."""
        if hasattr(self.metadata_primary, "get_official_cover_art"):
            try:
                cov = await self.metadata_primary.get_official_cover_art(title, artist, release_id)
                if cov:
                    return cov
            except Exception as ex:
                logger.warning(f"[MusicProviderRegistry] get_official_cover_art falhou: {ex}")
        return ""

# Instância Singleton
provider_registry = MusicProviderRegistry()

