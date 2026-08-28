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
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const currentGainAdjustmentRef = useRef<number>(1.0)
  const preDuckVolumeRef = useRef<number>(1.0)
  const duckIntervalRef = useRef<any>(null)

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

  // ─── Normalização de Volume com ReplayGain ───
  const applyNormalizedVolume = useCallback((baseVol: number) => {
    if (!audioElementRef.current) return
    const gain = currentGainAdjustmentRef.current || 1.0
    const normalized = Math.max(0, Math.min(1, baseVol * gain))
    audioElementRef.current.volume = normalized
  }, [])

  // ─── Disparo garantido de fim de faixa com fila infinita ───
  const triggerTrackEnded = useCallback(() => {
    if (hasEndedHandledRef.current) return
    hasEndedHandledRef.current = true

    const currentRepeat = repeatRef.current
    const currentQ = queueRef.current
    const currentIdx = queueIndexRef.current

    if (currentRepeat === "one") {
      if (audioElementRef.current) {
        audioElementRef.current.currentTime = 0
        audioElementRef.current.play().catch(() => {})
      }
      setTimeout(() => {
        hasEndedHandledRef.current = false
      }, 1000)
      return
    }

    if (currentIdx < currentQ.length - 1) {
      const nextIdx = currentIdx + 1
      setQueueIndex(nextIdx)
      queueIndexRef.current = nextIdx
      playTrackRef.current(currentQ[nextIdx], currentQ)
    } else if (currentRepeat === "all" && currentQ.length > 0) {
      setQueueIndex(0)
      queueIndexRef.current = 0
      playTrackRef.current(currentQ[0], currentQ)
    } else if (currentQ.length > 0) {
      // Fila infinita automática: busca novas músicas relacionadas baseadas na última tocada
      const lastTrack = currentQ[currentIdx] || currentQ[0]
      fetchRadioTracks(lastTrack.id).then((moreTracks) => {
        const filtered = moreTracks.filter((t) => !currentQ.some((q) => q.id === t.id))
        if (filtered.length > 0) {
          const newQ = [...currentQ, ...filtered]
          setQueue(newQ)
          queueRef.current = newQ
          const nextIdx = currentIdx + 1
          setQueueIndex(nextIdx)
          queueIndexRef.current = nextIdx
          playTrackRef.current(newQ[nextIdx], newQ)
        } else {
          setIsPlaying(false)
        }
      }).catch(() => {
        setIsPlaying(false)
      })
    } else {
      setIsPlaying(false)
    }

    setTimeout(() => {
      hasEndedHandledRef.current = false
    }, 1500)
  }, [])

  const preloadedTrackIdRef = useRef<string | null>(null)

  // ─── 1. Inicializar Elemento de Áudio HTML5 Nativo (Persiste em Tela Bloqueada) ───
  useEffect(() => {
    const audio = new Audio()
    audio.preload = "auto"
    audio.autoplay = true
    // Permite que o áudio continue tocando no Android mesmo com a tela desligada
    audio.crossOrigin = "anonymous"
    audioElementRef.current = audio

    const onPlay = () => {
      setIsPlaying(true)
      setIsLoading(false)
      hasEndedHandledRef.current = false
    }

    const onPause = () => {
      setIsPlaying(false)
    }

    const onWaiting = () => {
      setIsLoading(true)
    }

    const onPlaying = () => {
      setIsLoading(false)
      setIsPlaying(true)
    }

    const onTimeUpdate = () => {
      if (audio.currentTime && !isNaN(audio.currentTime)) {
        setProgress(audio.currentTime)

        // ── Pré-Carregamento Inteligente (Gapless/Fast Next Track) ──
        // Quando faltar menos de 12 segundos para a música acabar, já faz prefetch do stream da próxima música
        const remaining = (audio.duration || 0) - audio.currentTime
        if (remaining > 0 && remaining < 12) {
          const currentQ = queueRef.current
          const currentIdx = queueIndexRef.current
          const nextTrack = currentQ[currentIdx + 1]

          if (nextTrack && preloadedTrackIdRef.current !== nextTrack.id) {
            preloadedTrackIdRef.current = nextTrack.id
            // Prefetch do endpoint de stream para aquecer o cache do backend
            fetch(`/api/v1/music/play/${nextTrack.id}`, {
              headers: { Range: "bytes=0-1024" }
            }).catch(() => {})
          }
        }
      }
    }

    const onDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration)
      }
    }

    const onEnded = () => {
      triggerTrackEnded()
    }

    const onError = (e: any) => {
      console.error("[HTML5 Audio Engine] Erro no stream:", e)
      setIsLoading(false)
      setIsPlaying(false)
    }

    const onCanPlay = () => {
      setIsLoading(false)
      audio.play().catch(() => {})
    }

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration)
      }
    }

    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)
    audio.addEventListener("waiting", onWaiting)
    audio.addEventListener("playing", onPlaying)
    audio.addEventListener("canplay", onCanPlay)
    audio.addEventListener("loadedmetadata", onLoadedMetadata)
    audio.addEventListener("timeupdate", onTimeUpdate)
    audio.addEventListener("durationchange", onDurationChange)
    audio.addEventListener("ended", onEnded)
    audio.addEventListener("error", onError)

    // Carregar curtidas iniciais
    fetchLikedTracks().then((tracks) => {
      setLikedIds(new Set(tracks.map((t) => t.id)))
    }).catch(() => {})

    return () => {
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
      audio.removeEventListener("waiting", onWaiting)
      audio.removeEventListener("playing", onPlaying)
      audio.removeEventListener("canplay", onCanPlay)
      audio.removeEventListener("loadedmetadata", onLoadedMetadata)
      audio.removeEventListener("timeupdate", onTimeUpdate)
      audio.removeEventListener("durationchange", onDurationChange)
      audio.removeEventListener("ended", onEnded)
      audio.removeEventListener("error", onError)
      audio.pause()
      audio.src = ""
    }
  }, [triggerTrackEnded])

  // ─── 2. Reproduzir Faixa via Proxy Nativo ───
  const playTrack = useCallback(async (track: LuciTrack, contextQueue?: LuciTrack[]) => {
    setIsLoading(true)
    setCurrentTrack(track)
    setLyrics(null)
    setProgress(0)
    setDuration(track.duration || 0)

    // Configura fila imediata
    let effectiveQueue = contextQueue && contextQueue.length > 0 ? contextQueue : [track]
    const idx = effectiveQueue.findIndex((t) => t.id === track.id)
    const validIdx = idx >= 0 ? idx : 0

    setQueue(effectiveQueue)
    queueRef.current = effectiveQueue
    setQueueIndex(validIdx)
    queueIndexRef.current = validIdx
    originalQueueRef.current = effectiveQueue

    // Busca imediatamente a rádio inteligente em background para abastecer a fila com antecedência
    fetchRadioTracks(track.id).then((related) => {
      if (related.length > 0) {
        const currentList = queueRef.current
        const unadded = related.filter((r) => !currentList.some((q) => q.id === r.id))
        if (unadded.length > 0) {
          const expanded = [...currentList, ...unadded]
          setQueue(expanded)
          queueRef.current = expanded
          originalQueueRef.current = expanded
        }
      }
    }).catch(() => {})

    recordTrackPlayed(track)

    // Reset ganho para 1.0 (neutro) e busca normalização de loudness
    currentGainAdjustmentRef.current = 1.0
    fetch(`/api/v1/music/loudness/${track.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.gain_adjustment === "number") {
          currentGainAdjustmentRef.current = data.gain_adjustment
          applyNormalizedVolume(volume)
        }
      })
      .catch(() => {})

    // Streaming proxy direto com HTTP 206 (funciona nativamente em background/lockscreen no Android)
    const streamProxyUrl = `/api/v1/music/play/${track.id}`
    if (audioElementRef.current) {
      audioElementRef.current.src = streamProxyUrl
      applyNormalizedVolume(volume)
      audioElementRef.current.play().catch((err) => {
        console.warn("[HTML5 Audio] Play bloqueado por gesto, aguardando clique:", err)
      })
    }

    // Letras sincronizadas
    fetchLyrics(track.id, track.title, track.artist, track.duration)
      .then((l) => setLyrics(l))
      .catch(() => {})
  }, [applyNormalizedVolume, volume])

  useEffect(() => {
    playTrackRef.current = playTrack
  }, [playTrack])

  // ─── 3. Próxima / Anterior / Controles ───
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
    if (progress > 3 && audioElementRef.current) {
      audioElementRef.current.currentTime = 0
      setProgress(0)
      return
    }
    if (queueIndex > 0) {
      const prevIdx = queueIndex - 1
      setQueueIndex(prevIdx)
      playTrack(queue[prevIdx], queue)
    } else if (audioElementRef.current) {
      audioElementRef.current.currentTime = 0
      setProgress(0)
    }
  }, [progress, queue, queueIndex, playTrack])

  const togglePlay = useCallback(() => {
    if (!audioElementRef.current) return
    if (isPlaying) {
      audioElementRef.current.pause()
      setIsPlaying(false)
    } else {
      audioElementRef.current.play().catch(() => {})
      setIsPlaying(true)
    }
  }, [isPlaying])

  const pause = useCallback(() => {
    audioElementRef.current?.pause()
    setIsPlaying(false)
  }, [])

  const resume = useCallback(() => {
    audioElementRef.current?.play().catch(() => {})
    setIsPlaying(true)
  }, [])

  const seek = useCallback((secs: number) => {
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = secs
      setProgress(secs)
    }
  }, [])

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v))
    setVolumeState(clamped)
    preDuckVolumeRef.current = clamped
    applyNormalizedVolume(clamped)
  }, [applyNormalizedVolume])

  // Ducking suave escalonado no player
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
      applyNormalizedVolume(newVol)
      if (currentStep >= steps) {
        clearInterval(duckIntervalRef.current)
        duckIntervalRef.current = null
      }
    }, stepTime)
  }, [volume, applyNormalizedVolume])

  // ─── Modos Shuffle e Repeat ───
  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => {
      const nextShuffle = !prev
      if (nextShuffle) {
        if (queue.length > 1) {
          const current = queue[queueIndex] || queue[0]
          const rest = queue.filter((t) => t.id !== current.id)
          const shuffled = [current, ...rest.sort(() => Math.random() - 0.5)]
          setQueue(shuffled)
          setQueueIndex(0)
        }
      } else {
        const current = queue[queueIndex]
        setQueue(originalQueueRef.current)
        const idx = originalQueueRef.current.findIndex((t) => t.id === current?.id)
        setQueueIndex(idx >= 0 ? idx : 0)
      }
      return nextShuffle
    })
  }, [queue, queueIndex])

  const toggleRepeat = useCallback(() => {
    setRepeat((prev) => {
      if (prev === "off") return "all"
      if (prev === "all") return "one"
      return "off"
    })
  }, [])

  // ─── Curtidas ───
  const toggleLike = useCallback(async (track: LuciTrack) => {
    const isNowLiked = await toggleLikeTrack(track)
    setLikedIds((prev) => {
      const nextSet = new Set(prev)
      if (isNowLiked) nextSet.add(track.id)
      else nextSet.delete(track.id)
      return nextSet
    })
  }, [])

  const isLiked = useCallback((trackId: string) => likedIds.has(trackId), [likedIds])

  // ─── Fila ───
  const addToQueue = useCallback((track: LuciTrack) => {
    setQueue((prev) => [...prev, track])
  }, [])

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index))
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
