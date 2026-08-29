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
    <div className="fixed inset-x-0 bottom-24 z-30 flex justify-center px-4 pointer-events-none animate-slide-up">
      <div
        onClick={goToNowPlaying}
        className="pointer-events-auto relative overflow-hidden flex w-full max-w-[420px] items-center gap-3 rounded-[20px] px-3.5 py-2.5 shadow-[var(--shadow-card)] backdrop-blur-xl border border-[var(--border-subtle)] transition-all active:scale-[0.99] text-left cursor-pointer bg-[var(--bg-surface-1)]"
      >
        {/* Barra de Progresso Fina no Topo */}
        <div className="absolute top-0 left-4 right-4 h-[2px] bg-[var(--bg-surface-2)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent-primary)] transition-all duration-150"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Capa Quadrada com cantos arredondados suaves */}
        <TrackImage
          src={currentTrack.thumbnail}
          trackId={currentTrack.id}
          alt={currentTrack.title}
          className="size-10 shrink-0 rounded-xl object-cover bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] shadow-sm"
        />

        {/* Informações da Faixa */}
        <div className="min-w-0 flex-1 pr-1">
          <p className="truncate text-xs font-semibold text-[var(--text-primary)] leading-tight">
            {currentTrack.title}
          </p>
          <p className="truncate text-[11px] font-normal text-[var(--text-secondary)] mt-0.5">
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
          className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-90 transition-transform"
          aria-label="Curtir"
        >
          <Heart
            className={`size-4 transition-colors ${
              liked ? "fill-[var(--accent-primary)] text-[var(--accent-primary)]" : "text-[var(--text-muted)]"
            }`}
          />
        </button>

        {/* Botão Play/Pause Sólido Tátil */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            togglePlay()
          }}
          className="size-9 shrink-0 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center shadow-[0_4px_12px_var(--accent-glow)] active:scale-90 transition-transform"
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
