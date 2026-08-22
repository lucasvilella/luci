"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

// ─── Types ───────────────────────────────────────────────────────────

export type MusicScreen =
  | { type: "home" }
  | { type: "now-playing" }
  | { type: "artist"; artistId: string | number }
  | { type: "lyrics" }
  | { type: "search" }
  | { type: "playlists" }
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
  goToNowPlaying: () => void
  goToLyrics: () => void
  goToSearch: () => void
  goToPlaylists: () => void
  goToLibrary: () => void
  goToProfile: () => void
  goToSettings: () => void
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
      goToNowPlaying,
      goToLyrics,
      goToSearch,
      goToPlaylists,
      goToLibrary,
      goToProfile,
      goToSettings,
    }),
    [
      screen,
      canGoBack,
      push,
      pop,
      reset,
      goToArtist,
      goToNowPlaying,
      goToLyrics,
      goToSearch,
      goToPlaylists,
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
