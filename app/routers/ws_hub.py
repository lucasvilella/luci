"""
Router do Hub WebSocket da Luci (Omnichannel WebSocket Hub Router).
Gerencia a conexão persistente de todos os clientes (Web, PWA, APK Android, Desktop).
"""

import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.services.ws_manager import ws_hub
from app.services.playback_manager import playback_manager
from app.services.brain_service import brain_service

router = APIRouter(prefix="/ws", tags=["WebSocket Hub"])

@router.websocket("/hub")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str = Query(default="lucas_default"),
    client_type: str = Query(default="web") # "web" | "pwa" | "apk" | "desktop"
):
    """
    Ponto de entrada WebSocket persistente para clientes da Luci.
    Todos os clientes devem se conectar a este endpoint ao inicializar o app.
    """
    await ws_hub.connect(user_id=user_id, websocket=websocket, client_info=client_type)
    
    # Envia imediatamente o estado atual de reprodução para sincronização instantânea
    current_session = playback_manager.get_session(user_id)
    await ws_hub.send_personal_message(
        user_id=user_id,
        message={
            "event": "SYNC_PLAYBACK_STATE",
            "payload": current_session
        },
        target_ws=websocket
    )

    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                message = json.loads(raw_data)
                action = message.get("action")
                payload = message.get("payload", {})

                # ─── 1. Ações de Reprodução de Música ───
                if action == "PLAY_TRACK":
                    track = payload.get("track")
                    queue = payload.get("queue")
                    if track:
                        updated_session = playback_manager.set_current_track(user_id, track, queue)
                        # Notifica todos os aparelhos do usuário para tocar a música
                        await ws_hub.emit_to_user(user_id, "START_PLAYBACK", updated_session)

                elif action == "UPDATE_PLAYBACK":
                    is_playing = payload.get("is_playing", False)
                    progress = payload.get("progress_seconds", 0)
                    updated_session = playback_manager.update_playback_state(user_id, is_playing, progress)
                    await ws_hub.emit_to_user(user_id, "PLAYBACK_STATE_CHANGED", updated_session)

                elif action == "NEXT_TRACK":
                    updated_session = playback_manager.next_track(user_id)
                    if updated_session:
                        await ws_hub.emit_to_user(user_id, "START_PLAYBACK", updated_session)

                elif action == "PREV_TRACK":
                    updated_session = playback_manager.prev_track(user_id)
                    if updated_session:
                        await ws_hub.emit_to_user(user_id, "START_PLAYBACK", updated_session)

                # ─── 2. Ping / Heartbeat ───
                elif action == "PING":
                    await websocket.send_text(json.dumps({"event": "PONG"}))

            except json.JSONDecodeError:
                pass
            except Exception as e:
                print(f"[WebSocketHub] Erro ao processar mensagem do cliente {user_id}: {e}")

    except WebSocketDisconnect:
        await ws_hub.disconnect(user_id=user_id, websocket=websocket)
    except Exception as e:
        print(f"[WebSocketHub] Conexão encerrada com erro ({user_id}): {e}")
        await ws_hub.disconnect(user_id=user_id, websocket=websocket)
