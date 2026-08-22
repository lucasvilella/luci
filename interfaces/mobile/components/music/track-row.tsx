"use client"

import Image from "next/image"
import { Play, Heart } from "lucide-react"
import type { DeezerTrack } from "@/lib/deezer"
import { formatDuration } from "@/lib/deezer"
import { useMusicPlayer } from "@/hooks/use-music-player"

type Props = {
  track: DeezerTrack
  index?: number
  context?: DeezerTrack[]
  showCover?: boolean
}

export function TrackRow({ track, index, context, showCover = false }: Props) {
  const { playTrack, currentTrack, isPlaying, toggleLike, isLiked } = useMusicPlayer()
  const active = currentTrack?.id === track.id
  const liked = isLiked(track.id)

  return (
    <button
      type="button"
      onClick={() => playTrack(track, context)}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors active:scale-[0.98] ${
        active ? "bg-music-accent/10" : "hover:bg-white/5"
      }`}
    >
      {/* Play button or cover */}
      {showCover ? (
        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg">
          <Image
            src={track.album.cover_small || track.album.cover}
            alt={track.album.title}
            fill
            sizes="48px"
            className="object-cover"
          />
          {active && isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="flex items-center gap-0.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-0.5 rounded-full bg-music-accent"
                    style={{
                      height: "12px",
                      animation: `eq-bar ${0.6 + i * 0.15}s ease-in-out infinite`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/5">
          {active && isPlaying ? (
            <div className="flex items-center gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-0.5 rounded-full bg-music-accent"
                  style={{
                    height: "10px",
                    animation: `eq-bar ${0.6 + i * 0.15}s ease-in-out infinite`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          ) : (
            <Play className="size-4 text-white/70" aria-hidden="true" />
          )}
        </span>
      )}

      {/* Track info */}
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-semibold ${active ? "text-music-accent" : "text-white"}`}>
          {track.title_short || track.title}
        </p>
        <p className="truncate text-xs text-white/50">
          {track.artist.name}
        </p>
      </div>

      {/* Duration */}
      <span className="shrink-0 text-xs tabular-nums text-white/40">
        {formatDuration(track.duration)}
      </span>

      {/* Like button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          toggleLike(track.id)
        }}
        className="shrink-0 p-1"
        aria-label={liked ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      >
        <Heart
          className={`size-4 transition-colors ${
            liked ? "fill-music-accent text-music-accent" : "text-white/30"
          }`}
          aria-hidden="true"
        />
      </button>
    </button>
  )
}
