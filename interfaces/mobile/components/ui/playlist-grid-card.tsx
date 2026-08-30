"use client"

import React from "react"

interface PlaylistGridCardProps {
  id: string
  title: string
  coverUrl: string
  onClick: () => void
}

export function PlaylistGridCard({
  id,
  title,
  coverUrl,
  onClick,
}: PlaylistGridCardProps) {
  return (
    <div
      onClick={onClick}
      className="flex flex-col space-y-2.5 cursor-pointer group active:scale-[0.97] transition-all select-none w-full"
    >
      {/* Capa da Playlist Quadrada com Raio de 16px (10-12% da altura) */}
      <div className="relative aspect-square w-full rounded-[16px] overflow-hidden bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] shadow-md">
        <img
          src={coverUrl}
          alt={title}
          loading="lazy"
          className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Título da Playlist em destaque (15px font-bold com quebra natural de linha) */}
      <div className="px-0.5">
        <h4 className="text-[14px] font-extrabold text-[var(--text-primary)] leading-tight group-hover:text-[var(--accent-primary)] transition-colors line-clamp-2">
          {title}
        </h4>
      </div>
    </div>
  )
}
