"use client"

import React from "react"

interface ArtistCircleProps {
  id: string
  name: string
  avatarUrl: string
  onClick: () => void
}

export function ArtistCircle({
  id,
  name,
  avatarUrl,
  onClick,
}: ArtistCircleProps) {
  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center gap-2 w-[130px] shrink-0 cursor-pointer group active:scale-95 transition-all select-none"
    >
      {/* Avatar Circular 130x130 */}
      <div className="relative size-[130px] rounded-full overflow-hidden bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] shadow-md">
        <img
          src={avatarUrl}
          alt={name}
          loading="lazy"
          className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Nome do Artista */}
      <span className="text-[13px] font-bold text-[var(--text-primary)] text-center truncate w-full px-1 group-hover:text-[var(--accent-primary)] transition-colors">
        {name}
      </span>
    </div>
  )
}
