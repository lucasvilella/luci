"""
Provedor de Metadados YouTube Music (InnerTube / ytmusicapi).
"""

import asyncio
import re
from typing import Dict, Any, Optional, List
from ytmusicapi import YTMusic

from app.services.music_providers.base import MetadataProvider

class YTMusicMetadataProvider(MetadataProvider):
    def __init__(self):
        try:
            self.ytm = YTMusic()
        except Exception as e:
            print(f"[YTMusicMetadataProvider] Aviso ao inicializar YTMusic: {e}")
            self.ytm = None

    @property
    def name(self) -> str:
        return "ytmusic"

    def format_track(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Padroniza o objeto de música."""
        track_id = raw.get("videoId") or raw.get("id") or ""
        title = raw.get("title") or "Sem Título"
        
        # Artistas
        artists = raw.get("artists") or []
        artist_name = ""
        artist_id = ""

        if isinstance(artists, list) and artists:
            valid_names = [a.get("name", "") for a in artists if isinstance(a, dict) and a.get("name")]
            if valid_names:
                artist_name = ", ".join(valid_names)
            artist_id = artists[0].get("id", "") if isinstance(artists[0], dict) else ""
        elif isinstance(artists, str) and artists.strip():
            artist_name = artists.strip()

        if not artist_name or artist_name.lower() in ["artista desconhecido", "desconhecido", "unknown"]:
            if raw.get("artist"):
                artist_name = str(raw.get("artist"))
            elif raw.get("uploader"):
                artist_name = str(raw.get("uploader"))
            elif raw.get("author"):
                artist_name = str(raw.get("author"))
            elif raw.get("subtitle"):
                sub = str(raw.get("subtitle")).split("•")[0].strip()
                if sub: artist_name = sub

        if artist_name.endswith(" - Topic"):
            artist_name = artist_name.replace(" - Topic", "").strip()

        if not artist_name:
            artist_name = "Artista"

        # Álbum
        album = raw.get("album")
        album_name = album.get("name", "") if isinstance(album, dict) else (str(album) if album else "")

        # Thumbnail
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
            "durationFormatted": f"{int(duration)//60}:{int(duration)%60:02d}",
            "provider": self.name,
            "external_ids": {"youtube_video_id": track_id}
        }

    async def search(self, query: str, limit: int = 20, filter_type: Optional[str] = None) -> Dict[str, Any]:
        if not self.ytm or not query.strip():
            return {"songs": [], "artists": [], "albums": [], "playlists": []}

        loop = asyncio.get_running_loop()
        
        def _execute():
            if filter_type in ["songs", "artists", "albums", "playlists"]:
                results = self.ytm.search(query, filter=filter_type, limit=limit)
                return {filter_type: results}
            else:
                songs_res = self.ytm.search(query, filter="songs", limit=limit)
                all_res = self.ytm.search(query, limit=limit)
                categorized = {"songs": songs_res, "artists": [], "albums": [], "playlists": []}
                for r in all_res:
                    category = r.get("resultType")
                    if category == "artist":
                        categorized["artists"].append(r)
                    elif category == "album":
                        categorized["albums"].append(r)
                    elif category == "playlist":
                        categorized["playlists"].append(r)
                return categorized

        raw = await loop.run_in_executor(None, _execute)

        return {
            "songs": [self.format_track(s) for s in raw.get("songs", []) if s.get("videoId")],
            "artists": [
                {
                    "id": a.get("browseId", ""),
                    "name": a.get("artist", "") or a.get("name", ""),
                    "thumbnail": (a.get("thumbnails") or [{}])[-1].get("url", "")
                }
                for a in raw.get("artists", []) if a.get("browseId")
            ],
            "albums": [
                {
                    "id": alb.get("browseId", ""),
                    "title": alb.get("title", ""),
                    "artist": alb.get("artist", "") or (alb.get("artists") or [{}])[0].get("name", ""),
                    "year": alb.get("year", ""),
                    "thumbnail": (alb.get("thumbnails") or [{}])[-1].get("url", "")
                }
                for alb in raw.get("albums", []) if alb.get("browseId")
            ],
            "playlists": [
                {
                    "id": p.get("browseId", ""),
                    "title": p.get("title", ""),
                    "author": p.get("author", ""),
                    "itemCount": p.get("itemCount", ""),
                    "thumbnail": (p.get("thumbnails") or [{}])[-1].get("url", "")
                }
                for p in raw.get("playlists", []) if p.get("browseId")
            ]
        }

    async def get_track_metadata(self, track_id: str) -> Optional[Dict[str, Any]]:
        if not self.ytm or not track_id:
            return None
        loop = asyncio.get_running_loop()
        def _get():
            try:
                watch = self.ytm.get_watch_playlist(videoId=track_id, limit=1)
                tracks = watch.get("tracks", [])
                if tracks:
                    return self.format_track(tracks[0])
            except Exception:
                pass
            return None
        return await loop.run_in_executor(None, _get)
