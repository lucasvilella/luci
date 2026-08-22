"""
Serviço Principal do LuciMusic — Arquitetura e Funcionamento idênticos ao SimpMusic (v1.7.0).
Orquestração de YouTube Music (InnerTube), Proxy de Áudio Direto (yt-dlp),
Letras Sincronizadas (LRCLIB), Fila Infinita e Motor Daily Mix (Spotify Style).
"""

import asyncio
import time
import re
import urllib.parse
from typing import List, Dict, Any, Optional
import httpx
from ytmusicapi import YTMusic
import yt_dlp

from app.core.cache import AsyncTTLCache
from app.database.music_db import MusicDatabase

# Caches em memória de alta performance
stream_url_cache = AsyncTTLCache(default_ttl_seconds=3600 * 4) # 4 horas
lyrics_cache = AsyncTTLCache(default_ttl_seconds=3600 * 24)     # 24 horas
home_feed_cache = AsyncTTLCache(default_ttl_seconds=1800)       # 30 minutos

class LuciMusicService:
    def __init__(self):
        try:
            self.ytm = YTMusic()
        except Exception as e:
            print(f"[LuciMusic] Aviso ao inicializar YTMusic: {e}")
            self.ytm = None

    def _format_track(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Padroniza o objeto de música garantindo compatibilidade com o SimpMusic."""
        track_id = raw.get("videoId") or raw.get("id") or ""
        title = raw.get("title") or "Sem Título"
        
        # Artistas
        artists = raw.get("artists") or []
        if isinstance(artists, list):
            artist_name = ", ".join([a.get("name", "") for a in artists if isinstance(a, dict)]) or "Artista Desconhecido"
            artist_id = artists[0].get("id", "") if artists and isinstance(artists[0], dict) else ""
        else:
            artist_name = str(artists)
            artist_id = ""

        # Álbum
        album = raw.get("album")
        album_name = album.get("name", "") if isinstance(album, dict) else (str(album) if album else "")

        # Thumbnail (SimpMusic Style: Alta resolução com fallback HQ garantido)
        thumbnails = raw.get("thumbnails") or []
        thumbnail = ""
        if isinstance(thumbnails, list) and thumbnails:
            thumbnail = thumbnails[-1].get("url", "")
            if thumbnail.startswith("//"):
                thumbnail = f"https:{thumbnail}"
            if "googleusercontent.com" in thumbnail:
                thumbnail = re.sub(r'=w\d+-h\d+.*', '=w500-h500-l90-rj', thumbnail)
        elif raw.get("thumbnail"):
            thumbnail = str(raw.get("thumbnail"))
            if thumbnail.startswith("//"):
                thumbnail = f"https:{thumbnail}"

        if (not thumbnail or not thumbnail.startswith("http")) and track_id:
            thumbnail = f"https://i.ytimg.com/vi/{track_id}/hqdefault.jpg"

        # Duração em segundos
        duration = raw.get("duration_seconds")
        if duration is None:
            dur_str = raw.get("duration") or "0:00"
            parts = str(dur_str).split(":")
            try:
                if len(parts) == 2:
                    duration = int(parts[0]) * 60 + int(parts[1])
                elif len(parts) == 3:
                    duration = int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
                else:
                    duration = 0
            except ValueError:
                duration = 0

        return {
            "id": track_id,
            "title": title,
            "artist": artist_name,
            "artistId": artist_id,
            "album": album_name,
            "thumbnail": thumbnail,
            "duration": int(duration),
            "durationFormatted": f"{int(duration)//60}:{int(duration)%60:02d}"
        }

    # ─── 1. Extração e Proxy de Áudio (yt-dlp) ───
    async def get_stream_url(self, track_id: str) -> Dict[str, Any]:
        """Extrai o melhor stream de áudio Opus/WebM ou AAC para reprodução proxy sem bloqueios."""
        cached = stream_url_cache.get(track_id)
        if cached:
            return cached

        loop = asyncio.get_running_loop()

        def _extract():
            ydl_opts = {
                'format': 'bestaudio[ext=webm]/bestaudio[ext=m4a]/bestaudio/best',
                'quiet': True,
                'no_warnings': True,
                'noplaylist': True,
                'extract_flat': False,
                'cachedir': False,
            }
            yt_url = f"https://www.youtube.com/watch?v={track_id}"
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(yt_url, download=False)
                audio_url = info.get("url")
                format_note = info.get("format_note", "best")
                ext = info.get("ext", "webm")
                mime_type = "audio/webm; codecs=\"opus\"" if ext == "webm" else "audio/mp4"
                return {
                    "stream_url": audio_url,
                    "format": format_note,
                    "ext": ext,
                    "mime_type": mime_type,
                    "title": info.get("title"),
                    "artist": info.get("uploader"),
                    "duration": info.get("duration")
                }

        data = await loop.run_in_executor(None, _extract)
        stream_url_cache.set(track_id, data)
        return data

    # ─── 2. Busca Global ───
    async def search(self, query: str, filter_type: Optional[str] = None) -> Dict[str, Any]:
        """Busca estruturada por Músicas, Artistas, Álbuns e Playlists."""
        if not self.ytm or not query.strip():
            return {"songs": [], "artists": [], "albums": [], "playlists": []}

        loop = asyncio.get_running_loop()
        
        def _execute_search():
            if filter_type in ["songs", "artists", "albums", "playlists"]:
                results = self.ytm.search(query, filter=filter_type, limit=25)
                return {filter_type: results}
            else:
                results = self.ytm.search(query, limit=30)
                categorized = {"songs": [], "artists": [], "albums": [], "playlists": []}
                for r in results:
                    category = r.get("resultType")
                    if category in ["song", "video"]:
                        categorized["songs"].append(r)
                    elif category == "artist":
                        categorized["artists"].append(r)
                    elif category == "album":
                        categorized["albums"].append(r)
                    elif category == "playlist":
                        categorized["playlists"].append(r)
                return categorized

        raw_results = await loop.run_in_executor(None, _execute_search)

        return {
            "songs": [self._format_track(s) for s in raw_results.get("songs", []) if s.get("videoId")],
            "artists": [
                {
                    "id": a.get("browseId", ""),
                    "name": a.get("artist", "") or a.get("name", ""),
                    "thumbnail": (a.get("thumbnails") or [{}])[-1].get("url", "")
                }
                for a in raw_results.get("artists", []) if a.get("browseId")
            ],
            "albums": [
                {
                    "id": alb.get("browseId", ""),
                    "title": alb.get("title", ""),
                    "artist": alb.get("artist", "") or (alb.get("artists") or [{}])[0].get("name", ""),
                    "year": alb.get("year", ""),
                    "thumbnail": (alb.get("thumbnails") or [{}])[-1].get("url", "")
                }
                for alb in raw_results.get("albums", []) if alb.get("browseId")
            ],
            "playlists": [
                {
                    "id": p.get("browseId", ""),
                    "title": p.get("title", ""),
                    "author": p.get("author", ""),
                    "itemCount": p.get("itemCount", ""),
                    "thumbnail": (p.get("thumbnails") or [{}])[-1].get("url", "")
                }
                for p in raw_results.get("playlists", []) if p.get("browseId")
            ]
        }

    # ─── 3. Letras Sincronizadas (LRCLIB) ───
    async def get_lyrics(self, track_id: str, title: str, artist: str, duration: int = 0) -> Dict[str, Any]:
        """Busca letras sincronizadas em tempo real via LRCLIB com timestamps formatados."""
        cache_key = f"lyrics_{track_id}"
        cached = lyrics_cache.get(cache_key)
        if cached:
            return cached

        clean_title = re.sub(r'\(.*?\)|\[.*?\]|feat\..*|ft\..*|official.*|video.*', '', title, flags=re.IGNORECASE).strip()
        clean_artist = re.sub(r'\(.*?\)|\[.*?\]', '', artist).split(',')[0].strip()

        params = {
            "track_name": clean_title,
            "artist_name": clean_artist,
        }
        if duration > 0:
            params["duration"] = str(duration)

        async with httpx.AsyncClient(timeout=6.0) as client:
            try:
                res = await client.get("https://lrclib.net/api/get", params=params)
                if res.status_code == 200:
                    data = res.json()
                    synced_lrc = data.get("syncedLyrics")
                    plain_lyrics = data.get("plainLyrics")
                    
                    parsed_lines = []
                    if synced_lrc:
                        for line in synced_lrc.strip().split("\n"):
                            match = re.match(r'\[(\d{2}):(\d{2}\.\d{2,3})\](.*)', line)
                            if match:
                                mins = int(match.group(1))
                                secs = float(match.group(2))
                                text_content = match.group(3).strip()
                                total_secs = mins * 60 + secs
                                parsed_lines.append({
                                    "time": total_secs,
                                    "timeFormatted": f"{mins:02d}:{int(secs):02d}",
                                    "text": text_content
                                })

                    result = {
                        "has_synced": bool(synced_lrc),
                        "synced_lrc": synced_lrc,
                        "lines": parsed_lines,
                        "plain": plain_lyrics or "Letra não disponível."
                    }
                    lyrics_cache.set(cache_key, result)
                    return result
            except Exception as e:
                print(f"[LuciMusic] Erro ao buscar letras: {e}")

        fallback = {
            "has_synced": False,
            "synced_lrc": None,
            "lines": [],
            "plain": "Letra sincronizada não encontrada para esta faixa."
        }
        return fallback

    # ─── 4. Fila Automática / Rádio Infinita (SimpMusic Style) ───
    async def get_radio_tracks(self, track_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Gera faixas recomendadas para a fila infinita (Watch Playlist)."""
        if not self.ytm:
            return []

        loop = asyncio.get_running_loop()

        def _get_watch():
            try:
                watch = self.ytm.get_watch_playlist(videoId=track_id, limit=limit)
                return watch.get("tracks", [])
            except Exception:
                return []

        raw_tracks = await loop.run_in_executor(None, _get_watch)
        formatted = [self._format_track(t) for t in raw_tracks if t.get("videoId") and t.get("videoId") != track_id]
        return formatted[:limit]

    # ─── 5. Detalhes do Artista ───
    async def get_artist_page(self, artist_id: str) -> Dict[str, Any]:
        """Obtém top músicas e álbuns do artista."""
        if not self.ytm:
            return {"name": "", "top_tracks": [], "albums": []}

        loop = asyncio.get_running_loop()

        def _fetch_artist():
            try:
                artist_data = self.ytm.get_artist(artist_id)
                top_tracks = [self._format_track(t) for t in (artist_data.get("songs", {}).get("results") or [])]
                albums = [
                    {
                        "id": a.get("browseId"),
                        "title": a.get("title"),
                        "year": a.get("year"),
                        "thumbnail": (a.get("thumbnails") or [{}])[-1].get("url", "")
                    }
                    for a in (artist_data.get("albums", {}).get("results") or [])
                ]
                return {
                    "id": artist_id,
                    "name": artist_data.get("name", "Artista"),
                    "description": artist_data.get("description", ""),
                    "thumbnail": (artist_data.get("thumbnails") or [{}])[-1].get("url", ""),
                    "top_tracks": top_tracks,
                    "albums": albums
                }
            except Exception as e:
                print(f"[LuciMusic] Erro get_artist: {e}")
                return {"id": artist_id, "name": "Artista", "top_tracks": [], "albums": []}

        return await loop.run_in_executor(None, _fetch_artist)

    # ─── 6. Motor "Daily Mix" (Spotify Style) ───
    async def generate_daily_mixes(self, user_id: str) -> List[Dict[str, Any]]:
        """Gera 4 listas personalizadas 'Mix Diário' baseadas no uso real."""
        top_artists = MusicDatabase.get_top_artists(user_id, limit=4)
        
        default_mix_seeds = [
            {"title": "Mix Diário 1", "genre": "Indie Pop & Alternative Rock", "query": "The Neighbourhood Arctic Monkeys Gorillaz", "color": "from-purple-900 to-indigo-950"},
            {"title": "Mix Diário 2", "genre": "MPB, Bossa & Brasilidades", "query": "Tim Maia Jorge Ben Jor Djavan Chico Buarque", "color": "from-amber-900 to-yellow-950"},
            {"title": "Mix Diário 3", "genre": "Lofi Beats & Foco", "query": "Lofi hip hop beats to study relax focus", "color": "from-emerald-900 to-teal-950"},
            {"title": "Mix Diário 4", "genre": "Pop Internacional & R&B", "query": "The Weeknd Dua Lipa Bruno Mars SZA", "color": "from-rose-900 to-pink-950"},
        ]

        mixes = []
        loop = asyncio.get_running_loop()

        for idx, seed in enumerate(default_mix_seeds):
            if idx < len(top_artists) and top_artists[idx].get("artist"):
                anchor_artist = top_artists[idx]["artist"]
                mix_title = f"Mix Diário {idx + 1}"
                search_query = f"{anchor_artist} radio mix"
                subtitle = f"{anchor_artist} e artistas semelhantes"
            else:
                mix_title = seed["title"]
                search_query = seed["query"]
                subtitle = seed["genre"]

            def _get_mix_tracks(q=search_query):
                try:
                    res = self.ytm.search(q, filter="songs", limit=15)
                    return [self._format_track(t) for t in res if t.get("videoId")]
                except Exception:
                    return []

            tracks = await loop.run_in_executor(None, _get_mix_tracks)
            thumb = tracks[0]["thumbnail"] if tracks else ""
            mixes.append({
                "id": f"daily_mix_{idx + 1}",
                "title": mix_title,
                "subtitle": subtitle,
                "gradient": seed["color"],
                "thumbnail": thumb,
                "tracks": tracks
            })

        return mixes

    # ─── 7. Feed da Tela Inicial ───
    async def get_home_feed(self, user_id: str) -> Dict[str, Any]:
        """Feed completo da Home (Mix Diários, Tocadas Recentemente, Em Alta no Brasil) com Cache."""
        cache_key = f"home_feed_{user_id}"
        cached = home_feed_cache.get(cache_key)
        if cached:
            cached["recently_played"] = MusicDatabase.get_history(user_id, limit=10)
            cached["liked_preview"] = MusicDatabase.get_liked_songs(user_id, limit=10)
            return cached

        daily_mixes = await self.generate_daily_mixes(user_id)
        history = MusicDatabase.get_history(user_id, limit=10)
        liked_songs = MusicDatabase.get_liked_songs(user_id, limit=10)

        loop = asyncio.get_running_loop()
        def _get_charts():
            try:
                res = self.ytm.search("Top Brasil 2026 Hits", filter="songs", limit=12)
                return [self._format_track(t) for t in res if t.get("videoId")]
            except Exception:
                return []

        trending = await loop.run_in_executor(None, _get_charts)

        feed_data = {
            "daily_mixes": daily_mixes,
            "recently_played": history,
            "liked_preview": liked_songs,
            "trending_brasil": trending
        }
        home_feed_cache.set(cache_key, feed_data)
        return feed_data

# Instância Singleton
lucimusic_service = LuciMusicService()
