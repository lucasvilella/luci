"""
Hub Central de Conexões WebSocket da Luci (Omnichannel WebSocket Hub).
Permite que o Cérebro Centralizado emita comandos em tempo real (push)
para todos os clientes conectados (Web, PWA, APK Android, Desktop).
"""

import json
import asyncio
from typing import Dict, List, Set, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect

class WebSocketHubManager:
    def __init__(self):
        # Mapeamento: user_id -> Set de conexões ativas (celular, web, pc, etc.)
        self._active_connections: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, user_id: str, websocket: WebSocket, client_info: Optional[str] = "unknown"):
        await websocket.accept()
        async with self._lock:
            if user_id not in self._active_connections:
                self._active_connections[user_id] = set()
            self._active_connections[user_id].add(websocket)
        
        # Envia evento de boas-vindas e confirmação de conexão
        await self.send_personal_message(
            user_id=user_id,
            message={
                "event": "CONNECTION_ESTABLISHED",
                "payload": {
                    "user_id": user_id,
                    "client_info": client_info,
                    "status": "connected",
                    "channels": ["chat", "music", "voice", "system"]
                }
            },
            target_ws=websocket
        )
        print(f"[WebSocketHub] Cliente conectado: user={user_id} ({client_info}). Total conexões ativas: {len(self._active_connections.get(user_id, []))}")

    async def disconnect(self, user_id: str, websocket: WebSocket):
        async with self._lock:
            if user_id in self._active_connections:
                self._active_connections[user_id].discard(websocket)
                if not self._active_connections[user_id]:
                    del self._active_connections[user_id]
        print(f"[WebSocketHub] Cliente desconectado: user={user_id}")

    async def send_personal_message(self, user_id: str, message: Dict[str, Any], target_ws: WebSocket):
        """Envia mensagem para uma conexão específica."""
        try:
            await target_ws.send_text(json.dumps(message, ensure_ascii=False))
        except Exception as e:
            print(f"[WebSocketHub] Erro ao enviar mensagem individual: {e}")

    async def emit_to_user(self, user_id: str, event_type: str, payload: Dict[str, Any]):
        """
        Emite um evento proativo da Luci para TODOS os dispositivos conectados do usuário.
        Exemplos de eventos:
        - START_PLAYBACK: Faz o app tocar uma música ordenada por voz
        - PAUSE_PLAYBACK: Pausa a música em todos os dispositivos
        - NEW_MESSAGE: Notifica nova mensagem do chat em tempo real
        - SYNC_STATE: Atualiza o estado da fila ou preferências
        """
        async with self._lock:
            connections = list(self._active_connections.get(user_id, []))

        if not connections:
            return

        envelope = {
            "event": event_type,
            "payload": payload,
            "timestamp": int(asyncio.get_event_loop().time())
        }
        text_data = json.dumps(envelope, ensure_ascii=False)

        dead_connections = []
        for ws in connections:
            try:
                await ws.send_text(text_data)
            except Exception:
                dead_connections.append(ws)

        if dead_connections:
            async with self._lock:
                for dead_ws in dead_connections:
                    self._active_connections.get(user_id, set()).discard(dead_ws)

    async def broadcast(self, event_type: str, payload: Dict[str, Any]):
        """Emite um evento global para todos os usuários conectados."""
        envelope = {
            "event": event_type,
            "payload": payload,
            "timestamp": int(asyncio.get_event_loop().time())
        }
        text_data = json.dumps(envelope, ensure_ascii=False)

        async with self._lock:
            all_sockets = [ws for s in self._active_connections.values() for ws in s]

        for ws in all_sockets:
            try:
                await ws.send_text(text_data)
            except Exception:
                pass

# Instância Singleton do Hub
ws_hub = WebSocketHubManager()
