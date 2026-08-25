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

# ─── 1. Feed Principal (Início / Daily Mixes orquestrados pelo MusicIntelligenceEngine) ───
@app_home := router.get("/home")
async def get_music_home(request: Request):
    """
    Retorna o feed completo da tela Início.
    O MusicIntelligenceEngine infere o contexto cognitivo e o LuciMusicService busca as faixas.
    """
    user_id = _get_current_user(request)
    curation = await music_intelligence_engine.get_home_curation(user_id)
    feed = await lucimusic_service.resolve_home_curation(curation, user_id)
    return feed

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

# ─── 2. Busca Global ───
@router.get("/search")
async def search_music(
    q: str = Query(..., description="Termo de busca"),
    filter: Optional[str] = Query(None, description="Filtro: songs, artists, albums, playlists")
):
    """Busca faixas, artistas, álbuns e playlists no YouTube Music."""
    results = await lucimusic_service.search(query=q, filter_type=filter)
    return results

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

# ─── 4. Letras Sincronizadas (LRCLIB) ───
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

# ─── 6. Página do Artista e Álbum ───
@router.get("/artist/{artist_id}")
async def get_artist(artist_id: str):
    """Retorna top faixas, álbuns e informações do artista."""
    data = await lucimusic_service.get_artist_page(artist_id)
    return data

@router.get("/album/{album_id}")
async def get_album(album_id: str, title: Optional[str] = Query(None), artist: Optional[str] = Query(None)):
    """Retorna detalhes de um álbum com todas as suas faixas, ano e artista."""
    data = await lucimusic_service.get_album_details(album_id=album_id, title=title, artist=artist)
    return data

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

# ─── 9. Playlists do Usuário ───
class CreatePlaylistPayload(BaseModel):
    title: str
    description: Optional[str] = ""

@router.post("/playlists")
async def create_playlist(payload: CreatePlaylistPayload, request: Request):
    """Cria uma nova playlist para o usuário."""
    user_id = _get_current_user(request)
    pl = MusicDatabase.create_playlist(user_id, payload.title, payload.description or "")
    return pl

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

