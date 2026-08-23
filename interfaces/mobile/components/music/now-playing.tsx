"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import {
  ChevronDown,
  Heart,
  Repeat,
  Repeat1,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Shuffle,
  Mic2,
  Loader2,
  ListMusic,
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
  } = useMusicPlayer()

  const { pop, goToLyrics } = useMusicNavigation()
  const [showQueue, setShowQueue] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Detecta tema dark / light
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark =
        document.documentElement.classList.contains("dark") ||
        localStorage.getItem("nova-theme") === "dark"
      setIsDarkMode(isDark)
    }
  }, [])

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

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col transition-colors duration-300 select-none overflow-hidden ${
        isDarkMode
          ? "bg-gradient-to-b from-[#2E1065] via-[#1E0B40] to-[#0D041A] text-white"
          : "bg-gradient-to-b from-[#FAF5FF] via-[#F3E8FF] to-[#E9D5FF] text-zinc-900"
      }`}
    >
      {/* ─── 1. Header Minimalista (Figma: Chevron Down, Título Contextual Centralizado, Ícone de Coração à Direita) ─── */}
      <header className="flex items-center justify-between px-6 pt-5 pb-2 relative z-10">
        <button
          type="button"
          onClick={pop}
          className={`size-11 flex items-center justify-center rounded-full transition-transform active:scale-90 ${
            isDarkMode
              ? "bg-white/10 text-white hover:bg-white/20 border border-white/10"
              : "bg-white/80 backdrop-blur-md text-zinc-700 hover:bg-white shadow-sm border border-purple-200/60"
          }`}
          aria-label="Minimizar"
        >
          <ChevronDown className="size-5.5 stroke-[2.2]" />
        </button>

        {/* Título de contexto no topo */}
        <div className="text-center px-2 min-w-0">
          <p
            className={`text-xs font-bold tracking-tight truncate max-w-[200px] ${
              isDarkMode ? "text-purple-200" : "text-purple-900"
            }`}
          >
            {currentTrack.album || "Luci Music"}
          </p>
        </div>

        {/* Botão de Curtir no topo direito (Figma Style) */}
        <button
          type="button"
          onClick={() => toggleLike(currentTrack)}
          className={`size-11 flex items-center justify-center rounded-full transition-transform active:scale-90 ${
            isDarkMode
              ? "bg-white/10 hover:bg-white/20 border border-white/10"
              : "bg-white/80 backdrop-blur-md hover:bg-white shadow-sm border border-purple-200/60"
          }`}
          aria-label="Curtir"
        >
          <Heart
            className={`size-5 transition-colors ${
              liked
                ? "fill-[#EC4899] text-[#EC4899]"
                : isDarkMode
                ? "text-purple-300"
                : "text-purple-700"
            }`}
          />
        </button>
      </header>

      {/* ─── Alternador de Fila ─── */}
      {showQueue ? (
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 no-scrollbar relative z-10">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-300">
              Fila de Reprodução ({queue.length})
            </h3>
            <button
              onClick={() => setShowQueue(false)}
              className="text-xs font-bold text-[#6366F1] underline"
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
                      ? "bg-[#6366F1]/20 border border-[#6366F1]/40 text-[#A5B4FC]"
                      : isDarkMode
                      ? "bg-white/5 border border-white/5 hover:bg-white/10 text-white"
                      : "bg-white border border-purple-100 shadow-sm text-zinc-900"
                  }`}
                >
                  <TrackImage
                    src={track.thumbnail}
                    trackId={track.id}
                    alt={track.title}
                    className="size-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-bold truncate ${
                        isCurrent ? "text-[#6366F1]" : ""
                      }`}
                    >
                      {track.title}
                    </p>
                    <p
                      className={`text-xs truncate ${
                        isDarkMode ? "text-purple-300/70" : "text-zinc-500"
                      }`}
                    >
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
                      className="p-2 text-zinc-400 hover:text-red-400"
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
        /* ─── 2. Corpo Principal do Player (Figma 3342-5006) ─── */
        <div className="flex-1 flex flex-col justify-between px-7 py-3 max-w-sm mx-auto w-full relative z-10">
          {/* Capa Principal com Bordas Suaves e Sombra Profunda */}
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(76,29,149,0.35)] bg-zinc-900 border border-white/10 mt-1">
            <TrackImage
              src={currentTrack.thumbnail}
              trackId={currentTrack.id}
              alt={currentTrack.title}
              className="size-full object-cover"
            />
          </div>

          {/* Indicador Sonoro "Now Playing" com Equalizador Animado */}
          <div className="flex items-center justify-center gap-2 pt-3">
            <div className="flex items-end gap-0.5 h-3">
              <span
                className={`w-0.5 rounded-full bg-[#6366F1] ${
                  isPlaying ? "animate-pulse h-3" : "h-1.5"
                }`}
              />
              <span
                className={`w-0.5 rounded-full bg-[#6366F1] ${
                  isPlaying ? "animate-pulse delay-75 h-2" : "h-2"
                }`}
              />
              <span
                className={`w-0.5 rounded-full bg-[#6366F1] ${
                  isPlaying ? "animate-pulse delay-150 h-3" : "h-1"
                }`}
              />
            </div>
            <span
              className={`text-[11px] font-semibold tracking-wide ${
                isDarkMode ? "text-purple-300/80" : "text-purple-700/80"
              }`}
            >
              Now Playing
            </span>
          </div>

          {/* Informações da Faixa (Título, Artista • Contagem e Botão Letras/Mic) */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex-1 min-w-0 pr-3">
              <h1
                className={`text-2xl font-bold tracking-tight truncate leading-tight font-sans ${
                  isDarkMode ? "text-white" : "text-zinc-900"
                }`}
              >
                {currentTrack.title}
              </h1>
              <p
                className={`text-sm font-medium truncate mt-0.5 ${
                  isDarkMode ? "text-purple-300/70" : "text-purple-800/70"
                }`}
              >
                {currentTrack.artist}{" "}
                {queue.length > 0 ? `• ${queueIndex + 1}/${queue.length}` : ""}
              </p>
            </div>

            {/* Ícone de Microfone / Letras Sincronizadas (Figma Style) */}
            <button
              type="button"
              onClick={goToLyrics}
              className={`p-2.5 rounded-full transition-transform active:scale-90 ${
                isDarkMode
                  ? "bg-white/10 hover:bg-white/20 text-purple-200 border border-white/10"
                  : "bg-white/80 hover:bg-white text-purple-900 shadow-sm border border-purple-200/60"
              }`}
              aria-label="Ver Letras"
            >
              <Mic2 className="size-5 stroke-[2.2]" />
            </button>
          </div>

          {/* ─── 3. Barra de Progresso Estilizada (Figma Style: Gradiente Azul/Roxo e Thumb Circular Glow) ─── */}
          <div className="space-y-1.5 pt-2">
            <div
              ref={progressBarRef}
              onClick={handleSeek}
              className={`group relative h-1.5 w-full cursor-pointer rounded-full overflow-visible ${
                isDarkMode ? "bg-white/15" : "bg-purple-900/15"
              }`}
            >
              {/* Barra de preenchimento com gradiente */}
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#60A5FA] to-[#6366F1]"
                style={{ width: `${progressPct}%` }}
              />
              {/* Thumb redondo estilizado */}
              <div
                className="absolute top-1/2 -translate-y-1/2 size-4.5 rounded-full bg-[#6366F1] shadow-[0_0_10px_rgba(99,102,241,0.8)] border-2 border-white transition-transform group-hover:scale-125"
                style={{ left: `calc(${progressPct}% - 9px)` }}
              />
            </div>

            <div
              className={`flex justify-between text-[11px] font-semibold ${
                isDarkMode ? "text-purple-300/60" : "text-purple-800/60"
              }`}
            >
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* ─── 4. Controles Principais de Reprodução (Figma Style: Shuffle, Prev, Play/Pause Redondo Azul/Roxo, Next, Repeat) ─── */}
          <div className="flex items-center justify-between px-1 pt-1 pb-4">
            <button
              type="button"
              onClick={toggleShuffle}
              className={`size-11 flex items-center justify-center rounded-full transition-all active:scale-90 ${
                shuffle
                  ? "bg-[#6366F1] text-white shadow-md shadow-[#6366F1]/30"
                  : isDarkMode
                  ? "bg-white/10 text-purple-200 hover:bg-white/15"
                  : "bg-white/80 text-purple-900 hover:bg-white shadow-sm border border-purple-200/50"
              }`}
              aria-label="Aleatório"
            >
              <Shuffle className="size-5" />
            </button>

            <button
              type="button"
              onClick={prev}
              className={`size-13 flex items-center justify-center rounded-full transition-all active:scale-90 ${
                isDarkMode
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-white/90 text-purple-950 hover:bg-white shadow-md border border-purple-200/60"
              }`}
              aria-label="Anterior"
            >
              <SkipBack className="size-6 fill-current" />
            </button>

            {/* Botão Central Gigante de Play/Pause Azul/Roxo do Figma */}
            <button
              type="button"
              onClick={togglePlay}
              disabled={isLoading}
              className="size-18 flex items-center justify-center rounded-full bg-gradient-to-tr from-[#4F46E5] to-[#6366F1] text-white shadow-[0_10px_25px_rgba(79,70,229,0.45)] active:scale-95 transition-transform"
              aria-label={isPlaying ? "Pausar" : "Tocar"}
            >
              {isLoading ? (
                <Loader2 className="size-8 animate-spin text-white" />
              ) : isPlaying ? (
                <Pause className="size-7 fill-white" />
              ) : (
                <Play className="size-7 fill-white ml-1" />
              )}
            </button>

            <button
              type="button"
              onClick={next}
              className={`size-13 flex items-center justify-center rounded-full transition-all active:scale-90 ${
                isDarkMode
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-white/90 text-purple-950 hover:bg-white shadow-md border border-purple-200/60"
              }`}
              aria-label="Próxima"
            >
              <SkipForward className="size-6 fill-current" />
            </button>

            <button
              type="button"
              onClick={toggleRepeat}
              className={`size-11 flex items-center justify-center rounded-full transition-all active:scale-90 ${
                repeat !== "off"
                  ? "bg-[#6366F1] text-white shadow-md shadow-[#6366F1]/30"
                  : isDarkMode
                  ? "bg-white/10 text-purple-200 hover:bg-white/15"
                  : "bg-white/80 text-purple-900 hover:bg-white shadow-sm border border-purple-200/50"
              }`}
              aria-label="Repetir"
            >
              {repeat === "one" ? (
                <Repeat1 className="size-5" />
              ) : (
                <Repeat className="size-5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
