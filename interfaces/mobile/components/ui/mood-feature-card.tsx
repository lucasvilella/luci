"use client"

import React from "react"
import { LucideIcon } from "lucide-react"

interface MoodFeatureCardProps {
  id: string
  title: string
  bgGradient: string
  icon: LucideIcon
  onClick?: () => void
}

export function MoodFeatureCard({
  id,
  title,
  bgGradient,
  icon: Icon,
  onClick,
}: MoodFeatureCardProps) {
  return (
    <div
      onClick={onClick}
      className="relative h-[84px] w-full rounded-[14px] overflow-hidden p-3.5 flex items-center justify-between cursor-pointer group active:scale-[0.98] transition-all shadow-md select-none border border-white/10"
      style={{ background: bgGradient }}
    >
      {/* Título do Mood / Categoria */}
      <span className="relative z-10 text-base font-extrabold text-white tracking-tight drop-shadow-sm truncate max-w-[65%]">
        {title}
      </span>

      {/* Ícone de Contorno Neon/Suave no Lado Direito */}
      <div className="relative z-10 size-12 flex items-center justify-center text-white/40 group-hover:text-white/80 group-hover:scale-110 transition-all duration-300">
        <Icon className="size-9 stroke-[1.5]" />
      </div>
    </div>
  )
}
