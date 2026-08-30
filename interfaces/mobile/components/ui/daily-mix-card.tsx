"use client"

import React from "react"

interface DailyMixCardProps {
  mixId: number | string
  title: string
  subtitle: string
  artistImageUrl?: string
  templateUrl?: string
  onClick?: () => void
}

export function DailyMixCard({
  mixId,
  title,
  subtitle,
  artistImageUrl,
  templateUrl,
  onClick,
}: DailyMixCardProps) {
  // Extrai o número do mix (1 a 5)
  const mixNum = typeof mixId === "number" ? mixId : parseInt(String(mixId).replace(/\D/g, ""), 10) || 1
  const safeMixIndex = ((mixNum - 1) % 5) + 1
  const frameSrc = templateUrl || `/images/music/daily-mix/dailymix_${safeMixIndex}.png`

  return (
    <div
      onClick={onClick}
      className="flex flex-col w-[130px] shrink-0 cursor-pointer group active:scale-95 transition-all select-none"
    >
      {/* Container da Capa: Proporção 1050x1200 com Capa Alinhada ao Topo por Baixo da Moldura */}
      <div className="relative aspect-[1050/1200] w-full rounded-[14px] overflow-hidden bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] shadow-md">
        {/* Foto de Fundo do Artista / Capa Alinhada no Topo por baixo da moldura */}
        {artistImageUrl ? (
          <img
            src={artistImageUrl}
            alt={title}
            loading="lazy"
            className="absolute inset-0 size-full object-cover object-top group-hover:scale-105 transition-transform duration-300 z-0"
          />
        ) : (
          <div className="absolute inset-0 size-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 z-0" />
        )}

        {/* Moldura Oficial Daily Mix Sobreposta (PNG transparente) */}
        <img
          src={frameSrc}
          alt={title}
          loading="lazy"
          className="absolute inset-0 size-full object-cover pointer-events-none z-10 drop-shadow-sm"
        />
      </div>

      {/* Textos com Margem Superior Arejada */}
      <div className="mt-2.5 px-0.5 space-y-0.5">
        <h4 className="text-sm font-extrabold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-primary)] transition-colors">
          {title}
        </h4>
        <p className="text-xs font-medium text-[var(--text-secondary)] line-clamp-1">
          {subtitle}
        </p>
      </div>
    </div>
  )
}
