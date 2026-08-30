import { create } from "zustand"
import { API_BASE_URL } from "@/lib/api"
import {
  type LuciTrack,
  type LyricsData,
  fetchLyrics,
  fetchRadioTracks,
  toggleLikeTrack,
  fetchLikedTracks,
  recordTrackPlayed,
  getAudioStreamUrl,
  fetchTrackStream,
} from "@/lib/lucimusic"

export type RepeatMode = "off" | "all" | "one"

export interface AudioPlayerState {
  // Estado do Player
  currentTrack: LuciTrack | null
  queue: LuciTrack[]
  currentIndex: number
  isPlaying: boolean
  isLoading: boolean
  progress: number
  duration: number
  volume: number
  shuffle: boolean
  repeat: RepeatMode
  isDucking: boolean
  isBuffering: boolean
  likedIds: Set<string>
  lyrics: LyricsData | null
  loadingLyrics: boolean

  // Ações Principais
  playTrack: (track: LuciTrack, newQueue?: LuciTrack[]) => Promise<void>
  togglePlay: () => void
  pause: () => void
  resume: () => void
  next: () => void
  prev: () => void
  seek: (seconds: number) => void
  setVolume: (vol: number) => void
  toggleShuffle: () => void
  toggleRepeat: () => void
  toggleLike: (track: LuciTrack) => Promise<void>
  isLiked: (trackId: string) => boolean
  addToQueue: (track: LuciTrack) => void
  removeFromQueue: (index: number) => void
  reorderQueue: (newQueue: LuciTrack[]) => void
  clearQueue: () => void
  loadLyricsForCurrent: () => Promise<void>

  // Audio Ducking para a Luci
  setAudioDucking: (active: boolean) => void
  duckPlayerVolume: (targetLevel?: number, durationMs?: number) => void
  restorePlayerVolume: (durationMs?: number) => void
}

// Instâncias Globais de Áudio (Gapless Buffer & Web Audio API)
let primaryAudio: HTMLAudioElement | null = null
let preloadAudio: HTMLAudioElement | null = null
let audioCtx: AudioContext | null = null
let gainNode: GainNode | null = null
let sourceNode: MediaElementAudioSourceNode | null = null
let isPreloaded = false
let isEngineInitialized = false

const initAudioEngine = () => {
  if (typeof window === "undefined" || isEngineInitialized) return

  primaryAudio = new Audio()
  preloadAudio = new Audio()

  isEngineInitialized = true
}

const updateNativeMediaSession = (track: LuciTrack, state: AudioPlayerState) => {
  if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album || "LuciMusic",
      artwork: [
        { src: track.thumbnail || "", sizes: "512x512", type: "image/jpeg" },
      ],
    })

    navigator.mediaSession.setActionHandler("play", () => state.resume())
    navigator.mediaSession.setActionHandler("pause", () => state.pause())
    navigator.mediaSession.setActionHandler("nexttrack", () => state.next())
    navigator.mediaSession.setActionHandler("previoustrack", () => state.prev())
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime !== undefined) {
        state.seek(details.seekTime)
      }
    })
  }
}

