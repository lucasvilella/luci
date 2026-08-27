"use client"

import { Play, Pause, Loader2, Heart } from "lucide-react"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { TrackImage } from "./track-image"

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

  if (!currentTrack || screen.type === "now-playing" || screen.type === "lyrics") return null

  const pct = duration > 0 ? (progress / duration) * 100 : 0
  const liked = isLiked(currentTrack.id)

  return (
    <div className="relative mx-4 mb-2 z-30 animate-slide-up">
      <div
        onClick={goToNowPlaying}
        className="relative overflow-hidden flex w-full items-center gap-3 rounded-full bg-white border border-zinc-200/90 px-3 py-2 shadow-lg shadow-zinc-200/60 transition-all active:scale-[0.99] text-left cursor-pointer"
      >
        {/* Barra de Progresso Fina no Topo */}
        <div className="absolute top-0 left-4 right-4 h-[2px] bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#62CF5E] transition-all duration-100"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Capa Circular com borda */}
        <TrackImage
          src={currentTrack.thumbnail}
          trackId={currentTrack.id}
          alt={currentTrack.title}
          className="size-10 shrink-0 rounded-full object-cover bg-zinc-100 border border-zinc-200/80 shadow-sm"
        />

        {/* Informações da Faixa */}
        <div className="min-w-0 flex-1 pr-1">
          <p className="truncate text-xs font-bold text-zinc-900 leading-tight">
            {currentTrack.title}
          </p>
          <p className="truncate text-[11px] text-zinc-500 mt-0.5">
            {currentTrack.artist}
          </p>
        </div>

        {/* Botão Curtir (Coração) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            toggleLike(currentTrack)
          }}
          className="p-1.5 text-zinc-400 hover:text-red-500 active:scale-90 transition-transform"
          aria-label="Curtir"
        >
          <Heart
            className={`size-4 transition-colors ${
              liked ? "fill-[#62CF5E] text-[#62CF5E]" : "text-zinc-400 stroke-zinc-400"
            }`}
          />
        </button>

        {/* Botão Play/Pause Verde #62CF5E */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            togglePlay()
          }}
          className="size-9 flex items-center justify-center rounded-full bg-[#62CF5E] text-white shadow-md active:scale-90 transition-transform shrink-0 mr-1"
          aria-label={isPlaying ? "Pausar" : "Tocar"}
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin text-white" />
          ) : isPlaying ? (
            <Pause className="size-4 fill-white" />
          ) : (
            <Play className="size-4 fill-white ml-0.5" />
          )}
        </button>
      </div>
    </div>
  )
}
