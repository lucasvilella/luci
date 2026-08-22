"use client"

import { useState, useRef, useCallback } from "react"
import {
  ChevronDown,
  MoreVertical,
  Heart,
  Repeat,
  Repeat1,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Shuffle,
  Info,
  ListMusic,
  Loader2,
  Trash2,
} from "lucide-react"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { TrackImage } from "./track-image"

export function NowPlaying() {
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
    lyrics,
  } = useMusicPlayer()

  const { pop } = useMusicNavigation()
  const [showQueue, setShowQueue] = useState(false)
  const [lyricsExpanded, setLyricsExpanded] = useState(false)
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
  const progressPct = duration > 0 ? (progress / duration) * 100 : 0
  const upcomingTracks = queue.slice(queueIndex + 1)

  // Encontra a linha atual de letras sincronizadas
  const currentLineIndex = lyrics?.lines?.findIndex((line, idx) => {
    const nextLine = lyrics.lines[idx + 1]
    if (nextLine) {
      return progress >= line.time && progress < nextLine.time
    }
    return progress >= line.time
  }) ?? -1

  return (
    <div className="flex h-full flex-col bg-[#0f192b] text-white select-none animate-slide-up overflow-hidden">
      {/* ─── 1. Header Oficial do SimpMusic ─── */}
      <header className="flex items-center justify-between px-5 pt-4 pb-2 z-10">
        <button
          type="button"
          onClick={pop}
          className="p-2 text-white/90 hover:text-white transition-all active:scale-90"
          aria-label="Voltar"
        >
          <ChevronDown className="size-6" />
        </button>

        <div className="text-center px-4 min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-300">
            NOW PLAYING
          </p>
          <p className="text-sm font-bold text-white truncate mt-0.5">
            {currentTrack.album || "Queue"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {}}
          className="p-2 text-white/90 hover:text-white transition-all active:scale-90"
          aria-label="Opções"
        >
          <MoreVertical className="size-5" />
        </button>
      </header>

      {/* ─── 2. Área Central (Capa Quadrada ou Fila) ─── */}
      <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4 no-scrollbar">
        {showQueue ? (
          <div className="space-y-2 py-2">
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Queue ({upcomingTracks.length})
              </h3>
              <span className="text-[11px] text-zinc-400">Up Next</span>
            </div>

            <div className="space-y-2">
              {upcomingTracks.map((track, idx) => (
                <div
                  key={`${track.id}-${idx}`}
                  onClick={() => playTrack(track, queue)}
                  className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-all cursor-pointer group"
                >
                  <TrackImage
                    src={track.thumbnail}
                    trackId={track.id}
                    alt={track.title}
                    className="size-11 rounded-lg object-cover bg-zinc-800 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{track.title}</p>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">{track.artist}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFromQueue(queueIndex + 1 + idx)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-rose-400 transition-opacity"
                    aria-label="Remover"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Capa com Proporção Exata do SimpMusic */
          <div className="flex items-center justify-center py-2">
            <div className="relative aspect-square w-full max-w-[320px] rounded-2xl overflow-hidden shadow-2xl shadow-black/60 group">
              <TrackImage
                src={currentTrack.thumbnail}
                trackId={currentTrack.id}
                alt={currentTrack.title}
                className="size-full object-cover"
              />
            </div>
          </div>
        )}

        {/* ─── 3. Título & Artista (SimpMusic Style) ─── */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-white truncate tracking-tight font-sans">
              {currentTrack.title}
            </h2>
            <p className="text-sm text-zinc-300 truncate mt-0.5 font-normal">
              {currentTrack.artist}
            </p>
          </div>

          <button
            type="button"
            onClick={() => toggleLike(currentTrack)}
            className="p-2 text-white/90 hover:text-white transition-all active:scale-90"
            aria-label={liked ? "Descurtir" : "Curtir"}
          >
            <Heart
              className={`size-6 transition-colors ${
                liked ? "fill-rose-500 text-rose-500" : "text-white"
              }`}
            />
          </button>
        </div>

        {/* ─── 4. Barra de Progresso SimpMusic (Cinza Claro / Branco com Bolinha) ─── */}
        <div className="space-y-1 pt-1">
          <div
            ref={progressBarRef}
            onClick={handleSeek}
            className="group relative h-4 flex items-center cursor-pointer touch-none"
          >
            <div className="h-1 w-full rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div
              className="absolute size-3 rounded-full bg-white shadow-md -translate-x-1/2"
              style={{ left: `${progressPct}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-zinc-300 font-mono">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* ─── 5. Controles Oficiais SimpMusic (Shuffle, Prev, Play/Pause Redondo, Next, Repeat) ─── */}
        <div className="flex items-center justify-between pt-1 px-1">
          <button
            type="button"
            onClick={toggleShuffle}
            className={`p-2 transition-colors active:scale-90 ${
              shuffle ? "text-white" : "text-white/40 hover:text-white/70"
            }`}
            aria-label="Shuffle"
          >
            <Shuffle className="size-5" />
          </button>

          <button
            type="button"
            onClick={prev}
            className="p-2 text-white hover:text-white/80 transition-transform active:scale-90"
            aria-label="Anterior"
          >
            <SkipBack className="size-7 fill-white" />
          </button>

          {/* Botão Play/Pause Branco Redondo Idêntico ao SimpMusic */}
          <button
            type="button"
            onClick={togglePlay}
            disabled={isLoading}
            className="flex size-16 items-center justify-center rounded-full bg-white text-black shadow-lg transition-all active:scale-95 hover:scale-105"
            aria-label={isPlaying ? "Pausar" : "Reproduzir"}
          >
            {isLoading ? (
              <Loader2 className="size-7 animate-spin text-black" />
            ) : isPlaying ? (
              <Pause className="size-7 fill-black" />
            ) : (
              <Play className="size-7 fill-black ml-1" />
            )}
          </button>

          <button
            type="button"
            onClick={next}
            className="p-2 text-white hover:text-white/80 transition-transform active:scale-90"
            aria-label="Próxima"
          >
            <SkipForward className="size-7 fill-white" />
          </button>

          <button
            type="button"
            onClick={toggleRepeat}
            className={`p-2 transition-colors active:scale-90 ${
              repeat !== "off" ? "text-white" : "text-white/40 hover:text-white/70"
            }`}
            aria-label={`Repetir: ${repeat}`}
          >
            {repeat === "one" ? (
              <Repeat1 className="size-5" />
            ) : (
              <Repeat className="size-5" />
            )}
          </button>
        </div>

        {/* ─── 6. Barra Inferior com Ícones de Info e Fila ─── */}
        <div className="flex items-center justify-between pt-1 text-white/60">
          <button type="button" className="p-2 hover:text-white" aria-label="Informações">
            <Info className="size-5" />
          </button>

          <button
            type="button"
            onClick={() => setShowQueue(!showQueue)}
            className={`p-2 transition-colors ${showQueue ? "text-white" : "hover:text-white"}`}
            aria-label="Fila"
          >
            <ListMusic className="size-5" />
          </button>
        </div>

        {/* ─── 7. Card Azul de Letras (Lyrics Card do SimpMusic) ─── */}
        <div className="rounded-2xl bg-[#133266] p-4 text-white shadow-xl space-y-3 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-white">Lyrics</span>
            <button
              type="button"
              onClick={() => setLyricsExpanded(!lyricsExpanded)}
              className="text-xs font-semibold text-white/80 hover:text-white px-2 py-1 rounded-lg bg-white/10"
            >
              {lyricsExpanded ? "Hide" : "Show"}
            </button>
          </div>

          {/* Exibição Sincronizada das Letras */}
          {lyrics?.has_synced && lyrics.lines.length > 0 ? (
            <div className={`space-y-3 font-sans transition-all overflow-y-auto ${lyricsExpanded ? "max-h-72" : "max-h-32"} no-scrollbar`}>
              {lyrics.lines.map((line, idx) => {
                const isCurrent = idx === currentLineIndex
                return (
                  <p
                    key={idx}
                    onClick={() => seek(line.time)}
                    className={`cursor-pointer transition-all leading-snug ${
                      isCurrent
                        ? "text-xl font-extrabold text-white scale-[1.02] origin-left"
                        : "text-base font-medium text-white/50 hover:text-white/80"
                    }`}
                  >
                    {line.text}
                  </p>
                )
              })}
            </div>
          ) : (
            <div className="py-2">
              <p className="text-sm font-medium text-white/70">
                {lyrics?.plain || "Carregando letras sincronizadas..."}
              </p>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 text-[10px] text-white/40 border-t border-white/10">
            <span>{lyrics?.has_synced ? "Line Synced" : "Plain Lyrics"}</span>
            <span>LRCLIB</span>
          </div>
        </div>
      </div>
    </div>
  )
}
