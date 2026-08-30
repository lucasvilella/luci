"use client"

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react"
import { useAudioPlayerStore, type RepeatMode } from "@/stores/useAudioPlayerStore"
import { type LuciTrack, type LyricsData, fetchLikedTracks } from "@/lib/lucimusic"

export type { RepeatMode }

export type MusicPlayerState = {
  currentTrack: LuciTrack | null
  queue: LuciTrack[]
  queueIndex: number
  isPlaying: boolean
  isLoading: boolean
  progress: number
  currentTime: number
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
  skipNext: () => void
  skipPrevious: () => void
  seek: (seconds: number) => void
  seekTo: (seconds: number) => void
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

  const playerValue: MusicPlayerContextValue = {
    ...store,
    currentTime: store.progress,
    seekTo: store.seek,
    skipNext: store.next,
    skipPrevious: store.prev,
  }

  return (
    <MusicPlayerContext.Provider value={playerValue}>
      {children}
    </MusicPlayerContext.Provider>
  )
}

export function useMusicPlayer(): MusicPlayerContextValue {
  const ctx = useContext(MusicPlayerContext)
  if (ctx) return ctx
  const state = useAudioPlayerStore.getState()
  return {
    ...state,
    currentTime: state.progress,
    seekTo: state.seek,
    skipNext: state.next,
    skipPrevious: state.prev,
  }
}
