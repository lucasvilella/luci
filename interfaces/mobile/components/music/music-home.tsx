"use client"

import { useState, useEffect } from "react"
import {
  History,
  Settings,
  Search,
  Library as LibraryIcon,
  Home as HomeIcon,
  Play,
  Pause,
  Loader2,
  Sparkles,
} from "lucide-react"
import {
  type LuciTrack,
  type DailyMix,
  type MusicHomeFeed,
  fetchMusicHome,
} from "@/lib/lucimusic"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { TrackImage } from "./track-image"

let clientHomeFeedCache: MusicHomeFeed | null = null

if (typeof window !== "undefined") {
  try {
    const local = localStorage.getItem("lucimusic_feed_v1")
    if (local) clientHomeFeedCache = JSON.parse(local)
  } catch {}
}

export function MusicHome() {
  const [feed, setFeed] = useState<MusicHomeFeed | null>(() => {
    if (clientHomeFeedCache) return clientHomeFeedCache
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("lucimusic_feed_v1")
        if (local) return JSON.parse(local)
      } catch {}
    }
    return null
  })

  const { playTrack, currentTrack, isPlaying, togglePlay } = useMusicPlayer()
  const { goToSearch, goToLibrary } = useMusicNavigation()

  useEffect(() => {
    const refreshFeed = () => {
      fetchMusicHome()
        .then((data) => {
          clientHomeFeedCache = data
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("lucimusic_feed_v1", JSON.stringify(data))
            } catch {}
          }
          setFeed(data)
        })
        .catch((err) => console.error("[SimpMusic] Erro background refresh:", err))
    }

    refreshFeed()
    const interval = setInterval(refreshFeed, 1000 * 60 * 30)
    return () => clearInterval(interval)
  }, [])

  // Desduplicar faixas por id
  const rawList = feed?.recently_played && feed.recently_played.length > 0
    ? feed.recently_played
    : (feed?.trending_brasil || [])

  const uniqueTracksMap = new Map<string, LuciTrack>()
  for (const t of rawList) {
    if (t.id && !uniqueTracksMap.has(t.id)) {
      uniqueTracksMap.set(t.id, t)
    }
  }
  const quickPicks = Array.from(uniqueTracksMap.values()).slice(0, 6)

  return (
    <div className="flex h-full flex-col bg-[#0b0c10] text-white animate-view-in select-none">
      {/* ─── 1. Header Limpo Sem Título (Apenas Ações Direita) ─── */}
      <header className="flex items-center justify-end px-5 pt-3 pb-2 bg-[#0b0c10]">
        <div className="flex items-center gap-3 text-zinc-300">
          <button
            type="button"
            onClick={goToLibrary}
            className="p-2 hover:text-white transition-colors"
            aria-label="History"
          >
            <History className="size-5" />
          </button>
          <button
            type="button"
            onClick={goToSearch}
            className="p-2 hover:text-white transition-colors"
            aria-label="Settings"
          >
            <Settings className="size-5" />
          </button>
        </div>
      </header>

      {/* ─── 2. Conteúdo Rolável Oficial do SimpMusic ─── */}
      <div className="flex-1 overflow-y-auto px-5 py-2 space-y-7 pb-28 no-scrollbar">
        {!feed ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-500">
            <Loader2 className="size-7 animate-spin text-indigo-500" />
            <p className="text-xs">Loading feed...</p>
          </div>
        ) : (
          <>
            {/* ─── Seção: LET'S START WITH A RADIO / Quick Picks (Sem Duplicatas) ─── */}
            {quickPicks.length > 0 && (
              <section className="space-y-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    LET'S START WITH A RADIO
                  </p>
                  <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5 font-sans">
                    Quick Picks
                  </h2>
                </div>

                <div className="space-y-2">
                  {quickPicks.map((track) => {
                    const isThisPlaying = currentTrack?.id === track.id && isPlaying
                    return (
                      <div
                        key={track.id}
                        onClick={() => playTrack(track, quickPicks)}
                        className="flex items-center gap-3.5 p-1 rounded-xl hover:bg-white/[0.05] transition-all cursor-pointer group"
                      >
                        <TrackImage
                          src={track.thumbnail}
                          trackId={track.id}
                          alt={track.title}
                          className="size-13 rounded-xl object-cover bg-zinc-800 shrink-0"
                        />
                        <div className="flex-1 min-w-0 pr-2">
                          <p className={`text-base font-bold truncate leading-tight ${
                            currentTrack?.id === track.id ? "text-indigo-400" : "text-white"
                          }`}>
                            {track.title}
                          </p>
                          <p className="text-sm text-zinc-400 truncate mt-0.5">
                            {track.artist}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ─── Seção: Daily Mix (Spotify & SimpMusic Intelligence) ─── */}
            {feed?.daily_mixes && feed.daily_mixes.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white tracking-tight font-sans">
                    Daily Mixes
                  </h2>
                  <span className="text-xs text-zinc-400">Made for you</span>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                  {feed.daily_mixes.map((mix) => {
                    const isMixPlaying = mix.tracks.some((t) => t.id === currentTrack?.id) && isPlaying

                    return (
                      <div
                        key={mix.id}
                        onClick={() => {
                          if (mix.tracks.length > 0) {
                            if (isMixPlaying) {
                              togglePlay()
                            } else {
                              playTrack(mix.tracks[0], mix.tracks)
                            }
                          }
                        }}
                        className={`relative group shrink-0 w-44 rounded-2xl overflow-hidden p-4 flex flex-col justify-between h-48 bg-gradient-to-br ${mix.gradient} border border-white/10 shadow-lg cursor-pointer transition-all active:scale-[0.98] hover:border-white/20`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-white/90">
                            {mix.title}
                          </span>
                          <div className="size-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                            {isMixPlaying ? (
                              <Pause className="size-4 fill-black" />
                            ) : (
                              <Play className="size-4 fill-black ml-0.5" />
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-white line-clamp-2 leading-snug">
                            {mix.subtitle}
                          </p>
                          <p className="text-[10px] text-white/70 mt-1 font-medium">
                            {mix.tracks.length} songs • Radio
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ─── Seção: Trending / Recommended Playlists ─── */}
            {feed?.trending_brasil && feed.trending_brasil.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-2xl font-bold text-white tracking-tight font-sans">
                  Trending
                </h2>

                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                  {feed.trending_brasil.map((track) => (
                    <div
                      key={track.id}
                      onClick={() => playTrack(track, feed.trending_brasil)}
                      className="group shrink-0 w-36 flex flex-col cursor-pointer active:scale-98"
                    >
                      <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-2 bg-zinc-800">
                        <TrackImage
                          src={track.thumbnail}
                          trackId={track.id}
                          alt={track.title}
                          className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <p className="text-sm font-bold text-white truncate">
                        {track.title}
                      </p>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">
                        {track.artist}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
