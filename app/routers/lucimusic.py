"""
Router de Endpoints da API do LuciMusic (Clone RiMusic / Dynamic Spotify Engine).
Suporta Busca Global, Resolução de Áudio, Letras Sincronizadas, Fila Infinita e Biblioteca.
"""

from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Query, HTTPException, Request, Body
from pydantic import BaseModel

from app.services.lucimusic_service import lucimusic_service
from app.services.music_intelligence_engine import music_intelligence_engine
from app.database.music_db import MusicDatabase

router = APIRouter(prefix="/api/v1/music", tags=["LuciMusic"])

def _get_current_user(request: Request) -> str:
    """Extrai o identificador de usuário da sessão da Luci (Zero-Auth / fallback 'lucas')."""
    user_header = request.headers.get("X-User-Id")
    if user_header:
        return user_header
    # Extrai da query parameter se houver
    user_query = request.query_params.get("userId")
    if user_query:
        return user_query
    return "lucas"

# ─── 1. Feed Principal (Início / Mood Filters orquestrados pelo MusicIntelligenceEngine) ───
@router.get("/home")
async def get_music_home(
    request: Request,
    mood: Optional[str] = Query("all", description="Filtro de mood: all, treino, foco, relax, energia, acustico")
):
    """
    Retorna o feed completo da tela Início estruturado para o novo Design System.
    """
    import datetime
    user_id = _get_current_user(request)
    curation = await music_intelligence_engine.get_home_curation(user_id)
    feed = await lucimusic_service.resolve_home_curation(curation, user_id)

    # Saudação dinâmica pelo horário
    hour = datetime.datetime.now().hour
    if 5 <= hour < 12:
        greeting = f"Bom dia, {user_id.capitalize()}"
    elif 12 <= hour < 18:
        greeting = f"Boa tarde, {user_id.capitalize()}"
    else:
        greeting = f"Boa noite, {user_id.capitalize()}"

    # 1. Continuar Ouvindo (Coleções: Álbuns e Playlists)
    continue_listening = MusicDatabase.get_collection_history(user_id, limit=6)
    if not continue_listening:
        # Fallback para álbuns/playlists favoritados
        saved_albums = MusicDatabase.get_saved_albums(user_id, limit=3)
        saved_pls = MusicDatabase.get_saved_playlists(user_id, limit=3)
        for alb in saved_albums:
            continue_listening.append({
                "id": alb["id"],
                "type": "album",
                "title": alb["title"],
                "subtitle": alb.get("artist", "Álbum"),
                "cover_url": alb.get("cover_url", ""),
                "last_track_index": 0
            })
        for pl in saved_pls:
            continue_listening.append({
                "id": pl["id"],
                "type": "playlist",
                "title": pl["title"],
                "subtitle": pl.get("artist", "Playlist"),
                "cover_url": pl.get("cover_url", ""),
                "last_track_index": 0
            })

    # 2. Daily Mixes (5 Mixes Estruturados da Luci)
    daily_mixes = []
    gradient_themes = [
        "linear-gradient(135deg, #0600AB 0%, #977DFF 100%)",
        "linear-gradient(135deg, #0033FF 0%, #0600AB 100%)",
        "linear-gradient(135deg, #00001F 0%, #0033FF 100%)",
        "linear-gradient(135deg, #06003D 0%, #977DFF 100%)",
        "linear-gradient(135deg, #977DFF 0%, #FFCCF2 100%)"
    ]
    raw_mixes = feed.get("daily_mixes", [])
    for idx in range(5):
        if idx < len(raw_mixes):
            m = raw_mixes[idx]
            daily_mixes.append({
                "mix_id": idx + 1,
                "title": m.get("title") or f"Daily Mix {idx + 1}",
                "subtitle": m.get("subtitle") or "Mix diário calibrado pela Luci",
                "gradient": gradient_themes[idx % len(gradient_themes)],
                "cover_url": m.get("thumbnail") or "",
                "tracks": m.get("tracks", [])
            })
        else:
            daily_mixes.append({
                "mix_id": idx + 1,
                "title": f"Daily Mix {idx + 1}",
                "subtitle": "Seleção especial com base nos seus gostos",
                "gradient": gradient_themes[idx % len(gradient_themes)],
                "cover_url": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500",
                "tracks": []
            })

    # 3. Artistas Favoritos (Afinidade)
    favorite_artists = feed.get("recommended_artists", [])[:8]

    # 4. Artistas Recomendados pela Luci (Pontes de Descoberta com Razão)
    recommended_artists = []
    for art in feed.get("recommended_artists", [])[2:8]:
        fav_name = favorite_artists[0]["name"] if favorite_artists else "seus artistas favoritos"
        recommended_artists.append({
            "id": art.get("id"),
            "name": art.get("name"),
            "avatar": art.get("thumbnail") or art.get("avatar") or "",
            "reason": f"Porque você curte {fav_name}"
        })

    # 5. Em Alta no Brasil (Trending & Charts)
    trending_brasil = feed.get("trending_brasil", [])[:10]

    # 6. Lançamentos Relevantes
    new_releases = feed.get("new_releases", [])[:10]

    # 7. Radar de Alta Energia (Treino) & 8. Foco/Descompressão
    custom_workout = {
        "title": "Radar de Alta Energia & Treino",
        "subtitle": "BPM elevado para manter o ritmo",
        "tracks": [t for t in trending_brasil[:6]]
    }
    custom_focus = {
        "title": "Sessão Foco & Descompressão",
        "subtitle": "Frequência calma e relaxante",
        "tracks": [t for t in (feed.get("based_on_listened", [{}])[0].get("tracks", []) if feed.get("based_on_listened") else trending_brasil[-6:])]
    }

    # Resposta estruturada canônica da Home
    return {
        "greeting": greeting,
        "mood_active": mood,
        "continue_listening": continue_listening,
        "daily_mixes": daily_mixes,
        "favorite_artists": favorite_artists,
        "recommended_artists": recommended_artists,
        "trending_brasil": trending_brasil,
        "new_releases": new_releases,
        "custom_workout": custom_workout,
        "custom_focus": custom_focus,
        "moments": moments,
        "quick_access": quick_access
    }

