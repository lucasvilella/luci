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
import type { DeezerTrack } from "@/lib/deezer"
import { formatDuration } from "@/lib/deezer"

// ─── Types ───────────────────────────────────────────────────────────

type RepeatMode = "off" | "all" | "one"

type MusicPlayerState = {
  currentTrack: DeezerTrack | null
  queue: DeezerTrack[]
  queueIndex: number
  isPlaying: boolean
  isLoading: boolean
  progress: number       // current time in seconds
  duration: number       // total duration in seconds
  volume: number         // 0-1
  shuffle: boolean
  repeat: RepeatMode
  liked: Set<number>     // track IDs
}

type MusicPlayerActions = {
  playTrack: (track: DeezerTrack, context?: DeezerTrack[]) => void
  togglePlay: () => void
  pause: () => void
  resume: () => void
  next: () => void
  prev: () => void
  seek: (seconds: number) => void
  setVolume: (v: number) => void
  toggleShuffle: () => void
  toggleRepeat: () => void
  toggleLike: (trackId: number) => void
  isLiked: (trackId: number) => boolean
  formatTime: (s: number) => string
}

type MusicPlayerContextValue = MusicPlayerState & MusicPlayerActions

// ─── Context ─────────────────────────────────────────────────────────

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null)

// ─── Helpers ─────────────────────────────────────────────────────────

const LIKED_KEY = "luci.music.liked"
const VOLUME_KEY = "luci.music.volume"

