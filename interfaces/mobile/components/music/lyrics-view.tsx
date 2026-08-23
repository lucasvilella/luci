"use client"

import { useEffect, useRef, useState } from "react"
import {
  ChevronDown,
  Share2,
  Heart,
  MoreVertical,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Loader2,
  Mic,
} from "lucide-react"
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
    toggleLike,
    isLiked,
  } = useMusicPlayer()

  const activeLineRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark =
        document.documentElement.classList.contains("dark") ||
        localStorage.getItem("nova-theme") === "dark"
      setIsDarkMode(isDark)
    }
  }, [])

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

  if (!currentTrack) return null

  const liked = isLiked(currentTrack.id)
  const progressPct = duration > 0 ? (progress / duration) * 100 : 0

  return (
    <div
      className={`relative fixed inset-0 z-50 flex h-full flex-col select-none overflow-hidden transition-colors duration-300 ${
        isDarkMode
          ? "bg-gradient-to-b from-[#2E1065] via-[#1E0B40] to-[#0D041A] text-white"
          : "bg-gradient-to-b from-[#FAF5FF] via-[#F3E8FF] to-[#E9D5FF] text-zinc-900"
      }`}
    >
      {/* ─── Fundo Suave com Blur Dinâmico da Capa ─── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src={currentTrack.thumbnail || "/placeholder.jpg"}
          alt={currentTrack.title}
          referrerPolicy="no-referrer"
          className="size-full object-cover opacity-25 blur-3xl scale-125 transition-all duration-700"
        />
        <div
          className={`absolute inset-0 ${
            isDarkMode ? "bg-black/50" : "bg-white/40"
          } backdrop-blur-xl`}
        />
      </div>

      {/* ─── 1. Header (Chevron Down para minimizar e Botão de Compartilhar/Mais) ─── */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-5 pb-2">
        <button
          type="button"
          onClick={pop}
          className={`size-11 flex items-center justify-center rounded-full transition-transform active:scale-90 ${
            isDarkMode
              ? "bg-white/10 text-white hover:bg-white/20 border border-white/10"
              : "bg-white/80 backdrop-blur-md text-zinc-700 hover:bg-white shadow-sm border border-purple-200/60"
          }`}
          aria-label="Voltar para o Player"
        >
          <ChevronDown className="size-5.5 stroke-[2.2]" />
        </button>

        <div className="text-center min-w-0 px-2">
          <span
            className={`text-[10px] uppercase font-bold tracking-widest ${
              isDarkMode ? "text-purple-300" : "text-purple-700"
            }`}
          >
            Letras Sincronizadas
          </span>
          <p
            className={`text-xs font-bold truncate max-w-[200px] ${
              isDarkMode ? "text-white" : "text-zinc-900"
            }`}
          >
            {currentTrack.title}
          </p>
        </div>

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

      {/* ─── 2. Corpo Central das Letras com Tipografia Grande e Destaque da Linha Ativa ─── */}
      <div
        ref={containerRef}
        className="relative z-10 flex-1 overflow-y-auto px-7 py-8 space-y-7 text-left no-scrollbar scroll-smooth"
      >
        {loadingLyrics ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-purple-300">
            <Loader2 className="size-8 animate-spin text-[#6366F1]" />
            <p className="text-xs font-medium">Sincronizando letra com a música...</p>
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
                className={`cursor-pointer transition-all duration-300 ${
                  isActive
                    ? "scale-105 origin-left"
                    : isPast
                    ? "opacity-40 hover:opacity-75"
                    : "opacity-40 hover:opacity-75"
                }`}
              >
                <p
                  className={`text-2xl font-black leading-snug tracking-tight font-sans ${
                    isActive
                      ? isDarkMode
                        ? "text-white drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                        : "text-purple-950 font-black"
                      : isDarkMode
                      ? "text-purple-300/60"
                      : "text-purple-900/60"
                  }`}
                >
                  {line.text}
                </p>
              </div>
            )
          })
        ) : (
          <div className="py-20 text-center space-y-3">
            <p className="text-base font-semibold text-purple-400">
              {lyrics?.plain || "Letra sincronizada não disponível para esta faixa."}
            </p>
          </div>
        )}
      </div>

      {/* ─── 3. Rodapé com Mini Barra de Progresso e Player Flutuante da Letra ─── */}
      <div
        className={`relative z-10 px-6 pt-3 pb-6 border-t ${
          isDarkMode
            ? "border-white/10 bg-black/40 backdrop-blur-xl"
            : "border-purple-200/50 bg-white/70 backdrop-blur-xl"
        }`}
      >
        {/* Barra de Progresso */}
        <div className="space-y-1 pb-3">
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const pct = (e.clientX - rect.left) / rect.width
              seek(pct * duration)
            }}
            className={`h-1.5 w-full cursor-pointer rounded-full overflow-hidden ${
              isDarkMode ? "bg-white/10" : "bg-purple-900/10"
            }`}
          >
            <div
              className="h-full bg-gradient-to-r from-[#60A5FA] to-[#6366F1]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div
            className={`flex justify-between text-[10px] font-bold ${
              isDarkMode ? "text-purple-300/60" : "text-purple-800/60"
            }`}
          >
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controles Reduzidos na Tela de Letras */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
            <img
              src={currentTrack.thumbnail || "/placeholder.jpg"}
              alt={currentTrack.title}
              className="size-11 rounded-xl object-cover shadow-sm bg-zinc-800 shrink-0"
            />
            <div className="min-w-0">
              <p
                className={`text-xs font-bold truncate ${
                  isDarkMode ? "text-white" : "text-zinc-900"
                }`}
              >
                {currentTrack.title}
              </p>
              <p
                className={`text-[11px] truncate ${
                  isDarkMode ? "text-purple-300/70" : "text-zinc-500"
                }`}
              >
                {currentTrack.artist}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prev}
              className={`p-2 rounded-full transition-all active:scale-90 ${
                isDarkMode ? "text-white" : "text-zinc-800"
              }`}
            >
              <SkipBack className="size-5 fill-current" />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className="size-11 flex items-center justify-center rounded-full bg-gradient-to-tr from-[#4F46E5] to-[#6366F1] text-white shadow-md active:scale-90 transition-transform"
            >
              {isPlaying ? (
                <Pause className="size-5 fill-white" />
              ) : (
                <Play className="size-5 fill-white ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={next}
              className={`p-2 rounded-full transition-all active:scale-90 ${
                isDarkMode ? "text-white" : "text-zinc-800"
              }`}
            >
              <SkipForward className="size-5 fill-current" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
