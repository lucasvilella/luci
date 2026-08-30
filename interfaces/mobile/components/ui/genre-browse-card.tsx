"use client"

import React from "react"

interface GenreBrowseCardProps {
  id: string
  title: string
  bgGradient: string
  artistImageUrl: string
  onClick?: () => void
}

export function GenreBrowseCard({
  id,
  title,
  bgGradient,
  artistImageUrl,
  onClick,
}: GenreBrowseCardProps) {
  return (
    <div
      onClick={onClick}
      className="relative h-[84px] w-full rounded-[14px] overflow-hidden p-3.5 flex items-center justify-between cursor-pointer group active:scale-[0.98] transition-all shadow-md select-none border border-white/10"
      style={{ background: bgGradient }}
    >
      {/* Título do Gênero */}
      <span className="relative z-10 text-base font-extrabold text-white tracking-tight drop-shadow-sm truncate max-w-[60%]">
        {title}
      </span>

      {/* Recorte do Artista no Lado Direito */}
      <div className="absolute right-0 bottom-0 top-0 w-24 overflow-hidden pointer-events-none flex items-end justify-end">
        <img
          src={artistImageUrl}
          alt={title}
          loading="lazy"
          className="h-full object-cover object-top filter drop-shadow-lg group-hover:scale-105 transition-transform duration-300"
        />
      </div>
    </div>
  )
}
