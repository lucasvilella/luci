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

const SAFE_COVERS = [
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400",
  "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400",
]

export function PlaylistMosaicCard({
  id,
  title,
  subtitle,
  covers = [],
  fallbackCoverUrl = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
  onClick,
}: PlaylistMosaicCardProps) {
  // Filtra capas válidas e completa até 4 para nunca quebrar a grade 2x2
  const rawValid = (covers || []).filter((c) => c && typeof c === "string" && c.trim().length > 0)
  const fullCovers = [...rawValid]
  while (fullCovers.length < 4) {
    fullCovers.push(SAFE_COVERS[fullCovers.length % SAFE_COVERS.length])
  }

  return (
    <div
      onClick={onClick}
      className="flex flex-col w-[130px] shrink-0 cursor-pointer group active:scale-95 transition-all select-none"
    >
      {/* Container da Capa Quadrada de 130px com Raio de 14px */}
      <div className="relative aspect-square w-full rounded-[14px] overflow-hidden bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] shadow-md">
        {/* Montagem 2x2 das 4 Primeiras Músicas com Fallback em caso de erro */}
        <div className="grid grid-cols-2 grid-rows-2 size-full">
          {fullCovers.slice(0, 4).map((c, i) => (
            <img
              key={i}
              src={c}
              alt=""
              loading="lazy"
              onError={(e) => {
                const target = e.currentTarget
                target.onerror = null
                target.src = SAFE_COVERS[i % SAFE_COVERS.length]
              }}
              className="size-full object-cover"
            />
          ))}
        </div>
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
