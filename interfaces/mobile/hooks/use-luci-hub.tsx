/**
 * Luci Omnichannel WebSocket Client Hook.
 * Gerencia a conexão persistente e bidirecional com o Cérebro Centralizado da Luci.
 * Funciona de forma idêntica em Web, PWA e WebView / React Native / Native Bridges.
 */

import { useEffect, useRef, useState, useCallback } from "react"
import { type LuciTrack } from "@/lib/lucimusic"

export interface PlaybackSessionState {
  user_id: string
  current_track: LuciTrack | null
  queue: LuciTrack[]
  queue_index: number
  is_playing: boolean
  progress_seconds: number
  repeat_mode: "off" | "all" | "one"
  shuffle: boolean
  updated_at: number
}

export type WebSocketEvent = 
  | { event: "CONNECTION_ESTABLISHED"; payload: any }
  | { event: "SYNC_PLAYBACK_STATE"; payload: PlaybackSessionState }
  | { event: "START_PLAYBACK"; payload: PlaybackSessionState }
  | { event: "PLAYBACK_STATE_CHANGED"; payload: PlaybackSessionState }
  | { event: "NEW_MESSAGE"; payload: any }

export function useLuciHub(userId: string = "lucas", clientType: string = "web") {
  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [sessionState, setSessionState] = useState<PlaybackSessionState | null>(null)

  // Callbacks registrados para escutar eventos
  const onStartPlaybackRef = useRef<((session: PlaybackSessionState) => void) | null>(null)

  const connect = useCallback(() => {
    if (typeof window === "undefined") return

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const host = window.location.host || "127.0.0.1:8000"
    const wsUrl = `${protocol}//${host}/ws/hub?user_id=${encodeURIComponent(userId)}&client_type=${encodeURIComponent(clientType)}`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log("[LuciHub] Conectado ao Cérebro Centralizado da Luci via WebSocket.")
      setIsConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const data: WebSocketEvent = JSON.parse(event.data)
        switch (data.event) {
          case "SYNC_PLAYBACK_STATE":
          case "PLAYBACK_STATE_CHANGED":
            setSessionState(data.payload)
            break
          case "START_PLAYBACK":
            setSessionState(data.payload)
            if (onStartPlaybackRef.current) {
              onStartPlaybackRef.current(data.payload)
            }
            break
        }
      } catch (err) {
        console.error("[LuciHub] Erro ao decodificar evento WS:", err)
      }
    }

    ws.onclose = () => {
      console.warn("[LuciHub] Desconectado. Tentando reconectar em 3s...")
      setIsConnected(false)
      setTimeout(connect, 3000)
    }

    ws.onerror = (err) => {
      console.error("[LuciHub] Erro no socket:", err)
    }
  }, [userId, clientType])

  useEffect(() => {
    connect()
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  const sendAction = useCallback((action: string, payload: any = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action, payload }))
    }
  }, [])

  const playTrackRemote = useCallback((track: LuciTrack, queue?: LuciTrack[]) => {
    sendAction("PLAY_TRACK", { track, queue })
  }, [sendAction])

  const updateStateRemote = useCallback((isPlaying: boolean, progressSeconds: number = 0) => {
    sendAction("UPDATE_PLAYBACK", { is_playing: isPlaying, progress_seconds: progressSeconds })
  }, [sendAction])

  const setOnStartPlayback = useCallback((cb: (session: PlaybackSessionState) => void) => {
    onStartPlaybackRef.current = cb
  }, [])

  return {
    isConnected,
    sessionState,
    sendAction,
    playTrackRemote,
    updateStateRemote,
    setOnStartPlayback,
  }
}
