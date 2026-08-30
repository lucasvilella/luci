"use client"

import React from "react"
import { Play, MoreVertical, Check } from "lucide-react"
import { type LuciTrack } from "@/lib/lucimusic"

interface TrackRowProps {
  track: LuciTrack
  isArtist?: boolean
  isFollowed?: boolean
  onPlay: (track: LuciTrack) => void
  onMore: (track: LuciTrack) => void
  onFollowToggle?: (artistId: string) => void
}

export function TrackRow({
  track,
  isArtist = false,
  isFollowed = false,
  onPlay,
  onMore,
  onFollowToggle,
}: TrackRowProps) {
  return (
    <div
      onClick={() => {
        if (!isArtist) onPlay(track)
      }}
      className="flex items-center justify-between py-2 px-1 rounded-2xl hover:bg-[var(--bg-surface-1)] transition-colors cursor-pointer group active:scale-[0.99] select-none"
    >
      {/* Lado Esquerdo: Imagem (Quadrada 52x52 ou Redonda se Artista) + Info */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
        <div
          className={`relative size-[52px] shrink-0 overflow-hidden bg-[var(--bg-surface-2)] shadow-sm border border-[var(--border-subtle)] ${
            isArtist ? "rounded-full" : "rounded-[10px]"
          }`}
        >
          <img
            src={track.thumbnail || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200"}
            alt={track.title}
            loading="lazy"
            className="size-full object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-primary)] transition-colors leading-tight">
              {track.title}
            </h4>
            {isArtist && (
              <span className="size-3.5 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center shrink-0">
                <Check className="size-2.5 stroke-[3]" />
              </span>
            )}
          </div>

          <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5 font-normal">
            {isArtist ? "Artista" : `${track.artist} | Música`}
          </p>
        </div>
      </div>

      {/* Lado Direito: Botão Play Circular Verde/Marca ou Botão Seguir + Menu 3 Pontos */}
      <div className="flex items-center gap-2 shrink-0">
        {isArtist ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onFollowToggle?.(track.id)
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
              isFollowed
                ? "bg-[var(--bg-surface-2)] text-[var(--text-primary)] border border-[var(--border-subtle)]"
                : "bg-[var(--accent-primary)] text-white shadow-sm shadow-[#5c62ec]/30"
            }`}
          >
            {isFollowed ? "Seguindo" : "Seguir"}
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onPlay(track)
            }}
            aria-label="Tocar música"
            className="size-8 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center shadow-md shadow-[#5c62ec]/30 active:scale-90 transition-transform"
          >
            <Play className="size-4 fill-white translate-x-0.5" />
          </button>
        )}

        {/* Botão Três Pontos (Abre Menu Suspenso) */}
        {!isArtist && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onMore(track)
            }}
            aria-label="Opções"
            className="size-8 rounded-full hover:bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center active:scale-90 transition-transform"
          >
            <MoreVertical className="size-4.5" />
          </button>
        )}
      </div>
    </div>
  )
}
