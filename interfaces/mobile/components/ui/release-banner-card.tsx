"use client"

import React from "react"
import { Play, Pause } from "lucide-react"

interface ReleaseBannerCardProps {
  id?: string
  tag?: string
  title: string
  subtitle: string
  footerText?: string
  coverUrl: string
  isPlaying?: boolean
  onPlay?: () => void
  onClick?: () => void
}

export function ReleaseBannerCard({
  tag = "Novo Lançamento",
  title = "HIT ME HARD AND SOFT",
  subtitle = "Billie Eilish",
  footerText = "Álbum • 10 faixas",
  coverUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500",
  isPlaying = false,
  onPlay,
  onClick,
}: ReleaseBannerCardProps) {
  return (
    <div
      onClick={onClick}
      className="relative w-full overflow-hidden rounded-[24px] p-4 select-none cursor-pointer group active:scale-[0.99] transition-all shadow-xl shadow-[#5c62ec]/20"
      style={{
        background: "linear-gradient(135deg, #5c62ec 0%, #7c82ff 100%)",
      }}
    >
      {/* ─── PADRÃO DE ONDAS RADIAIS NO CANTO DIREITO (CONFORME O MOCKUP) ─── */}
      <div className="absolute right-0 top-0 bottom-0 w-44 pointer-events-none opacity-25 overflow-hidden flex items-center justify-center">
        <svg
          viewBox="0 0 200 200"
          className="size-48 text-white stroke-current fill-none stroke-[1.2]"
        >
          <ellipse cx="140" cy="100" rx="30" ry="70" />
          <ellipse cx="140" cy="100" rx="45" ry="85" />
          <ellipse cx="140" cy="100" rx="60" ry="100" />
          <ellipse cx="140" cy="100" rx="75" ry="115" />
          <ellipse cx="140" cy="100" rx="90" ry="130" />
          <ellipse cx="140" cy="100" rx="105" ry="145" />
        </svg>
      </div>

      {/* ─── CONTEÚDO DO CARD EM GRID HORIZONTAL ─── */}
      <div className="relative z-10 flex items-center justify-between gap-3">
        {/* Lado Esquerdo: Imagem da Capa (Raio 12px) + Textos */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {/* Capa com Raio de 12px (12-15% da altura de 80px) */}
          <div className="size-20 rounded-[12px] overflow-hidden bg-black/20 border border-white/20 shadow-md shrink-0">
            <img
              src={coverUrl}
              alt={title}
              loading="lazy"
              className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Textos em Branco com Tipografia de Alto Impacto */}
          <div className="min-w-0 flex-1 space-y-0.5 text-white">
            <p className="text-[11px] font-bold tracking-wider uppercase opacity-90 truncate">
              {tag}
            </p>
            <h3 className="text-base sm:text-lg font-black leading-tight tracking-tight line-clamp-2 drop-shadow-sm">
              {title}
            </h3>
            <p className="text-xs font-semibold opacity-95 truncate">
              {subtitle}
            </p>
            {footerText && (
              <p className="text-[10px] font-normal opacity-75 truncate">
                {footerText}
              </p>
            )}
          </div>
        </div>

        {/* Lado Direito: Botão Play Circular Flutuante em Vidro/Soft-UI */}
        <div className="shrink-0 pr-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onPlay?.()
            }}
            aria-label={isPlaying ? "Pausar lançamento" : "Tocar lançamento"}
            className="size-14 rounded-full bg-white text-[#1c1e26] flex items-center justify-center shadow-xl shadow-black/25 hover:scale-105 active:scale-95 transition-all group/btn"
          >
            {isPlaying ? (
              <Pause className="size-6 fill-[#1c1e26] text-[#1c1e26]" />
            ) : (
              <Play className="size-6 fill-[#1c1e26] text-[#1c1e26] translate-x-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
