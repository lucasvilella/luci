"""
Provedor de Áudio YouTube Music (Extração de Stream via yt-dlp).
"""

import asyncio
from typing import Dict, Any, Optional
import yt_dlp

from app.core.cache import AsyncTTLCache
from app.services.music_providers.base import AudioSourceProvider

stream_url_cache = AsyncTTLCache(default_ttl_seconds=3600 * 4)  # 4 horas

class YTMusicAudioProvider(AudioSourceProvider):
    def __init__(self):
        self.ydl_opts = {
            'format': 'bestaudio/best',
            'quiet': True,
            'no_warnings': True,
            'noplaylist': True,
            'extract_flat': False,
            'cachedir': False,
            'source_address': '0.0.0.0',
            'extractor_args': {
                'youtube': {
                    'player_client': ['android', 'web'],
                    'player_skip': ['webpage', 'configs', 'js'],
                }
            },
            'http_headers': {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Sec-Fetch-Mode': 'navigate',
            }
        }

    @property
    def name(self) -> str:
        return "ytmusic_stream"

    async def resolve_stream(self, track_id: str, title: Optional[str] = None, artist: Optional[str] = None) -> Dict[str, Any]:
        """Extrai o melhor stream de áudio Opus/WebM ou AAC para reprodução sem travamentos."""
        clean_id = track_id
        if clean_id.startswith("mb_") and title:
            # Caso receba um ID do MusicBrainz, o caller deve ter feito o matching ou faremos busca pelo nome
            clean_id = f"ytsearch1:{title} {artist or ''}"

        cached = stream_url_cache.get(clean_id)
        if cached:
            return cached

        loop = asyncio.get_running_loop()

        def _extract():
            target = clean_id if clean_id.startswith("ytsearch") else f"https://www.youtube.com/watch?v={clean_id}"
            with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                info = ydl.extract_info(target, download=False)
                if "entries" in info:
                    info = info["entries"][0]
                
                audio_url = info.get("url")
                format_note = info.get("format_note", "best")
                ext = info.get("ext", "webm")
                abr = info.get("abr") or info.get("tbr")
                mime_type = "audio/webm; codecs=\"opus\"" if ext == "webm" else "audio/mp4"

                return {
                    "stream_url": audio_url,
                    "format": format_note,
                    "ext": ext,
                    "mime_type": mime_type,
                    "bitrate_kbps": int(abr) if abr else None,
                    "title": info.get("title"),
                    "artist": info.get("uploader"),
                    "duration": info.get("duration"),
                    "http_headers": info.get("http_headers", {}),
                    "provider": self.name
                }

        data = await loop.run_in_executor(None, _extract)
        stream_url_cache.set(clean_id, data)
        return data
