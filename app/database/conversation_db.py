"""
Módulo de Banco de Dados Unificado de Conversação da Luci AI.
Armazena a timeline unificada de mensagens de Texto, Voz e Intérprete Simultâneo
para garantir contexto contínuo (Cérebro Único Omnichannel).
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
DB_PATH = DB_DIR / "conversations.db"

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Cria a tabela unificada de mensagens de conversa."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS conversation_messages (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL,                -- 'user', 'assistant', 'system'
        input_type TEXT NOT NULL,          -- 'text', 'voice', 'interpreter'
        content TEXT NOT NULL,             -- Texto da mensagem ou transcrição
        audio_file_path TEXT,              -- Caminho ou URL de áudio gerado/gravado
        metadata TEXT,                     -- JSON com dados extras (tools, latência, etc.)
        created_at INTEGER NOT NULL
    )
    """)

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_conv_user_created ON conversation_messages (user_id, created_at ASC)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_conv_type ON conversation_messages (input_type)")

    conn.commit()
    conn.close()

# Inicialização automática
init_db()

class ConversationDatabase:
    """Repositório de persistência de conversas do Cérebro da Luci."""

    @staticmethod
    def add_message(
        user_id: str,
        role: str,
        content: str,
        input_type: str = "text",
        audio_file_path: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Insere uma nova mensagem na timeline do usuário."""
        msg_id = f"msg_{uuid.uuid4().hex[:12]}"
        now = int(time.time() * 1000) # Milissegundos
        meta_str = json.dumps(metadata or {}, ensure_ascii=False)

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO conversation_messages (id, user_id, role, input_type, content, audio_file_path, metadata, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (msg_id, user_id, role, input_type, content, audio_file_path or "", meta_str, now))
        conn.commit()
        conn.close()

        return {
            "id": msg_id,
            "userId": user_id,
            "role": role,
            "inputType": input_type,
            "content": content,
            "audioFilePath": audio_file_path or "",
            "metadata": metadata or {},
            "createdAt": now
        }

    @staticmethod
    def get_recent_context_for_llm(user_id: str, limit: int = 15) -> List[Dict[str, str]]:
        """
        Retorna as últimas N mensagens do usuário no formato de histórico para a LLM,
        unificando mensagens geradas por Voz, Texto ou Intérprete.
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        SELECT role, content
        FROM conversation_messages
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
        """, (user_id, limit))
        rows = cursor.fetchall()
        conn.close()

        # Inverte para ordem cronológica (mais antiga -> mais recente)
        history = []
        for r in reversed(rows):
            history.append({
                "role": r["role"],
                "content": r["content"]
            })
        return history

    @staticmethod
    def get_timeline(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Retorna a timeline de mensagens para renderizar no frontend."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        SELECT id, user_id AS userId, role, input_type AS inputType, content, audio_file_path AS audioFilePath, metadata, created_at AS createdAt
        FROM conversation_messages
        WHERE user_id = ?
        ORDER BY created_at ASC
        LIMIT ?
        """, (user_id, limit))
        rows = cursor.fetchall()
        conn.close()

        timeline = []
        for r in rows:
            d = dict(r)
            try:
                d["metadata"] = json.loads(d.get("metadata") or "{}")
            except Exception:
                d["metadata"] = {}
            timeline.append(d)
        return timeline

    @staticmethod
    def clear_history(user_id: str):
        """Limpa o histórico de mensagens do usuário."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM conversation_messages WHERE user_id = ?", (user_id,))
        conn.commit()
        conn.close()
