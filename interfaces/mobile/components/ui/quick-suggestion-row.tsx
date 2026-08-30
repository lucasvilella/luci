"use client"

import React from "react"

interface QuickSuggestionRowProps {
  id: string
  title: string
  subtitle?: string
  coverUrl?: string
  isArtist?: boolean
  covers?: string[]
  onClick?: () => void
}

export function QuickSuggestionRow({
  id,
  title,
  subtitle,
  coverUrl,
  isArtist = false,
  covers = [],
  onClick,
}: QuickSuggestionRowProps) {
  const isMosaic = covers.length >= 4

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 py-1.5 px-2 rounded-xl hover:bg-[var(--bg-surface-1)] transition-colors cursor-pointer group active:scale-[0.99] select-none w-full"
    >
      {/* Capa / Avatar */}
      <div
        className={`size-14 overflow-hidden bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] shadow-sm shrink-0 ${
          isArtist ? "rounded-full" : "rounded-[10px]"
        }`}
      >
        {isMosaic ? (
          <div className="grid grid-cols-2 grid-rows-2 size-full">
            {covers.slice(0, 4).map((c, i) => (
              <img key={i} src={c} alt="" className="size-full object-cover" />
            ))}
          </div>
        ) : (
          <img
            src={coverUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300"}
            alt={title}
            loading="lazy"
            className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
      </div>

      {/* Textos: Título e Subtítulo */}
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-extrabold text-[var(--text-primary)] truncate leading-tight group-hover:text-[var(--accent-primary)] transition-colors">
          {title}
        </h4>
        {subtitle && (
          <p className="text-xs font-normal text-[var(--text-secondary)] truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
