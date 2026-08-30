"use client"

import React from "react"

interface ExploreCategoryCardProps {
  id: string
  title: string
  bgColor: string
  coverUrl: string
  onClick: () => void
}

export function ExploreCategoryCard({
  id,
  title,
  bgColor,
  coverUrl,
  onClick,
}: ExploreCategoryCardProps) {
  return (
    <div
      onClick={onClick}
      className="relative h-[106px] w-full rounded-[24px] overflow-hidden p-4 flex flex-col justify-between cursor-pointer group active:scale-[0.97] transition-all shadow-md select-none border border-[var(--border-subtle)]"
      style={{
        backgroundColor: bgColor,
      }}
    >
      {/* Título da Categoria */}
      <h3 className="text-base font-extrabold text-white tracking-tight drop-shadow-sm z-10">
        {title}
      </h3>

      {/* Capa Inclinada / Rotação no Canto Inferior Direito (Mockup Exact Pattern) */}
      <div className="absolute -bottom-3 -right-3 size-[78px] rounded-[14px] overflow-hidden shadow-2xl transform rotate-[25deg] group-hover:rotate-[18deg] group-hover:scale-110 transition-transform duration-300 border border-white/20">
        <img
          src={coverUrl}
          alt={title}
          loading="lazy"
          className="size-full object-cover"
        />
      </div>
    </div>
  )
}
