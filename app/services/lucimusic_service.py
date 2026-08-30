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
artist_cache = AsyncTTLCache(default_ttl_seconds=3600 * 6)      # 6 horas
album_cache = AsyncTTLCache(default_ttl_seconds=3600 * 6)       # 6 horas

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

    # ─── 1. Extração e Proxy de Áudio (Delegado ao AudioSourceProvider) ───
    async def get_stream_url(self, track_id: str, title: Optional[str] = None, artist: Optional[str] = None) -> Dict[str, Any]:
        """Extrai o melhor stream de áudio via provedor de áudio plugável."""
        from app.services.music_providers import provider_registry
        return await provider_registry.resolve_audio_stream(track_id, title=title, artist=artist)

    # ─── 2. Busca Global (Delegada ao MetadataProvider com Fallback) ───
    async def search(self, query: str, filter_type: Optional[str] = None, limit: int = 20) -> Dict[str, Any]:
        """Busca estruturada através do registry plugável (MusicBrainz primário -> YT Music fallback)."""
        from app.services.music_providers import provider_registry
        return await provider_registry.search(query=query, limit=limit, filter_type=filter_type)

    # ─── 3. Letras Sincronizadas (LRCLIB com Busca Inteligente Cascata) ───
    async def get_lyrics(self, track_id: str, title: str, artist: str, duration: int = 0) -> Dict[str, Any]:
        """Busca letras sincronizadas em tempo real via LRCLIB com timestamps formatados e fallback inteligente."""
        clean_title = re.sub(r'\(.*?\)|\[.*?\]|feat\..*|ft\..*|official.*|video.*|ao vivo.*', '', title, flags=re.IGNORECASE).strip()
        clean_artist = re.sub(r'\(.*?\)|\[.*?\]', '', artist).split(',')[0].split('&')[0].split(' e ')[0].split('/')[0].strip()

        cache_key = f"lyrics_{track_id}_{clean_title}_{clean_artist}"
        cached = lyrics_cache.get(cache_key)
        if cached:
            return cached

        async with httpx.AsyncClient(timeout=6.0) as client:
            def _parse_lrc(data: Dict[str, Any]) -> Dict[str, Any]:
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
                elif plain_lyrics:
                    raw_lines = [l.strip() for l in plain_lyrics.strip().split("\n") if l.strip()]
                    if raw_lines and duration > 0:
                        step = max(2.5, (duration - 10) / len(raw_lines))
                        for idx, l in enumerate(raw_lines):
                            t = round(5.0 + idx * step, 1)
                            mins = int(t // 60)
                            secs = int(t % 60)
                            parsed_lines.append({
                                "time": t,
                                "timeFormatted": f"{mins:02d}:{secs:02d}",
                                "text": l
                            })

                return {
                    "has_synced": bool(synced_lrc),
                    "synced_lrc": synced_lrc,
                    "lines": parsed_lines,
                    "plain": plain_lyrics or "Letra não disponível."
                }

            # 1. Tentativa exata via /api/get
            try:
                params = {"track_name": clean_title, "artist_name": clean_artist}
                if duration > 0:
                    params["duration"] = str(duration)
                res = await client.get("https://lrclib.net/api/get", params=params)
                if res.status_code == 200:
                    result = _parse_lrc(res.json())
                    lyrics_cache.set(cache_key, result)
                    return result
            except Exception:
                pass

            # 2. Tentativa flexível via /api/search (query completa) com prioridade absoluta para letras sincronizadas (LRC)
            try:
                search_q = f"{clean_title} {clean_artist}".strip()
                res = await client.get("https://lrclib.net/api/search", params={"q": search_q})
                if res.status_code == 200:
                    items = res.json()
                    if isinstance(items, list) and items:
                        def _is_relevant(it: Dict[str, Any]) -> bool:
                            it_art = (it.get("artistName") or "").lower()
                            it_trk = (it.get("trackName") or "").lower()
                            first_art = clean_artist.lower().split()[0] if clean_artist else ""
                            first_trk = clean_title.lower().split()[0] if clean_title else ""
                            return (first_art in it_art or first_trk in it_trk)

                        valid_items = [it for it in items if _is_relevant(it)]
                        if valid_items:
                            # Prioriza item que tenha letras sincronizadas verdadeiras (syncedLyrics)
                            synced_item = next((it for it in valid_items if it.get("syncedLyrics")), None)
                            chosen = synced_item or valid_items[0]
                            result = _parse_lrc(chosen)
                            lyrics_cache.set(cache_key, result)
                            return result
            except Exception:
                pass

            # 3. Tratamento de medleys / pot-pourris separados por '/' ou '-'
            sub_titles = [s.strip() for s in re.split(r'[/\\-]', clean_title) if s.strip()]
            for sub_t in sub_titles:
                candidate_queries = [
                    f"{sub_t} {clean_artist}",
                    sub_t
                ]
                if sub_t.lower().startswith("sivel"):
                    candidate_queries.insert(0, f"Sensível {sub_t[5:].strip()} {clean_artist}")

                for q_try in candidate_queries:
                    try:
                        res = await client.get("https://lrclib.net/api/search", params={"q": q_try})
                        if res.status_code == 200:
                            items = res.json()
                            if isinstance(items, list) and items:
                                def _is_relevant_sub(it: Dict[str, Any]) -> bool:
                                    it_art = (it.get("artistName") or "").lower()
                                    first_art = clean_artist.lower().split()[0] if clean_artist else ""
                                    return first_art in it_art

                                valid = [it for it in items if _is_relevant_sub(it)]
                                if valid:
                                    synced_sub = next((it for it in valid if it.get("syncedLyrics")), valid[0])
                                    result = _parse_lrc(synced_sub)
                                    lyrics_cache.set(cache_key, result)
                                    return result
                    except Exception:
                        pass

        # 4. Provedor Secundário: YTMusic Official Lyrics (Letras Oficiais da Gravadora)
        try:
            from ytmusicapi import YTMusic
            yt = YTMusic()
            # Se já tivermos o videoId do YouTube
            watch_data = await asyncio.to_thread(yt.get_watch_playlist, videoId=track_id)
            lyrics_browse_id = watch_data.get("lyrics") if isinstance(watch_data, dict) else None

            if not lyrics_browse_id:
                # Tenta buscar a música pelo título e artista no YTMusic
                yt_results = await asyncio.to_thread(yt.search, f"{clean_title} {clean_artist}", filter="songs")
                if yt_results and yt_results[0].get("videoId"):
                    found_watch = await asyncio.to_thread(yt.get_watch_playlist, videoId=yt_results[0]["videoId"])
                    lyrics_browse_id = found_watch.get("lyrics") if isinstance(found_watch, dict) else None

            if lyrics_browse_id:
                yt_lyrics_data = await asyncio.to_thread(yt.get_lyrics, lyrics_browse_id)
                plain_yt = yt_lyrics_data.get("lyrics") if isinstance(yt_lyrics_data, dict) else None
                if plain_yt and plain_yt.strip():
                    raw_lines = [l.strip() for l in plain_yt.strip().split("\n") if l.strip()]
                    parsed_lines = []
                    if raw_lines and duration > 0:
                        step = max(2.5, (duration - 10) / len(raw_lines))
                        for idx, l in enumerate(raw_lines):
                            t = round(5.0 + idx * step, 1)
                            mins = int(t // 60)
                            secs = int(t % 60)
                            parsed_lines.append({
                                "time": t,
                                "timeFormatted": f"{mins:02d}:{secs:02d}",
                                "text": l
                            })

                    result = {
                        "has_synced": False,
                        "synced_lrc": None,
                        "lines": parsed_lines,
                        "plain": plain_yt
                    }
                    lyrics_cache.set(cache_key, result)
                    return result
        except Exception:
            pass

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

    def _safe_search(self, query: str, filter_type: Optional[str] = None, limit: int = 15) -> List[Dict[str, Any]]:
        """Executa buscas no YouTube Music com sanitização de caracteres especiais para evitar erros e lentidão."""
        if not self.ytm or not query:
            return []
        clean_q = re.sub(r'[&/\\#+()$~%."*?:;<>{}]', ' ', query)
        clean_q = ' '.join(clean_q.split()).strip()
        if not clean_q:
            return []
        try:
            return self.ytm.search(clean_q, filter=filter_type, limit=limit)
        except Exception as e:
            print(f"[LuciMusic] _safe_search erro ({clean_q}, {filter_type}): {e}")
            return []

    # ─── 5. Detalhes do Artista ───
    async def get_artist_page(self, artist_id: str) -> Dict[str, Any]:
        """Obtém top músicas e álbuns do artista com fallback inteligente e cache rápido."""
        if not self.ytm:
            return {"name": "", "top_tracks": [], "albums": []}

        cache_key = f"artist_page_{artist_id}"
        cached = artist_cache.get(cache_key)
        if cached:
            return cached

        loop = asyncio.get_running_loop()

        def _fetch_artist():
            target_id = artist_id
            artist_data = {}
            search_res_thumb = ""

            # 1. Se o ID não parece um Channel ID (UC...), busca pelo nome para obter o browseId oficial
            art_clean_name = artist_id
            if not target_id.startswith("UC") and not target_id.startswith("MPLA"):
                try:
                    search_res = self._safe_search(target_id, filter_type="artists", limit=1)
                    if search_res and search_res[0].get("browseId"):
                        target_id = search_res[0]["browseId"]
                        art_clean_name = search_res[0].get("artist") or search_res[0].get("name") or target_id
                        search_res_thumb = (search_res[0].get("thumbnails") or [{}])[-1].get("url", "")
                except Exception as ex:
                    print(f"[LuciMusic] Busca de browseId por nome falhou ({target_id}): {ex}")

            # 2. Tenta obter o perfil oficial do artista pelo browseId
            try:
                artist_data = self.ytm.get_artist(target_id)
                if artist_data.get("name"):
                    art_clean_name = artist_data["name"]
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
            singles = [
                {
                    "id": s.get("browseId") or s.get("audioPlaylistId"),
                    "title": s.get("title"),
                    "year": s.get("year") or "Single",
                    "thumbnail": (s.get("thumbnails") or [{}])[-1].get("url", "")
                }
                for s in (artist_data.get("singles", {}).get("results") or [])
            ]

            # Se temos menos de 10 faixas, busca as mais tocadas do artista pelo nome
            if len(top_tracks) < 10:
                song_res = self._safe_search(art_clean_name, filter_type="songs", limit=15)
                for s in song_res:
                    vid = s.get("videoId")
                    if vid and not any(t["id"] == vid for t in top_tracks):
                        top_tracks.append(self._format_track(s))
                    if len(top_tracks) >= 10:
                        break

            if not albums:
                alb_res = self._safe_search(art_clean_name, filter_type="albums", limit=10)
                albums = [
                    {
                        "id": a.get("browseId") or a.get("audioPlaylistId"),
                        "title": a.get("title"),
                        "year": a.get("year") or "Álbum",
                        "thumbnail": (a.get("thumbnails") or [{}])[-1].get("url", "")
                    }
                    for a in alb_res if a.get("browseId")
                ]

            # Artistas Semelhantes / Os Fãs Também Curtem
            similar_raw = (artist_data.get("related", {}).get("results") or [])
            similar_artists = []
            seen_sim_names = {art_clean_name.lower()}
            for sim in similar_raw:
                thumb = (sim.get("thumbnails") or [{}])[-1].get("url", "")
                name_val = sim.get("title") or sim.get("name") or sim.get("artist") or ""
                if name_val and name_val.lower() not in seen_sim_names:
                    seen_sim_names.add(name_val.lower())
                    similar_artists.append({
                        "id": sim.get("browseId") or name_val,
                        "name": name_val,
                        "thumbnail": thumb or "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300"
                    })

            # Se a API não retornou similares direto na seção related, busca artistas do mesmo gênero musical
            if len(similar_artists) < 3:
                try:
                    sim_search = self._safe_search(f"{art_clean_name}", filter_type="artists", limit=8)
                    for sim in sim_search:
                        sim_name = sim.get("artist") or sim.get("name") or ""
                        if sim.get("browseId") and sim_name and sim_name.lower() not in seen_sim_names:
                            seen_sim_names.add(sim_name.lower())
                            thumb = (sim.get("thumbnails") or [{}])[-1].get("url", "")
                            similar_artists.append({
                                "id": sim.get("browseId"),
                                "name": sim_name,
                                "thumbnail": thumb or "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300"
                            })
                except Exception:
                    pass

            name = artist_data.get("name") or art_clean_name
            thumb = ""
            if artist_data.get("thumbnails"):
                thumb = artist_data["thumbnails"][-1].get("url", "")
            elif search_res_thumb:
                thumb = search_res_thumb
            elif top_tracks:
                thumb = top_tracks[0].get("thumbnail", "")

            # Contadores de ouvintes / inscritos
            subscribers = artist_data.get("subscribers") or "2.4M inscritos"

            result = {
                "id": target_id,
                "name": name,
                "description": artist_data.get("description", ""),
                "thumbnail": thumb,
                "subscribers": subscribers,
                "monthly_listeners": "24,419,528 monthly listeners",
                "top_tracks": top_tracks[:10],
                "albums": albums,
                "singles": singles,
                "similar_artists": similar_artists[:8]
            }

            artist_cache.set(cache_key, result)
            return result

        return await loop.run_in_executor(None, _fetch_artist)

    # ─── 5.1 Detalhes do Álbum (Otimizado com Cache Rápido) ───
    async def get_album_details(self, album_id: str, title: Optional[str] = None, artist: Optional[str] = None) -> Dict[str, Any]:
        """Obtém os detalhes completos de um álbum e suas faixas com resposta ultra-rápida e cache."""
        cache_key = f"album_{album_id}_{title}_{artist}"
        cached = album_cache.get(cache_key)
        if cached:
            return cached

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
            if album_id and (album_id.startswith("MPRE") or album_id.startswith("OLAK")):
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

            # 2. Se não encontrou faixas pelo ID ou o ID era genérico, busca as músicas pelo nome
            if not tracks:
                search_query = f"{album_title} {artist_name}".strip()
                res = self._safe_search(search_query, filter_type="songs", limit=16)
                for t in res:
                    if t.get("videoId"):
                        tracks.append(self._format_track(t))

            if tracks:
                if not thumb:
                    thumb = tracks[0].get("thumbnail", "")
                artist_thumb = tracks[0].get("thumbnail", "")

            # 3. Mais do mesmo Artista (Rápido e não-bloqueante)
            more_from_artist = []
            if artist_name and len(artist_name) > 2:
                art_albums = self._safe_search(artist_name, filter_type="albums", limit=4)
                for alb in art_albums:
                    if alb.get("browseId") != album_id:
                        more_from_artist.append({
                            "id": alb.get("browseId") or alb.get("title"),
                            "title": alb.get("title"),
                            "artist": artist_name,
                            "year": alb.get("year", "2024"),
                            "thumbnail": (alb.get("thumbnails") or [{}])[-1].get("url", "")
                        })

            artist_id_resolved = ""
            if album_data and album_data.get("artists") and album_data["artists"][0].get("id"):
                artist_id_resolved = album_data["artists"][0]["id"]
            elif tracks and tracks[0].get("artistId"):
                artist_id_resolved = tracks[0]["artistId"]

            result = {
                "id": album_id,
                "title": album_title,
                "artist": artist_name,
                "artist_id": artist_id_resolved,
                "artist_thumbnail": artist_thumb,
                "year": year,
                "thumbnail": thumb,
            "tracks": tracks,
                "more_from_artist": more_from_artist,
                "you_might_like": []
            }

            album_cache.set(cache_key, result)
            return result

        return await loop.run_in_executor(None, _fetch_album)

    # ─── 6. Resolução de Sementes de Busca para Faixas e Playlists (Provider Puro) ───
    async def resolve_seeds_to_tracks(self, seeds: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Recebe sementes geradas pelo MusicIntelligenceEngine e busca as faixas reais
        correspondentes no YouTube Music, formatando cada item de forma padronizada.
        """
        if not self.ytm or not seeds:
            return []

        loop = asyncio.get_running_loop()

        def _search_seed(seed: Dict[str, Any]) -> Dict[str, Any]:
            query = seed.get("search_query") or seed.get("query") or seed.get("title", "")
            limit = seed.get("limit", 15)
            try:
                res = self.ytm.search(query, filter="songs", limit=limit)
                tracks = [self._format_track(t) for t in res if t.get("videoId")]
            except Exception as e:
                print(f"[LuciMusic Provider] Erro ao buscar semente '{query}': {e}")
                tracks = []

            thumb = tracks[0]["thumbnail"] if tracks else (seed.get("thumbnail") or "")
            return {
                "id": seed.get("id") or f"seed_{seed.get('title', '').lower().replace(' ', '_')}",
                "title": seed.get("title", "Mix"),
                "subtitle": seed.get("subtitle", ""),
                "gradient": seed.get("gradient", "from-emerald-700 to-teal-950"),
                "thumbnail": thumb,
                "is_fallback": seed.get("is_fallback", False),
                "tracks": tracks
            }

        tasks = [loop.run_in_executor(None, _search_seed, s) for s in seeds]
        return await asyncio.gather(*tasks)

    # ─── 7. Resolução da Curadoria Completa da Home ───
    async def resolve_home_curation(self, curation: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """
        Monta o feed completo da Home a partir das decisões tomadas pelo MusicIntelligenceEngine.
        O Provider apenas busca, formata e organiza os dados sem tomar decisões de gosto.
        """
        # 1. Janela de Atualização Periódica das Indicações (12:00 e 00:00)
        # Ex: "2026-08-27_00h" para 00:00-11:59 e "2026-08-27_12h" para 12:00-23:59
        import datetime
        now = datetime.datetime.now()
        curation_window_key = f"{now.strftime('%Y-%m-%d')}_{'12h' if now.hour >= 12 else '00h'}"
        cache_key = f"home_feed_{user_id}_{curation_window_key}"
        
        cached = home_feed_cache.get(cache_key)
        if cached:
            # Atualiza apenas histórico e curtidas imediatas em tempo real sem re-computar IA/APIs
            cached["recently_played"] = MusicDatabase.get_history(user_id, limit=10)
            cached["liked_preview"] = MusicDatabase.get_liked_songs(user_id, limit=10)
            return cached

        # 2. Daily Mix é fixo diário por data completa (Atualiza estritamente às 00:00)
        daily_mix_date_key = now.strftime("%Y-%m-%d")
        daily_mixes = MusicDatabase.get_daily_mixes_cache(user_id, daily_mix_date_key)
        if not daily_mixes:
            daily_mix_seeds = curation.get("daily_mix_seeds", [])
            daily_mixes = await self.resolve_seeds_to_tracks(daily_mix_seeds)
            if daily_mixes:
                MusicDatabase.save_daily_mixes_cache(user_id, daily_mix_date_key, daily_mixes)

        # 2. Resolução paralela das demais seções
        loop = asyncio.get_running_loop()

        def _get_charts():
            try:
                res = self.ytm.search(curation.get("trending_query", "Top Brasil 2026 Hits"), filter="songs", limit=12)
                return [self._format_track(t) for t in res if t.get("videoId")]
            except Exception:
                return []

        def _get_new_releases():
            try:
                res = self.ytm.search(curation.get("new_releases_query", "Novos Lançamentos 2026 Hits"), filter="songs", limit=12)
                return [self._format_track(t) for t in res if t.get("videoId")]
            except Exception:
                return []

        def _get_favorite_albums():
            fav_seeds = curation.get("favorite_albums_seeds", [])
            albums_list = []
            for s in fav_seeds:
                q = s.get("search_query", "")
                art = s.get("artist", "")
                try:
                    res = self.ytm.search(q, filter="albums", limit=1)
                    if res:
                        item = res[0]
                        thumb = (item.get("thumbnails") or [{}])[-1].get("url", "")
                        albums_list.append({
                            "id": item.get("browseId", ""),
                            "title": item.get("title", ""),
                            "artist": art or (item.get("artists", [{}])[0].get("name", "") if item.get("artists") else ""),
                            "year": item.get("year", "2024"),
                            "thumbnail": thumb
                        })
                except Exception:
                    pass
            return albums_list

        # Playlists criadas pela Luci salvas no SQLite
        ai_playlists = MusicDatabase.get_user_playlists(user_id)
        created_by_luci = [p for p in ai_playlists if p.get("is_ai_generated")]
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

        # Artistas Recomendados baseados no gosto real do usuário (Individuais)
        ranked_artists_list = curation.get("ranked_artists", [])
        if not ranked_artists_list:
            taste_profile = MusicDatabase.get_taste_profile(user_id, limit=10)
            raw_top = [t.get("artist") for t in taste_profile.get("top_artists", []) if t.get("artist")]
            ranked_artists_list = []
            for item in raw_top:
                parts = re.split(r'[,/|&]|\bfeat\.?\b|\bft\.?\b|\b e \b', item, flags=re.IGNORECASE)
                for p in parts:
                    clean = p.strip()
                    if clean and len(clean) > 2 and clean.lower() not in [x.lower() for x in ranked_artists_list]:
                        ranked_artists_list.append(clean)
            if not ranked_artists_list:
                ranked_artists_list = ["Mariana Fagundes", "Ícaro e Gilmar", "Humberto e Ronaldo", "Gusttavo Lima", "Luan Santana", "Jorge e Mateus", "Marília Mendonça"]

        def _get_artists_data():
            artists_res = []
            seen_names = set()
            for art_name in ranked_artists_list[:8]:
                clean_name = art_name.strip()
                if not clean_name or clean_name.lower() in seen_names:
                    continue
                seen_names.add(clean_name.lower())
                try:
                    res = self.ytm.search(clean_name, filter="artists", limit=1)
                    if res and len(res) > 0:
                        item = res[0]
                        thumb = (item.get("thumbnails") or [{}])[-1].get("url", "")
                        artists_res.append({
                            "id": item.get("browseId") or clean_name,
                            "name": item.get("artist") or clean_name,
                            "thumbnail": thumb
                        })
                    else:
                        artists_res.append({
                            "id": clean_name,
                            "name": clean_name,
                            "thumbnail": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300"
                        })
                except Exception:
                    artists_res.append({
                        "id": clean_name,
                        "name": clean_name,
                        "thumbnail": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300"
                    })
            return artists_res
        # Tarefas paralelas de resolução
        similarity_task = self.resolve_seeds_to_tracks(curation.get("similarity_seeds", []))
        trending_task = loop.run_in_executor(None, _get_charts)
        new_releases_task = loop.run_in_executor(None, _get_new_releases)
        albums_task = loop.run_in_executor(None, _get_favorite_albums)
        artists_task = loop.run_in_executor(None, _get_artists_data)

        based_on_listened, trending, new_releases, favorite_albums, recommended_artists = await asyncio.gather(
            similarity_task, trending_task, new_releases_task, albums_task, artists_task
        )

        history = MusicDatabase.get_history(user_id, limit=10)
        liked_songs = MusicDatabase.get_liked_songs(user_id, limit=10)

        feed_data = {
            "created_by_luci": created_by_luci,
            "active_moments": curation.get("active_moments", []),
            "daily_mixes": daily_mixes,
            "recently_played": history,
            "liked_preview": liked_songs,
            "trending_brasil": trending,
            "new_releases": new_releases,
            "based_on_listened": based_on_listened,
            "favorite_albums": favorite_albums,
            "recommended_artists": recommended_artists
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
