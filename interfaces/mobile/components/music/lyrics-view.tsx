"use client"

import { useEffect, useRef } from "react"
import {
  ChevronLeft,
  Heart,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Loader2,
  Play as PlaySmall,
} from "lucide-react"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { TrackImage } from "./track-image"

export function LyricsView() {
  const { pop } = useMusicNavigation()
  const {
    currentTrack,
    isPlaying,
    isLoading,
    togglePlay,
    next,
    prev,
    progress,
    duration,
    seek,
    repeat,
    shuffle,
    toggleRepeat,
    toggleShuffle,
    lyrics,
    loadingLyrics,
    formatTime,
    toggleLike,
    isLiked,
  } = useMusicPlayer()

  const activeLineRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const progressBarRef = useRef<HTMLDivElement | null>(null)

  // Encontra o índice da linha ativa baseado no tempo atual do áudio
  const activeLineIndex = lyrics?.lines
    ? lyrics.lines.reduce((acc, line, idx) => {
        if (progress >= line.time) {
          return idx
        }
        return acc
      }, -1)
    : -1

  // Auto-scroll suave para manter a linha ativa centralizada
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }
  }, [activeLineIndex])

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressBarRef.current
    if (!bar || !duration) return
    const rect = bar.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    seek(pct * duration)
  }

  if (!currentTrack) return null

  const liked = isLiked(currentTrack.id)
  const progressPct = duration > 0 ? Math.min(100, Math.max(0, (progress / duration) * 100)) : 0

  return (
    <div className="fixed inset-0 z-50 flex h-full flex-col select-none overflow-hidden bg-black text-white animate-view-in">
      {/* ─── Fundo com Capa em Alta Resolução levemente borrada (~7% = blur-[3px]) com Vignette Escuro ─── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src={currentTrack.thumbnail}
          alt={currentTrack.title}
          referrerPolicy="no-referrer"
          className="size-full object-cover opacity-35 filter brightness-75 blur-[3px] scale-105 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/90" />
      </div>

      {/* ─── 1. Header Oficial do Figma: Voltar (ChevronLeft Circular), Título da Música Centralizado (Sem botão de 3 pontinhos) ─── */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-5 pb-2 shrink-0">
        <button
          type="button"
          onClick={pop}
          className="size-11 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-white active:scale-95 transition-all"
          aria-label="Voltar para o Player"
        >
          <ChevronLeft className="size-5.5 stroke-[2.2]" />
        </button>

        <h2 className="text-base font-extrabold tracking-tight text-white font-sans truncate max-w-[240px] text-center">
          {currentTrack.title}
        </h2>

        {/* Espaçador invisível para manter o título perfeitamente centralizado */}
        <div className="size-11" />
      </header>

      {/* ─── 2. Corpo Central das Letras Sincronizadas (Figma Style com Destaque e Play Icon na Linha Ativa) ─── */}
      <div
        ref={containerRef}
        className="relative z-10 flex-1 overflow-y-auto px-7 py-6 space-y-5 text-left no-scrollbar scroll-smooth"
      >
        {loadingLyrics ? (
          <div className="flex flex-col items-center justify-center py-36 gap-3 text-zinc-400">
            <Loader2 className="size-8 animate-spin text-[#22C55E]" />
            <p className="text-xs font-medium">Sincronizando letra da música...</p>
          </div>
        ) : lyrics?.has_synced && lyrics.lines.length > 0 ? (
          lyrics.lines.map((line, idx) => {
            const isActive = idx === activeLineIndex

            return (
              <div
                key={`${line.time}-${idx}`}
                ref={isActive ? activeLineRef : null}
                onClick={() => seek(line.time)}
                className="group cursor-pointer transition-all duration-300 flex items-start gap-2.5"
              >
                {/* Ícone de Play Verde na linha ativa conforme o Figma */}
                <div className="w-4 pt-1 shrink-0">
                  {isActive && (
                    <PlaySmall className="size-3.5 fill-[#22C55E] text-[#22C55E] animate-pulse" />
                  )}
                </div>

                <p
                  className={`text-lg font-extrabold leading-snug tracking-tight font-sans transition-all duration-300 ${
                    isActive
                      ? "text-white text-xl scale-[1.02] origin-left"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {line.text}
                </p>
              </div>
            )
          })
        ) : (
          <div className="py-28 text-center space-y-3 px-6">
            <p className="text-sm font-semibold text-zinc-300">
              {lyrics?.plain || "Letra sincronizada não encontrada para esta faixa."}
            </p>
          </div>
        )}
      </div>

      {/* ─── 3. Rodapé Oficial do Figma: Mini Player Branco Inferior com Controles e Botão Verde ─── */}
      <div className="relative z-20 bg-white text-zinc-900 px-6 pt-3.5 pb-6 shadow-2xl rounded-t-[32px] border-t border-zinc-200 shrink-0">
        {/* Linha da Faixa: Mini Capa, Título, Artista e Coração */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
            <TrackImage
              src={currentTrack.thumbnail}
              trackId={currentTrack.id}
              alt={currentTrack.title}
              className="size-11 rounded-xl object-cover bg-zinc-100 border border-zinc-200/60 shrink-0"
            />
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-zinc-900 truncate leading-tight">
                {currentTrack.title}
              </h3>
              <p className="text-xs text-zinc-500 truncate mt-0.5 font-medium">
                {currentTrack.artist}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => toggleLike(currentTrack)}
            className="p-2 text-zinc-700 hover:text-black active:scale-90 transition-transform"
            aria-label="Curtir"
          >
            <Heart
              className={`size-5 transition-colors ${
                liked ? "fill-[#EC4899] text-[#EC4899]" : "text-zinc-600"
              }`}
            />
          </button>
        </div>

        {/* Barra de Progresso Oficial do Figma */}
        <div className="space-y-1.5 py-1">
          <div
            ref={progressBarRef}
            onClick={handleSeek}
            className="group relative h-1 w-full cursor-pointer rounded-full bg-zinc-200 overflow-visible"
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-zinc-600"
              style={{ width: `${progressPct}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 size-3 rounded-full bg-zinc-600 shadow-sm border-2 border-white transition-transform group-hover:scale-125"
              style={{ left: `calc(${progressPct}% - 6px)` }}
            />
          </div>

          <div className="flex justify-between text-[11px] font-semibold text-zinc-500">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controles de Reprodução Oficiais do Figma (Repeat, Prev, Botão Verde Gigante Play/Pause, Next, Shuffle) */}
        <div className="flex items-center justify-between px-2 pt-1">
          <button
            type="button"
            onClick={toggleRepeat}
            className={`p-2 transition-all active:scale-90 ${
              repeat !== "off" ? "text-[#22C55E]" : "text-zinc-500 hover:text-zinc-800"
            }`}
            aria-label="Repetir"
          >
            {repeat === "one" ? <Repeat1 className="size-5" /> : <Repeat className="size-5" />}
          </button>

          <button
            type="button"
            onClick={prev}
            className="p-2 text-zinc-800 hover:text-black active:scale-90 transition-transform"
            aria-label="Anterior"
          >
            <SkipBack className="size-5.5 fill-zinc-800" />
          </button>

          {/* Botão Central Play/Pause Verde Redondo do Figma (#22C55E) */}
          <button
            type="button"
            onClick={togglePlay}
            disabled={isLoading}
            className="size-14 flex items-center justify-center rounded-full bg-[#22C55E] text-white shadow-lg shadow-green-500/30 active:scale-95 hover:scale-105 transition-transform"
            aria-label={isPlaying ? "Pausar" : "Tocar"}
          >
            {isLoading ? (
              <Loader2 className="size-6 animate-spin text-white" />
            ) : isPlaying ? (
              <Pause className="size-6 fill-white stroke-[0]" />
            ) : (
              <Play className="size-6 fill-white stroke-[0] ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={next}
            className="p-2 text-zinc-800 hover:text-black active:scale-90 transition-transform"
            aria-label="Próxima"
          >
            <SkipForward className="size-5.5 fill-zinc-800" />
          </button>

          <button
            type="button"
            onClick={toggleShuffle}
            className={`p-2 transition-all active:scale-90 ${
              shuffle ? "text-[#22C55E]" : "text-zinc-500 hover:text-zinc-800"
            }`}
            aria-label="Aleatório"
          >
            <Shuffle className="size-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