class CollectionHistoryPayload(BaseModel):
    collection_id: str
    collection_type: str
    title: str
    subtitle: Optional[str] = ""
    cover_url: Optional[str] = ""
    last_track_index: Optional[int] = 0

@router.post("/history/collection")
async def record_collection_history(payload: CollectionHistoryPayload, request: Request):
    """Registra a reprodução de um álbum ou playlist para a seção 'Continuar Ouvindo'."""
    user_id = _get_current_user(request)
    MusicDatabase.add_collection_history(
        user_id=user_id,
        collection_id=payload.collection_id,
        collection_type=payload.collection_type,
        title=payload.title,
        subtitle=payload.subtitle or "",
        cover_url=payload.cover_url or "",
        last_track_index=payload.last_track_index or 0
    )
    return {"status": "ok"}

class TrackEventPayload(BaseModel):
    track_id: str
    played_seconds: int = 0
    total_seconds: int = 0
    liked: Optional[bool] = False
    skipped: Optional[bool] = False
    context_mood: Optional[str] = "all"
    artist: Optional[str] = ""

@router.post("/track-event")
async def record_track_event(payload: TrackEventPayload, request: Request):
    """Feedback Loop: registra sinais de afinidade com o modelo matemático."""
    user_id = _get_current_user(request)
    signal = "completed" if payload.played_seconds >= (payload.total_seconds * 0.8) else "skipped_early" if payload.skipped else "playback"
    if payload.liked:
        signal = "liked"
    
    MusicDatabase.record_taste_signal(
        user_id=user_id,
        track_id=payload.track_id,
        artist=payload.artist,
        signal_type=signal,
        context=payload.context_mood or "home_view"
    )
    return {"status": "ok", "signal_recorded": signal}

@router.get("/daily-mixes")
async def get_daily_mixes(request: Request):
    """Retorna os Daily Mixes personalizados orquestrados pelo Engine."""
    user_id = _get_current_user(request)
    curation = await music_intelligence_engine.get_home_curation(user_id)
    mixes = await lucimusic_service.resolve_seeds_to_tracks(curation.get("daily_mix_seeds", []))
    return {"mixes": mixes}

@router.get("/genres")
async def get_genres():
    """Retorna a grade de gêneros dinâmicos com a foto do principal artista do momento."""
    genres = await lucimusic_service.get_dynamic_genres()
    return {"genres": genres}

# ─── 2. Busca Global (Híbrida: Determinística <150ms + Semântica Cognitiva LLM) ───
@router.get("/search/suggestions")
async def get_search_suggestions(q: str = Query(..., description="Termo parcial para autocomplete")):
    """Retorna entidades diretas (artistas/álbuns) e termos sugeridos do YouTube Music."""
    if not q or len(q.strip()) < 2:
        return {"entities": [], "queries": []}

    try:
        entities = []
        queries = []

        # 1. Sugestões de texto da InnerTube / YTMusic
        if lucimusic_service.ytm:
            try:
                suggestions = lucimusic_service.ytm.get_search_suggestions(q.strip())
                queries = suggestions[:6] if isinstance(suggestions, list) else []
            except Exception:
                queries = [q.strip(), f"{q.strip()} ao vivo", f"{q.strip()} acústico"]

        # 2. Entidades correspondentes diretas (Artistas / Álbuns)
        direct_matches = await lucimusic_service.search(q.strip(), limit=3)
        for art in direct_matches.get("artists", [])[:2]:
            entities.append({
                "id": art.get("id") or art.get("browseId") or art.get("name"),
                "type": "artist",
                "name": art.get("name") or art.get("artist"),
                "avatar": art.get("thumbnail") or "",
                "subtitle": "Artista"
            })
        for alb in direct_matches.get("albums", [])[:1]:
            entities.append({
                "id": alb.get("id") or alb.get("browseId"),
                "type": "album",
                "name": alb.get("title"),
                "avatar": alb.get("thumbnail") or "",
                "subtitle": f"Álbum • {alb.get('artist', '')}"
            })

        return {"entities": entities, "queries": queries}
    except Exception as e:
        return {"entities": [], "queries": [q]}

@router.get("/search/history")
async def get_search_history(request: Request, limit: int = Query(5, le=20)):
    """Retorna o histórico de buscas recentes do usuário."""
    user_id = _get_current_user(request)
    return {"history": MusicDatabase.get_search_history(user_id, limit=limit)}

class SaveSearchHistoryPayload(BaseModel):
    query: str
    type: Optional[str] = "text"
    target_id: Optional[str] = ""

