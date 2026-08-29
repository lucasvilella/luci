"""
Módulo de Banco de Dados SQLite do LuciMusic.
Persistência de Músicas Curtidas, Playlists do Usuário e Histórico com Metadados de Contexto
para alimentar o Motor de Busca Semântica e os Mixes Diários da Luci.
"""

import sqlite3
import os
import json
import time
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional

DB_DIR = Path(__file__).resolve().parent.parent.parent / "storage"
DB_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DB_DIR / "lucimusic.db"

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Inicializa as tabelas do LuciMusic no SQLite com suporte a contexto e IA."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Tabela de Músicas Curtidas
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS liked_songs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        album TEXT,
        thumbnail TEXT,
        duration INTEGER DEFAULT 0,
        liked_at INTEGER NOT NULL
    )
    """)

    # 2. Tabela de Playlists do Usuário
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_playlists (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        thumbnail TEXT,
        is_ai_generated INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
    )
    """)

    # 3. Tabela de Faixas das Playlists
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS playlist_tracks (
        playlist_id TEXT NOT NULL,
        track_id TEXT NOT NULL,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        album TEXT,
        thumbnail TEXT,
        duration INTEGER DEFAULT 0,
        added_at INTEGER NOT NULL,
        position INTEGER NOT NULL,
        PRIMARY KEY (playlist_id, track_id),
        FOREIGN KEY (playlist_id) REFERENCES user_playlists(id) ON DELETE CASCADE
    )
    """)

    # 4. Tabela de Histórico com Rastreamento de Contexto
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS playback_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        track_id TEXT NOT NULL,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        album TEXT,
        thumbnail TEXT,
        duration INTEGER DEFAULT 0,
        context_tag TEXT DEFAULT '',
        played_at INTEGER NOT NULL
    )
    """)

    # 5. Tabela de Sinais de Aprendizado de Gosto Musical
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS music_taste_signals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        track_id TEXT NOT NULL,
        artist TEXT,
        signal_type TEXT NOT NULL,
        context TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Migração segura para bancos existentes
    try:
        cursor.execute("ALTER TABLE playback_history ADD COLUMN context_tag TEXT DEFAULT ''")
    except sqlite3.OperationalError:
        pass

    try:
        cursor.execute("ALTER TABLE user_playlists ADD COLUMN is_ai_generated INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass

    # 5. Tabela de Cache Persistente de Daily Mixes (Atualização Diária às 00:01)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS daily_mix_cache (
        user_id TEXT NOT NULL,
        date_key TEXT NOT NULL,
        mixes_json TEXT NOT NULL,
        generated_at INTEGER NOT NULL,
        PRIMARY KEY (user_id, date_key)
    )
    """)

    # 6. Tabela de Loudness Pré-calculado (Normalização de Volume ReplayGain Style)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS track_loudness (
        track_id TEXT PRIMARY KEY,
        lufs_integrated REAL NOT NULL,
        gain_adjustment REAL NOT NULL,
        analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 7. Tabela de Momentos Contextuais Autônomos e Episódicos
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_moments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        moment_name TEXT NOT NULL,
        subtitle TEXT,
        time_start_hour INTEGER DEFAULT 0,
        time_end_hour INTEGER DEFAULT 23,
        days_of_week TEXT DEFAULT 'all',
        target_bpm_min INTEGER DEFAULT 60,
        target_bpm_max INTEGER DEFAULT 180,
        preferred_genres TEXT DEFAULT '',
        is_active INTEGER DEFAULT 1,
        source TEXT DEFAULT 'clustering', -- 'clustering' ou 'conversational'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 8. Tabela de Logs de Sessão para Clustering (timestamp, dia_da_semana, bpm_medio, nivel_volume)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS playback_session_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        track_id TEXT NOT NULL,
        played_at INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL, -- 0=Monday, 6=Sunday
        hour_of_day INTEGER NOT NULL,
        estimated_bpm INTEGER DEFAULT 120,
        volume_level REAL DEFAULT 1.0,
        context_tag TEXT DEFAULT ''
    )
    """)

    # Índices para performance e busca rápida
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_history_user ON playback_history (user_id, played_at DESC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_history_search ON playback_history (user_id, title, artist, context_tag)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_liked_user ON liked_songs (user_id, liked_at DESC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_daily_mix ON daily_mix_cache (user_id, date_key)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_track_loudness ON track_loudness (track_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_moments ON user_moments (user_id, is_active)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_session_metrics ON playback_session_metrics (user_id, played_at DESC)")

    conn.commit()
    conn.close()

# Executa inicialização
init_db()

class MusicDatabase:
    """Repositório central de dados para o módulo LuciMusic."""

    @staticmethod
    def add_to_history(user_id: str, track: Dict[str, Any], context_tag: str = ""):
        """Registra uma faixa ouvida no histórico com contexto de momento (ex: foco, treino)."""
        track_id = track.get("id")
        if not track_id:
            return

        conn = get_db_connection()
        cursor = conn.cursor()
        now = int(time.time())

        # Determina tag de contexto automática por horário se não for passada
        if not context_tag:
            hour = time.localtime(now).tm_hour
            if 6 <= hour < 10:
                context_tag = "manha"
            elif 10 <= hour < 18:
                context_tag = "tarde"
            elif 18 <= hour < 22:
                context_tag = "noite"
            else:
                context_tag = "madrugada"

        cursor.execute("""
        INSERT INTO playback_history (user_id, track_id, title, artist, album, thumbnail, duration, context_tag, played_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            track_id,
            track.get("title", "Desconhecido"),
            track.get("artist", "Desconhecido"),
            track.get("album", ""),
            track.get("thumbnail", ""),
            track.get("duration", 0),
            context_tag,
            now
        ))
        conn.commit()
        conn.close()

    @staticmethod
    def get_history(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Retorna faixas ÚNICAS recentemente ouvidas."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        SELECT track_id AS id, title, artist, album, thumbnail, duration, context_tag, MAX(played_at) as played_at
        FROM playback_history
        WHERE user_id = ?
        GROUP BY track_id
        ORDER BY played_at DESC
        LIMIT ?
        """, (user_id, limit))
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    @staticmethod
    def search_semantic_history(user_id: str, query: str, limit: int = 15) -> List[Dict[str, Any]]:
        """Busca semântica no histórico do usuário por título, artista ou tag de contexto."""
        conn = get_db_connection()
        cursor = conn.cursor()
        wildcard = f"%{query.strip()}%"
        cursor.execute("""
        SELECT track_id AS id, title, artist, album, thumbnail, duration, context_tag, MAX(played_at) as played_at
        FROM playback_history
        WHERE user_id = ? AND (title LIKE ? OR artist LIKE ? OR context_tag LIKE ?)
        GROUP BY track_id
        ORDER BY played_at DESC
        LIMIT ?
        """, (user_id, wildcard, wildcard, wildcard, limit))
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    @staticmethod
    def record_taste_signal(
        user_id: str,
        track_id: str,
        artist: Optional[str] = None,
        signal_type: str = "completed",
        context: Optional[str] = None
    ) -> None:
        """Registra um sinal explícito ou implícito de preferência musical."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO music_taste_signals (user_id, track_id, artist, signal_type, context)
        VALUES (?, ?, ?, ?, ?)
        """, (user_id, track_id, artist or "", signal_type, context or ""))
        conn.commit()
        conn.close()

    @staticmethod
    def get_taste_profile(user_id: str, limit: int = 10) -> Dict[str, Any]:
        """
        Calcula o perfil de gosto do usuário baseado em sinais ponderados:
        - liked: 3.0
        - added_to_playlist: 3.0
        - replayed: 2.5
        - completed: 2.0
        - playback_history: 1.0
        - skipped_early: -1.5
        """
        conn = get_db_connection()
        cursor = conn.cursor()

        # Top artistas ponderados
        cursor.execute("""
        SELECT artist,
               SUM(CASE
                   WHEN signal_type IN ('liked', 'added_to_playlist') THEN 3.0
                   WHEN signal_type = 'replayed' THEN 2.5
                   WHEN signal_type = 'completed' THEN 2.0
                   WHEN signal_type = 'skipped_early' THEN -1.5
                   ELSE 1.0
               END) as score,
               COUNT(*) as total_signals
        FROM music_taste_signals
        WHERE user_id = ? AND artist != '' AND artist IS NOT NULL
        GROUP BY artist
        HAVING score > 0
        ORDER BY score DESC
        LIMIT ?
        """, (user_id, limit))
        top_artists_signals = [dict(r) for r in cursor.fetchall()]

        # Top faixas ponderadas
        cursor.execute("""
        SELECT track_id, artist,
               SUM(CASE
                   WHEN signal_type IN ('liked', 'added_to_playlist') THEN 3.0
                   WHEN signal_type = 'replayed' THEN 2.5
                   WHEN signal_type = 'completed' THEN 2.0
                   WHEN signal_type = 'skipped_early' THEN -1.5
                   ELSE 1.0
               END) as score
        FROM music_taste_signals
        WHERE user_id = ?
        GROUP BY track_id, artist
        HAVING score > 0
        ORDER BY score DESC
        LIMIT ?
        """, (user_id, limit))
        top_tracks_signals = [dict(r) for r in cursor.fetchall()]

        conn.close()
        return {
            "top_artists": top_artists_signals,
            "top_tracks": top_tracks_signals
        }

    @staticmethod
    def get_top_artists(user_id: str, limit: int = 6) -> List[Dict[str, Any]]:
        """Retorna os artistas mais reproduzidos pelo usuário para o motor de Mix Diário."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        SELECT artist, COUNT(*) as play_count, MAX(thumbnail) as thumbnail
        FROM playback_history
        WHERE user_id = ?
        GROUP BY artist
        ORDER BY play_count DESC
        LIMIT ?
        """, (user_id, limit))
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    @staticmethod
    def toggle_like(user_id: str, track: Dict[str, Any]) -> bool:
        """Adiciona ou remove uma música das curtidas."""
        track_id = track.get("id")
        if not track_id:
            return False

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM liked_songs WHERE user_id = ? AND id = ?", (user_id, track_id))
        exists = cursor.fetchone()

        if exists:
            cursor.execute("DELETE FROM liked_songs WHERE user_id = ? AND id = ?", (user_id, track_id))
            is_liked = False
        else:
            now = int(time.time())
            cursor.execute("""
            INSERT INTO liked_songs (id, user_id, title, artist, album, thumbnail, duration, liked_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                track_id,
                user_id,
                track.get("title", "Desconhecido"),
                track.get("artist", "Desconhecido"),
                track.get("album", ""),
                track.get("thumbnail", ""),
                track.get("duration", 0),
                now
            ))
            is_liked = True

        conn.commit()
        conn.close()
        return is_liked

    @staticmethod
    def get_liked_songs(user_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Retorna as faixas curtidas pelo usuário."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        SELECT id, title, artist, album, thumbnail, duration, liked_at
        FROM liked_songs
        WHERE user_id = ?
        ORDER BY liked_at DESC
        LIMIT ?
        """, (user_id, limit))
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    @staticmethod
    def is_song_liked(user_id: str, track_id: str) -> bool:
        """Verifica se uma faixa está curtida."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM liked_songs WHERE user_id = ? AND id = ?", (user_id, track_id))
        row = cursor.fetchone()
        conn.close()
        return bool(row)

    @staticmethod
    def create_playlist(user_id: str, title: str, description: str = "", thumbnail: str = "", is_ai_generated: bool = False) -> Dict[str, Any]:
        """Cria uma nova playlist para o usuário."""
        playlist_id = f"pl_{uuid.uuid4().hex[:12]}"
        now = int(time.time())
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO user_playlists (id, user_id, title, description, thumbnail, is_ai_generated, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (playlist_id, user_id, title, description, thumbnail, 1 if is_ai_generated else 0, now, now))
        conn.commit()
        conn.close()
        return {
            "id": playlist_id,
            "title": title,
            "description": description,
            "thumbnail": thumbnail,
            "is_ai_generated": is_ai_generated,
            "track_count": 0
        }

    @staticmethod
    def get_playlists(user_id: str) -> List[Dict[str, Any]]:
        """Alias para get_user_playlists."""
        return MusicDatabase.get_user_playlists(user_id)

    @staticmethod
    def get_user_playlists(user_id: str) -> List[Dict[str, Any]]:
        """Retorna todas as playlists do usuário com contagem de faixas."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        SELECT p.id, p.title, p.description, p.thumbnail, p.is_ai_generated, p.created_at, p.updated_at,
               COUNT(pt.track_id) as track_count
        FROM user_playlists p
        LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
        WHERE p.user_id = ?
        GROUP BY p.id
        ORDER BY p.updated_at DESC
        """, (user_id,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    @staticmethod
    def add_track_to_playlist(playlist_id: str, track: Dict[str, Any]) -> bool:
        """Adiciona uma faixa a uma playlist existente."""
        track_id = track.get("id")
        if not track_id:
            return False

        conn = get_db_connection()
        cursor = conn.cursor()
        now = int(time.time())

        cursor.execute("SELECT MAX(position) FROM playlist_tracks WHERE playlist_id = ?", (playlist_id,))
        max_pos = cursor.fetchone()[0]
        next_pos = (max_pos + 1) if max_pos is not None else 0

        try:
            cursor.execute("""
            INSERT INTO playlist_tracks (playlist_id, track_id, title, artist, album, thumbnail, duration, added_at, position)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                playlist_id,
                track_id,
                track.get("title", "Desconhecido"),
                track.get("artist", "Desconhecido"),
                track.get("album", ""),
                track.get("thumbnail", ""),
                track.get("duration", 0),
                now,
                next_pos
            ))
            cursor.execute("UPDATE user_playlists SET updated_at = ? WHERE id = ?", (now, playlist_id))
            conn.commit()
            success = True
        except sqlite3.IntegrityError:
            success = False
        finally:
            conn.close()

        return success

    @staticmethod
    def get_playlist_tracks(playlist_id: str) -> List[Dict[str, Any]]:
        """Retorna todas as faixas de uma playlist em ordem."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        SELECT track_id AS id, title, artist, album, thumbnail, duration, added_at, position
        FROM playlist_tracks
        WHERE playlist_id = ?
        ORDER BY position ASC
        """, (playlist_id,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    @staticmethod
    def get_daily_mixes_cache(user_id: str, date_key: str) -> Optional[List[Dict[str, Any]]]:
        """Obtém mixes diários persistidos no SQLite para a data atual."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        SELECT mixes_json FROM daily_mix_cache WHERE user_id = ? AND date_key = ?
        """, (user_id, date_key))
        row = cursor.fetchone()
        conn.close()
        if row and row["mixes_json"]:
            try:
                return json.loads(row["mixes_json"])
            except Exception:
                return None
        return None

    @staticmethod
    def save_daily_mixes_cache(user_id: str, date_key: str, mixes: List[Dict[str, Any]]) -> None:
        """Persiste os Daily Mixes no SQLite com chave da data atual."""
        conn = get_db_connection()
        cursor = conn.cursor()
        now = int(time.time())
        cursor.execute("""
        INSERT OR REPLACE INTO daily_mix_cache (user_id, date_key, mixes_json, generated_at)
        VALUES (?, ?, ?, ?)
        """, (user_id, date_key, json.dumps(mixes, ensure_ascii=False), now))
        conn.commit()
        conn.close()

    @staticmethod
    def delete_playlist(playlist_id: str, user_id: str) -> bool:
        """Exclui uma playlist do usuário."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM user_playlists WHERE id = ? AND user_id = ?", (playlist_id, user_id))
        cursor.execute("DELETE FROM playlist_tracks WHERE playlist_id = ?", (playlist_id,))
        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return deleted

    @staticmethod
    def get_loudness(track_id: str) -> Optional[Dict[str, Any]]:
        """Recupera o LUFS integrado e o fator de ajuste de ganho para uma faixa."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        SELECT track_id, lufs_integrated, gain_adjustment, analyzed_at
        FROM track_loudness
        WHERE track_id = ?
        """, (track_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return dict(row)
        return None

    @staticmethod
    def save_loudness(track_id: str, lufs_integrated: float, gain_adjustment: float) -> None:
        """Salva a medição de LUFS e o fator de ganho ReplayGain no banco SQLite."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT OR REPLACE INTO track_loudness (track_id, lufs_integrated, gain_adjustment)
        VALUES (?, ?, ?)
        """, (track_id, round(lufs_integrated, 2), round(gain_adjustment, 4)))
        conn.commit()
        conn.close()

    @staticmethod
    def record_session_metric(
        user_id: str,
        track_id: str,
        estimated_bpm: int = 120,
        volume_level: float = 1.0,
        context_tag: str = ""
    ) -> None:
        """Grava uma tupla [timestamp, dia_da_semana, hora, bpm_medio, nivel_volume] para clustering."""
        conn = get_db_connection()
        cursor = conn.cursor()
        now = int(time.time())
        local_time = time.localtime(now)
        day_of_week = local_time.tm_wday # 0 = Segunda, 6 = Domingo
        hour_of_day = local_time.tm_hour

        cursor.execute("""
        INSERT INTO playback_session_metrics (
            user_id, track_id, played_at, day_of_week, hour_of_day, estimated_bpm, volume_level, context_tag
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, track_id, now, day_of_week, hour_of_day, estimated_bpm, volume_level, context_tag))
        conn.commit()
        conn.close()

    @staticmethod
    def get_session_metrics(user_id: str, limit: int = 200) -> List[Dict[str, Any]]:
        """Retorna tuplas de métricas para a rotina de clustering."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        SELECT track_id, played_at, day_of_week, hour_of_day, estimated_bpm, volume_level, context_tag
        FROM playback_session_metrics
        WHERE user_id = ?
        ORDER BY played_at DESC
        LIMIT ?
        """, (user_id, limit))
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    @staticmethod
    def save_user_moment(
        user_id: str,
        moment_id: str,
        moment_name: str,
        subtitle: str,
        time_start_hour: int,
        time_end_hour: int,
        days_of_week: str = "all",
        target_bpm_min: int = 60,
        target_bpm_max: int = 180,
        preferred_genres: str = "",
        source: str = "clustering"
    ) -> None:
        """Salva ou atualiza uma entidade de momento identificada pela Luci."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT OR REPLACE INTO user_moments (
            id, user_id, moment_name, subtitle, time_start_hour, time_end_hour,
            days_of_week, target_bpm_min, target_bpm_max, preferred_genres, is_active, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        """, (
            moment_id, user_id, moment_name, subtitle, time_start_hour, time_end_hour,
            days_of_week, target_bpm_min, target_bpm_max, preferred_genres, source
        ))
        conn.commit()
        conn.close()

    @staticmethod
    def get_active_moments_for_now(user_id: str) -> List[Dict[str, Any]]:
        """Retorna os momentos contextuais ativos para o dia e horário atuais."""
        conn = get_db_connection()
        cursor = conn.cursor()
        now = time.localtime()
        current_hour = now.tm_hour
        current_day = str(now.tm_wday) # 0 a 6

        cursor.execute("""
        SELECT id, moment_name, subtitle, time_start_hour, time_end_hour, days_of_week,
               target_bpm_min, target_bpm_max, preferred_genres, source
        FROM user_moments
        WHERE user_id = ? AND is_active = 1
          AND time_start_hour <= ? AND time_end_hour >= ?
          AND (days_of_week = 'all' OR days_of_week LIKE ?)
        ORDER BY source DESC, time_start_hour ASC
        """, (user_id, current_hour, current_hour, f"%{current_day}%"))
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    @staticmethod
    def add_search_history(user_id: str, query_text: str, entity_type: str = "text", target_id: str = "") -> None:
        """Salva uma busca recente no histórico do usuário."""
        if not query_text or not query_text.strip():
            return
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS search_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            query_text TEXT NOT NULL,
            entity_type TEXT DEFAULT 'text',
            target_id TEXT DEFAULT '',
            searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        # Remove busca duplicada do mesmo termo para manter o mais recente no topo
        cursor.execute("DELETE FROM search_history WHERE user_id = ? AND query_text = ?", (user_id, query_text.strip()))
        cursor.execute("""
        INSERT INTO search_history (user_id, query_text, entity_type, target_id)
        VALUES (?, ?, ?, ?)
        """, (user_id, query_text.strip(), entity_type, target_id or ""))
        conn.commit()
        conn.close()

    @staticmethod
    def get_search_history(user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Retorna os últimos termos ou faixas pesquisadas pelo usuário."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS search_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            query_text TEXT NOT NULL,
            entity_type TEXT DEFAULT 'text',
            target_id TEXT DEFAULT '',
            searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        cursor.execute("""
        SELECT id, query_text, entity_type, target_id, searched_at
        FROM search_history
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT ?
        """, (user_id, limit))
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    @staticmethod
    def clear_search_history(user_id: str) -> None:
        """Limpa todo o histórico de busca do usuário."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM search_history WHERE user_id = ?", (user_id,))
        conn.commit()
        conn.close()

    @staticmethod
    def delete_search_history_item(user_id: str, item_id: int) -> None:
        """Remove um item específico do histórico de busca."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM search_history WHERE user_id = ? AND id = ?", (user_id, item_id))
        conn.commit()
        conn.close()

    @staticmethod
    def toggle_follow_artist(user_id: str, artist_id: str, artist_name: str, avatar_url: str = "") -> bool:
        """Adiciona ou remove um artista seguido pelo usuário."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_followed_artists (
            artist_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            artist_name TEXT NOT NULL,
            avatar_url TEXT,
            followed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, artist_id)
        )
        """)
        cursor.execute("SELECT 1 FROM user_followed_artists WHERE user_id = ? AND artist_id = ?", (user_id, artist_id))
        exists = cursor.fetchone()
        if exists:
            cursor.execute("DELETE FROM user_followed_artists WHERE user_id = ? AND artist_id = ?", (user_id, artist_id))
            conn.commit()
            conn.close()
            return False
        else:
            cursor.execute("""
            INSERT INTO user_followed_artists (user_id, artist_id, artist_name, avatar_url)
            VALUES (?, ?, ?, ?)
            """, (user_id, artist_id, artist_name, avatar_url or ""))
            conn.commit()
            conn.close()
            return True

    @staticmethod
    def is_following_artist(user_id: str, artist_id: str) -> bool:
        """Verifica se o usuário segue o artista."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_followed_artists (
            artist_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            artist_name TEXT NOT NULL,
            avatar_url TEXT,
            followed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, artist_id)
        )
        """)
        cursor.execute("SELECT 1 FROM user_followed_artists WHERE user_id = ? AND artist_id = ?", (user_id, artist_id))
        row = cursor.fetchone()
        conn.close()
        return bool(row)

    @staticmethod
    def get_followed_artists(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Retorna todos os artistas seguidos pelo usuário."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_followed_artists (
            artist_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            artist_name TEXT NOT NULL,
            avatar_url TEXT,
            followed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, artist_id)
        )
        """)
        cursor.execute("""
        SELECT artist_id as id, artist_name as name, avatar_url as thumbnail, followed_at
        FROM user_followed_artists
        WHERE user_id = ?
        ORDER BY followed_at DESC
        LIMIT ?
        """, (user_id, limit))
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    @staticmethod
    def toggle_favorite_collection(
        user_id: str,
        collection_id: str,
        collection_type: str = "album",
        title: str = "",
        artist: str = "",
        cover_url: str = ""
    ) -> bool:
        """Salva ou remove um álbum/playlist dos favoritos da biblioteca do usuário."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_favorite_collections (
            user_id TEXT NOT NULL,
            collection_id TEXT NOT NULL,
            collection_type TEXT NOT NULL, -- 'album' ou 'playlist'
            title TEXT NOT NULL,
            artist TEXT DEFAULT '',
            cover_url TEXT DEFAULT '',
            saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, collection_id)
        )
        """)
        cursor.execute("SELECT 1 FROM user_favorite_collections WHERE user_id = ? AND collection_id = ?", (user_id, collection_id))
        exists = cursor.fetchone()
        if exists:
            cursor.execute("DELETE FROM user_favorite_collections WHERE user_id = ? AND collection_id = ?", (user_id, collection_id))
            conn.commit()
            conn.close()
            return False
        else:
            cursor.execute("""
            INSERT INTO user_favorite_collections (user_id, collection_id, collection_type, title, artist, cover_url)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (user_id, collection_id, collection_type, title, artist or "", cover_url or ""))
            conn.commit()
            conn.close()
            return True

    @staticmethod
    def is_collection_saved(user_id: str, collection_id: str) -> bool:
        """Verifica se o álbum ou playlist está nos favoritos do usuário."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_favorite_collections (
            user_id TEXT NOT NULL,
            collection_id TEXT NOT NULL,
            collection_type TEXT NOT NULL,
            title TEXT NOT NULL,
            artist TEXT DEFAULT '',
            cover_url TEXT DEFAULT '',
            saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, collection_id)
        )
        """)
        cursor.execute("SELECT 1 FROM user_favorite_collections WHERE user_id = ? AND collection_id = ?", (user_id, collection_id))
        row = cursor.fetchone()
        conn.close()
        return bool(row)

    @staticmethod
    def get_saved_albums(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Retorna todos os álbuns favoritados pelo usuário."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_favorite_collections (
            user_id TEXT NOT NULL,
            collection_id TEXT NOT NULL,
            collection_type TEXT NOT NULL,
            title TEXT NOT NULL,
            artist TEXT DEFAULT '',
            cover_url TEXT DEFAULT '',
            saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, collection_id)
        )
        """)
        cursor.execute("""
        SELECT collection_id as id, title, artist, cover_url, saved_at
        FROM user_favorite_collections
        WHERE user_id = ? AND collection_type = 'album'
        ORDER BY saved_at DESC
        LIMIT ?
        """, (user_id, limit))
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    @staticmethod
    def get_saved_playlists(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Retorna todas as playlists favoritadas pelo usuário."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_favorite_collections (
            user_id TEXT NOT NULL,
            collection_id TEXT NOT NULL,
            collection_type TEXT NOT NULL,
            title TEXT NOT NULL,
            artist TEXT DEFAULT '',
            cover_url TEXT DEFAULT '',
            saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, collection_id)
        )
        """)
        cursor.execute("""
        SELECT collection_id as id, title, artist, cover_url, saved_at
        FROM user_favorite_collections
        WHERE user_id = ? AND collection_type = 'playlist'
        ORDER BY saved_at DESC
        LIMIT ?
        """, (user_id, limit))
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

    @staticmethod
    def add_collection_history(
        user_id: str,
        collection_id: str,
        collection_type: str,
        title: str,
        subtitle: str,
        cover_url: str,
        last_track_index: int = 0
    ) -> None:
        """Registra a reprodução contínua de um álbum ou playlist para 'Continuar Ouvindo'."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_collection_history (
            user_id TEXT NOT NULL,
            collection_id TEXT NOT NULL,
            collection_type TEXT NOT NULL, -- 'album' ou 'playlist'
            title TEXT NOT NULL,
            subtitle TEXT NOT NULL,
            cover_url TEXT NOT NULL,
            last_track_index INTEGER DEFAULT 0,
            last_played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, collection_id, collection_type)
        )
        """)
        cursor.execute("""
        INSERT INTO user_collection_history (user_id, collection_id, collection_type, title, subtitle, cover_url, last_track_index, last_played_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, collection_id, collection_type) DO UPDATE SET
            title=excluded.title,
            subtitle=excluded.subtitle,
            cover_url=excluded.cover_url,
            last_track_index=excluded.last_track_index,
            last_played_at=CURRENT_TIMESTAMP
        """, (user_id, collection_id, collection_type, title, subtitle, cover_url, last_track_index))
        conn.commit()
        conn.close()

    @staticmethod
    def get_collection_history(user_id: str, limit: int = 6) -> List[Dict[str, Any]]:
        """Retorna os últimos álbuns e playlists ouvidos para o carrossel 'Continuar Ouvindo'."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_collection_history (
            user_id TEXT NOT NULL,
            collection_id TEXT NOT NULL,
            collection_type TEXT NOT NULL,
            title TEXT NOT NULL,
            subtitle TEXT NOT NULL,
            cover_url TEXT NOT NULL,
            last_track_index INTEGER DEFAULT 0,
            last_played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, collection_id, collection_type)
        )
        """)
        cursor.execute("""
        SELECT collection_id as id, collection_type as type, title, subtitle, cover_url, last_track_index
        FROM user_collection_history
        WHERE user_id = ?
        ORDER BY last_played_at DESC
        LIMIT ?
        """, (user_id, limit))
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]
