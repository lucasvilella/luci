"use client"

import { Play, Pause, Loader2, Heart } from "lucide-react"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"

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

  const totalDur = duration || currentTrack.duration || 180
  const pct = totalDur > 0 ? Math.min(100, Math.max(0, (progress / totalDur) * 100)) : 0
  const liked = isLiked(currentTrack.id)

  return (
    <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 pointer-events-none select-none animate-slide-up">
      {/* 
        Container em Pílula Orgânica que "sobe por trás" do deck de navegação (bottom-4 com z-30, dock no z-40).
        Fundo branco/superfície suave, cantos arredondados generosos de 32px e barra de progresso no topo.
      */}
      <div
        onClick={goToNowPlaying}
        className="pointer-events-auto relative overflow-hidden flex w-full max-w-[404px] items-center gap-3 rounded-[32px] pt-3 pb-[74px] px-4 shadow-[0_12px_32px_rgba(0,0,0,0.12)] backdrop-blur-2xl border border-[var(--border-subtle)] transition-all active:scale-[0.99] text-left cursor-pointer bg-[var(--bg-surface-1)] hover:border-[var(--accent-primary)]/40"
      >
        {/* Barra de Progresso Fina no Topo na Cor Verde/Padrão */}
        <div className="absolute top-0 left-6 right-6 h-[2.5px] bg-[var(--bg-surface-2)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#22c55e] transition-all duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Capa Redonda do Álbum com Anel de Progresso Fino */}
        <div className="relative size-11 shrink-0 flex items-center justify-center">
          {/* Anel Circular SVG com o progresso exato da faixa */}
          <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 44 44">
            <circle
              cx="22"
              cy="22"
              r="20"
              className="stroke-[var(--bg-surface-2)]"
              strokeWidth="2"
              fill="none"
            />
            <circle
              cx="22"
              cy="22"
              r="20"
              className="stroke-[#22c55e] transition-all duration-300"
              strokeWidth="2"
              strokeDasharray={2 * Math.PI * 20}
              strokeDashoffset={2 * Math.PI * 20 * (1 - pct / 100)}
              strokeLinecap="round"
              fill="none"
            />
          </svg>

          {/* Imagem Circular Centralizada */}
          <img
            src={currentTrack.thumbnail || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300"}
            alt={currentTrack.title}
            className="size-9 rounded-full object-cover shadow-sm"
          />
        </div>

        {/* Informações da Faixa (Título e Artista em 2 linhas) */}
        <div className="min-w-0 flex-1 pr-1">
          <p className="truncate text-[13px] font-extrabold text-[var(--text-primary)] leading-snug">
            {currentTrack.title}
          </p>
          <p className="truncate text-[11px] font-semibold text-[var(--text-secondary)] mt-0.5">
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
          className="p-2 text-[var(--text-secondary)] hover:text-[#22c55e] active:scale-90 transition-transform"
          aria-label="Curtir"
        >
          <Heart
            className={`size-5 transition-colors ${
              liked ? "fill-[#22c55e] text-[#22c55e]" : "text-[var(--text-muted)] stroke-[1.8]"
            }`}
          />
        </button>

        {/* Botão Play/Pause Verde Circular (#22c55e) conforme a referência */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            togglePlay()
          }}
          className="size-10 shrink-0 rounded-full bg-[#22c55e] text-white flex items-center justify-center shadow-md shadow-[#22c55e]/30 active:scale-90 transition-transform"
          aria-label={isPlaying ? "Pausar" : "Reproduzir"}
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin text-white" />
          ) : isPlaying ? (
            <Pause className="size-4.5 fill-white stroke-none" />
          ) : (
            <Play className="size-4.5 fill-white stroke-none translate-x-0.5" />
          )}
        </button>
      </div>
    </div>
  )
}
