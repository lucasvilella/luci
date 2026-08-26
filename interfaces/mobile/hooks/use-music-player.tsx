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
import { voiceInputManager } from "@/lib/voice-input-manager"

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
  duckPlayerVolume: (targetLevel?: number, durationMs?: number) => void
  restorePlayerVolume: (durationMs?: number) => void
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

  // Refs mutáveis para evitar closures desatualizadas nos eventos do player
  const queueRef = useRef<LuciTrack[]>([])
  const queueIndexRef = useRef<number>(-1)
  const repeatRef = useRef<RepeatMode>("off")
  const playTrackRef = useRef<(track: LuciTrack, contextQueue?: LuciTrack[]) => Promise<void>>(() => Promise.resolve())
  const hasEndedHandledRef = useRef<boolean>(false)

  useEffect(() => {
    queueRef.current = queue
  }, [queue])

  useEffect(() => {
    queueIndexRef.current = queueIndex
  }, [queueIndex])

  useEffect(() => {
    repeatRef.current = repeat
  }, [repeat])

  // ─── Disparo garantido de fim de faixa ───
  const triggerTrackEnded = useCallback(() => {
    if (hasEndedHandledRef.current) return
    hasEndedHandledRef.current = true

    const currentRepeat = repeatRef.current
    const currentQ = queueRef.current
    const currentIdx = queueIndexRef.current

    if (currentRepeat === "one") {
      if (ytPlayerRef.current?.seekTo) {
        ytPlayerRef.current.seekTo(0, true)
        ytPlayerRef.current.playVideo()
      }
      setTimeout(() => {
        hasEndedHandledRef.current = false
      }, 1000)
      return
    }

    if (currentIdx < currentQ.length - 1) {
      const nextIdx = currentIdx + 1
      setQueueIndex(nextIdx)
      playTrackRef.current(currentQ[nextIdx], currentQ)
    } else if (currentRepeat === "all" && currentQ.length > 0) {
      setQueueIndex(0)
      playTrackRef.current(currentQ[0], currentQ)
    } else {
      setIsPlaying(false)
    }

    setTimeout(() => {
      hasEndedHandledRef.current = false
    }, 1500)
  }, [])

  // ─── 1. Inicializar YouTube IFrame Player (SimpMusic Engine Oficial) ───
  useEffect(() => {
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
                hasEndedHandledRef.current = false
                if (ytPlayerRef.current?.getDuration) {
                  const d = ytPlayerRef.current.getDuration()
                  if (d > 0) setDuration(d)
                }
              } else if (event.data === 2) {
                setIsPlaying(false)
              } else if (event.data === 3) {
                setIsLoading(true)
              } else if (event.data === 0) {
                triggerTrackEnded()
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

    // Intervalo suave de atualização do progresso com verificação de fim de faixa
    progressIntervalRef.current = setInterval(() => {
      if (ytPlayerRef.current && isPlayerReadyRef.current) {
        try {
          let cur = 0
          let dur = 0
          if (typeof ytPlayerRef.current.getCurrentTime === "function") {
            cur = ytPlayerRef.current.getCurrentTime()
            if (typeof cur === "number" && !isNaN(cur)) {
              setProgress(cur)
            }
          }
          if (typeof ytPlayerRef.current.getDuration === "function") {
            dur = ytPlayerRef.current.getDuration()
            if (typeof dur === "number" && dur > 0) {
              setDuration(dur)
            }
          }

          // Fallback seguro: se a faixa atingiu o final (dur > 5 e cur >= dur - 0.5) e o estado não disparou
          if (dur > 5 && cur > 0 && cur >= dur - 0.8 && !hasEndedHandledRef.current) {
            triggerTrackEnded()
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

  // ─── 2. Web MediaSession API (Controle na Tela de Bloqueio e Notificação do Android) ───
  useEffect(() => {
    if ("mediaSession" in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || "LuciMusic",
        artwork: [
          { src: currentTrack.thumbnail, sizes: "512x512", type: "image/jpeg" },
        ],
      })

      navigator.mediaSession.setActionHandler("play", () => {
        ytPlayerRef.current?.playVideo()
        setIsPlaying(true)
      })

      navigator.mediaSession.setActionHandler("pause", () => {
        ytPlayerRef.current?.pauseVideo()
        setIsPlaying(false)
      })

      navigator.mediaSession.setActionHandler("previoustrack", () => {
        prev()
      })

      navigator.mediaSession.setActionHandler("nexttrack", () => {
        next()
      })

      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null) {
          seek(details.seekTime)
        }
      })
    }
  }, [currentTrack])

  // ─── 3. Reproduzir Faixa ───
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

    // Reset ganho para 1.0 (neutro) e busca normalização de loudness pré-calculada
    currentGainAdjustmentRef.current = 1.0
    fetch(`/api/v1/music/loudness/${track.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.gain_adjustment === "number") {
          currentGainAdjustmentRef.current = data.gain_adjustment
          if (ytPlayerRef.current?.setVolume) {
            applyNormalizedVolume(volume)
          }
        }
      })
      .catch(() => {})

    // Tocar no player oficial
    const startPlay = () => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === "function") {
        ytPlayerRef.current.loadVideoById(track.id)
        applyNormalizedVolume(volume)
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
  }, [applyNormalizedVolume, volume])

  useEffect(() => {
    playTrackRef.current = playTrack
  }, [playTrack])

  // ─── 4. Próxima / Fim de Faixa ───
  const handleTrackEnded = useCallback(() => {
    triggerTrackEnded()
  }, [triggerTrackEnded])

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

  const currentGainAdjustmentRef = useRef<number>(1.0)

  const applyNormalizedVolume = useCallback((baseVol: number) => {
    if (!ytPlayerRef.current?.setVolume) return
    const gain = currentGainAdjustmentRef.current || 1.0
    // Aplica o fator de ganho ao volume base com teto de 100%
    const normalized = Math.max(0, Math.min(100, baseVol * gain * 100))
    ytPlayerRef.current.setVolume(normalized)
  }, [])

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v))
    setVolumeState(clamped)
    preDuckVolumeRef.current = clamped
    applyNormalizedVolume(clamped)
  }, [applyNormalizedVolume])

  // Ducking suave escalonado no YouTube Iframe Player
  const duckPlayerVolume = useCallback((targetLevel = 0.15, durationMs = 150) => {
    if (duckIntervalRef.current) {
      clearInterval(duckIntervalRef.current)
      duckIntervalRef.current = null
    }

    const currentVol = volume
    preDuckVolumeRef.current = currentVol
    const target = Math.max(0, Math.min(1, targetLevel))
    const steps = 10
    const stepTime = Math.max(10, Math.floor(durationMs / steps))
    let currentStep = 0

    duckIntervalRef.current = setInterval(() => {
      currentStep++
      const progressRatio = currentStep / steps
      const newVol = currentVol + (target - currentVol) * progressRatio
      setVolumeState(newVol)
      applyNormalizedVolume(newVol)
      if (currentStep >= steps) {
        clearInterval(duckIntervalRef.current)
        duckIntervalRef.current = null
      }
    }, stepTime)
  }, [volume, applyNormalizedVolume])

  // Restauração suave do volume do player
  const restorePlayerVolume = useCallback((durationMs = 200) => {
    if (duckIntervalRef.current) {
      clearInterval(duckIntervalRef.current)
      duckIntervalRef.current = null
    }

    const currentVol = volume
    const target = preDuckVolumeRef.current || 1.0
    const steps = 10
    const stepTime = Math.max(10, Math.floor(durationMs / steps))
    let currentStep = 0

    duckIntervalRef.current = setInterval(() => {
      currentStep++
      const progressRatio = currentStep / steps
      const newVol = currentVol + (target - currentVol) * progressRatio
      setVolumeState(newVol)
      if (ytPlayerRef.current?.setVolume) {
        ytPlayerRef.current.setVolume(newVol * 100)
      }
      if (currentStep >= steps) {
        clearInterval(duckIntervalRef.current)
        duckIntervalRef.current = null
      }
    }, stepTime)
  }, [volume])

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

  // ─── Media Session API (Nativo Android Lockscreen & Notificação) ───
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return

    if (currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || "Luci Music",
        artwork: [
          { src: currentTrack.thumbnail, sizes: "96x96", type: "image/jpeg" },
          { src: currentTrack.thumbnail, sizes: "128x128", type: "image/jpeg" },
          { src: currentTrack.thumbnail, sizes: "192x192", type: "image/jpeg" },
          { src: currentTrack.thumbnail, sizes: "256x256", type: "image/jpeg" },
          { src: currentTrack.thumbnail, sizes: "384x384", type: "image/jpeg" },
          { src: currentTrack.thumbnail, sizes: "512x512", type: "image/jpeg" },
        ],
      })

      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused"

      try {
        navigator.mediaSession.setActionHandler("play", () => togglePlay())
        navigator.mediaSession.setActionHandler("pause", () => togglePlay())
        navigator.mediaSession.setActionHandler("previoustrack", () => prev())
        navigator.mediaSession.setActionHandler("nexttrack", () => next())
        navigator.mediaSession.setActionHandler("seekto", (details) => {
          if (details.seekTime !== undefined && details.seekTime !== null) {
            seek(details.seekTime)
          }
        })
        navigator.mediaSession.setActionHandler("seekbackward", () => {
          seek(Math.max(0, progress - 10))
        })
        navigator.mediaSession.setActionHandler("seekforward", () => {
          seek(Math.min(duration, progress + 10))
        })
      } catch (e) {
        console.warn("[MediaSession] Falha ao registrar handler:", e)
      }
    }
  }, [currentTrack, isPlaying, progress, duration, togglePlay, prev, next, seek])

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
      duckPlayerVolume,
      restorePlayerVolume,
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
      duckPlayerVolume,
      restorePlayerVolume,
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
