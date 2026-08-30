"use client"

import React from "react"

interface CreatedByLuciCardProps {
  momentTag?: string
  title: string
  affinityPercent?: number
  athleteImageUrl?: string
  onClick?: () => void
}

export function CreatedByLuciCard({
  momentTag = "MOMENTO DO DIA/GATILHO",
  title = "TEMA CENTRAL\nDA PLAYLIST",
  affinityPercent = 88,
  athleteImageUrl = "/images/music/created-by-luci/playlist_gym.png",
  onClick,
}: CreatedByLuciCardProps) {
  return (
    <div className="relative pt-6 w-full select-none">
      {/* Card Retangular Roxo Escuro / Índigo com Cantos de 24px */}
      <div
        onClick={onClick}
        className="relative w-full rounded-[24px] bg-[#2f2963] shadow-xl cursor-pointer group active:scale-[0.99] transition-all border border-[#403882] min-h-[148px]"
      >
        {/* Padrão de Ondas Radiais Finas no Canto Superior Direito */}
        <div className="absolute right-0 top-0 size-48 pointer-events-none opacity-25 overflow-hidden rounded-tr-[24px]">
          <svg viewBox="0 0 200 200" className="size-full" fill="none" stroke="white" strokeWidth="1">
            <circle cx="200" cy="0" r="40" />
            <circle cx="200" cy="0" r="70" />
            <circle cx="200" cy="0" r="100" />
            <circle cx="200" cy="0" r="130" />
            <circle cx="200" cy="0" r="160" />
            <circle cx="200" cy="0" r="190" />
          </svg>
        </div>

        {/* Conteúdo de Texto à Esquerda */}
        <div className="relative z-10 flex flex-col justify-between p-5 pr-[42%] min-h-[148px]">
          {/* Tag de Momento / Gatilho */}
          <span className="text-[11px] font-black uppercase tracking-wider text-[#9790c9]">
            {momentTag}
          </span>

          {/* Título Principal */}
          <div className="my-1.5">
            <h3 className="text-lg font-black uppercase text-white leading-[1.15] tracking-tight whitespace-pre-line drop-shadow-sm">
              {title}
            </h3>
          </div>

          {/* Barra de Afinidade */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-xs font-bold text-[#b4aedc]">
              <span>Afinidade</span>
              <span className="text-white font-extrabold">{affinityPercent}%</span>
            </div>
            {/* Barra de Fundo (#4b4382) e Preenchimento Branco Total */}
            <div className="w-full h-2 rounded-full bg-[#4b4382] overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all duration-700 shadow-sm"
                style={{ width: `${affinityPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Foto do Atleta Recortada (playlist_gym.png) Vazando no Topo */}
        <div className="absolute -top-6 right-0 h-[174px] w-[46%] pointer-events-none z-20 flex items-end justify-end">
          <img
            src={athleteImageUrl}
            alt={title}
            className="h-full w-auto object-contain object-right-bottom drop-shadow-2xl"
          />
        </div>
      </div>
    </div>
  )
}
