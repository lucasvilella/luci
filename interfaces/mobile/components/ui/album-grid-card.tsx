"use client"

import React from "react"

interface AlbumGridCardProps {
  id: string
  title: string
  artist: string
  year: string | number
  coverUrl: string
  onClick: () => void
}

export function AlbumGridCard({
  id,
  title,
  artist,
  year,
  coverUrl,
  onClick,
}: AlbumGridCardProps) {
  return (
    <div
      onClick={onClick}
      className="flex flex-col space-y-2 cursor-pointer group active:scale-[0.97] transition-all select-none w-full"
    >
      {/* Capa do Álbum Quadrada com Raio de 16px (10-12% da altura) */}
      <div className="relative aspect-square w-full rounded-[16px] overflow-hidden bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] shadow-md">
        <img
          src={coverUrl}
          alt={title}
          loading="lazy"
          className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Metadados: Título, Artista e Ano de Lançamento com Margem Superior Arejada */}
      <div className="mt-2.5 px-0.5 space-y-0.5">
        <h4 className="text-[15px] font-extrabold text-[var(--text-primary)] truncate leading-tight group-hover:text-[var(--accent-primary)] transition-colors">
          {title}
        </h4>
        <p className="text-xs font-normal text-[var(--text-secondary)] truncate">
          {artist}
        </p>
        <p className="text-[11px] font-normal text-[var(--text-muted)]">
          {year}
        </p>
      </div>
    </div>
  )
}
