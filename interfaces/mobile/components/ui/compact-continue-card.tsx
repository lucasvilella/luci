"use client"

import React from "react"
import { Shuffle, Radio } from "lucide-react"

interface CompactContinueCardProps {
  id: string
  title: string
  coverUrl: string
  type?: "playlist" | "station" | "album"
  onClick?: () => void
}

export function CompactContinueCard({
  id,
  title,
  coverUrl,
  type = "playlist",
  onClick,
}: CompactContinueCardProps) {
  return (
    <div
      onClick={onClick}
      className="flex flex-col w-[92px] shrink-0 cursor-pointer group active:scale-95 transition-all select-none"
    >
      {/* Miniatura Quadrada de 92px com Cantos Arredondados de 10px (10-12% da altura) */}
      <div className="relative size-[92px] rounded-[10px] overflow-hidden bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] shadow-sm">
        <img
          src={coverUrl}
          alt={title}
          loading="lazy"
          className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Badge circular translúcido no canto inferior esquerdo (Shuffle / Rádio) */}
        <div className="absolute bottom-1.5 left-1.5 size-6 rounded-full bg-black/75 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-sm">
          {type === "station" ? (
            <Radio className="size-3 stroke-[2.2]" />
          ) : (
            <Shuffle className="size-3 stroke-[2.2]" />
          )}
        </div>
      </div>

      {/* Título Compacto com font-bold e 2 linhas limitadas */}
      <div className="mt-1.5">
        <h4 className="text-xs font-bold text-[var(--text-primary)] line-clamp-2 leading-tight tracking-tight group-hover:text-[var(--accent-primary)] transition-colors">
          {title}
        </h4>
      </div>
    </div>
  )
}
