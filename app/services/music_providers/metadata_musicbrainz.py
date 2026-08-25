"""
Provedor de Metadados MusicBrainz & ListenBrainz (Primário / Open Music Database).
Implementa rate-limiting estrito (1 req/s) e enriquece tags/dados com ListenBrainz.
"""

import asyncio
import time
import re
import urllib.parse
from typing import Dict, Any, Optional, List
import httpx

from app.services.music_providers.base import MetadataProvider

class MusicBrainzMetadataProvider(MetadataProvider):
    def __init__(self):
        self.base_url = "https://musicbrainz.org/ws/2"
        self.listenbrainz_url = "https://api.listenbrainz.org/1"
        self.headers = {
            "User-Agent": "LuciMusicAssistant/1.0.0 ( lucas.vilella@policryl.com.br )",
            "Accept": "application/json"
        }
        self._last_request_time = 0.0
        self._rate_limit_lock = asyncio.Lock()

    @property
    def name(self) -> str:
        return "musicbrainz"

    async def _rate_limited_get(self, url: str, params: Optional[Dict[str, Any]] = None, timeout: float = 10.0) -> Optional[Dict[str, Any]]:
        """Garante intervalo de no mínimo 1.1s entre requisições para respeitar o rate-limit da MusicBrainz API."""
        async with self._rate_limit_lock:
            now = time.time()
            elapsed = now - self._last_request_time
            if elapsed < 1.1:
                await asyncio.sleep(1.1 - elapsed)
            self._last_request_time = time.time()

        try:
            async with httpx.AsyncClient(timeout=timeout, headers=self.headers, follow_redirects=True) as client:
                res = await client.get(url, params=params)
                if res.status_code == 200:
                    return res.json()
                elif res.status_code == 503:
                    print("[MusicBrainz] 503 Rate Limit atingido. Ativando fallback.")
                    return None
                else:
                    print(f"[MusicBrainz] Status {res.status_code} ({url}): {res.text[:80]}")
        except Exception as e:
            print(f"[MusicBrainz] Erro de requisição ({url}): {type(e).__name__} - {e}")
            return None
        return None

    def _format_recording(self, rec: Dict[str, Any]) -> Dict[str, Any]:
        """Formata uma recording do MusicBrainz no schema unificado do LuciMusic."""
        mbid = rec.get("id", "")
        title = rec.get("title", "Sem Título")
        
        # Artistas
        artist_credit = rec.get("artist-credit") or []
        artist_names = []
        artist_id = ""
        for ac in artist_credit:
            if isinstance(ac, dict):
                artist_names.append(ac.get("name", ""))
                if not artist_id and ac.get("artist", {}).get("id"):
                    artist_id = ac["artist"]["id"]
            elif isinstance(ac, str):
                artist_names.append(ac)
        
        artist = "".join(artist_names).strip() if artist_names else "Artista Desconhecido"

        # Release / Álbum
        releases = rec.get("releases") or []
        album_name = ""
        release_id = ""
        if releases:
            first_rel = releases[0]
            album_name = first_rel.get("title", "")
            release_id = first_rel.get("id", "")

        # Duração (MusicBrainz fornece length em milissegundos)
        length_ms = rec.get("length") or 0
        duration_sec = int(length_ms // 1000)

        # Capa via Cover Art Archive oficial do MusicBrainz
        thumbnail = f"https://coverartarchive.org/release/{release_id}/front-500" if release_id else ""

        # Tags de gênero
        tags = [t.get("name") for t in (rec.get("tags") or []) if t.get("name")]

        return {
            "id": f"mb_{mbid}",
            "title": title,
            "artist": artist,
            "artistId": artist_id or f"mb_art_{artist_id}",
            "album": album_name,
            "thumbnail": thumbnail,
            "duration": duration_sec,
            "durationFormatted": f"{duration_sec // 60}:{duration_sec % 60:02d}",
            "provider": self.name,
            "external_ids": {
                "mbid": mbid,
                "release_id": release_id,
                "tags": tags
            }
        }

    async def search(self, query: str, limit: int = 20, filter_type: Optional[str] = None) -> Dict[str, Any]:
        """Busca gravações musicais no catálogo do MusicBrainz."""
        if not query.strip():
            return {"songs": [], "artists": [], "albums": [], "playlists": []}

        clean_q = re.sub(r'[\/:]', ' ', query).strip()
        search_url = f"{self.base_url}/recording"
        params = {
            "query": f'recording:"{clean_q}"',
            "fmt": "json",
            "limit": min(limit, 25)
        }

        data = await self._rate_limited_get(search_url, params=params)
        if not data or not data.get("recordings"):
            return {"songs": [], "artists": [], "albums": [], "playlists": []}

        recordings = data.get("recordings", [])
        songs = [self._format_recording(r) for r in recordings if r.get("id")]

        return {
            "songs": songs,
            "artists": [],
            "albums": [],
            "playlists": []
        }

    async def get_track_metadata(self, track_id: str) -> Optional[Dict[str, Any]]:
        """Enriquece metadados via MusicBrainz e ListenBrainz."""
        clean_id = track_id.replace("mb_", "")
        url = f"{self.base_url}/recording/{clean_id}"
        params = {"fmt": "json", "inc": "artists+releases+tags"}
        data = await self._rate_limited_get(url, params=params)
        if not data:
            return None
        return self._format_recording(data)
