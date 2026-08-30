"use client"

import React from "react"
import { ChevronRight } from "lucide-react"

interface LibraryMenuRowProps {
  id: string
  label: string
  icon: React.ElementType
  badgeCount?: number
  onClick: () => void
}

export function LibraryMenuRow({
  id,
  label,
  icon: Icon,
  badgeCount,
  onClick,
}: LibraryMenuRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between py-3.5 px-2 rounded-2xl hover:bg-[var(--bg-surface-1)] transition-all active:scale-[0.99] select-none group text-left"
    >
      {/* Lado Esquerdo: Ícone Estilizado + Nome */}
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="flex size-9 items-center justify-center rounded-xl bg-[var(--bg-surface-1)] text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] group-hover:bg-[var(--accent-surface)] transition-colors shrink-0 border border-[var(--border-subtle)] shadow-sm">
          <Icon className="size-5 stroke-[1.8]" />
        </div>
        <span className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors truncate">
          {label}
        </span>
      </div>

      {/* Lado Direito: Contador Opcional + Chevron */}
      <div className="flex items-center gap-2 shrink-0">
        {badgeCount !== undefined && badgeCount > 0 && (
          <span className="text-xs font-semibold text-[var(--text-secondary)] px-2 py-0.5 rounded-full bg-[var(--bg-surface-2)]">
            {badgeCount}
          </span>
        )}
        <ChevronRight className="size-5 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] group-hover:translate-x-0.5 transition-all" />
      </div>
    </button>
  )
}
