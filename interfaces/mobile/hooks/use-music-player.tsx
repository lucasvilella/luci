"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  type LuciTrack,
  type LyricsData,
  formatSeconds,
  fetchLyrics,
  fetchRadioTracks,
  toggleLikeTrack,
  fetchLikedTracks,
  recordTrackPlayed,
} from "@/lib/lucimusic"

// ─── Tipos ───────────────────────────────────────────────────────────

export type RepeatMode = "off" | "all" | "one"

export type MusicPlayerState = {
  currentTrack: LuciTrack | null
  queue: LuciTrack[]
  queueIndex: number
  isPlaying: boolean
  isLoading: boolean
  progress: number       // tempo atual em segundos
  duration: number       // duração total em segundos
  volume: number         // 0..1
  shuffle: boolean
  repeat: RepeatMode
  likedIds: Set<string>  // IDs das músicas curtidas
  lyrics: LyricsData | null
  loadingLyrics: boolean
}

export type MusicPlayerActions = {
  playTrack: (track: LuciTrack, contextQueue?: LuciTrack[]) => void
  togglePlay: () => void
  pause: () => void
  resume: () => void
  next: () => void
  prev: () => void
  seek: (seconds: number) => void
  setVolume: (v: number) => void
  toggleShuffle: () => void
  toggleRepeat: () => void
  toggleLike: (track: LuciTrack) => Promise<void>
  isLiked: (trackId: string) => boolean
  formatTime: (s: number) => string
  addToQueue: (track: LuciTrack) => void
  removeFromQueue: (index: number) => void
  loadLyricsForCurrent: () => Promise<void>
}

export type MusicPlayerContextValue = MusicPlayerState & MusicPlayerActions

