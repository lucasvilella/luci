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
        className="relative overflow-hidden flex w-full items-center gap-3 rounded-full bg-[var(--bg-surface-glass)] border border-[var(--border)] px-3.5 py-2.5 shadow-2xl backdrop-blur-2xl transition-all active:scale-[0.99] text-left cursor-pointer"
      >
        {/* Barra de Progresso Fina no Topo com Gradiente Luci */}
        <div className="absolute top-0 left-4 right-4 h-[2px] bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#0033ff] via-[#977dff] to-[#ffccf2] transition-all duration-100"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Capa Circular com borda translúcida */}
        <TrackImage
          src={currentTrack.thumbnail}
          trackId={currentTrack.id}
          alt={currentTrack.title}
          className="size-10 shrink-0 rounded-full object-cover bg-[var(--bg-surface)] border border-white/15 shadow-md"
        />

        {/* Informações da Faixa */}
        <div className="min-w-0 flex-1 pr-1">
          <p className="truncate text-xs font-bold text-[var(--text-primary)] leading-tight">
            {currentTrack.title}
          </p>
          <p className="truncate text-[11px] font-semibold text-[var(--text-secondary)] mt-0.5">
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
          className="p-1.5 text-[var(--text-secondary)] hover:text-white active:scale-90 transition-transform"
          aria-label="Curtir"
        >
          <Heart
            className={`size-4 transition-colors ${
              liked ? "fill-[var(--accent-purple)] text-[var(--accent-purple)]" : "text-[var(--text-secondary)]"
            }`}
          />
        </button>

        {/* Botão Play/Pause em Gradiente Luci */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            togglePlay()
          }}
          className="size-9 shrink-0 rounded-full bg-gradient-to-tr from-[#0033ff] to-[#977dff] text-white flex items-center justify-center shadow-lg shadow-[#0033ff]/40 active:scale-90 transition-transform"
          aria-label={isPlaying ? "Pausar" : "Reproduzir"}
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin text-white" />
          ) : isPlaying ? (
            <Pause className="size-4 fill-white text-white" />
          ) : (
            <Play className="size-4 fill-white text-white translate-x-0.5" />
          )}
        </button>
      </div>
    </div>
  )
}
