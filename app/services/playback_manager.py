"""
Gerenciador Central de Estado de Reprodução (Headless Playback Engine).
Mantém o estado ativo de cada usuário na memória/banco e sincroniza entre Web, PWA e APK nativo.
"""

import time
from typing import Dict, Any, Optional, List
from app.database.music_db import MusicDatabase

class PlaybackManagerService:
    def __init__(self):
        # Mapeamento em memória: user_id -> Estado da Sessão de Reprodução
        self._sessions: Dict[str, Dict[str, Any]] = {}

    def get_session(self, user_id: str) -> Dict[str, Any]:
        if user_id not in self._sessions:
            # Tenta recuperar última música ouvida no histórico
            history = MusicDatabase.get_history(user_id, limit=1)
            last_track = history[0] if history else None
            self._sessions[user_id] = {
                "user_id": user_id,
                "current_track": last_track,
                "queue": [last_track] if last_track else [],
                "queue_index": 0,
                "is_playing": False,
                "progress_seconds": 0,
                "repeat_mode": "off", # off | all | one
                "shuffle": False,
                "updated_at": int(time.time())
            }
        return self._sessions[user_id]

    def set_current_track(self, user_id: str, track: Dict[str, Any], queue: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        session = self.get_session(user_id)
        session["current_track"] = track
        session["is_playing"] = True
        session["progress_seconds"] = 0
        session["updated_at"] = int(time.time())

        if queue and len(queue) > 0:
            session["queue"] = queue
            try:
                session["queue_index"] = next(i for i, t in enumerate(queue) if t.get("id") == track.get("id"))
            except StopIteration:
                session["queue_index"] = 0
        else:
            session["queue"] = [track]
            session["queue_index"] = 0

        # Grava histórico no SQLite central
        MusicDatabase.add_to_history(user_id, track)
        return session

    def update_playback_state(self, user_id: str, is_playing: bool, progress_seconds: int = 0) -> Dict[str, Any]:
        session = self.get_session(user_id)
        session["is_playing"] = is_playing
        session["progress_seconds"] = progress_seconds
        session["updated_at"] = int(time.time())
        return session

    def next_track(self, user_id: str) -> Optional[Dict[str, Any]]:
        session = self.get_session(user_id)
        queue = session.get("queue", [])
        idx = session.get("queue_index", 0)

        if len(queue) == 0:
            return None

        if idx < len(queue) - 1:
            next_idx = idx + 1
            session["queue_index"] = next_idx
            session["current_track"] = queue[next_idx]
            session["progress_seconds"] = 0
            session["is_playing"] = True
            MusicDatabase.add_to_history(user_id, queue[next_idx])
            return session
        elif session.get("repeat_mode") == "all" and len(queue) > 0:
            session["queue_index"] = 0
            session["current_track"] = queue[0]
            session["progress_seconds"] = 0
            session["is_playing"] = True
            MusicDatabase.add_to_history(user_id, queue[0])
            return session
        else:
            session["is_playing"] = False
            return session

    def prev_track(self, user_id: str) -> Optional[Dict[str, Any]]:
        session = self.get_session(user_id)
        queue = session.get("queue", [])
        idx = session.get("queue_index", 0)

        if len(queue) == 0:
            return None

        if idx > 0:
            prev_idx = idx - 1
            session["queue_index"] = prev_idx
            session["current_track"] = queue[prev_idx]
            session["progress_seconds"] = 0
            session["is_playing"] = True
            MusicDatabase.add_to_history(user_id, queue[prev_idx])
            return session
        else:
            session["progress_seconds"] = 0
            return session

playback_manager = PlaybackManagerService()