function loadLiked(): Set<number> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(LIKED_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function saveLiked(liked: Set<number>) {
  localStorage.setItem(LIKED_KEY, JSON.stringify([...liked]))
}

function loadVolume(): number {
  if (typeof window === "undefined") return 0.8
  try {
    const v = localStorage.getItem(VOLUME_KEY)
    return v ? parseFloat(v) : 0.8
  } catch {
    return 0.8
  }
}

async function fetchAudioUrl(track: DeezerTrack): Promise<{ url: string; duration?: number }> {
  const key = `${track.artist.name} - ${track.title}`
  const cached = audioUrlCache.get(key)
  if (cached) return { url: cached }

  try {
    const res = await fetch(`/api/music/stream?q=${encodeURIComponent(key)}`)
    if (res.ok) {
      const data = await res.json()
      if (data.url && data.url.startsWith("http")) {
        audioUrlCache.set(key, data.url)
        return { url: data.url, duration: data.duration }
      }
    }
  } catch (err) {
    console.warn("[MusicPlayer] yt-dlp stream fetch failed:", err)
  }

  // Fallback to Deezer preview only if yt-dlp totally fails
  return { url: track.preview || "", duration: 30 }
}

// ─── Provider ────────────────────────────────────────────────────────

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentTrack, setCurrentTrack] = useState<DeezerTrack | null>(null)
  const [queue, setQueue] = useState<DeezerTrack[]>([])
  const [queueIndex, setQueueIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(0.8)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState<RepeatMode>("off")
  const [liked, setLiked] = useState<Set<number>>(new Set())

  // Initialize on mount
  useEffect(() => {
    setLiked(loadLiked())
    setVolumeState(loadVolume())

    const audio = new Audio()
    audio.preload = "auto"
    audioRef.current = audio

    return () => {
      audio.pause()
      audio.src = ""
    }
  }, [])

  // Sync volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
    localStorage.setItem(VOLUME_KEY, String(volume))
  }, [volume])

  const loadAndPlay = useCallback(async (track: DeezerTrack) => {
    const audio = audioRef.current
    if (!audio) return

    setCurrentTrack(track)
    setIsLoading(true)
    setProgress(0)

    try {
      const res = await fetchAudioUrl(track)
      if (!res.url) throw new Error("No stream URL returned")
      audio.src = res.url
      audio.load()
      if (res.duration && res.duration > 30) {
        setDuration(res.duration)
      }
      await audio.play()
    } catch (err) {
      console.error("[MusicPlayer] playback error:", err)
      if (track.preview) {
        audio.src = track.preview
        audio.load()
        audio.play().catch(() => {})
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const playTrack = useCallback((track: DeezerTrack, context?: DeezerTrack[]) => {
    if (context) {
      setQueue(context)
      const idx = context.findIndex((t) => t.id === track.id)
      setQueueIndex(idx >= 0 ? idx : 0)
    }
    loadAndPlay(track)
  }, [loadAndPlay])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const queueRef = useRef<DeezerTrack[]>([])
  const queueIndexRef = useRef<number>(0)
  const shuffleRef = useRef<boolean>(false)
  const repeatRef = useRef<RepeatMode>("off")

  useEffect(() => {
    queueRef.current = queue
  }, [queue])

  useEffect(() => {
    queueIndexRef.current = queueIndex
  }, [queueIndex])

  useEffect(() => {
    shuffleRef.current = shuffle
  }, [shuffle])

  useEffect(() => {
    repeatRef.current = repeat
  }, [repeat])

  const resume = useCallback(() => {
    audioRef.current?.play().catch(() => {})
  }, [])

  const nextTrack = useCallback(() => {
    const q = queueRef.current
    const curIdx = queueIndexRef.current
    if (q.length === 0) return

    let nextIdx: number
    if (shuffleRef.current) {
      nextIdx = Math.floor(Math.random() * q.length)
    } else {
      nextIdx = curIdx + 1
      if (nextIdx >= q.length) {
        nextIdx = 0 // loop back to first song in playlist
      }
    }
    setQueueIndex(nextIdx)
    queueIndexRef.current = nextIdx
    loadAndPlay(q[nextIdx])
  }, [loadAndPlay])

  const nextTrackRef = useRef(nextTrack)
  useEffect(() => {
    nextTrackRef.current = nextTrack
  }, [nextTrack])

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => setProgress(audio.currentTime)
    const onDurationChange = () => setDuration(audio.duration || 0)
    const onEnded = () => {
      if (repeatRef.current === "one") {
        audio.currentTime = 0
        audio.play().catch(() => {})
      } else {
        // Automatically play the next song!
        nextTrackRef.current()
      }
    }
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onWaiting = () => setIsLoading(true)
    const onCanPlay = () => setIsLoading(false)

    audio.addEventListener("timeupdate", onTimeUpdate)
    audio.addEventListener("durationchange", onDurationChange)
    audio.addEventListener("ended", onEnded)
    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)
    audio.addEventListener("waiting", onWaiting)
    audio.addEventListener("canplay", onCanPlay)

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate)
      audio.removeEventListener("durationchange", onDurationChange)
      audio.removeEventListener("ended", onEnded)
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
      audio.removeEventListener("waiting", onWaiting)
      audio.removeEventListener("canplay", onCanPlay)
    }
  }, [])

  const prev = useCallback(() => {
    const audio = audioRef.current
    // If more than 3s in, restart current track
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0
      return
    }
    if (queue.length === 0) return
    let prevIdx = queueIndex - 1
    if (prevIdx < 0) {
      if (repeat === "all") prevIdx = queue.length - 1
      else prevIdx = 0
    }
    setQueueIndex(prevIdx)
    loadAndPlay(queue[prevIdx])
  }, [queue, queueIndex, repeat, loadAndPlay])

  const seek = useCallback((seconds: number) => {
    if (audioRef.current) audioRef.current.currentTime = seconds
  }, [])

  const setVolume = useCallback((v: number) => {
    setVolumeState(Math.max(0, Math.min(1, v)))
  }, [])

  const toggleShuffle = useCallback(() => setShuffle((s) => !s), [])

  const toggleRepeat = useCallback(() => {
    setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off"))
  }, [])

  const toggleLike = useCallback((trackId: number) => {
    setLiked((prev) => {
      const next = new Set(prev)
      if (next.has(trackId)) next.delete(trackId)
      else next.add(trackId)
      saveLiked(next)
      return next
    })
  }, [])

  const isLiked = useCallback((trackId: number) => liked.has(trackId), [liked])

  // ─── Context Value ───────────────────────────────────────────────

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
      liked,
      playTrack,
      togglePlay,
      pause,
      resume,
      next: nextTrack,
      prev,
      seek,
      setVolume,
      toggleShuffle,
      toggleRepeat,
      toggleLike,
      isLiked,
      formatTime: formatDuration,
    }),
    [
      currentTrack, queue, queueIndex, isPlaying, isLoading,
      progress, duration, volume, shuffle, repeat, liked,
      playTrack, togglePlay, pause, resume, nextTrack, prev,
      seek, setVolume, toggleShuffle, toggleRepeat, toggleLike, isLiked,
    ]
  )

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext)
  if (!ctx) throw new Error("useMusicPlayer must be used within MusicPlayerProvider")
  return ctx
}