// ─── Contexto ─────────────────────────────────────────────────────────

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null)

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<LuciTrack | null>(null)
  const [queue, setQueue] = useState<LuciTrack[]>([])
  const [queueIndex, setQueueIndex] = useState<number>(-1)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [duration, setDuration] = useState<number>(0)
  const [volume, setVolumeState] = useState<number>(1)
  const [shuffle, setShuffle] = useState<boolean>(false)
  const [repeat, setRepeat] = useState<RepeatMode>("off")
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [lyrics, setLyrics] = useState<LyricsData | null>(null)
  const [loadingLyrics, setLoadingLyrics] = useState<boolean>(false)

  const originalQueueRef = useRef<LuciTrack[]>([])
  const ytPlayerRef = useRef<any>(null)
  const isPlayerReadyRef = useRef<boolean>(false)
  const progressIntervalRef = useRef<any>(null)

  // ─── 1. Inicializar YouTube IFrame Player (SimpMusic Engine Oficial) ───
  useEffect(() => {
    // Carrega script do YouTube IFrame API se ainda não existir
    if (!document.getElementById("yt-iframe-api")) {
      const tag = document.createElement("script")
      tag.id = "yt-iframe-api"
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag)
    }

    const initPlayer = () => {
      if (window.YT && window.YT.Player) {
        ytPlayerRef.current = new window.YT.Player("youtube-audio-engine", {
          height: "1",
          width: "1",
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              isPlayerReadyRef.current = true
            },
            onStateChange: (event: any) => {
              // 1 = PLAYING, 2 = PAUSED, 0 = ENDED, 3 = BUFFERING
              if (event.data === 1) {
                setIsPlaying(true)
                setIsLoading(false)
                if (ytPlayerRef.current?.getDuration) {
                  const d = ytPlayerRef.current.getDuration()
                  if (d > 0) setDuration(d)
                }
              } else if (event.data === 2) {
                setIsPlaying(false)
              } else if (event.data === 3) {
                setIsLoading(true)
              } else if (event.data === 0) {
                handleTrackEnded()
              }
            },
            onError: (err: any) => {
              console.error("[SimpMusic Engine] Erro no reprodutor:", err)
              setIsLoading(false)
              setIsPlaying(false)
            },
          },
        })
      }
    }

    if (window.YT && window.YT.Player) {
      initPlayer()
    } else {
      window.onYouTubeIframeAPIReady = initPlayer
    }

    // Intervalo suave de atualização do progresso (a cada 250ms)
    progressIntervalRef.current = setInterval(() => {
      if (ytPlayerRef.current && isPlayerReadyRef.current) {
        try {
          if (typeof ytPlayerRef.current.getCurrentTime === "function") {
            const cur = ytPlayerRef.current.getCurrentTime()
            if (typeof cur === "number" && !isNaN(cur)) {
              setProgress(cur)
            }
          }
          if (typeof ytPlayerRef.current.getDuration === "function") {
            const dur = ytPlayerRef.current.getDuration()
            if (typeof dur === "number" && dur > 0) {
              setDuration(dur)
            }
          }
        } catch {}
      }
    }, 250)

    // Carregar curtidas iniciais
    fetchLikedTracks().then((tracks) => {
      setLikedIds(new Set(tracks.map((t) => t.id)))
    }).catch(() => {})

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      try {
        ytPlayerRef.current?.destroy()
      } catch {}
    }
  }, [])

  // ─── 2. Reproduzir Faixa ───
  const playTrack = useCallback(async (track: LuciTrack, contextQueue?: LuciTrack[]) => {
    setIsLoading(true)
    setCurrentTrack(track)
    setLyrics(null)
    setProgress(0)
    setDuration(track.duration || 0)

    // Fila
    if (contextQueue && contextQueue.length > 0) {
      originalQueueRef.current = contextQueue
      const idx = contextQueue.findIndex((t) => t.id === track.id)
      setQueue(contextQueue)
      setQueueIndex(idx >= 0 ? idx : 0)
    } else {
      setQueue([track])
      setQueueIndex(0)
      originalQueueRef.current = [track]

      fetchRadioTracks(track.id).then((related) => {
        if (related.length > 0) {
          setQueue((prev) => [...prev, ...related])
          originalQueueRef.current = [...originalQueueRef.current, ...related]
        }
      }).catch(() => {})
    }

    recordTrackPlayed(track)

    // Tocar no player oficial
    const startPlay = () => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === "function") {
        ytPlayerRef.current.loadVideoById(track.id)
        ytPlayerRef.current.playVideo()
        setIsPlaying(true)
      } else {
        setTimeout(startPlay, 200)
      }
    }
    startPlay()

    // Letras
    fetchLyrics(track.id, track.title, track.artist, track.duration)
      .then((l) => setLyrics(l))
      .catch(() => {})
  }, [])

  // ─── 3. Próxima / Fim de Faixa ───
  const handleTrackEnded = useCallback(() => {
    if (repeat === "one") {
      if (ytPlayerRef.current?.seekTo) {
        ytPlayerRef.current.seekTo(0, true)
        ytPlayerRef.current.playVideo()
      }
      return
    }

    if (queueIndex < queue.length - 1) {
      const nextIdx = queueIndex + 1
      setQueueIndex(nextIdx)
      playTrack(queue[nextIdx], queue)
    } else if (repeat === "all" && queue.length > 0) {
      setQueueIndex(0)
      playTrack(queue[0], queue)
    } else {
      setIsPlaying(false)
    }
  }, [queueIndex, queue, repeat, playTrack])

  const next = useCallback(() => {
    if (queue.length === 0) return
    if (queueIndex < queue.length - 1) {
      const nextIdx = queueIndex + 1
      setQueueIndex(nextIdx)
      playTrack(queue[nextIdx], queue)
    } else if (repeat === "all") {
      setQueueIndex(0)
      playTrack(queue[0], queue)
    }
  }, [queue, queueIndex, repeat, playTrack])

  const prev = useCallback(() => {
    if (progress > 3 && ytPlayerRef.current?.seekTo) {
      ytPlayerRef.current.seekTo(0, true)
      setProgress(0)
      return
    }
    if (queueIndex > 0) {
      const prevIdx = queueIndex - 1
      setQueueIndex(prevIdx)
      playTrack(queue[prevIdx], queue)
    } else if (ytPlayerRef.current?.seekTo) {
      ytPlayerRef.current.seekTo(0, true)
      setProgress(0)
    }
  }, [progress, queue, queueIndex, playTrack])

  const togglePlay = useCallback(() => {
    if (!ytPlayerRef.current) return
    if (isPlaying) {
      ytPlayerRef.current.pauseVideo()
      setIsPlaying(false)
    } else {
      ytPlayerRef.current.playVideo()
      setIsPlaying(true)
    }
  }, [isPlaying])

  const pause = useCallback(() => {
    ytPlayerRef.current?.pauseVideo()
    setIsPlaying(false)
  }, [])

  const resume = useCallback(() => {
    ytPlayerRef.current?.playVideo()
    setIsPlaying(true)
  }, [])

  const seek = useCallback((secs: number) => {
    if (ytPlayerRef.current?.seekTo) {
      ytPlayerRef.current.seekTo(secs, true)
      setProgress(secs)
    }
  }, [])

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v))
    setVolumeState(clamped)
    if (ytPlayerRef.current?.setVolume) {
      ytPlayerRef.current.setVolume(clamped * 100)
    }
  }, [])

  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => {
      const nextShuffle = !prev
      if (nextShuffle) {
        if (queue.length > 1 && currentTrack) {
          const rest = queue.filter((t) => t.id !== currentTrack.id)
          const shuffled = [...rest].sort(() => Math.random() - 0.5)
          setQueue([currentTrack, ...shuffled])
          setQueueIndex(0)
        }
      } else {
        setQueue(originalQueueRef.current)
        if (currentTrack) {
          const idx = originalQueueRef.current.findIndex((t) => t.id === currentTrack.id)
          setQueueIndex(idx >= 0 ? idx : 0)
        }
      }
      return nextShuffle
    })
  }, [queue, currentTrack])

  const toggleRepeat = useCallback(() => {
    setRepeat((prev) => (prev === "off" ? "all" : prev === "all" ? "one" : "off"))
  }, [])

  const toggleLike = useCallback(async (track: LuciTrack) => {
    const liked = likedIds.has(track.id)
    setLikedIds((prev) => {
      const nextSet = new Set(prev)
      if (liked) nextSet.delete(track.id)
      else nextSet.add(track.id)
      return nextSet
    })
    try {
      await toggleLikeTrack(track, liked)
    } catch {
      setLikedIds((prev) => {
        const revert = new Set(prev)
        if (liked) revert.add(track.id)
        else revert.delete(track.id)
        return revert
      })
    }
  }, [likedIds])

  const isLiked = useCallback((id: string) => likedIds.has(id), [likedIds])

  const addToQueue = useCallback((track: LuciTrack) => {
    setQueue((prev) => [...prev, track])
  }, [])

  const removeFromQueue = useCallback((idx: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== idx))
  }, [])

  const loadLyricsForCurrent = useCallback(async () => {
    if (!currentTrack) return
    setLoadingLyrics(true)
    try {
      const l = await fetchLyrics(currentTrack.id, currentTrack.title, currentTrack.artist, currentTrack.duration)
      setLyrics(l)
    } finally {
      setLoadingLyrics(false)
    }
  }, [currentTrack])

  const formatTime = useCallback((s: number) => formatSeconds(s), [])

  const value = useMemo<MusicPlayerContextValue>(
    () => ({
      currentTrack,
      queue,
      queueIndex,
      isPlaying,
      isLoading,
      progress,
      duration,
      volume,
      shuffle,
      repeat,
      likedIds,
      lyrics,
      loadingLyrics,
      playTrack,
      togglePlay,
      pause,
      resume,
      next,
      prev,
      seek,
      setVolume,
      toggleShuffle,
      toggleRepeat,
      toggleLike,
      isLiked,
      formatTime,
      addToQueue,
      removeFromQueue,
      loadLyricsForCurrent,
    }),
    [
      currentTrack,
      queue,
      queueIndex,
      isPlaying,
      isLoading,
      progress,
      duration,
      volume,
      shuffle,
      repeat,
      likedIds,
      lyrics,
      loadingLyrics,
      playTrack,
      togglePlay,
      pause,
      resume,
      next,
      prev,
      seek,
      setVolume,
      toggleShuffle,
      toggleRepeat,
      toggleLike,
      isLiked,
      formatTime,
      addToQueue,
      removeFromQueue,
      loadLyricsForCurrent,
    ]
  )

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
      {/* Contêiner invisível do motor oficial do YouTube IFrame (SimpMusic Engine) */}
      <div
        id="youtube-audio-engine-container"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "1px",
          height: "1px",
          opacity: 0.01,
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        <div id="youtube-audio-engine" />
      </div>
    </MusicPlayerContext.Provider>
  )
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext)
  if (!context) {
    throw new Error("useMusicPlayer deve ser usado dentro de um MusicPlayerProvider")
  }
  return context
}
