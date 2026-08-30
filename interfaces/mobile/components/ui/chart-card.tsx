"use client"

import React from "react"

interface ChartCardProps {
  id: string
  title: string
  gradient: string
  onClick: () => void
}

export function ChartCard({ id, title, gradient, onClick }: ChartCardProps) {
  return (
    <div
      onClick={onClick}
      className="w-[155px] h-[100px] shrink-0 rounded-[22px] overflow-hidden p-3 flex items-end justify-center cursor-pointer group active:scale-95 transition-all shadow-md select-none border border-[var(--border-subtle)]"
      style={{
        background: gradient,
      }}
    >
      <span className="text-sm font-black tracking-wider text-white uppercase drop-shadow-md group-hover:scale-105 transition-transform">
        {title}
      </span>
    </div>
  )
}
