"use client"

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react"
import { useAudioPlayerStore, type RepeatMode } from "@/stores/useAudioPlayerStore"
import { type LuciTrack, type LyricsData, fetchLikedTracks } from "@/lib/lucimusic"
import { voiceInputManager } from "@/lib/voice-input-manager"

export type { RepeatMode }

export type MusicPlayerState = {
  currentTrack: LuciTrack | null
  queue: LuciTrack[]
  queueIndex: number
  isPlaying: boolean
  isLoading: boolean
  progress: number
  duration: number
  volume: number
  shuffle: boolean
  repeat: RepeatMode
  likedIds: Set<string>
  lyrics: LyricsData | null
  loadingLyrics: boolean
}

export type MusicPlayerActions = {
  playTrack: (track: LuciTrack, contextQueue?: LuciTrack[]) => Promise<void>
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
  addToQueue: (track: LuciTrack) => void
  removeFromQueue: (index: number) => void
  reorderQueue: (newQueue: LuciTrack[]) => void
  clearQueue: () => void
  loadLyricsForCurrent: () => Promise<void>
}

export type MusicPlayerContextValue = MusicPlayerState & MusicPlayerActions

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null)

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const store = useAudioPlayerStore()

  useEffect(() => {
    fetchLikedTracks()
      .then((tracks) => {
        if (tracks && tracks.length) {
          useAudioPlayerStore.setState({
            likedIds: new Set(tracks.map((t) => t.id)),
          })
        }
      })
      .catch(console.error)
  }, [])

  return (
    <MusicPlayerContext.Provider value={store}>
      {children}
    </MusicPlayerContext.Provider>
  )
}

export function useMusicPlayer(): MusicPlayerContextValue {
  const ctx = useContext(MusicPlayerContext)
  if (ctx) return ctx
  return useAudioPlayerStore.getState()
}
