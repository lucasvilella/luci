"use client"

import Image from "next/image"
import { ChevronLeft, MoreVertical, Play, Pause, Heart, SkipBack, SkipForward } from "lucide-react"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { getHiResCover } from "@/lib/deezer"

const SAMPLE_LYRICS = [
  { section: "( Verse 1 )" },
  { text: "Sleepin', You're On Your Tippy Toes" },
  { text: "Creepin' Around Like No One Knows" },
  { text: "Think You're So Criminal" },
  { text: "Bruises On Both My Knees For You" },
  { text: "Don't Say Thank You Or Please" },
  { text: "I Do What I Want When I'm Wanting To" },
  { text: "My Soul? So Cynical", active: true },
  { section: "( Verse 2 )" },
  { text: "Sleepin', You're On Your Tippy Toes" },
  { text: "Creepin' Around Like No One Knows" },
  { text: "Think You're So Criminal" },
  { text: "Bruises On Both My Knees For You" },
]

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
    toggleLike,
    isLiked,
    formatTime,
  } = useMusicPlayer()

  if (!currentTrack) return null

  const coverUrl = getHiResCover(currentTrack, "xl")
  const pct = duration > 0 ? (progress / duration) * 100 : 0
  const liked = isLiked(currentTrack.id)

  return (
    <div className="relative flex h-full flex-col bg-[#0d0d0d] overflow-hidden animate-view-in">
      {/* Blurred background cover */}
      <div className="absolute inset-0 z-0">
        <Image
          src={coverUrl}
          alt={currentTrack.album.title}
          fill
          className="object-cover opacity-25 blur-3xl scale-125"
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 pb-2 pt-4">
        <button type="button" onClick={pop} aria-label="Voltar">
          <ChevronLeft className="size-6 text-white/70" />
        </button>
        <p className="text-sm font-semibold text-white truncate max-w-[200px]">
          {currentTrack.title_short || currentTrack.title}
        </p>
        <button type="button" aria-label="Mais opções">
          <MoreVertical className="size-5 text-white/70" />
        </button>
      </div>

      {/* Lyrics content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 py-4 space-y-4 text-center">
        {SAMPLE_LYRICS.map((line, idx) =>
          line.section ? (
            <p key={idx} className="text-xs font-semibold uppercase tracking-wider text-white/40 pt-4">
              {line.section}
            </p>
          ) : (
            <div key={idx} className="flex items-center justify-center gap-2">
              {line.active && <Play className="size-3.5 fill-current text-music-accent shrink-0" />}
              <p
                className={`text-lg font-bold transition-all ${
                  line.active
                    ? "text-white scale-105"
                    : "text-white/30 hover:text-white/60 cursor-pointer"
                }`}
              >
                {line.text}
              </p>
            </div>
          )
        )}
      </div>

      {/* Bottom Sticky Player Bar */}
      <div className="relative z-10 border-t border-white/10 bg-black/80 backdrop-blur-xl px-5 pt-3 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-xl">
            <Image
              src={getHiResCover(currentTrack, "small")}
              alt={currentTrack.album.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {currentTrack.title_short || currentTrack.title}
            </p>
            <p className="truncate text-xs text-white/50">{currentTrack.artist.name}</p>
          </div>
          <button
            type="button"
            onClick={() => toggleLike(currentTrack.id)}
            className="p-1"
          >
            <Heart
              className={`size-5 transition-colors ${
                liked ? "fill-music-accent text-music-accent" : "text-white/40"
              }`}
            />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-music-accent transition-all duration-150"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] tabular-nums text-white/40">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration || currentTrack.duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-2 flex items-center justify-center gap-6">
          <button type="button" onClick={prev} className="text-white">
            <SkipBack className="size-5 fill-current" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            className="flex size-11 items-center justify-center rounded-full bg-music-accent text-black"
          >
            {isPlaying ? (
              <Pause className="size-5 fill-current" />
            ) : (
              <Play className="size-5 translate-x-0.5 fill-current" />
            )}
          </button>
          <button type="button" onClick={next} className="text-white">
            <SkipForward className="size-5 fill-current" />
          </button>
        </div>
      </div>
    </div>
  )
}
