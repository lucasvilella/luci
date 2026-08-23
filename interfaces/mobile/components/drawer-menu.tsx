"use client"

import { useState } from "react"
import { Sparkles, Music, MessageSquare, Mic, Settings, LogOut, ChevronRight, X } from "lucide-react"

export interface DrawerMenuProps {
  isOpen: boolean
  onClose: () => void
  currentModule: "luci" | "music" | "settings"
  onSelectModule: (module: "luci" | "music" | "settings") => void
  user?: { name: string; email?: string }
}

export function DrawerMenu({
  isOpen,
  onClose,
  currentModule,
  onSelectModule,
  user = { name: "Lucas Vilella", email: "lucas@luci.ai" },
}: DrawerMenuProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in select-none">
      {/* Backdrop com desfoque */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
      />

      {/* Painel do Drawer Lateral */}
      <div className="relative z-10 w-72 max-w-[80vw] h-full bg-[#FFFFFF] text-zinc-900 shadow-2xl flex flex-col justify-between p-6 animate-slide-right border-r border-zinc-200">
        <div className="space-y-7">
          {/* Topo: Perfil & Fechar */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-full bg-gradient-to-tr from-[#22C55E] to-emerald-600 flex items-center justify-center text-white font-bold shadow-md">
                LV
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate text-zinc-900">{user.name}</p>
                <p className="text-[11px] text-zinc-400 font-medium">Conta Pessoal</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="size-9 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-black active:scale-95 transition-transform"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Módulos Principais */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-3">
              Módulos
            </p>

            {/* 1. Módulo Único: Luci (Voz & Chat Unificados) */}
            <button
              type="button"
              onClick={() => {
                onSelectModule("luci")
                onClose()
              }}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all ${
                currentModule === "luci"
                  ? "bg-zinc-900 text-white shadow-md"
                  : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${currentModule === "luci" ? "bg-white/10 text-[#22C55E]" : "bg-zinc-200 text-zinc-700"}`}>
                  <Sparkles className="size-4" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">Luci</p>
                  <p className={`text-[10px] font-medium ${currentModule === "luci" ? "text-zinc-400" : "text-zinc-500"}`}>
                    Voz, Chat & Inteligência
                  </p>
                </div>
              </div>
              <ChevronRight className="size-4 opacity-40" />
            </button>

            {/* 2. Módulo: LuciMusic (Player Inteligente) */}
            <button
              type="button"
              onClick={() => {
                onSelectModule("music")
                onClose()
              }}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all ${
                currentModule === "music"
                  ? "bg-zinc-900 text-white shadow-md"
                  : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${currentModule === "music" ? "bg-white/10 text-[#22C55E]" : "bg-zinc-200 text-zinc-700"}`}>
                  <Music className="size-4" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">Música</p>
                  <p className={`text-[10px] font-medium ${currentModule === "music" ? "text-zinc-400" : "text-zinc-500"}`}>
                    Player, Mixes & Rádio
                  </p>
                </div>
              </div>
              <ChevronRight className="size-4 opacity-40" />
            </button>
          </div>
        </div>

        {/* Rodapé: Configurações */}
        <div className="pt-4 border-t border-zinc-100 space-y-1">
          <button
            type="button"
            onClick={() => {
              onSelectModule("settings")
              onClose()
            }}
            className="w-full flex items-center gap-3 p-3 rounded-2xl text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            <Settings className="size-4 text-zinc-500" />
            <span className="text-xs font-bold">Configurações</span>
          </button>
        </div>
      </div>
    </div>
  )
}
