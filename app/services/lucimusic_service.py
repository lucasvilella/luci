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
        artist_name = ""
        artist_id = ""

        if isinstance(artists, list) and artists:
            valid_names = [a.get("name", "") for a in artists if isinstance(a, dict) and a.get("name")]
            if valid_names:
                artist_name = ", ".join(valid_names)
            artist_id = artists[0].get("id", "") if isinstance(artists[0], dict) else ""
        elif isinstance(artists, str) and artists.strip():
            artist_name = artists.strip()

        # Fallbacks caso o ytmusicapi venha em outro formato (ex: uploader, artist, author, subtitle)
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

        # Remove sufixo - Topic se houver
        if artist_name.endswith(" - Topic"):
            artist_name = artist_name.replace(" - Topic", "").strip()

        if not artist_name:
            artist_name = "Artista"

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
                # Quando busca global, traz músicas oficiais com filtro songs + artistas
                songs_res = self.ytm.search(query, filter="songs", limit=20)
                all_res = self.ytm.search(query, limit=20)
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
        """Obtém top músicas e álbuns do artista com fallback inteligente e cache rápido."""
        if not self.ytm:
            return {"name": "", "top_tracks": [], "albums": []}

        loop = asyncio.get_running_loop()

        def _fetch_artist():
            target_id = artist_id
            artist_data = {}

            # 1. Se o ID não parece um Channel ID (UC...), busca pelo nome para obter o browseId oficial
            if not target_id.startswith("UC") and not target_id.startswith("MPLA"):
                try:
                    search_res = self.ytm.search(target_id, filter="artists", limit=1)
                    if search_res and search_res[0].get("browseId"):
                        target_id = search_res[0]["browseId"]
                except Exception as ex:
                    print(f"[LuciMusic] Busca de browseId por nome falhou ({target_id}): {ex}")

            # 2. Tenta obter o perfil oficial do artista pelo browseId
            try:
                artist_data = self.ytm.get_artist(target_id)
            except Exception as e:
                print(f"[LuciMusic] get_artist direto falhou para {target_id}: {e}")

            top_tracks = [self._format_track(t) for t in (artist_data.get("songs", {}).get("results") or [])]
            albums = [
                {
                    "id": a.get("browseId") or a.get("audioPlaylistId"),
                    "title": a.get("title"),
                    "year": a.get("year") or "Álbum",
                    "thumbnail": (a.get("thumbnails") or [{}])[-1].get("url", "")
                }
                for a in (artist_data.get("albums", {}).get("results") or [])
            ]

            # Se ainda faltam faixas ou álbuns, faz buscas complementares
            if not top_tracks:
                try:
                    song_res = self.ytm.search(artist_id, filter="songs", limit=15)
                    top_tracks = [self._format_track(t) for t in song_res if t.get("videoId")]
                except Exception as ex:
                    print(f"[LuciMusic] Fallback de músicas falhou: {ex}")

            if not albums:
                try:
                    alb_res = self.ytm.search(artist_id, filter="albums", limit=10)
                    albums = [
                        {
                            "id": a.get("browseId") or a.get("audioPlaylistId"),
                            "title": a.get("title"),
                            "year": a.get("year") or "Álbum",
                            "thumbnail": (a.get("thumbnails") or [{}])[-1].get("url", "")
                        }
                        for a in alb_res if a.get("browseId")
                    ]
                except Exception as ex:
                    print(f"[LuciMusic] Fallback de álbuns falhou: {ex}")

            name = artist_data.get("name") or artist_id
            thumb = (artist_data.get("thumbnails") or [{}])[-1].get("url", "")
            if not thumb and top_tracks:
                thumb = top_tracks[0].get("thumbnail", "")

            return {
                "id": target_id,
                "name": name,
                "description": artist_data.get("description", ""),
                "thumbnail": thumb,
                "top_tracks": top_tracks,
                "albums": albums
            }

        return await loop.run_in_executor(None, _fetch_artist)

    # ─── 5.1 Detalhes do Álbum (Faixas, Data de Lançamento, Mais do Artista e Você Também Pode Gostar) ───
    async def get_album_details(self, album_id: str, title: Optional[str] = None, artist: Optional[str] = None) -> Dict[str, Any]:
        """Obtém os detalhes completos de um álbum, suas músicas, data de lançamento e recomendações."""
        loop = asyncio.get_running_loop()

        def _fetch_album():
            album_data = {}
            tracks = []
            album_title = title or "Álbum"
            artist_name = artist or ""
            thumb = ""
            year = "2024"
            artist_thumb = ""

            # 1. Tenta buscar direto pelo browseId no YouTube Music
            if album_id and album_id.startswith("MPRE") or album_id.startswith("OLAK"):
                try:
                    album_data = self.ytm.get_album(album_id)
                    album_title = album_data.get("title") or album_title
                    year = album_data.get("year") or str(album_data.get("releaseDate", {}).get("year", "2024"))
                    thumb = (album_data.get("thumbnails") or [{}])[-1].get("url", "")
                    if album_data.get("artists"):
                        artist_name = album_data["artists"][0].get("name") or artist_name
                    
                    raw_tracks = album_data.get("tracks") or []
                    for t in raw_tracks:
                        if t.get("videoId"):
                            tracks.append(self._format_track(t))
                except Exception as e:
                    print(f"[LuciMusic] get_album direto falhou: {e}")

            # 2. Se não encontrou faixas pelo ID, busca as músicas pelo nome do álbum + artista
            if not tracks:
                clean_title = (album_title or "").replace("&", " ").replace("•", " ").strip()
                clean_artist = (artist_name or "").replace("&", " ").replace("•", " ").strip()
                search_query = f"{clean_title} {clean_artist}".strip()
                try:
                    res = self.ytm.search(search_query, filter="songs", limit=16)
                    for t in res:
                        if t.get("videoId"):
                            tracks.append(self._format_track(t))
                except Exception as ex:
                    print(f"[LuciMusic] Busca de faixas do álbum falhou: {ex}")

            # Foto do artista
            try:
                if artist_name:
                    art_search = self.ytm.search(artist_name, filter="artists", limit=1)
                    if art_search:
                        artist_thumb = (art_search[0].get("thumbnails") or [{}])[-1].get("url", "")
            except Exception:
                pass

            if not artist_thumb and tracks:
                artist_thumb = tracks[0].get("thumbnail", "")

            # 3. Mais do mesmo Artista (outros álbuns ou faixas)
            more_from_artist = []
            try:
                if artist_name:
                    art_albums = self.ytm.search(f"{artist_name} album", filter="albums", limit=4)
                    for alb in art_albums:
                        if alb.get("browseId") != album_id:
                            more_from_artist.append({
                                "id": alb.get("browseId") or alb.get("title"),
                                "title": alb.get("title"),
                                "artist": artist_name,
                                "year": alb.get("year", "2024"),
                                "thumbnail": (alb.get("thumbnails") or [{}])[-1].get("url", "")
                            })
            except Exception:
                pass

            # 4. Você também pode gostar (outros álbuns populares de sertanejo/brasil)
            you_might_like = []
            try:
                rec_res = self.ytm.search("Sertanejo Ao Vivo Album Hits", filter="albums", limit=4)
                for alb in rec_res:
                    if alb.get("title") != album_title:
                        you_might_like.append({
                            "id": alb.get("browseId") or alb.get("title"),
                            "title": alb.get("title"),
                            "artist": alb.get("artist") or (alb.get("artists") or [{}])[0].get("name", "Vários"),
                            "year": alb.get("year", "2024"),
                            "thumbnail": (alb.get("thumbnails") or [{}])[-1].get("url", "")
                        })
            except Exception:
                pass

            return {
                "id": album_id,
                "title": album_title,
                "artist": artist_name,
                "artist_thumbnail": artist_thumb,
                "year": year,
                "thumbnail": thumb or (tracks[0]["thumbnail"] if tracks else ""),
                "tracks": tracks,
                "more_from_artist": more_from_artist,
                "you_might_like": you_might_like
            }

        return await loop.run_in_executor(None, _fetch_album)

    # ─── 6. Motor "Daily Mix" (Spotify Style — Atualização 1x ao dia às 00:01) ───
    async def generate_daily_mixes(self, user_id: str, force_refresh: bool = False) -> List[Dict[str, Any]]:
        """
        Gera 5 listas personalizadas 'Daily Mix' baseadas nas preferências reais do usuário.
        Regra: Gerado exatamente UMA vez ao dia às 00:01 e persistido no SQLite.
        Só gera novas atualizações após a virada para 00:01 do dia seguinte.
        """
        import datetime
        now = datetime.datetime.now()
        # Se for antes das 00:01, a chave pertence ao dia anterior
        if now.hour == 0 and now.minute == 0:
            active_date = (now - datetime.timedelta(days=1)).strftime("%Y-%m-%d")
        else:
            active_date = now.strftime("%Y-%m-%d")

        # 1. Checa se já temos o Daily Mix gerado para o dia de hoje no SQLite
        if not force_refresh:
            persisted_mixes = MusicDatabase.get_daily_mixes_cache(user_id, active_date)
            if persisted_mixes:
                return persisted_mixes

        top_artists = MusicDatabase.get_top_artists(user_id, limit=5)
        
        default_mix_seeds = [
            {
                "title": "Daily Mix 1",
                "genre": "Hugo & Guilherme, Clayton & Romário e George Henrique",
                "query": "Hugo e Guilherme Clayton e Romario George Henrique e Rodrigo Henrique e Juliano ao vivo",
                "color": "from-emerald-700 to-teal-950"
            },
            {
                "title": "Daily Mix 2",
                "genre": "Vitor e Luan, Panda, Ícaro e Gilmar e Fred Liel",
                "query": "Vitor e Luan Panda Icaro e Gilmar Humberto e Ronaldo Lauana Prado ao vivo",
                "color": "from-amber-700 to-orange-950"
            },
            {
                "title": "Daily Mix 3",
                "genre": "MC Kako, MC Tuto, MC Don Juan e DJ BOY",
                "query": "MC Kako MC Tuto MC Don Juan MC Magal DJ BOY Rashid funk consciente",
                "color": "from-purple-700 to-indigo-950"
            },
            {
                "title": "Daily Mix 4",
                "genre": "Belchior, Jorge Vercillo, Liniker e Secos & Molhados",
                "query": "Belchior Jorge Vercillo Liniker Secos e Molhados Zé Ramalho Vanessa da Mata MPB",
                "color": "from-rose-700 to-red-950"
            },
            {
                "title": "Daily Mix 5",
                "genre": "Felipe e Rodrigo, Murilo Huff, Diego & Victor Hugo e Thauane",
                "query": "Felipe e Rodrigo Murilo Huff Diego e Victor Hugo Matheus e Kauan Jorge e Mateus",
                "color": "from-blue-700 to-slate-950"
            },
        ]

        mixes = []
        loop = asyncio.get_running_loop()

        for idx, seed in enumerate(default_mix_seeds):
            if idx < len(top_artists) and top_artists[idx].get("artist"):
                anchor_artist = top_artists[idx]["artist"]
                mix_title = f"Daily Mix {idx + 1}"
                search_query = f"{anchor_artist} {seed['query']}"
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

        # Salva no SQLite com a chave do dia (mantém até as 00:01 do dia seguinte)
        if mixes:
            MusicDatabase.save_daily_mixes_cache(user_id, active_date, mixes)

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

        # ─── Seção Especial: Criado pela Luci (IA Contextual) ───
        ai_playlists = MusicDatabase.get_user_playlists(user_id)
        created_by_luci = [p for p in ai_playlists if p.get("is_ai_generated")]

        # Se não houver nenhuma salva ainda no banco, gera mixes temáticos com a assinatura da Luci
        if not created_by_luci:
            created_by_luci = [
                {
                    "id": "luci_focus_mix",
                    "title": "Foco Imersivo da Luci",
                    "subtitle": "Curadoria inteligente baseada nas suas conversas",
                    "gradient": "from-emerald-600 to-teal-900",
                    "tracks_count": 15,
                    "is_ai_generated": 1,
                    "thumbnail": "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&q=80"
                },
                {
                    "id": "luci_night_chill",
                    "title": "Desaceleração Noturna",
                    "subtitle": "Seleção calma para o fim do seu dia",
                    "gradient": "from-indigo-600 to-purple-950",
                    "tracks_count": 12,
                    "is_ai_generated": 1,
                    "thumbnail": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80"
                },
                {
                    "id": "luci_workout_energy",
                    "title": "Energia Pura do Lucas",
                    "subtitle": "Batidas para acelerar o seu ritmo",
                    "gradient": "from-orange-600 to-red-950",
                    "tracks_count": 18,
                    "is_ai_generated": 1,
                    "thumbnail": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&q=80"
                }
            ]

        # ─── 1. Novos Lançamentos em Alta ───
        def _get_new_releases():
            try:
                res = self.ytm.search("Novos Lançamentos 2026 Hits", filter="songs", limit=12)
                return [self._format_track(t) for t in res if t.get("videoId")]
            except Exception:
                return []

        # ─── 2. Playlists com Artistas Semelhantes (Com base no que você ouviu) ───
        def _get_similarity_playlists():
            seeds = [
                {"title": "Resenha Sertaneja & Modão", "query": "Clayton e Romario Hugo e Guilherme Mayke e Rodrigo ao vivo", "color": "from-amber-600 to-yellow-900"},
                {"title": "Trap & Funk de Rua", "query": "MC Kako MC Tuto DJ BOY Matue Cabelinho", "color": "from-purple-600 to-indigo-900"},
                {"title": "Poesia & Brasilidades", "query": "Belchior Jorge Vercillo Liniker Secos e Molhados MPB", "color": "from-teal-600 to-emerald-950"},
                {"title": "Sertanejo Apaixonado", "query": "Felipe e Rodrigo Murilo Huff Matheus e Kauan Jorge e Mateus", "color": "from-rose-600 to-red-950"},
            ]
            results = []
            for s in seeds:
                try:
                    res = self.ytm.search(s["query"], filter="songs", limit=15)
                    tracks = [self._format_track(t) for t in res if t.get("videoId")]
                    thumb = tracks[0]["thumbnail"] if tracks else ""
                    results.append({
                        "id": f"similar_{s['title'].lower().replace(' ', '_')}",
                        "title": s["title"],
                        "subtitle": "Playlists com artistas semelhantes aos que você ouve",
                        "gradient": s["color"],
                        "thumbnail": thumb,
                        "tracks": tracks
                    })
                except Exception:
                    pass
            return results

        # ─── 3. Álbuns Favoritos (Álbuns dos artistas que você mais adora) ───
        def _get_favorite_albums():
            fav_artists = ["Hugo & Guilherme", "Clayton & Romário", "Murilo Huff", "Belchior", "Jorge Vercillo", "Felipe e Rodrigo"]
            albums_list = []
            for art in fav_artists:
                try:
                    res = self.ytm.search(f"{art} album", filter="albums", limit=1)
                    if res:
                        item = res[0]
                        thumb = (item.get("thumbnails") or [{}])[-1].get("url", "")
                        albums_list.append({
                            "id": item.get("browseId", ""),
                            "title": item.get("title", ""),
                            "artist": art,
                            "year": item.get("year", "2024"),
                            "thumbnail": thumb
                        })
                except Exception:
                    pass
            return albums_list

        trending = await loop.run_in_executor(None, _get_charts)
        new_releases = await loop.run_in_executor(None, _get_new_releases)
        based_on_listened = await loop.run_in_executor(None, _get_similarity_playlists)
        favorite_albums = await loop.run_in_executor(None, _get_favorite_albums)

        feed_data = {
            "created_by_luci": created_by_luci,
            "daily_mixes": daily_mixes,
            "recently_played": history,
            "liked_preview": liked_songs,
            "trending_brasil": trending,
            "new_releases": new_releases,
            "based_on_listened": based_on_listened,
            "favorite_albums": favorite_albums
        }
        home_feed_cache.set(cache_key, feed_data)
        return feed_data

    # ─── 8. Gêneros Dinâmicos com Artistas Reais em Alta (Rotativo) ───
    async def get_dynamic_genres(self) -> List[Dict[str, Any]]:
        """Gera a grade de gêneros rotativa com a foto oficial do artista em alta naquele gênero."""
        all_genres_pool = [
            {"name": "Sertanejo", "color": "bg-[#F59E0B]", "seed_artist": "Gusttavo Lima"},
            {"name": "Pop", "color": "bg-[#EA580C]", "seed_artist": "Dua Lipa"},
            {"name": "Funk Brasil", "color": "bg-[#8B5CF6]", "seed_artist": "MC Cabelinho"},
            {"name": "Indie & Rock", "color": "bg-[#D946EF]", "seed_artist": "Arctic Monkeys"},
            {"name": "R&B & Soul", "color": "bg-[#3B82F6]", "seed_artist": "The Weeknd"},
            {"name": "Eletrônica", "color": "bg-[#10B981]", "seed_artist": "Alok"},
            {"name": "Trap & Rap", "color": "bg-[#EF4444]", "seed_artist": "Matuê"},
            {"name": "Pagode & Samba", "color": "bg-[#06B6D4]", "seed_artist": "Menos É Mais"},
            {"name": "MPB & Acústico", "color": "bg-[#F97316]", "seed_artist": "Anavitória"},
            {"name": "K-Pop", "color": "bg-[#84CC16]", "seed_artist": "BTS"},
            {"name": "Lofi & Foco", "color": "bg-[#14B8A6]", "seed_artist": "Lofi Fruits Music"},
            {"name": "Reggaeton & Latino", "color": "bg-[#E11D48]", "seed_artist": "Bad Bunny"}
        ]

        # Rotaciona a lista dinamicamente por hora/dia para não ser fixo
        import time
        shift = int(time.time() // 3600) % len(all_genres_pool)
        rotated_pool = all_genres_pool[shift:] + all_genres_pool[:shift]
        selected_8 = rotated_pool[:8]

        loop = asyncio.get_running_loop()

        def _fetch_genre_artist(genre_item):
            try:
                # Busca artista oficial no ytmusicapi
                res = self.ytm.search(genre_item["seed_artist"], filter="artists", limit=1)
                if res and res[0].get("thumbnails"):
                    thumb = res[0]["thumbnails"][-1]["url"]
                    if "googleusercontent.com" in thumb:
                        thumb = re.sub(r'=w\d+-h\d+.*', '=w400-h400-l90-rj', thumb)
                    return {
                        "name": genre_item["name"],
                        "color": genre_item["color"],
                        "artist_name": res[0].get("artist", genre_item["seed_artist"]),
                        "image": thumb
                    }
            except Exception:
                pass
            return {
                "name": genre_item["name"],
                "color": genre_item["color"],
                "artist_name": genre_item["seed_artist"],
                "image": "https://i.ytimg.com/vi/hqdefault.jpg"
            }

        tasks = [loop.run_in_executor(None, _fetch_genre_artist, g) for g in selected_8]
        return await asyncio.gather(*tasks)

# Instância Singleton
lucimusic_service = LuciMusicService()