export const useAudioPlayerStore = create<AudioPlayerState>((set, get) => ({
  currentTrack: null,
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  isLoading: false,
  progress: 0,
  duration: 0,
  volume: 1.0,
  shuffle: false,
  repeat: "off",
  isDucking: false,
  isBuffering: false,
  likedIds: new Set<string>(),
  lyrics: null,
  loadingLyrics: false,

  playTrack: async (track: LuciTrack, newQueue?: LuciTrack[]) => {
    initAudioEngine()
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume()
    }

    const { queue, shuffle } = get()
    let targetQueue = newQueue ? [...newQueue] : queue.length ? queue : [track]

    let trackIndex = targetQueue.findIndex((t) => t.id === track.id)
    if (trackIndex === -1) {
      targetQueue.push(track)
      trackIndex = targetQueue.length - 1
    }

    set({
      currentTrack: track,
      queue: targetQueue,
      currentIndex: trackIndex,
      isPlaying: true,
      isLoading: true,
      progress: 0,
      duration: track.duration || 180,
      isBuffering: true,
      lyrics: null,
    })

    if (primaryAudio) {
      isPreloaded = false
      let directUrl = track.audioUrl

      if (!directUrl) {
        try {
          const streamData = await fetchTrackStream(track.id, track.title, track.artist)
          if (streamData?.stream_url) {
            directUrl = streamData.stream_url
          }
        } catch {
          // Fallback silencioso para o proxy de áudio com bypass do ngrok
        }
      }

      const streamUrl = directUrl || getAudioStreamUrl(track.id, track.title, track.artist)
      primaryAudio.src = streamUrl
      primaryAudio.load()

      primaryAudio
        .play()
        .then(() => {
          set({ isPlaying: true, isLoading: false, isBuffering: false })
          recordTrackPlayed(track.id, track.artist)
        })
        .catch((err) => {
          console.error("[useAudioPlayerStore] Erro ao reproduzir:", err)
          set({ isPlaying: false, isLoading: false, isBuffering: false })
        })

      primaryAudio.ontimeupdate = () => {
        const time = primaryAudio?.currentTime || 0
        const dur = primaryAudio?.duration || track.duration || 180
        set({ progress: time, duration: dur })

        // Pre-fetching inteligente (15s antes ou 90% da faixa)
        if (!isPreloaded && dur > 20 && time >= dur - 15) {
          const { queue: currentQ, currentIndex: currentIdx } = get()
          const nextTrack = currentQ[currentIdx + 1]
          if (nextTrack && preloadAudio) {
            preloadAudio.src = nextTrack.audioUrl || getAudioStreamUrl(nextTrack.id, nextTrack.title, nextTrack.artist)
            preloadAudio.load()
            isPreloaded = true
          }
        }
      }

      primaryAudio.onwaiting = () => set({ isBuffering: true })
      primaryAudio.onplaying = () => set({ isBuffering: false, isPlaying: true, isLoading: false })

      primaryAudio.onended = () => {
        const { repeat } = get()
        if (repeat === "one") {
          if (primaryAudio) {
            primaryAudio.currentTime = 0
            primaryAudio.play()
          }
        } else {
          get().next()
        }
      }
    }

    updateNativeMediaSession(track, get())
    get().loadLyricsForCurrent()
  },

  togglePlay: () => {
    const { isPlaying, currentTrack } = get()
    if (isPlaying) {
      get().pause()
    } else {
      if (!primaryAudio?.src && currentTrack) {
        get().playTrack(currentTrack)
      } else {
        get().resume()
      }
    }
  },

  pause: () => {
    if (primaryAudio) {
      primaryAudio.pause()
      set({ isPlaying: false })
    }
  },

  resume: () => {
    const { currentTrack } = get()
    if (primaryAudio) {
      if (!primaryAudio.src || primaryAudio.src === "" || primaryAudio.src === window.location.href) {
        if (currentTrack) {
          get().playTrack(currentTrack)
          return
        }
      }
      primaryAudio
        .play()
        .then(() => set({ isPlaying: true }))
        .catch((err) => {
          console.warn("[useAudioPlayerStore] Erro ao retomar reprodução:", err)
          if (currentTrack) {
            get().playTrack(currentTrack)
          }
        })
    }
  },

  next: () => {
    const { queue, currentIndex, repeat } = get()
    if (currentIndex < queue.length - 1) {
      const nextTrack = queue[currentIndex + 1]
      get().playTrack(nextTrack)
    } else if (repeat === "all" && queue.length > 0) {
      get().playTrack(queue[0])
    } else {
      // Rádio Infinita da Luci
      const current = get().currentTrack
      if (current) {
        fetchRadioTracks(current.id, current.artist)
          .then((radioTracks) => {
            if (radioTracks && radioTracks.length) {
              const updatedQueue = [...queue, ...radioTracks]
              set({ queue: updatedQueue })
              get().playTrack(radioTracks[0])
            }
          })
          .catch(() => set({ isPlaying: false }))
      }
    }
  },

  prev: () => {
    const { progress, queue, currentIndex } = get()
    if (progress > 3 || currentIndex <= 0) {
      if (primaryAudio) {
        primaryAudio.currentTime = 0
        set({ progress: 0 })
      }
    } else {
      const prevTrack = queue[currentIndex - 1]
      get().playTrack(prevTrack)
    }
  },

  seek: (seconds: number) => {
    if (primaryAudio) {
      primaryAudio.currentTime = seconds
      set({ progress: seconds })
    }
  },

  setVolume: (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol))
    if (primaryAudio) {
      primaryAudio.volume = clamped
    }
    set({ volume: clamped })
  },

  toggleShuffle: () => {
    const { shuffle, queue, currentIndex } = get()
    if (!shuffle) {
      const current = queue[currentIndex]
      const remaining = queue.filter((_, idx) => idx !== currentIndex)
      for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[remaining[i], remaining[j]] = [remaining[j], remaining[i]]
      }
      set({ queue: current ? [current, ...remaining] : remaining, currentIndex: 0, shuffle: true })
    } else {
      set({ shuffle: false })
    }
  },

  toggleRepeat: () => {
    const { repeat } = get()
    const modes: RepeatMode[] = ["off", "all", "one"]
    const nextMode = modes[(modes.indexOf(repeat) + 1) % modes.length]
    set({ repeat: nextMode })
  },

  toggleLike: async (track: LuciTrack) => {
    const { likedIds } = get()
    const nextLiked = new Set(likedIds)
    const willBeLiked = !nextLiked.has(track.id)

    if (willBeLiked) {
      nextLiked.add(track.id)
    } else {
      nextLiked.delete(track.id)
    }
    set({ likedIds: nextLiked })

    try {
      await toggleLikeTrack(track.id, willBeLiked)
    } catch (err) {
      console.error("[useAudioPlayerStore] Erro ao curtir faixa:", err)
      set({ likedIds }) // Rollback
    }
  },

  isLiked: (trackId: string) => {
    return get().likedIds.has(trackId)
  },

  addToQueue: (track: LuciTrack) => {
    const { queue } = get()
    set({ queue: [...queue, track] })
  },

  removeFromQueue: (index: number) => {
    const { queue, currentIndex } = get()
    const nextQ = queue.filter((_, idx) => idx !== index)
    let nextIdx = currentIndex
    if (index < currentIndex) nextIdx--
    set({ queue: nextQ, currentIndex: Math.max(0, nextIdx) })
  },

  reorderQueue: (newQueue: LuciTrack[]) => {
    const current = get().currentTrack
    const newIndex = current ? newQueue.findIndex((t) => t.id === current.id) : 0
    set({ queue: newQueue, currentIndex: Math.max(0, newIndex) })
  },

  clearQueue: () => {
    const current = get().currentTrack
    set({ queue: current ? [current] : [], currentIndex: 0 })
  },

  loadLyricsForCurrent: async () => {
    const current = get().currentTrack
    if (!current) return

    set({ loadingLyrics: true })
    try {
      const lyricsData = await fetchLyrics(current.id, current.title, current.artist, current.duration)
      set({ lyrics: lyricsData, loadingLyrics: false })
    } catch {
      set({ loadingLyrics: false })
    }
  },

  // Audio Ducking via Web Audio API GainNode linear ramp
  setAudioDucking: (active: boolean) => {
    if (!gainNode || !audioCtx) {
      // Fallback para volume do elemento
      if (primaryAudio) {
        primaryAudio.volume = active ? 0.15 : get().volume
      }
      set({ isDucking: active })
      return
    }

    const targetGain = active ? 0.15 : get().volume
    const rampTime = active ? 0.3 : 0.5

    gainNode.gain.cancelScheduledValues(audioCtx.currentTime)
    gainNode.gain.linearRampToValueAtTime(targetGain, audioCtx.currentTime + rampTime)
    set({ isDucking: active })
  },

  duckPlayerVolume: (targetLevel = 0.15, durationMs = 300) => {
    get().setAudioDucking(true)
  },

  restorePlayerVolume: (durationMs = 500) => {
    get().setAudioDucking(false)
  },
}))
