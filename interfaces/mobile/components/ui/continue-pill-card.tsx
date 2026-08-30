"use client"

import React from "react"

interface ContinuePillCardProps {
  id: string
  title: string
  coverUrl: string
  onClick?: () => void
}

export function ContinuePillCard({
  id,
  title,
  coverUrl,
  onClick,
}: ContinuePillCardProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2.5 p-1.5 pr-3 h-14 rounded-[8.5px] bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-1)] active:scale-[0.98] transition-all cursor-pointer select-none group w-full shadow-sm"
    >
      {/* Capa com cantos arredondados de 15% da altura (44px * 0.15 = ~6.5px) */}
      <div className="size-11 rounded-[6.5px] overflow-hidden bg-[var(--bg-surface-1)] shrink-0 border border-[var(--border-subtle)]">
        <img
          src={coverUrl}
          alt={title}
          loading="lazy"
          className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Título da Faixa ou Coleção */}
      <div className="min-w-0 flex-1">
        <h4 className="text-[13px] font-extrabold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-primary)] transition-colors leading-tight">
          {title}
        </h4>
      </div>
    </div>
  )
}
