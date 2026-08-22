"use client"

import { useRef, useCallback } from "react"
import Image from "next/image"
import {
  ChevronDown,
  MoreVertical,
  Heart,
  Repeat,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Shuffle,
  ChevronUp,
  Loader2,
  Share2,
} from "lucide-react"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { getHiResCover } from "@/lib/deezer"

export function NowPlaying() {
  const {
    currentTrack,
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
  } = useMusicPlayer()
  const { pop, goToLyrics, goToArtist } = useMusicNavigation()
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

  if (!currentTrack) {
    return (
      <div className="flex h-full items-center justify-center bg-[#08080A]">
        <p className="text-zinc-500 text-sm">Nenhuma música em reprodução</p>
      </div>
    )
  }

  const pct = duration > 0 ? (progress / duration) * 100 : 0
  const liked = isLiked(currentTrack.id)
  const coverUrl = getHiResCover(currentTrack, "xl")

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#140F22] via-[#0D0B16] to-[#08080A] text-white animate-view-in select-none">
      {/* ─── Header ─── */}
      <header className="flex items-center justify-between px-5 pt-3 pb-2 border-b border-white/5">
        <button
          type="button"
          onClick={pop}
          className="flex size-9 items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:text-white transition-all active:scale-95"
          aria-label="Voltar"
        >
          <ChevronDown className="size-5" />
        </button>

        <div className="text-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">
            Tocando Agora
          </span>
          <p className="text-xs font-semibold text-zinc-300 truncate max-w-[180px]">
            {currentTrack.album.title}
          </p>
        </div>

        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:text-white transition-all active:scale-95"
          aria-label="Opções da Faixa"
        >
          <MoreVertical className="size-4" />
        </button>
      </header>

      {/* ─── Vinyl Holographic Cover & Art ─── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-2">
        <div className="relative size-64 sm:size-72 rounded-full p-2 bg-gradient-to-tr from-zinc-800 via-zinc-900 to-zinc-950 border border-white/10 shadow-[0_0_50px_rgba(0,242,254,0.15)] flex items-center justify-center group">
          {/* Vinyl Grooves Background */}
          <div className="absolute inset-2 rounded-full border border-white/5 animate-[spin_20s_linear_infinite]" />
          <div className="absolute inset-6 rounded-full border border-white/5" />
          <div className="absolute inset-12 rounded-full border border-white/5" />

          {/* Center Album Art */}
          <div className="relative size-44 rounded-full overflow-hidden border-2 border-zinc-950 shadow-2xl">
            <Image
              src={coverUrl}
              alt={currentTrack.title}
              fill
              sizes="200px"
              priority
              className={`object-cover ${isPlaying ? "animate-[spin_12s_linear_infinite]" : ""}`}
            />
            {/* Center Hole */}
            <div className="absolute inset-0 m-auto size-6 rounded-full bg-[#08080A] border-2 border-cyan-400/80 shadow-inner" />
          </div>
        </div>

        {/* ─── Title & Artist & Like ─── */}
        <div className="w-full mt-6 flex items-center justify-between px-2">
          <div className="min-w-0 flex-1 pr-4">
            <h1 className="text-lg font-bold text-white tracking-wide truncate">
              {currentTrack.title_short || currentTrack.title}
            </h1>
            <button
              type="button"
              onClick={() => goToArtist(currentTrack.artist.id)}
              className="text-xs text-cyan-400 font-medium hover:underline truncate text-left block"
            >
              {currentTrack.artist.name}
            </button>
          </div>

          <button
            type="button"
            onClick={() => toggleLike(currentTrack.id)}
            className="flex size-10 items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:text-cyan-400 active:scale-90 transition-all shrink-0"
            aria-label={liked ? "Descurtir" : "Curtir"}
          >
            <Heart
              className={`size-5 transition-colors ${
                liked ? "fill-cyan-400 text-cyan-400" : "text-zinc-400"
              }`}
            />
          </button>
        </div>
      </div>

      {/* ─── Progress Bar & Time ─── */}
      <div className="px-7 space-y-1.5">
        <div
          ref={progressBarRef}
          className="relative h-1.5 w-full cursor-pointer rounded-full bg-zinc-800/80 overflow-hidden"
          onClick={handleSeek}
          onTouchMove={handleSeek}
          role="slider"
          aria-label="Progresso da música"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={progress}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 shadow-[0_0_10px_rgba(0,242,254,0.5)] transition-[width] duration-150"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] font-mono text-zinc-400">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration || currentTrack.duration)}</span>
        </div>
      </div>

      {/* ─── Control Bar ─── */}
      <div className="flex items-center justify-between px-8 py-4">
        {/* Shuffle */}
        <button
          type="button"
          onClick={toggleShuffle}
          className={`p-2.5 rounded-full transition-colors ${
            shuffle ? "text-cyan-400 bg-cyan-400/10" : "text-zinc-500 hover:text-zinc-300"
          }`}
          aria-label="Aleatório"
        >
          <Shuffle className="size-4.5" />
        </button>

        {/* Skip Back */}
        <button
          type="button"
          onClick={prev}
          className="p-2.5 text-zinc-300 hover:text-white active:scale-90 transition-transform"
          aria-label="Anterior"
        >
          <SkipBack className="size-6 fill-current" />
        </button>

        {/* Play/Pause Central Button */}
        <button
          type="button"
          onClick={togglePlay}
          className="size-16 rounded-full bg-gradient-to-tr from-cyan-400 to-fuchsia-500 text-black flex items-center justify-center shadow-[0_0_30px_rgba(0,242,254,0.4)] active:scale-95 transition-transform"
          aria-label={isPlaying ? "Pausar" : "Tocar"}
        >
          {isLoading ? (
            <Loader2 className="size-7 animate-spin text-black" />
          ) : isPlaying ? (
            <Pause className="size-7 fill-current" />
          ) : (
            <Play className="size-7 fill-current translate-x-0.5" />
          )}
        </button>

        {/* Skip Forward */}
        <button
          type="button"
          onClick={next}
          className="p-2.5 text-zinc-300 hover:text-white active:scale-90 transition-transform"
          aria-label="Próxima"
        >
          <SkipForward className="size-6 fill-current" />
        </button>

        {/* Repeat */}
        <button
          type="button"
          onClick={toggleRepeat}
          className={`p-2.5 rounded-full transition-colors relative ${
            repeat !== "off" ? "text-cyan-400 bg-cyan-400/10" : "text-zinc-500 hover:text-zinc-300"
          }`}
          aria-label="Repetir"
        >
          <Repeat className="size-4.5" />
          {repeat === "one" && (
            <span className="absolute top-1.5 right-1.5 text-[8px] font-extrabold text-cyan-400">
              1
            </span>
          )}
        </button>
      </div>

      {/* ─── Lyrics Access Button (Bottom Drawer) ─── */}
      <div className="px-6 pb-6 pt-1">
        <button
          type="button"
          onClick={goToLyrics}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-zinc-300 transition-all active:scale-[0.99]"
        >
          <ChevronUp className="size-4 text-cyan-400" />
          <span>Ver Letra Sincronizada</span>
        </button>
      </div>
    </div>
  )
}
