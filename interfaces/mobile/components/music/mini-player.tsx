"use client"

import Image from "next/image"
import { Play, Pause, Loader2, Heart } from "lucide-react"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { getHiResCover } from "@/lib/deezer"

export function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    togglePlay,
    progress,
    duration,
    toggleLike,
    isLiked,
  } = useMusicPlayer()
  const { goToNowPlaying, screen } = useMusicNavigation()

  // Do not display if no track is playing or if already in full now-playing / lyrics view
  if (!currentTrack || screen.type === "now-playing" || screen.type === "lyrics") return null

  const pct = duration > 0 ? (progress / duration) * 100 : 0
  const liked = isLiked(currentTrack.id)

  return (
    <div className="relative mx-3 mb-1.5 z-30">
      <button
        type="button"
        onClick={goToNowPlaying}
        className="flex w-full items-center gap-3 rounded-2xl bg-[#111116]/95 border border-white/10 px-3.5 py-2.5 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] transition-all active:scale-[0.99] text-left"
        aria-label="Abrir Tocador em Tela Cheia"
      >
        {/* Album Art with subtle vinyl ring */}
        <div className="relative size-11 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black">
          <Image
            src={getHiResCover(currentTrack, "small")}
            alt={currentTrack.album.title}
            fill
            sizes="44px"
            className="object-cover"
          />
        </div>

        {/* Track Info */}
        <div className="min-w-0 flex-1 pr-1">
          <p className="truncate text-xs font-bold text-white">
            {currentTrack.title_short || currentTrack.title}
          </p>
          <p className="truncate text-[11px] text-zinc-400 font-medium">
            {currentTrack.artist.name}
          </p>
        </div>

        {/* Like Button */}
        <div
          onClick={(e) => {
            e.stopPropagation()
            toggleLike(currentTrack.id)
          }}
          role="button"
          tabIndex={0}
          className="p-2 text-zinc-400 hover:text-cyan-400 active:scale-90 transition-transform"
          aria-label={liked ? "Descurtir" : "Curtir"}
        >
          <Heart className={`size-4.5 ${liked ? "fill-cyan-400 text-cyan-400" : ""}`} />
        </div>

        {/* Play/Pause Button */}
        <div
          onClick={(e) => {
            e.stopPropagation()
            togglePlay()
          }}
          role="button"
          tabIndex={0}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-400 to-fuchsia-500 text-black shadow-[0_0_15px_rgba(0,242,254,0.4)] active:scale-90 transition-transform"
          aria-label={isPlaying ? "Pausar" : "Tocar"}
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin text-black" />
          ) : isPlaying ? (
            <Pause className="size-4 fill-current" />
          ) : (
            <Play className="size-4 fill-current translate-x-0.5" />
          )}
        </div>
      </button>

      {/* Scrubber Progress Bar at bottom */}
      <div className="absolute bottom-0 left-6 right-6 h-0.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
