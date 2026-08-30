"use client"

import React from "react"

interface MediaCardProps {
  id: string
  title: string
  subtitle?: string
  imageUrl: string
  onClick: () => void
}

export function MediaCard({
  id,
  title,
  subtitle,
  imageUrl,
  onClick,
}: MediaCardProps) {
  return (
    <div
      onClick={onClick}
      className="flex flex-col w-[130px] shrink-0 cursor-pointer group active:scale-95 transition-all select-none"
    >
      {/* Imagem Quadrada com Raio de 14px (10-12% da altura) */}
      <div className="relative aspect-square w-full rounded-[14px] overflow-hidden bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] shadow-md">
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
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
