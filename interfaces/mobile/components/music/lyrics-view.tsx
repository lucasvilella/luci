"use client"

import { useEffect, useRef } from "react"
import { ChevronLeft, Play, Pause, SkipBack, SkipForward, Mic2, Loader2 } from "lucide-react"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"

export function LyricsView() {
  const { pop } = useMusicNavigation()
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    next,
    prev,
    progress,
    duration,
    seek,
    lyrics,
    loadingLyrics,
    formatTime,
  } = useMusicPlayer()

  const activeLineRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Encontra o índice da linha ativa baseado no tempo atual do áudio
  const activeLineIndex = lyrics?.lines ? lyrics.lines.reduce((acc, line, idx) => {
    if (progress >= line.time) {
      return idx
    }
    return acc
  }, -1) : -1

  // Auto-scroll suave para manter a linha ativa centralizada
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }
  }, [activeLineIndex])

  if (!currentTrack) return null

  return (
    <div className="relative flex h-full flex-col bg-[#08080A] text-white animate-view-in select-none overflow-hidden">
      {/* ─── Fundo com Blur da Capa ─── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src={currentTrack.thumbnail || "/placeholder.jpg"}
          alt={currentTrack.title}
          className="size-full object-cover opacity-20 blur-3xl scale-125"
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      </div>

      {/* ─── Header ─── */}
      <header className="relative z-10 flex items-center justify-between px-5 pt-3 pb-2 border-b border-white/5 bg-[#08080A]/80 backdrop-blur-xl">
        <button
          type="button"
          onClick={pop}
          className="flex size-9 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
          aria-label="Voltar"
        >
          <ChevronLeft className="size-5" />
        </button>

        <div className="text-center min-w-0 px-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">
            Letras Sincronizadas
          </span>
          <p className="text-xs font-semibold text-white truncate max-w-[200px]">
            {currentTrack.title}
          </p>
        </div>

        <div className="size-9" />
      </header>

      {/* ─── Corpo das Letras ─── */}
      <div
        ref={containerRef}
        className="relative z-10 flex-1 overflow-y-auto px-6 py-8 space-y-6 text-center scrollbar-none"
      >
        {loadingLyrics ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-500">
            <Loader2 className="size-7 animate-spin text-indigo-400" />
            <p className="text-xs">Sincronizando letras com LRCLIB...</p>
          </div>
        ) : lyrics?.has_synced && lyrics.lines.length > 0 ? (
          lyrics.lines.map((line, idx) => {
            const isActive = idx === activeLineIndex
            const isPast = idx < activeLineIndex

            return (
              <div
                key={`${line.time}-${idx}`}
                ref={isActive ? activeLineRef : null}
                onClick={() => seek(line.time)}
                className={`transition-all duration-300 cursor-pointer py-1.5 px-3 rounded-xl ${
                  isActive
                    ? "text-lg font-bold text-white scale-105 bg-indigo-500/20 shadow-lg shadow-indigo-500/10"
                    : isPast
                    ? "text-sm font-medium text-zinc-500 hover:text-zinc-300"
                    : "text-sm font-medium text-zinc-400/80 hover:text-zinc-200"
                }`}
              >
                {line.text || "♪"}
              </div>
            )
          })
        ) : (
          <div className="py-20 text-center space-y-4">
            <Mic2 className="size-10 mx-auto text-zinc-600 stroke-1" />
            <p className="text-sm font-semibold text-zinc-300">Letra em Texto Simples</p>
            <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line max-w-sm mx-auto">
              {lyrics?.plain || "Nenhuma letra disponível para esta música no momento."}
            </p>
          </div>
        )}
      </div>

      {/* ─── Mini Barra de Controle na Base ─── */}
      <footer className="relative z-10 flex items-center justify-between px-6 py-3 border-t border-white/10 bg-[#08080A]/90 backdrop-blur-xl">
        <div className="text-[11px] font-mono text-zinc-400">
          {formatTime(progress)} / {formatTime(duration)}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={prev}
            className="p-1.5 text-zinc-300 hover:text-white"
            aria-label="Faixa Anterior"
          >
            <SkipBack className="size-5 fill-current" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            className="size-9 rounded-full bg-white text-black flex items-center justify-center shadow-md active:scale-95"
            aria-label={isPlaying ? "Pausar" : "Reproduzir"}
          >
            {isPlaying ? (
              <Pause className="size-4.5 fill-black" />
            ) : (
              <Play className="size-4.5 fill-black ml-0.5" />
            )}
          </button>
          <button
            type="button"
            onClick={next}
            className="p-1.5 text-zinc-300 hover:text-white"
            aria-label="Próxima Faixa"
          >
            <SkipForward className="size-5 fill-current" />
          </button>
        </div>
      </footer>
    </div>
  )
}
