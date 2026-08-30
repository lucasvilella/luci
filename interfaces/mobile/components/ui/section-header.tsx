"use client"

import React from "react"
import { ChevronRight } from "lucide-react"

interface SectionHeaderProps {
  title: string
  onSeeAll?: () => void
  seeAllText?: string
}

export function SectionHeader({
  title,
  onSeeAll,
  seeAllText = "Ver tudo",
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between px-1 mb-3 select-none">
      <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
        {title}
      </h2>

      {onSeeAll && (
        <button
          type="button"
          onClick={onSeeAll}
          className="text-xs font-semibold text-[var(--accent-primary)] hover:opacity-80 active:scale-95 transition-all flex items-center gap-0.5"
        >
          <span>{seeAllText}</span>
        </button>
      )}
    </div>
  )
}
