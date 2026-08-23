"use client"

import { useState, useRef, useCallback } from "react"
import {
  ChevronLeft,
  MoreVertical,
  Heart,
  Repeat,
  Repeat1,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Shuffle,
  ChevronUp,
  Loader2,
  Mic,
  ListMusic,
  Trash2,
} from "lucide-react"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { TrackImage } from "./track-image"

export function NowPlaying({ onSwitchToLuci }: { onSwitchToLuci?: () => void }) {
  const {
    currentTrack,
    queue,
    queueIndex,
    isPlaying,
    isLoading,
    progress,
    duration,
    repeat,
    shuffle,
    togglePlay,
    next,
    prev,
    seek,
    toggleShuffle,
    toggleRepeat,
    toggleLike,
    isLiked,
    formatTime,
    playTrack,
    removeFromQueue,
  } = useMusicPlayer()

  const { pop, goToLyrics } = useMusicNavigation()
  const [showQueue, setShowQueue] = useState(false)

  const progressBarRef = useRef<HTMLDivElement>(null)

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      const bar = progressBarRef.current
      if (!bar || !duration) return
      const rect = bar.getBoundingClientRect()
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      seek(pct * duration)
    },
    [duration, seek]
  )

  if (!currentTrack) return null

  const liked = isLiked(currentTrack.id)
  const progressPct = duration > 0 ? Math.min(100, Math.max(0, (progress / duration) * 100)) : 0

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F8FAFC] text-zinc-900 select-none animate-view-in overflow-hidden">
      {/* ─── 1. Header Oficial do Figma: Voltar (ChevronLeft Circular), "Now playing" em Negrito Centralizado, MoreVertical à Direita ─── */}
      <header className="flex items-center justify-between px-6 pt-5 pb-2 shrink-0 relative z-20">
        <button
          type="button"
          onClick={pop}
          className="size-11 flex items-center justify-center rounded-full bg-zinc-100/90 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_4px_rgba(0,0,0,0.06)] border border-zinc-200/80 text-zinc-700 active:scale-95 transition-all"
          aria-label="Voltar"
        >
          <ChevronLeft className="size-5.5 stroke-[2.2]" />
        </button>

        <h2 className="text-base font-extrabold tracking-tight text-zinc-900 font-sans">
          Now playing
        </h2>

        {/* Botão MoreVertical que abre opções / fila de reprodução */}
        <button
          type="button"
          onClick={() => setShowQueue(!showQueue)}
          className={`size-11 flex items-center justify-center rounded-full transition-all active:scale-95 ${
            showQueue
              ? "bg-[#22C55E] text-white shadow-md shadow-[#22C55E]/30"
              : "bg-zinc-100/90 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_4px_rgba(0,0,0,0.06)] border border-zinc-200/80 text-zinc-700 hover:text-zinc-900"
          }`}
          aria-label="Opções e Fila"
          title="Fila de Reprodução"
        >
          {showQueue ? <ListMusic className="size-5" /> : <MoreVertical className="size-5" />}
        </button>
      </header>

      {/* ─── 2. Fila de Reprodução (Gaveta Opcional) ─── */}
      {showQueue ? (
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 no-scrollbar relative z-10 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500">
              FILA A SEGUIR ({queue.length})
            </h3>
            <button
              onClick={() => setShowQueue(false)}
              className="text-xs font-bold text-[#22C55E] hover:underline"
            >
              Fechar Fila
            </button>
          </div>

          <div className="space-y-2">
            {queue.map((track, i) => {
              const isCurrent = i === queueIndex
              return (
                <div
                  key={`${track.id}-${i}`}
                  onClick={() => playTrack(track, queue)}
                  className={`flex items-center gap-3 p-2.5 rounded-2xl transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-green-50 border border-green-200 text-[#16A34A] shadow-sm"
                      : "bg-white border border-zinc-200/80 hover:border-zinc-300 shadow-sm text-zinc-900"
                  }`}
                >
                  <TrackImage
                    src={track.thumbnail}
                    trackId={track.id}
                    alt={track.title}
                    className="size-11 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${isCurrent ? "text-[#16A34A]" : "text-zinc-900"}`}>
                      {track.title}
                    </p>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                      {track.artist}
                    </p>
                  </div>
                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFromQueue(i)
                      }}
                      className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                      aria-label="Remover da fila"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* ─── 3. Corpo Principal do Player (Exatamente Igual ao Figma Oficial) ─── */
        <div className="flex-1 flex flex-col justify-between px-6 pt-2 pb-5 max-w-sm mx-auto w-full relative z-10">
          {/* Capa Principal Grande e Quadrada com Cantos Arredondados Figma */}
          <div className="relative aspect-square w-full rounded-[32px] overflow-hidden shadow-2xl shadow-zinc-900/10 border border-zinc-200/80 bg-zinc-100 mt-1">
            <TrackImage
              src={currentTrack.thumbnail}
              trackId={currentTrack.id}
              alt={currentTrack.title}
              className="size-full object-cover"
            />
          </div>

          {/* Informações da Música: Título, Artista, Botão de Microfone da Luci e Coração */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex-1 min-w-0 pr-3">
              <h1 className="text-2xl font-black tracking-tight text-zinc-900 leading-tight font-sans truncate">
                {currentTrack.title}
              </h1>
              <p className="text-base font-medium text-zinc-500 truncate mt-0.5">
                {currentTrack.artist}
              </p>
            </div>

            {/* Ações Laterais: Botão Microfone da Luci + Botão de Curtir Figma */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Botão Microfone Integrado Diretamente com a Luci IA */}
              <button
                type="button"
                onClick={() => {
                  if (onSwitchToLuci) {
                    onSwitchToLuci()
                  }
                }}
                className="size-11 flex items-center justify-center rounded-full bg-gradient-to-tr from-[#6366F1] to-[#818CF8] text-white shadow-md shadow-indigo-500/25 active:scale-90 hover:scale-105 transition-all"
                title="Falar com a Luci IA por Voz"
                aria-label="Luci Assistente de Voz"
              >
                <Mic className="size-5 stroke-[2.4]" />
              </button>

              {/* Botão Curtir Figma Style */}
              <button
                type="button"
                onClick={() => toggleLike(currentTrack)}
                className="size-11 flex items-center justify-center rounded-full bg-zinc-100/90 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_4px_rgba(0,0,0,0.06)] border border-zinc-200/80 text-zinc-700 active:scale-90 transition-all hover:text-black"
                aria-label="Curtir música"
              >
                <Heart
                  className={`size-5 transition-colors ${
                    liked ? "fill-[#EC4899] text-[#EC4899]" : "text-zinc-600"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* ─── 4. Barra de Progresso Oficial do Figma (Linha Cinza Fina + Thumb Redondo) ─── */}
          <div className="space-y-2 pt-2">
            <div
              ref={progressBarRef}
              onClick={handleSeek}
              className="group relative h-1.5 w-full cursor-pointer rounded-full bg-zinc-200 overflow-visible"
            >
              {/* Barra de Progresso Preenchida */}
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-zinc-600"
                style={{ width: `${progressPct}%` }}
              />
              {/* Thumb Circular Centralizado */}
              <div
                className="absolute top-1/2 -translate-y-1/2 size-3.5 rounded-full bg-zinc-600 shadow-md border-2 border-white transition-transform group-hover:scale-125"
                style={{ left: `calc(${progressPct}% - 7px)` }}
              />
            </div>

            {/* Timestamps Atual e Duração Total */}
            <div className="flex justify-between text-xs font-semibold text-zinc-500">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* ─── 5. Controles de Reprodução Oficiais do Figma (Repeat, Prev, Botão Verde Gigante Play/Pause, Next, Shuffle) ─── */}
          <div className="flex items-center justify-between px-2 pt-1 pb-2">
            {/* Botão Repeat (Repetir) */}
            <button
              type="button"
              onClick={toggleRepeat}
              className={`p-2.5 rounded-full transition-all active:scale-90 ${
                repeat !== "off" ? "text-[#22C55E]" : "text-zinc-500 hover:text-zinc-800"
              }`}
              aria-label="Repetir"
            >
              {repeat === "one" ? <Repeat1 className="size-5.5" /> : <Repeat className="size-5.5" />}
            </button>

            {/* Faixa Anterior */}
            <button
              type="button"
              onClick={prev}
              className="p-2.5 text-zinc-800 hover:text-black active:scale-90 transition-transform"
              aria-label="Anterior"
            >
              <SkipBack className="size-6 fill-zinc-800" />
            </button>

            {/* Botão Play/Pause Gigante Redondo Verde Figma (#22C55E) */}
            <button
              type="button"
              onClick={togglePlay}
              disabled={isLoading}
              className="size-17 flex items-center justify-center rounded-full bg-[#22C55E] text-white shadow-xl shadow-green-500/30 active:scale-95 hover:scale-105 transition-transform"
              aria-label={isPlaying ? "Pausar" : "Tocar"}
            >
              {isLoading ? (
                <Loader2 className="size-7 animate-spin text-white" />
              ) : isPlaying ? (
                <Pause className="size-7 fill-white stroke-[0]" />
              ) : (
                <Play className="size-7 fill-white stroke-[0] ml-1" />
              )}
            </button>

            {/* Próxima Faixa */}
            <button
              type="button"
              onClick={next}
              className="p-2.5 text-zinc-800 hover:text-black active:scale-90 transition-transform"
              aria-label="Próxima"
            >
              <SkipForward className="size-6 fill-zinc-800" />
            </button>

            {/* Botão Shuffle (Aleatório) */}
            <button
              type="button"
              onClick={toggleShuffle}
              className={`p-2.5 rounded-full transition-all active:scale-90 ${
                shuffle ? "text-[#22C55E]" : "text-zinc-500 hover:text-zinc-800"
              }`}
              aria-label="Aleatório"
            >
              <Shuffle className="size-5.5" />
            </button>
          </div>

          {/* ─── 6. Botão de Letras Inferior Oficial do Figma (^ Lyrics) ─── */}
          <div className="flex flex-col items-center justify-center pt-1">
            <button
              type="button"
              onClick={goToLyrics}
              className="flex flex-col items-center justify-center gap-0.5 text-zinc-600 hover:text-zinc-900 group active:scale-95 transition-all"
              aria-label="Abrir Letras"
            >
              <ChevronUp className="size-5 text-zinc-500 group-hover:-translate-y-0.5 transition-transform" />
              <span className="text-xs font-bold tracking-tight">Lyrics</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
