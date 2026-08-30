"use client"

import React from "react"
import { Check } from "lucide-react"

interface ArtistRowProps {
  id: string
  name: string
  avatarUrl: string
  isVerified?: boolean
  isFollowed?: boolean
  onClick: () => void
  onFollowToggle: (e: React.MouseEvent) => void
}

export function ArtistRow({
  id,
  name,
  avatarUrl,
  isVerified = true,
  isFollowed = false,
  onClick,
  onFollowToggle,
}: ArtistRowProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between py-2.5 px-1 rounded-2xl hover:bg-[var(--bg-surface-1)] transition-colors cursor-pointer group active:scale-[0.99] select-none"
    >
      {/* Lado Esquerdo: Avatar Circular (72x72) + Nome com Badge Verificado */}
      <div className="flex items-center gap-4 min-w-0 flex-1 pr-3">
        <div className="relative size-[68px] shrink-0 rounded-full overflow-hidden bg-[var(--bg-surface-2)] shadow-sm border border-[var(--border-subtle)]">
          <img
            src={avatarUrl}
            alt={name}
            loading="lazy"
            className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="text-base font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-primary)] transition-colors leading-tight">
              {name}
            </h4>
            {isVerified && (
              <span className="size-4 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Check className="size-2.5 stroke-[3]" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Lado Direito: Botão Seguir / Seguindo (Padrão Oficial Luci) */}
      <div className="shrink-0">
        <button
          type="button"
          onClick={onFollowToggle}
          aria-label={isFollowed ? "Deixar de seguir" : "Seguir artista"}
          className={`px-5 py-2 rounded-full text-xs font-bold transition-all active:scale-95 border ${
            isFollowed
              ? "bg-transparent text-[var(--accent-primary)] border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10"
              : "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-sm shadow-[#5c62ec]/30"
          }`}
        >
          {isFollowed ? "Seguindo" : "Seguir"}
        </button>
      </div>
    </div>
  )
}