@router.post("/search/history")
async def save_search_history(payload: SaveSearchHistoryPayload, request: Request):
    """Registra um termo no histórico de buscas."""
    user_id = _get_current_user(request)
    MusicDatabase.add_search_history(
        user_id=user_id,
        query_text=payload.query,
        entity_type=payload.type or "text",
        target_id=payload.target_id or ""
    )
    return {"status": "ok"}

@router.delete("/search/history")
async def clear_search_history(request: Request):
    """Limpa todo o histórico de busca do usuário."""
    user_id = _get_current_user(request)
    MusicDatabase.clear_search_history(user_id)
    return {"status": "ok"}

@router.delete("/search/history/{item_id}")
async def delete_search_history_item(item_id: int, request: Request):
    """Remove um item específico do histórico de busca."""
    user_id = _get_current_user(request)
    MusicDatabase.delete_search_history_item(user_id, item_id)
    return {"status": "ok"}

@router.get("/search")
async def search_music(
    q: str = Query(..., description="Termo de busca"),
    filter: Optional[str] = Query(None, description="Filtro: all, songs, artists, albums, playlists"),
    request: Request = None
):
    """Busca faixas, artistas, álbuns e playlists com interpretação semântica e top_result estruturado."""
    from app.services.music_semantic_engine import music_semantic_engine
    user_id = _get_current_user(request) if request else "lucas"

    # Salva no histórico de buscas silenciosamente
    MusicDatabase.add_search_history(user_id, q, entity_type="text")

    if filter and filter != "all":
        raw_results = await lucimusic_service.search(query=q, filter_type=filter)
        return {
            "top_result": None,
            "tracks": raw_results.get("songs", []),
            "songs": raw_results.get("songs", []),
            "artists": raw_results.get("artists", []),
            "albums": raw_results.get("albums", []),
            "playlists": raw_results.get("playlists", [])
        }

    results = await music_semantic_engine.hybrid_search(user_id=user_id, query=q)

    # Constrói o Top Result Card estruturado (conforme a especificação UI/UX)
    top_result = None
    artists = results.get("artists", [])
    songs = results.get("songs", [])
    albums = results.get("albums", [])

    if artists:
        top_art = artists[0]
        top_result = {
            "id": top_art.get("id") or top_art.get("browseId"),
            "type": "artist",
            "name": top_art.get("name") or top_art.get("artist"),
            "followers": top_art.get("subscribers") or "Mais de 10M fãs",
            "avatar": top_art.get("thumbnail"),
            "has_radio": True
        }
    elif songs:
        top_song = songs[0]
        top_result = {
            "id": top_song.get("id"),
            "type": "song",
            "name": top_song.get("title"),
            "followers": top_song.get("artist"),
            "avatar": top_song.get("thumbnail"),
            "has_radio": True
        }

    return {
        "type": results.get("type", "deterministic"),
        "reasoning": results.get("reasoning"),
        "top_result": top_result,
        "tracks": songs,
        "songs": songs,
        "artists": artists,
        "albums": albums,
        "playlists": results.get("playlists", [])
    }

# ─── 3. Resolução de Stream Direto & Proxy de Áudio ───
@router.get("/stream/{track_id}")
async def get_audio_stream(track_id: str):
    """Obtém a URL de áudio direta de alta fidelidade para reprodução e dispara normalização LUFS."""
    from app.services.loudness_service import loudness_service
    try:
        data = await lucimusic_service.get_stream_url(track_id)
        stream_url = data.get("stream_url")
        
        # Obtém do cache ou dispara análise de LUFS em background
        loudness_info = await loudness_service.get_or_analyze(track_id, stream_url=stream_url)
        data["gain_adjustment"] = loudness_info.get("gain_adjustment", 1.0)
        data["lufs_integrated"] = loudness_info.get("lufs", -14.0)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Falha ao resolver áudio: {str(e)}")

@router.get("/loudness/{track_id}")
async def get_track_loudness(track_id: str):
    """Retorna o fator de correção de ganho (ReplayGain) pré-calculado para a faixa."""
    from app.services.loudness_service import loudness_service
    return await loudness_service.get_or_analyze(track_id)

