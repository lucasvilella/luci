"use client"

import React from "react"

interface PlaylistMosaicCardProps {
  id: string
  title: string
  subtitle?: string
  covers?: string[]
  fallbackCoverUrl?: string
  onClick?: () => void
}

export function PlaylistMosaicCard({
  id,
  title,
  subtitle,
  covers = [],
  fallbackCoverUrl = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
  onClick,
}: PlaylistMosaicCardProps) {
  // Filtra capas válidas
  const validCovers = (covers || []).filter((c) => c && typeof c === "string" && c.trim().length > 0)
  const isMosaic = validCovers.length >= 4

  return (
    <div
      onClick={onClick}
      className="flex flex-col w-[130px] shrink-0 cursor-pointer group active:scale-95 transition-all select-none"
    >
      {/* Container da Capa Quadrada de 130px com Raio de 14px */}
      <div className="relative aspect-square w-full rounded-[14px] overflow-hidden bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] shadow-md">
        {isMosaic ? (
          /* Montagem 2x2 das 4 Primeiras Músicas */
          <div className="grid grid-cols-2 grid-rows-2 size-full">
            {validCovers.slice(0, 4).map((c, i) => (
              <img
                key={i}
                src={c}
                alt=""
                loading="lazy"
                className="size-full object-cover"
              />
            ))}
          </div>
        ) : (
          /* Capa Única de Fallback */
          <img
            src={validCovers[0] || fallbackCoverUrl}
            alt={title}
            loading="lazy"
            className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
      </div>

      {/* Título e Subtítulo com Margem Superior Arejada */}
      <div className="mt-2.5 px-0.5 space-y-0.5">
        <h4 className="text-[13px] font-bold text-[var(--text-primary)] truncate leading-tight group-hover:text-[var(--accent-primary)] transition-colors">
          {title}
        </h4>
        {subtitle && (
          <p className="text-[11px] font-normal text-[var(--text-secondary)] truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
