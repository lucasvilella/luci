"""
Módulo de Banco de Dados SQLite do LuciMusic.
Persistência de Músicas Curtidas, Playlists do Usuário e Histórico de Reprodução
para alimentar o Motor de Recomendação Dinâmica (Mix Diário estilo Spotify).
"""

import sqlite3
import os
import json
import time
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
    """Inicializa as tabelas do LuciMusic no SQLite."""
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

    # 4. Tabela de Histórico de Reprodução
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
        played_at INTEGER NOT NULL
    )
    """)

    # Índices para performance
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_history_user_artist ON playback_history (user_id, artist)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_history_played_at ON playback_history (played_at DESC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_liked_user ON liked_songs (user_id, liked_at DESC)")

    conn.commit()
    conn.close()

# Executa migração/inicialização ao importar
init_db()

class MusicDatabase:
    """Repositório de dados para o módulo LuciMusic."""

    @staticmethod
    def add_to_history(user_id: str, track: Dict[str, Any]):
        """Registra uma faixa ouvida no histórico do usuário."""
        conn = get_db_connection()
        cursor = conn.cursor()
        now = int(time.time())
        track_id = track.get("id")
        if not track_id:
            conn.close()
            return

        cursor.execute("""
        INSERT INTO playback_history (user_id, track_id, title, artist, album, thumbnail, duration, played_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            track_id,
            track.get("title", "Desconhecido"),
            track.get("artist", "Desconhecido"),
            track.get("album", ""),
            track.get("thumbnail", ""),
            track.get("duration", 0),
            now
        ))
        conn.commit()
        conn.close()

    @staticmethod
    def get_history(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Retorna faixas ÚNICAS (sem duplicatas) recentemente ouvidas."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        SELECT track_id AS id, title, artist, album, thumbnail, duration, MAX(played_at) as played_at
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
        """Adiciona ou remove uma música das curtidas. Retorna True se curtida, False se descurtida."""
        conn = get_db_connection()
        cursor = conn.cursor()
        track_id = track.get("id")
        if not track_id:
            conn.close()
            return False

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
    def create_playlist(user_id: str, title: str, description: str = "", thumbnail: str = "") -> str:
        """Cria uma nova playlist para o usuário."""
        import uuid
        playlist_id = f"pl_{uuid.uuid4().hex[:12]}"
        now = int(time.time())
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO user_playlists (id, user_id, title, description, thumbnail, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (playlist_id, user_id, title, description, thumbnail, now, now))
        conn.commit()
        conn.close()
        return playlist_id

    @staticmethod
    def get_user_playlists(user_id: str) -> List[Dict[str, Any]]:
        """Retorna todas as playlists do usuário com contagem de faixas."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        SELECT p.id, p.title, p.description, p.thumbnail, p.created_at, p.updated_at,
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
        conn = get_db_connection()
        cursor = conn.cursor()
        now = int(time.time())
        track_id = track.get("id")

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
