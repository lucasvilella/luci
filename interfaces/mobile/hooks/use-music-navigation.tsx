"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

// ─── Types ───────────────────────────────────────────────────────────

export type MusicScreen =
  | { type: "home" }
  | { type: "now-playing" }
  | { type: "artist"; artistId: string | number }
  | { type: "artists" }
  | { type: "lyrics" }
  | { type: "search" }
  | { type: "playlists" }
  | { type: "playlist-detail"; playlistId?: string | number; title?: string; thumbnail?: string; initialTracks?: any[] }
  | { type: "albums" }
  | { type: "album-detail"; albumId?: string | number; title?: string; artist?: string; thumbnail?: string; initialTracks?: any[] }
  | { type: "songs" }
  | { type: "notifications" }
  | { type: "history" }
  | { type: "library" }
  | { type: "profile" }
  | { type: "settings" }

type MusicNavigationContextValue = {
  screen: MusicScreen
  canGoBack: boolean
  push: (screen: MusicScreen) => void
  pop: () => void
  reset: () => void
  goToArtist: (artistId: string | number) => void
  goToArtists: () => void
  goToNowPlaying: () => void
  goToLyrics: () => void
  goToSearch: () => void
  goToPlaylists: () => void
  goToPlaylistDetail: (playlistId?: string | number, title?: string, thumbnail?: string, initialTracks?: any[]) => void
  goToAlbums: () => void
  goToAlbumDetail: (albumId?: string | number, title?: string, coverUrl?: string, initialTracks?: any[]) => void
  goToSongs: () => void
  goToNotifications: () => void
  goToHistory: () => void
  goToLibrary: () => void
  goToProfile: () => void
  goToSettings: () => void
  goBack: () => void
}

// ─── Context ─────────────────────────────────────────────────────────

const MusicNavigationContext = createContext<MusicNavigationContextValue | null>(null)

// ─── Provider ────────────────────────────────────────────────────────

export function MusicNavigationProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<MusicScreen[]>([{ type: "home" }])

  const screen = stack[stack.length - 1]
  const canGoBack = stack.length > 1

  const push = useCallback((s: MusicScreen) => {
    setStack((prev) => [...prev, s])
  }, [])

  const pop = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))
  }, [])

  const reset = useCallback(() => {
    setStack([{ type: "home" }])
  }, [])

  const goToArtist = useCallback(
    (artistId: string | number) => push({ type: "artist", artistId }),
    [push]
  )

  const goToArtists = useCallback(
    () => push({ type: "artists" }),
    [push]
  )

  const goToNowPlaying = useCallback(
    () => push({ type: "now-playing" }),
    [push]
  )

  const goToLyrics = useCallback(
    () => push({ type: "lyrics" }),
    [push]
  )

  const goToSearch = useCallback(
    () => push({ type: "search" }),
    [push]
  )

  const goToPlaylists = useCallback(
    () => push({ type: "playlists" }),
    [push]
  )

  const goToAlbums = useCallback(
    () => push({ type: "albums" }),
    [push]
  )

  const goToSongs = useCallback(
    () => push({ type: "songs" }),
    [push]
  )

  const goToNotifications = useCallback(
    () => push({ type: "notifications" }),
    [push]
  )

  const goToHistory = useCallback(
    () => push({ type: "history" }),
    [push]
  )

  const goToPlaylistDetail = useCallback(
    (playlistId?: string | number, title?: string, thumbnail?: string, initialTracks?: any[]) =>
      push({ type: "playlist-detail", playlistId, title, thumbnail, initialTracks }),
    [push]
  )

  const goToAlbumDetail = useCallback(
    (albumId?: string | number, title?: string, coverUrl?: string, initialTracks?: any[]) =>
      push({ type: "album-detail", albumId, title, thumbnail: coverUrl, initialTracks }),
    [push]
  )

  const goToLibrary = useCallback(
    () => push({ type: "library" }),
    [push]
  )

  const goToProfile = useCallback(
    () => push({ type: "profile" }),
    [push]
  )

  const goToSettings = useCallback(
    () => push({ type: "settings" }),
    [push]
  )

  const value = useMemo<MusicNavigationContextValue>(
    () => ({
      screen,
      canGoBack,
      push,
      pop,
      reset,
      goToArtist,
      goToArtists,
      goToNowPlaying,
      goToLyrics,
      goToSearch,
      goToPlaylists,
      goToPlaylistDetail,
      goToAlbums,
      goToAlbumDetail,
      goToSongs,
      goToNotifications,
      goToHistory,
      goToLibrary,
      goToProfile,
      goToSettings,
      goBack: pop,
    }),
    [
      screen,
      canGoBack,
      push,
      pop,
      reset,
      goToArtist,
      goToArtists,
      goToNowPlaying,
      goToLyrics,
      goToSearch,
      goToPlaylists,
      goToPlaylistDetail,
      goToAlbums,
      goToAlbumDetail,
      goToSongs,
      goToNotifications,
      goToHistory,
      goToLibrary,
      goToProfile,
      goToSettings,
    ]
  )

  return (
    <MusicNavigationContext.Provider value={value}>
      {children}
    </MusicNavigationContext.Provider>
  )
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useMusicNavigation() {
  const ctx = useContext(MusicNavigationContext)
  if (!ctx) throw new Error("useMusicNavigation must be used within MusicNavigationProvider")
  return ctx
}
