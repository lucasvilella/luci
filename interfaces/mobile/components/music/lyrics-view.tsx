"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import {
  ChevronDown,
  MoreVertical,
  Mic,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Loader2,
  Heart,
  Share2,
  Disc,
} from "lucide-react"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { formatSeconds } from "@/lib/lucimusic"

export function LyricsView() {
  const { pop, goToArtist } = useMusicNavigation()
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
    lyrics,
    loadingLyrics,
    formatTime,
    toggleLike,
    isLiked,
  } = useMusicPlayer()

  // Auto-hide controls
  const [controlsVisible, setControlsVisible] = useState(true)
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Manual scroll detection (pause auto-scroll for 4s)
  const isManualScrollingRef = useRef(false)
  const resumeAutoScrollTimerRef = useRef<NodeJS.Timeout | null>(null)

  const containerRef = useRef<HTMLDivElement | null>(null)

  // Identifica a Linha de Letra Ativa
  const activeLineIndex = lyrics?.lines?.findIndex((line, i) => {
    const nextLine = lyrics.lines[i + 1]
    const currentTime = progress
    const lineSec = (line as any).timeSeconds ?? (line as any).seconds ?? (line as any).time ?? 0
    const nextSec = nextLine ? ((nextLine as any).timeSeconds ?? (nextLine as any).seconds ?? (nextLine as any).time ?? 0) : Infinity
    return currentTime >= lineSec && currentTime < nextSec
  }) ?? -1

  // Auto-scroll Suave com Spring Physics (transition cubic-bezier(0.25, 1, 0.5, 1))
  useEffect(() => {
    if (!isManualScrollingRef.current && activeLineIndex >= 0 && containerRef.current) {
      const activeEl = containerRef.current.children[activeLineIndex] as HTMLElement
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }, [activeLineIndex])

  // Gerenciamento de Interatividade do Usuário (Auto-Hide dos Controles)
  const resetUserActivity = useCallback(() => {
    setControlsVisible(true)
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current)
    hideControlsTimerRef.current = setTimeout(() => {
      setControlsVisible(false)
    }, 5000)
  }, [])

  useEffect(() => {
    resetUserActivity()
    return () => {
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current)
    }
  }, [resetUserActivity])

  // Trata Scroll Manual do Usuário
  const handleScroll = () => {
    resetUserActivity()
    isManualScrollingRef.current = true
    if (resumeAutoScrollTimerRef.current) clearTimeout(resumeAutoScrollTimerRef.current)
    resumeAutoScrollTimerRef.current = setTimeout(() => {
      isManualScrollingRef.current = false
    }, 4000)
  }

  // Salto Temporal Direto ao Clicar na Linha (Seek-on-Click)
  const handleLineClick = (line: any) => {
    resetUserActivity()
    const targetSeconds = line.timeSeconds ?? line.seconds ?? line.time ?? (line.timeMs ? line.timeMs / 1000 : 0)
    seek(targetSeconds)
  }

  if (!currentTrack) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[var(--bg-app)] text-[var(--text-secondary)] p-6 text-center">
        <Disc className="size-16 animate-spin text-[var(--accent-purple)]/40 mb-4" />
        <h2 className="text-base font-bold text-white">Nenhuma música reproduzindo</h2>
        <button
          type="button"
          onClick={pop}
          className="mt-6 px-6 py-2.5 rounded-full bg-[var(--accent-blue)] text-white text-xs font-bold shadow-lg"
        >
          Voltar
        </button>
      </div>
    )
  }

  const totalSec = duration || currentTrack.duration || 180
  const progressPercent = Math.min(100, Math.max(0, (progress / totalSec) * 100))
  const liked = isLiked(currentTrack.id)

  return (
    <div
      onClick={resetUserActivity}
      className="relative flex h-full flex-col bg-[var(--bg-app)] text-[var(--text-primary)] select-none overflow-hidden"
    >
      {/* ─── CAMADA 0: Dynamic Apple Music Fluid Mesh Gradient (filter: blur(90px)) ─── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-28 -left-28 size-[480px] rounded-full bg-[#0033ff] opacity-50 blur-[90px] animate-liquid-glow" />
        <div className="absolute top-1/3 -right-28 size-[420px] rounded-full bg-[#977dff] opacity-40 blur-[90px] animate-liquid-glow [animation-delay:-4s]" />
        <div className="absolute -bottom-28 left-1/4 size-[500px] rounded-full bg-[#06003d] opacity-95 blur-[100px]" />
        <div className="absolute top-1/2 left-1/3 size-[300px] rounded-full bg-[#ffccf2] opacity-15 blur-[80px] animate-liquid-glow [animation-delay:-8s]" />

        {/* ─── CAMADA 1: Overlay de Leitura (--lyrics-scrim) ─── */}
        <div className="absolute inset-0 bg-[#00001f]/45" />
      </div>

      {/* ─── CONTEÚDO PRINCIPAL (Z-10) ─── */}
      <div className="relative z-10 flex h-full flex-col justify-between p-6">
        {/* Header Superior */}
        <header
          className={`flex items-center justify-between transition-opacity duration-500 shrink-0 ${
            controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <button
            type="button"
            onClick={pop}
            aria-label="Fechar Letras"
            className="size-10 flex items-center justify-center rounded-full bg-[var(--bg-surface-glass)] backdrop-blur-2xl border border-[var(--border)] text-white active:scale-90 transition-all shadow-md"
          >
            <ChevronDown className="size-6" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white shadow-sm">
            <Mic className="size-3.5 text-[var(--accent-pink)] animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider">Modo Karaoke</span>
          </div>

          <button
            type="button"
            onClick={() => toggleLike(currentTrack)}
            aria-label="Favoritar"
            className="size-10 flex items-center justify-center rounded-full bg-[var(--bg-surface-glass)] backdrop-blur-2xl border border-[var(--border)] text-white active:scale-90 transition-all shadow-md"
          >
            <Heart className={`size-5 ${liked ? "fill-[var(--accent-purple)] text-[var(--accent-purple)]" : "text-white/80"}`} />
          </button>
        </header>

        {/* ─── CONTAINER DE LETRAS SINCRONIZADAS (Time-Synced Karaoke) ─── */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto my-6 py-28 space-y-7 text-left no-scrollbar px-2"
        >
          {loadingLyrics ? (
            <div className="flex flex-col items-center justify-center py-36 gap-3 text-[var(--text-secondary)] text-center">
              <Loader2 className="size-8 animate-spin text-[var(--accent-purple)]" />
              <p className="text-xs font-bold">Sincronizando letra da música...</p>
            </div>
          ) : lyrics?.lines && lyrics.lines.length > 0 ? (
            lyrics.lines.map((line, idx) => {
              const isActive = idx === activeLineIndex
              const isPast = idx < activeLineIndex
              const isFarFuture = idx > activeLineIndex + 1

              return (
                <div
                  key={`karaoke-line-${idx}`}
                  onClick={() => handleLineClick(line)}
                  className={`flex items-center gap-3 cursor-pointer transition-all duration-400 ease-[cubic-bezier(0.25,1,0.5,1)] origin-left py-1 select-none ${
                    isActive
                      ? "text-[28px] sm:text-[32px] font-black text-white scale-100 drop-shadow-[0_4px_14px_rgba(0,0,0,0.8)]"
                      : isPast || isFarFuture
                      ? "text-[22px] sm:text-[24px] font-medium text-[rgba(242,230,238,0.25)] hover:text-white/60"
                      : "text-[22px] sm:text-[24px] font-medium text-[rgba(242,230,238,0.40)] hover:text-white/60"
                  }`}
                >
                  {isActive && (
                    <div className="size-4 shrink-0 flex items-center justify-center text-[#22c55e]">
                      <Play className="size-4 fill-[#22c55e] text-[#22c55e]" />
                    </div>
                  )}
                  <span>{line.text}</span>
                </div>
              )
            })
          ) : lyrics?.plain ? (
            <p className="text-base font-semibold text-white/80 whitespace-pre-line leading-relaxed px-4 py-8">
              {lyrics.plain}
            </p>
          ) : (
            <div className="flex flex-col items-center justify-center py-36 gap-2 text-[var(--text-muted)] text-center">
              <p className="text-base font-bold text-white">Letra não disponível</p>
              <p className="text-xs">Não encontramos a transcrição sincronizada para esta faixa.</p>
            </div>
          )}
        </div>

        {/* ─── MINI-CONTROLE FLUTUANTE INFERIOR (Auto-Hide) ─── */}
        <footer
          className={`flex items-center justify-between p-3.5 rounded-3xl bg-[var(--bg-surface-glass)] backdrop-blur-2xl border border-[var(--border)] shadow-2xl transition-all duration-500 shrink-0 ${
            controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
          }`}
        >
          {/* Informações da Faixa */}
          <div className="min-w-0 flex-1 pl-2">
            <h4 className="text-xs font-black text-white truncate leading-tight">{currentTrack.title}</h4>
            <p className="text-[10.5px] font-semibold text-[var(--text-secondary)] truncate">{currentTrack.artist}</p>
          </div>

          {/* Controles de Playback */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prev}
              aria-label="Anterior"
              className="p-1.5 text-white active:scale-90 transition-transform"
            >
              <SkipBack className="size-5 fill-current" />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pausar" : "Reproduzir"}
              className="size-11 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-90 transition-transform"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin text-black" />
              ) : isPlaying ? (
                <Pause className="size-5 fill-black text-black" />
              ) : (
                <Play className="size-5 fill-black text-black translate-x-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={next}
              aria-label="Próximo"
              className="p-1.5 text-white active:scale-90 transition-transform"
            >
              <SkipForward className="size-5 fill-current" />
            </button>
          </div>

          {/* Duração & Barra */}
          <div className="text-right pl-3 pr-1">
            <span className="text-[10px] font-bold text-[var(--accent-pink)]">
              {formatSeconds(progress)} / {formatSeconds(totalSec)}
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}