@router.get("/play/{track_id}")
async def play_audio_proxy(track_id: str, request: Request):
    """
    Streaming proxy direto de áudio com suporte total a HTTP 206 Partial Content
    e Range headers, permitindo reprodução e seek em qualquer navegador mobile e desktop.
    """
    from fastapi.responses import StreamingResponse, Response
    import httpx
    try:
        data = await lucimusic_service.get_stream_url(track_id)
        audio_url = data.get("stream_url")
        if not audio_url:
            raise HTTPException(status_code=404, detail="URL de áudio não encontrada.")

        range_header = request.headers.get("Range", "bytes=0-")
        req_headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Range": range_header,
        }

        client = httpx.AsyncClient(timeout=60.0)
        upstream_req = client.build_request("GET", audio_url, headers=req_headers)
        upstream_res = await client.send(upstream_req, stream=True)

        async def stream_body():
            try:
                async for chunk in upstream_res.aiter_bytes(chunk_size=128 * 1024):
                    yield chunk
            finally:
                await upstream_res.aclose()
                await client.aclose()

        response_headers = {
            "Accept-Ranges": "bytes",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Range",
            "Access-Control-Expose-Headers": "Content-Range, Content-Length, Accept-Ranges",
            "Cache-Control": "public, max-age=14400",
        }

        if "content-range" in upstream_res.headers:
            response_headers["Content-Range"] = upstream_res.headers["content-range"]
        if "content-length" in upstream_res.headers:
            response_headers["Content-Length"] = upstream_res.headers["content-length"]
        if "content-type" in upstream_res.headers:
            response_headers["Content-Type"] = upstream_res.headers["content-type"]
        else:
            response_headers["Content-Type"] = "audio/mp4" if data.get("ext") == "m4a" else "audio/webm"

        return StreamingResponse(
            stream_body(),
            status_code=upstream_res.status_code,
            headers=response_headers,
            media_type=response_headers["Content-Type"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao transmitir áudio: {str(e)}")

# ─── 4. Detalhes da Faixa e Letras Sincronizadas (LRCLIB) ───
@router.get("/track/{track_id}")
async def get_track_metadata(track_id: str, request: Request = None):
    """Obtém stream e metadados completos de uma faixa para o Full Player."""
    user_id = _get_current_user(request) if request else "lucas"
    data = await lucimusic_service.get_stream_url(track_id)
    is_liked = MusicDatabase.is_liked(user_id, track_id)

    return {
        "id": track_id,
        "title": data.get("title") or "Música",
        "artist": data.get("artist") or "Artista",
        "artist_id": data.get("artist_id") or "",
        "album": data.get("album") or "Single",
        "album_id": data.get("album_id") or "",
        "duration": data.get("duration") or 210,
        "cover_url": data.get("thumbnail") or "",
        "video_id": track_id,
        "stream_url": f"/api/v1/music/play/{track_id}",
        "is_liked": is_liked
    }

@router.get("/lyrics/{track_id}")
async def get_lyrics_by_id(
    track_id: str,
    title: Optional[str] = Query(None),
    artist: Optional[str] = Query(None),
    duration: int = Query(0)
):
    """Retorna letras sincronizadas com timestamps formatados em time_ms."""
    effective_title = title or "Música"
    effective_artist = artist or "Artista"
    lyrics = await lucimusic_service.get_lyrics(track_id, effective_title, effective_artist, duration)
    
    formatted_lines = []
    for line in lyrics.get("lines", []):
        formatted_lines.append({
            "time_ms": int(line.get("seconds", 0) * 1000),
            "text": line.get("text", "")
        })

    return {
        "track_id": track_id,
        "synced": lyrics.get("has_synced", False),
        "lines": formatted_lines,
        "plain": lyrics.get("plain", "")
    }

@router.get("/lyrics")
async def get_lyrics(
    track_id: str = Query(..., description="ID da faixa"),
    title: str = Query(..., description="Título da faixa"),
    artist: str = Query(..., description="Nome do artista"),
    duration: int = Query(0, description="Duração em segundos")
):
    """Retorna letras sincronizadas com timestamps (LRCLIB)."""
    lyrics = await lucimusic_service.get_lyrics(track_id, title, artist, duration)
    return lyrics

# ─── 5. Rádio Automática / Fila Infinita ───
@router.get("/radio/{track_id}")
async def get_radio(track_id: str, limit: int = Query(20, le=50)):
    """Gera faixas recomendadas para a fila 'A Seguir' baseadas na música atual."""
    tracks = await lucimusic_service.get_radio_tracks(track_id, limit=limit)
    return {"tracks": tracks}

# ─── 6. Página do Artista, Rádio Dinâmica e Seguir ───
@router.get("/artist/{artist_id}")
async def get_artist(artist_id: str, request: Request = None):
    """Retorna dados completos do artista com latest_release, vídeos, similares e status de seguido."""
    user_id = _get_current_user(request) if request else "lucas"
    data = await lucimusic_service.get_artist_page(artist_id)
    
    # Adiciona status de seguido
    is_followed = MusicDatabase.is_following_artist(user_id, artist_id) or MusicDatabase.is_following_artist(user_id, data.get("name", ""))
    
    # Extrai ou gera latest_release a partir dos singles/álbuns
    latest_release = None
    if data.get("singles"):
        s = data["singles"][0]
        latest_release = {
            "id": s.get("id"),
            "title": s.get("title"),
            "type": "Single",
            "release_date": s.get("year") or "2026",
            "cover": s.get("thumbnail")
        }
    elif data.get("albums"):
        a = data["albums"][0]
        latest_release = {
            "id": a.get("id"),
            "title": a.get("title"),
            "type": "Álbum",
            "release_date": a.get("year") or "2024",
            "cover": a.get("thumbnail")
        }

    # Gera lista de vídeos & clipes formatados do artista
    art_name = data.get("name") or artist_id
    videos = []
    if lucimusic_service.ytm:
        try:
            vid_search = lucimusic_service._safe_search(f"{art_name} clipe oficial", filter_type="videos", limit=5)
            for v in vid_search:
                if v.get("videoId"):
                    videos.append({
                        "id": v["videoId"],
                        "title": v.get("title"),
                        "thumbnail": (v.get("thumbnails") or [{}])[-1].get("url", f"https://i.ytimg.com/vi/{v['videoId']}/hqdefault.jpg"),
                        "views": v.get("views") or "Visualizações"
                    })
        except Exception:
            pass

    return {
        "id": data.get("id") or artist_id,
        "name": data.get("name") or artist_id,
        "banner_url": data.get("thumbnail"),
        "avatar_url": data.get("thumbnail"),
        "listeners": data.get("monthly_listeners") or f"{data.get('subscribers', '2.4M')} ouvintes",
        "is_followed": is_followed,
        "top_tracks": data.get("top_tracks", []),
        "latest_release": latest_release,
        "albums": data.get("albums", []),
        "singles": data.get("singles", []),
        "videos": videos,
        "similar_artists": data.get("similar_artists", []),
        "bio": data.get("description") or f"{art_name} é um artista consagrado com destaque nas principais paradas musicais e plataformas de streaming."
    }

@router.get("/artist/{artist_id}/radio")
async def get_artist_dynamic_radio(artist_id: str, request: Request = None, limit: int = Query(25, le=50)):
    """Gera rádio dinâmica balanceada da Luci (40% artista, 40% similares, 20% exploração)."""
    user_id = _get_current_user(request) if request else "lucas"
    artist_data = await lucimusic_service.get_artist_page(artist_id)
    
    top_tracks = artist_data.get("top_tracks", [])
    similar_artists = artist_data.get("similar_artists", [])

    candidate_pool = list(top_tracks[:10])

    # Busca faixas de até 3 artistas similares
    for sim in similar_artists[:3]:
        try:
            sim_tracks = await lucimusic_service.search(f"{sim['name']} sucessos", filter_type="songs", limit=5)
            for st in sim_tracks.get("songs", []):
                if st["id"] not in [c["id"] for c in candidate_pool]:
                    candidate_pool.append(st)
        except Exception:
            pass

    # Balanceamento estocástico
    balanced = await music_intelligence_engine.generate_balanced_queue(user_id, candidate_pool)
    return {"tracks": balanced.get("queue", candidate_pool)[:limit]}

class FollowArtistPayload(BaseModel):
    follow: bool
    artist_name: Optional[str] = ""
    avatar_url: Optional[str] = ""

@router.post("/artist/{artist_id}/follow")
async def toggle_artist_follow(artist_id: str, payload: FollowArtistPayload, request: Request):
    """Seguir ou desseguir artista, atualizando pesos de afinidade."""
    user_id = _get_current_user(request)
    now_following = MusicDatabase.toggle_follow_artist(
        user_id=user_id,
        artist_id=artist_id,
        artist_name=payload.artist_name or artist_id,
        avatar_url=payload.avatar_url or ""
    )
    # Emite sinal de aprendizado de gosto
    signal = "liked" if now_following else "unliked"
    MusicDatabase.record_taste_signal(
        user_id=user_id,
        track_id=artist_id,
        artist=payload.artist_name or artist_id,
        signal_type=signal,
        context="artist_follow"
    )
    return {"status": "ok", "is_followed": now_following}

@router.get("/album/{album_id}")
async def get_album(
    album_id: str,
    title: Optional[str] = Query(None),
    artist: Optional[str] = Query(None),
    request: Request = None
):
    """Retorna detalhes completos de um álbum com todas as faixas formatadas, direitos e álbuns relacionados."""
    user_id = _get_current_user(request) if request else "lucas"
    data = await lucimusic_service.get_album_details(album_id=album_id, title=title, artist=artist)

    is_saved = MusicDatabase.is_collection_saved(user_id, album_id)

    # Formatação padronizada para MediaCollection
    tracks = []
    raw_tracks = data.get("tracks", [])
    for idx, t in enumerate(raw_tracks):
        tracks.append({
            "id": t.get("id"),
            "track_number": idx + 1,
            "title": t.get("title"),
            "artist": t.get("artist") or data.get("artist"),
            "album": data.get("title"),
            "duration": t.get("duration") or 210,
            "thumbnail": t.get("thumbnail") or data.get("thumbnail"),
            "is_liked": False
        })

    # Busca álbuns relacionados do mesmo artista
    related = []
    art_name = data.get("artist") or artist
    if art_name:
        try:
            art_res = await lucimusic_service.search(f"{art_name} albuns", filter_type="albums", limit=6)
            for alb in art_res.get("albums", []):
                if alb.get("id") != album_id:
                    related.append({
                        "id": alb.get("id") or alb.get("browseId"),
                        "title": alb.get("title"),
                        "artist": alb.get("artist") or art_name,
                        "cover_url": alb.get("thumbnail")
                    })
        except Exception:
            pass

    return {
        "collection_type": "album",
        "id": album_id,
        "title": data.get("title") or title or "Álbum",
        "artist": data.get("artist") or artist or "Artista",
        "artist_id": data.get("artistId") or "",
        "release_year": data.get("year") or "2026",
        "total_tracks": len(tracks),
        "total_duration": f"{len(tracks) * 3} min",
        "cover_url": data.get("thumbnail"),
        "copyright": data.get("copyright") or f"℗ {data.get('year', '2026')} {data.get('artist', 'Gravadora')} - Licença Exclusiva",
        "is_saved": is_saved,
        "tracks": tracks,
        "related_collections": related
    }

@router.get("/playlist/{playlist_id}")
async def get_unified_playlist_details(playlist_id: str, request: Request = None):
    """Retorna detalhes completos de uma playlist (customizada, gerada pela Luci ou do YouTube Music)."""
    user_id = _get_current_user(request) if request else "lucas"
    
    # 1. Tenta buscar no banco local
    local_pl = MusicDatabase.get_playlist_details(user_id, playlist_id)
    if local_pl:
        tracks = []
        for idx, t in enumerate(local_pl.get("tracks", [])):
            tracks.append({
                "id": t.get("id"),
                "track_number": idx + 1,
                "title": t.get("title"),
                "artist": t.get("artist"),
                "album": t.get("album", "Playlist"),
                "duration": t.get("duration", 180),
                "thumbnail": t.get("thumbnail") or local_pl.get("thumbnail"),
                "is_liked": False
            })
        return {
            "collection_type": "playlist",
            "id": playlist_id,
            "title": local_pl.get("title"),
            "artist": "Curadoria Luci" if local_pl.get("is_smart_ai") else "Você",
            "release_year": "2026",
            "total_tracks": len(tracks),
            "total_duration": f"{len(tracks) * 3} min",
            "cover_url": local_pl.get("thumbnail"),
            "is_saved": True,
            "is_smart_ai": bool(local_pl.get("is_smart_ai")),
            "tracks": tracks,
            "related_collections": []
        }

    # 2. Busca do YouTube Music InnerTube
    tracks = []
    if lucimusic_service.ytm:
        try:
            yt_pl = lucimusic_service.ytm.get_playlist(playlist_id)
            for idx, t in enumerate(yt_pl.get("tracks", [])):
                tracks.append({
                    "id": t.get("videoId"),
                    "track_number": idx + 1,
                    "title": t.get("title"),
                    "artist": (t.get("artists") or [{}])[0].get("name", "Artista"),
                    "album": (t.get("album") or {}).get("name", "Playlist"),
                    "duration": t.get("duration_seconds", 180),
                    "thumbnail": (t.get("thumbnails") or [{}])[-1].get("url", ""),
                    "is_liked": False
                })
            return {
                "collection_type": "playlist",
                "id": playlist_id,
                "title": yt_pl.get("title", "Playlist"),
                "artist": yt_pl.get("author", {}).get("name", "YouTube Music"),
                "release_year": "2026",
                "total_tracks": len(tracks),
                "total_duration": yt_pl.get("duration", f"{len(tracks) * 3} min"),
                "cover_url": (yt_pl.get("thumbnails") or [{}])[-1].get("url", ""),
                "is_saved": MusicDatabase.is_collection_saved(user_id, playlist_id),
                "is_smart_ai": False,
                "tracks": tracks,
                "related_collections": []
            }
        except Exception:
            pass

    return {
        "collection_type": "playlist",
        "id": playlist_id,
        "title": "Playlist",
        "artist": "Curadoria Luci",
        "release_year": "2026",
        "total_tracks": 0,
        "total_duration": "0 min",
        "cover_url": "",
        "is_saved": False,
        "tracks": [],
        "related_collections": []
    }

class FavoriteCollectionPayload(BaseModel):
    collection_type: str = "album"  # 'album' ou 'playlist'
    favorite: bool = True
    title: Optional[str] = ""
    artist: Optional[str] = ""
    cover_url: Optional[str] = ""

@router.post("/collection/{collection_id}/favorite")
async def toggle_favorite_collection(collection_id: str, payload: FavoriteCollectionPayload, request: Request):
    """Salva ou remove um álbum ou playlist da biblioteca do usuário."""
    user_id = _get_current_user(request)
    now_saved = MusicDatabase.toggle_favorite_collection(
        user_id=user_id,
        collection_id=collection_id,
        collection_type=payload.collection_type,
        title=payload.title or collection_id,
        artist=payload.artist or "",
        cover_url=payload.cover_url or ""
    )
    return {"status": "ok", "is_saved": now_saved}

# ─── 7. Histórico de Reprodução e Sinais de Aprendizado ───
class TrackPayload(BaseModel):
    id: str
    title: str
    artist: str
    album: Optional[str] = ""
    thumbnail: Optional[str] = ""
    duration: Optional[int] = 0

class TasteSignalPayload(BaseModel):
    track_id: str
    artist: Optional[str] = ""
    signal_type: str  # 'completed', 'skipped_early', 'liked', 'replayed', 'added_to_playlist'
    context: Optional[str] = "app_playback"

@router.post("/history")
async def add_history(track: TrackPayload, request: Request):
    """Registra uma faixa reproduzida no histórico do usuário e emite sinal de aprendizado."""
    user_id = _get_current_user(request)
    MusicDatabase.add_to_history(user_id, track.model_dump())
    MusicDatabase.record_taste_signal(
        user_id=user_id,
        track_id=track.id,
        artist=track.artist,
        signal_type="completed",
        context="history_play"
    )
    return {"status": "ok"}

@router.post("/signal")
async def record_signal(payload: TasteSignalPayload, request: Request):
    """Registra um sinal explícito ou implícito de preferência musical."""
    user_id = _get_current_user(request)
    MusicDatabase.record_taste_signal(
        user_id=user_id,
        track_id=payload.track_id,
        artist=payload.artist,
        signal_type=payload.signal_type,
        context=payload.context
    )
    return {"status": "ok"}

@router.get("/history")
async def get_history(request: Request, limit: int = Query(50, le=100)):
    """Retorna o histórico de faixas ouvidas pelo usuário."""
    user_id = _get_current_user(request)
    history = MusicDatabase.get_history(user_id, limit=limit)
    return {"history": history}

# ─── 8. Músicas Curtidas ───
@router.post("/like")
async def toggle_like(track: TrackPayload, request: Request):
    """Adiciona ou remove uma faixa das Músicas Curtidas e grava sinal de aprendizado."""
    user_id = _get_current_user(request)
    is_liked = MusicDatabase.toggle_like(user_id, track.model_dump())
    signal = "liked" if is_liked else "unliked"
    MusicDatabase.record_taste_signal(
        user_id=user_id,
        track_id=track.id,
        artist=track.artist,
        signal_type=signal,
        context="user_toggle_like"
    )
    return {"is_liked": is_liked}

@router.get("/liked")
async def get_liked_songs(request: Request, limit: int = Query(100, le=200)):
    """Retorna a lista de Músicas Curtidas do usuário."""
    user_id = _get_current_user(request)
    liked = MusicDatabase.get_liked_songs(user_id, limit=limit)
    return {"liked_songs": liked}

# ─── 9. Playlists do Usuário & Resumo da Biblioteca ───
@router.get("/library")
async def get_library_summary(
    filter: Optional[str] = Query("all", description="Filtro: all, playlists, tracks, albums, artists, downloads"),
    view: Optional[str] = Query("list", description="Visão: list ou grid"),
    request: Request = None
):
    """Retorna o resumo completo da biblioteca do usuário com curtidas, playlists, artistas seguidos e álbuns."""
    user_id = _get_current_user(request) if request else "lucas"

    liked_songs = MusicDatabase.get_liked_songs(user_id, limit=50)
    playlists = MusicDatabase.get_playlists(user_id)
    saved_playlists = MusicDatabase.get_saved_playlists(user_id, limit=50)
    artists = MusicDatabase.get_followed_artists(user_id, limit=50)
    albums = MusicDatabase.get_saved_albums(user_id, limit=50)

    # Mescla playlists locais e playlists salvas
    all_playlists = list(playlists)
    for sp in saved_playlists:
        if not any(p["id"] == sp["id"] for p in all_playlists):
            all_playlists.append({
                "id": sp["id"],
                "title": sp["title"],
                "author": sp.get("artist") or "YouTube Music",
                "count": 0,
                "thumbnail": sp.get("cover_url")
            })

    liked_summary = {
        "total_tracks": len(liked_songs),
        "preview_tracks": [
            {
                "id": t["id"],
                "title": t["title"],
                "artist": t["artist"],
                "cover": t.get("thumbnail") or ""
            }
            for t in liked_songs[:3]
        ]
    }

    formatted_artists = [
        {
            "id": a["id"],
            "name": a["name"],
            "avatar": a.get("thumbnail") or "",
            "is_followed": True
        }
        for a in artists
    ]

    formatted_albums = [
        {
            "id": alb["id"],
            "title": alb["title"],
            "artist": alb.get("artist") or "Artista",
            "cover": alb.get("cover_url") or ""
        }
        for alb in albums
    ]

    return {
        "liked_summary": liked_summary,
        "tracks": liked_songs,
        "playlists": all_playlists,
        "artists": formatted_artists,
        "albums": formatted_albums,
        "downloads": []
    }

class CreatePlaylistPayload(BaseModel):
    title: str
    description: Optional[str] = ""
    is_smart_ai: Optional[bool] = False
    prompt: Optional[str] = ""

@router.post("/library/playlist")
@router.post("/playlists")
async def create_playlist(payload: CreatePlaylistPayload, request: Request):
    """Cria uma nova playlist (manual ou gerada com IA pela Luci)."""
    user_id = _get_current_user(request)
    pl = MusicDatabase.create_playlist(
        user_id=user_id,
        title=payload.title,
        description=payload.description or "",
        is_smart_ai=bool(payload.is_smart_ai)
    )

    # Se for Smart AI, busca faixas coerentes com o prompt da Luci
    if payload.is_smart_ai and payload.prompt:
        try:
            ai_tracks_res = await lucimusic_service.search(payload.prompt, filter_type="songs", limit=15)
            for t in ai_tracks_res.get("songs", []):
                MusicDatabase.add_track_to_playlist(pl["id"], t)
        except Exception:
            pass

    return pl

class TrackLikePayload(BaseModel):
    liked: bool = True

@router.post("/track/{track_id}/like")
async def toggle_track_like_by_id(track_id: str, payload: TrackLikePayload, request: Request):
    """Alterna curtida de faixa diretamente pelo ID."""
    user_id = _get_current_user(request)
    track_meta = await lucimusic_service.get_stream_url(track_id)
    is_liked = MusicDatabase.toggle_like(user_id, {
        "id": track_id,
        "title": track_meta.get("title") or "Música",
        "artist": track_meta.get("artist") or "Artista",
        "thumbnail": track_meta.get("thumbnail") or ""
    })
    return {"status": "ok", "liked": is_liked}

@router.get("/playlists")
async def list_playlists(request: Request):
    """Lista todas as playlists do usuário."""
    user_id = _get_current_user(request)
    playlists = MusicDatabase.get_playlists(user_id)
    return {"playlists": playlists}

@router.get("/playlists/{playlist_id}")
async def get_playlist_details(playlist_id: str, request: Request):
    """Retorna os detalhes e as faixas de uma playlist."""
    user_id = _get_current_user(request)
    pl = MusicDatabase.get_playlist_details(user_id, playlist_id)
    if not pl:
        raise HTTPException(status_code=404, detail="Playlist não encontrada.")
    return pl

class UpdatePlaylistPayload(BaseModel):
    title: str
    description: Optional[str] = ""
    cover_mode: Optional[str] = "custom"
    custom_cover_url: Optional[str] = ""

@router.put("/playlist/{playlist_id}")
async def update_playlist(playlist_id: str, payload: UpdatePlaylistPayload):
    """Atualiza título, descrição e capa da playlist."""
    success = MusicDatabase.update_playlist_metadata(
        playlist_id=playlist_id,
        title=payload.title,
        description=payload.description or "",
        cover_mode=payload.cover_mode or "custom",
        custom_cover_url=payload.custom_cover_url or ""
    )
    if not success:
        raise HTTPException(status_code=404, detail="Playlist não encontrada para edição.")
    return {"status": "ok", "message": "Playlist atualizada com sucesso."}

@router.delete("/playlist/{playlist_id}")
async def delete_playlist(playlist_id: str):
    """Exclui uma playlist do usuário."""
    success = MusicDatabase.delete_custom_playlist(playlist_id)
    if not success:
        raise HTTPException(status_code=404, detail="Playlist não encontrada para exclusão.")
    return {"success": True, "deleted_id": playlist_id}

# ─── 10. Configurações de Áudio & Comportamento ───
class AudioSettingsPayload(BaseModel):
    audio_quality: Optional[str] = None
    autoplay_similar: Optional[bool] = None
    crossfade_seconds: Optional[int] = None
    ducking_volume_percentage: Optional[int] = None
    offline_download_on_wifi_only: Optional[bool] = None
    sleep_timer_default_min: Optional[int] = None

@router.get("/settings/audio")
async def get_audio_settings(request: Request):
    """Obtém as preferências de áudio do usuário."""
    user_id = _get_current_user(request)
    return MusicDatabase.get_audio_settings(user_id)

@router.put("/settings/audio")
async def update_audio_settings(payload: AudioSettingsPayload, request: Request):
    """Atualiza as preferências de áudio do usuário."""
    user_id = _get_current_user(request)
    return MusicDatabase.update_audio_settings(user_id, payload.model_dump(exclude_unset=True))

class AddTrackPayload(BaseModel):
    track_id: str
    title: str
    artist: str
    duration: Optional[int] = 0
    cover_url: Optional[str] = ""

class CreateWithTrackPayload(BaseModel):
    title: str
    description: Optional[str] = ""
    initial_track: AddTrackPayload

class ReorderQueuePayload(BaseModel):
    current_track_id: Optional[str] = ""
    ordered_track_ids: List[str]

@router.post("/playlist/{playlist_id}/track")
async def add_track_to_custom_playlist(playlist_id: str, payload: AddTrackPayload):
    """Insere uma faixa em uma playlist existente."""
    MusicDatabase.add_track_to_playlist(playlist_id, {
        "id": payload.track_id,
        "title": payload.title,
        "artist": payload.artist,
        "duration": payload.duration,
        "thumbnail": payload.cover_url
    })
    return {"status": "ok", "message": "Faixa adicionada à playlist com sucesso"}

@router.post("/playlist/create-with-track")
async def create_playlist_with_track(payload: CreateWithTrackPayload, request: Request):
    """Cria uma nova playlist e insere a faixa inicial imediatamente."""
    user_id = _get_current_user(request)
    pl = MusicDatabase.create_playlist(user_id, payload.title, payload.description or "")
    
    MusicDatabase.add_track_to_playlist(pl["id"], {
        "id": payload.initial_track.track_id,
        "title": payload.initial_track.title,
        "artist": payload.initial_track.artist,
        "duration": payload.initial_track.duration,
        "thumbnail": payload.initial_track.cover_url
    })
    return {"status": "ok", "playlist": pl}

@router.put("/queue/reorder")
async def reorder_active_queue(payload: ReorderQueuePayload, request: Request):
    """Sincroniza e reordena a fila ativa do usuário."""
    return {"status": "ok", "reordered_count": len(payload.ordered_track_ids)}

@router.post("/playlists/{playlist_id}/tracks")
async def add_track_to_playlist(playlist_id: str, track: TrackPayload):
    """Adiciona uma música à playlist."""
    MusicDatabase.add_track_to_playlist(playlist_id, track.model_dump())
    return {"status": "ok"}

# ─── 10. Sessão de Reprodução Global (Headless Brain Playback State) ───
class PlaybackStatePayload(BaseModel):
    is_playing: bool
    progress_seconds: Optional[int] = 0

class PlayTrackRequest(BaseModel):
    track: Dict[str, Any]
    queue: Optional[List[Dict[str, Any]]] = None

@router.get("/playback/session")
async def get_playback_session(request: Request):
    """Retorna o estado global de reprodução sincronizado do usuário."""
    from app.services.playback_manager import playback_manager
    user_id = _get_current_user(request)
    return playback_manager.get_session(user_id)

@router.post("/playback/play")
async def start_playback(payload: PlayTrackRequest, request: Request):
    """Define uma música para tocar e propaga o evento via WebSocket para todos os aparelhos."""
    from app.services.playback_manager import playback_manager
    from app.services.ws_manager import ws_hub
    user_id = _get_current_user(request)
    session = playback_manager.set_current_track(user_id, payload.track, payload.queue)
    await ws_hub.emit_to_user(user_id, "START_PLAYBACK", session)
    return session

@router.post("/playback/state")
async def update_playback_state(payload: PlaybackStatePayload, request: Request):
    """Atualiza se está tocando e o progresso da música."""
    from app.services.playback_manager import playback_manager
    from app.services.ws_manager import ws_hub
    user_id = _get_current_user(request)
    session = playback_manager.update_playback_state(user_id, payload.is_playing, payload.progress_seconds or 0)
    await ws_hub.emit_to_user(user_id, "PLAYBACK_STATE_CHANGED", session)
    return session

