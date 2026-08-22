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

  // Não exibe se não houver faixa ou se já estiver na tela cheia de reprodução / letras
  if (!currentTrack || screen.type === "now-playing" || screen.type === "lyrics") return null

  const pct = duration > 0 ? (progress / duration) * 100 : 0
  const liked = isLiked(currentTrack.id)

  return (
    <div className="relative mx-3 mb-2 z-30 animate-slide-up">
      <div
        onClick={goToNowPlaying}
        className="relative overflow-hidden flex w-full items-center gap-3 rounded-2xl bg-[#121217]/95 border border-white/10 px-3.5 py-2.5 backdrop-blur-xl shadow-2xl transition-all active:scale-[0.99] text-left cursor-pointer"
      >
        {/* Barra de Progresso Fina no Topo */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-100"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Capa */}
        <TrackImage
          src={currentTrack.thumbnail}
          trackId={currentTrack.id}
          alt={currentTrack.title}
          className="size-11 shrink-0 rounded-xl object-cover bg-zinc-800 border border-white/10"
        />

        {/* Informações da Faixa */}
        <div className="min-w-0 flex-1 pr-1">
          <p className="truncate text-xs font-bold text-white leading-tight">
            {currentTrack.title}
          </p>
          <p className="truncate text-[11px] text-zinc-400 mt-0.5">
            {currentTrack.artist}
          </p>
        </div>

        {/* Botão Curtir */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            toggleLike(currentTrack)
          }}
          className={`p-2 transition-transform active:scale-90 ${
            liked ? "text-rose-500" : "text-zinc-400 hover:text-white"
          }`}
          aria-label={liked ? "Descurtir" : "Curtir"}
        >
          <Heart className={`size-4.5 ${liked ? "fill-rose-500" : ""}`} />
        </button>

        {/* Botão Play/Pause */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            togglePlay()
          }}
          disabled={isLoading}
          className="flex size-9 items-center justify-center rounded-full bg-white text-black shadow-md transition-transform active:scale-90"
          aria-label={isPlaying ? "Pausar" : "Reproduzir"}
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin text-black" />
          ) : isPlaying ? (
            <Pause className="size-4 fill-black" />
          ) : (
            <Play className="size-4 fill-black ml-0.5" />
          )}
        </button>
      </div>
    </div>
  )
}
