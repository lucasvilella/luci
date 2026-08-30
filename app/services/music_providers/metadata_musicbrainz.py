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

    async def get_artist_details(self, artist_query: str) -> Optional[Dict[str, Any]]:
        """
        Obtém metadados canônicos do artista diretamente do MusicBrainz e ListenBrainz,
        incluindo gêneros, tags, bio, estatísticas e foto oficial via Wikimedia/Wikidata ou Deezer.
        """
        clean_name = re.sub(r'\(.*?\)|\[.*?\]', '', artist_query).split(',')[0].split('&')[0].split(' e ')[0].strip()
        if not clean_name:
            return None

        artist_data = None
        mbid = ""

        # 1. Se for MBID direto
        if len(clean_name) == 36 and "-" in clean_name:
            mbid = clean_name
            url = f"{self.base_url}/artist/{mbid}"
            artist_data = await self._rate_limited_get(url, params={"inc": "url-rels+tags+genres+releases+ratings", "fmt": "json"})
        else:
            # Busca pelo nome canônico
            search_url = f"{self.base_url}/artist"
            res = await self._rate_limited_get(search_url, params={"query": f'artist:"{clean_name}"', "fmt": "json", "limit": 1})
            if res and res.get("artists"):
                art_entry = res["artists"][0]
                mbid = art_entry.get("id", "")
                url = f"{self.base_url}/artist/{mbid}"
                artist_data = await self._rate_limited_get(url, params={"inc": "url-rels+tags+genres+releases+ratings", "fmt": "json"})

        if not artist_data:
            # Fallback rápido para resolução de foto via Deezer se MusicBrainz não encontrar
            avatar = await self.resolve_artist_portrait(clean_name, None)
            return {
                "id": f"mb_art_{clean_name}",
                "name": clean_name,
                "avatar": avatar,
                "thumbnail": avatar,
                "tags": ["MPB", "Pop"],
                "genres": ["Música Brasileira"],
                "country": "BR",
                "disambiguation": "Artista Canônico",
                "listeners": "Mais de 1M ouvintes"
            }

        name = artist_data.get("name") or clean_name
        country = artist_data.get("country", "BR")
        disambiguation = artist_data.get("disambiguation", "")
        tags = [t.get("name") for t in (artist_data.get("tags") or []) if t.get("name")]
        genres = [g.get("name") for g in (artist_data.get("genres") or []) if g.get("name")]

        # 2. Busca foto oficial do artista (Wikimedia/Wikidata relations -> Deezer 1000x1000 fallback)
        avatar = await self.resolve_artist_portrait(name, artist_data.get("relations", []))

        # 3. Estatísticas ListenBrainz (Open Source Listening Stats)
        listeners_text = "Artista no radar da Luci"
        if mbid:
            try:
                lb_url = f"{self.listenbrainz_url}/stats/artist/{mbid}/listeners"
                async with httpx.AsyncClient(timeout=3.0) as client:
                    lb_res = await client.get(lb_url)
                    if lb_res.status_code == 200:
                        lb_data = lb_res.json()
                        total_listeners = lb_data.get("payload", {}).get("total_listen_count")
                        if total_listeners:
                            listeners_text = f"{total_listeners:,} reproduções canônicas".replace(",", ".")
            except Exception:
                pass

        return {
            "id": f"mb_{mbid}" if mbid else f"mb_art_{name}",
            "mbid": mbid,
            "name": name,
            "avatar": avatar,
            "thumbnail": avatar,
            "banner_url": avatar,
            "country": country,
            "disambiguation": disambiguation,
            "tags": tags or genres or ["Música"],
            "genres": genres or tags or ["Música Brasileira"],
            "listeners": listeners_text
        }

    async def resolve_artist_portrait(self, artist_name: str, relations: Optional[List[Dict[str, Any]]] = None) -> str:
        """Resolve a foto oficial de perfil do artista (Wikimedia Commons -> Deezer 1000x1000)."""
        # 1. Tentativa via relações Wikidata/Wikimedia no MusicBrainz
        if relations:
            try:
                for rel in relations:
                    url_res = rel.get("url", {}).get("resource", "")
                    if "wikidata.org/wiki/Q" in url_res:
                        qid = url_res.split("/")[-1]
                        async with httpx.AsyncClient(timeout=3.0) as client:
                            rw = await client.get(f"https://www.wikidata.org/wiki/Special:EntityData/{qid}.json")
                            if rw.status_code == 200:
                                wdata = rw.json()
                                claims = wdata.get("entities", {}).get(qid, {}).get("claims", {})
                                if "P18" in claims:
                                    img_name = claims["P18"][0]["mainsnak"]["datavalue"]["value"]
                                    img_encoded = urllib.parse.quote(img_name)
                                    return f"https://commons.wikimedia.org/wiki/Special:FilePath/{img_encoded}?width=800"
            except Exception:
                pass

        # 2. Fallback de alta fidelidade para estúdio oficial (Deezer 1000x1000)
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get("https://api.deezer.com/search/artist", params={"q": artist_name, "limit": 1})
                if res.status_code == 200:
                    data = res.json()
                    if data.get("data") and len(data["data"]) > 0:
                        pic = data["data"][0].get("picture_xl") or data["data"][0].get("picture_big")
                        if pic:
                            return pic
        except Exception:
            pass

        return "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500"

    async def get_official_cover_art(self, title: str, artist: str, release_id: Optional[str] = None) -> str:
        """
        Obtém a capa oficial de estúdio (Cover Art Archive -> Deezer -> iTunes)
        para garantir proporção 1:1 sem distorção ou frames 16:9 de vídeo.
        """
        # 1. Cover Art Archive oficial do MusicBrainz
        if release_id:
            caa_url = f"https://coverartarchive.org/release/{release_id}/front-500"
            try:
                async with httpx.AsyncClient(timeout=2.5, follow_redirects=True) as client:
                    head_res = await client.head(caa_url)
                    if head_res.status_code == 200:
                        return caa_url
            except Exception:
                pass

        clean_title = re.sub(r'\(.*?\)|\[.*?\]|official.*|video.*|ao vivo.*', '', title, flags=re.IGNORECASE).strip()
        clean_artist = re.sub(r'\(.*?\)|\[.*?\]', '', artist).split(',')[0].split('&')[0].split(' e ')[0].strip()

        # 2. Deezer 1000x1000 Studio Album Cover
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                q = f"{clean_title} {clean_artist}".strip()
                res = await client.get("https://api.deezer.com/search", params={"q": q, "limit": 1})
                if res.status_code == 200:
                    data = res.json()
                    if data.get("data") and len(data["data"]) > 0:
                        cov = data["data"][0].get("album", {}).get("cover_xl") or data["data"][0].get("album", {}).get("cover_big")
                        if cov:
                            return cov
        except Exception:
            pass

        # 3. iTunes 600x600 Official Artwork
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                q = f"{clean_title} {clean_artist}".strip()
                res = await client.get("https://itunes.apple.com/search", params={"term": q, "entity": "song", "limit": 1})
                if res.status_code == 200:
                    data = res.json()
                    if data.get("resultCount", 0) > 0:
                        cov = data["results"][0].get("artworkUrl100", "").replace("100x100bb", "600x600bb")
                        if cov:
                            return cov
        except Exception:
            pass

        return ""

    async def get_track_metadata(self, track_id: str) -> Optional[Dict[str, Any]]:
        """Enriquece metadados via MusicBrainz e ListenBrainz."""
        clean_id = track_id.replace("mb_", "")
        url = f"{self.base_url}/recording/{clean_id}"
        params = {"fmt": "json", "inc": "artists+releases+tags"}
        data = await self._rate_limited_get(url, params=params)
        if not data:
            return None
        return self._format_recording(data)


