"""
Módulo de Ferramentas de IA para Música (LuciMusic Function Calling Tools).
Disponibiliza as tools `play_music`, `search_semantic_history` e `manage_playlist`
para o Cérebro Centralizado da Luci orquestrar o player silenciosamente.
"""

from typing import Dict, Any, Optional, List
from app.tools.registry import tool_registry
from app.services.lucimusic_service import lucimusic_service
from app.services.playback_manager import playback_manager
from app.services.ws_manager import ws_hub
from app.database.music_db import MusicDatabase

# ─── Tool 1: Iniciar Música ou Rádio Conversacionalmente ───
@tool_registry.register(
    name="play_music",
    description="Inicia a reprodução de uma música, artista, álbum ou estação de rádio nos dispositivos conectados da Luci.",
    parameters={
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Nome da música, artista ou gênero que o usuário deseja ouvir (ex: 'The Weeknd Blinding Lights', 'Queen', 'Lofi para estudar')."
            },
            "context": {
                "type": "string",
                "description": "Contexto do momento (ex: 'treino', 'foco', 'relaxar', 'churrasco')."
            }
        },
        "required": ["query"]
    }
)
async def tool_play_music(arguments: Dict[str, Any]) -> Dict[str, Any]:
    query = arguments.get("query", "").strip()
    context = arguments.get("context", "")
    user_id = "lucas"

    if not query:
        return {"sucesso": False, "mensagem": "Nenhum termo de busca musical fornecido."}

    search_res = await lucimusic_service.search(query, filter_type="songs")
    songs = search_res.get("songs", [])

    if not songs:
        # Tenta busca global sem filtro
        search_res = await lucimusic_service.search(query)
        songs = search_res.get("songs", [])

    if not songs:
        return {"sucesso": False, "mensagem": f"Nenhuma faixa oficial encontrada para '{query}'."}

    selected_track = songs[0]
    updated_session = playback_manager.set_current_track(user_id, selected_track, songs)
    
    # Registra no histórico com a tag de contexto
    MusicDatabase.add_to_history(user_id, selected_track, context_tag=context)

    # Emite evento push para todos os clientes conectados (Web, PWA, APK)
    await ws_hub.emit_to_user(user_id, "START_PLAYBACK", updated_session)

    return {
        "sucesso": True,
        "acao": "START_PLAYBACK",
        "faixa": {
            "id": selected_track.get("id"),
            "titulo": selected_track.get("title"),
            "artista": selected_track.get("artist"),
            "album": selected_track.get("album"),
            "thumbnail": selected_track.get("thumbnail")
        },
        "fila_tamanho": len(songs),
        "mensagem": f"Tocando '{selected_track.get('title')}' de '{selected_track.get('artist')}' agora."
    }

# ─── Tool 2: Busca Semântica no Histórico do Usuário ───
@tool_registry.register(
    name="search_semantic_history",
    description="Permite à IA varrer o histórico do banco de dados quando o usuário pede músicas ouvidas em momentos específicos (ex: 'aquela música que ouvi no churrasco', 'a música do treino de ontem').",
    parameters={
        "type": "object",
        "properties": {
            "description": {
                "type": "string",
                "description": "Descrição do momento, tag de contexto, parte da letra ou nome parcial do artista/música."
            }
        },
        "required": ["description"]
    }
)
async def tool_search_semantic_history(arguments: Dict[str, Any]) -> Dict[str, Any]:
    description = arguments.get("description", "").strip()
    user_id = "lucas"

    results = MusicDatabase.search_semantic_history(user_id, description, limit=10)
    if not results:
        # Se não encontrar por tag exata, busca no histórico recente geral
        history = MusicDatabase.get_history(user_id, limit=10)
        return {
            "sucesso": True,
            "encontrados": len(history),
            "faixas": history,
            "observacao": "Nenhuma correspondência exata para o contexto, retornando as mais ouvidas recentemente."
        }

    return {
        "sucesso": True,
        "encontrados": len(results),
        "faixas": results
    }

# ─── Tool 3: Gerenciamento de Playlists ───
@tool_registry.register(
    name="manage_playlist",
    description="Permite criar playlists, adicionar músicas a uma lista existente ou listar playlists do usuário.",
    parameters={
        "type": "object",
        "properties": {
            "action": {
                "type": "string",
                "enum": ["create", "add_track", "list"],
                "description": "Ação a ser executada: 'create', 'add_track' ou 'list'."
            },
            "playlist_name": {
                "type": "string",
                "description": "Nome da playlist (ex: 'Churrasco 2026', 'Músicas para Codar')."
            },
            "song_query": {
                "type": "string",
                "description": "Nome da música ou artista para adicionar à playlist."
            }
        },
        "required": ["action"]
    }
)
async def tool_manage_playlist(arguments: Dict[str, Any]) -> Dict[str, Any]:
    action = arguments.get("action")
    playlist_name = arguments.get("playlist_name", "Minha Playlist IA")
    song_query = arguments.get("song_query", "")
    user_id = "lucas"

    if action == "list":
        playlists = MusicDatabase.get_user_playlists(user_id)
        return {"sucesso": True, "playlists": playlists}

    elif action == "create":
        pl = MusicDatabase.create_playlist(user_id, title=playlist_name, description="Criada pela Luci AI", is_ai_generated=True)
        return {"sucesso": True, "playlist": pl, "mensagem": f"Playlist '{playlist_name}' criada com sucesso!"}

    elif action == "add_track":
        if not song_query:
            return {"sucesso": False, "mensagem": "Nome da música não informado."}

        # Busca a música
        search_res = await lucimusic_service.search(song_query, filter_type="songs")
        songs = search_res.get("songs", [])
        if not songs:
            return {"sucesso": False, "mensagem": f"Música '{song_query}' não encontrada."}

        track = songs[0]
        # Localiza ou cria a playlist
        playlists = MusicDatabase.get_user_playlists(user_id)
        target_pl = next((p for p in playlists if p["title"].lower() == playlist_name.lower()), None)
        if not target_pl:
            target_pl = MusicDatabase.create_playlist(user_id, title=playlist_name, is_ai_generated=True)

        added = MusicDatabase.add_track_to_playlist(target_pl["id"], track)
        return {
            "sucesso": added,
            "playlist": target_pl["title"],
            "faixa": track["title"],
            "mensagem": f"Faixa '{track['title']}' adicionada à playlist '{target_pl['title']}'."
        }

    return {"sucesso": False, "mensagem": f"Ação '{action}' desconhecida."}
