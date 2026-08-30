"use client"

import React, { useMemo } from "react"
import {
  Sparkles,
  Music,
  Film,
  House,
  Dumbbell,
  Wallet,
  Calendar,
  Check,
} from "lucide-react"
import {
  useAppNavigationStore,
  MODULES_REGISTRY,
  AppModuleId,
} from "@/stores/useAppNavigationStore"

const ICONS_MAP: Record<string, React.ElementType> = {
  Sparkles,
  Music,
  Film,
  House,
  Dumbbell,
  Wallet,
  Calendar,
}

export function ModuleSelectorModal() {
  const {
    isModuleSelectorOpen,
    activeModuleId,
    setActiveModule,
    moduleUsageCounts,
  } = useAppNavigationStore()

  // Ordenação Inteligente Omnipresente da Luci:
  // 1. Luci ('orb') é SEMPRE o primeiro.
  // 2. Os demais módulos são ordenados dinamicamente por volume de uso/relevância.
  const sortedModules = useMemo(() => {
    const all = Object.values(MODULES_REGISTRY)
    const luciCore = all.find((m) => m.id === "orb")
    const others = all.filter((m) => m.id !== "orb")

    others.sort((a, b) => {
      const countA = moduleUsageCounts[a.id] || 0
      const countB = moduleUsageCounts[b.id] || 0
      return countB - countA
    })

    return luciCore ? [luciCore, ...others] : others
  }, [moduleUsageCounts])

  if (!isModuleSelectorOpen) return null

  return (
    <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 pointer-events-none select-none animate-in fade-in slide-in-from-bottom-4 duration-150">
      {/* 
        Container em Pílula Orgânica que "sobe por trás" do deck de navegação (bottom-4 com z-30, dock no z-40).
        Fundo da superfície suave, cantos arredondados generosos de 32px e alinhado perfeitamente com o deck (max-w-[404px] pb-[74px]).
      */}
      <div
        className="pointer-events-auto relative w-full max-w-[404px] overflow-hidden rounded-[32px] pt-3 pb-[74px] px-3 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-2xl border border-[var(--border-subtle)] transition-all bg-[var(--bg-surface-1)]"
        style={{
          boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.15), var(--shadow-deck)",
        }}
      >
        {/* Lista Vertical de Módulos (1 por linha, sem pill pesada, tipografia ampliada e divisores sutis) */}
        <div className="divide-y divide-[var(--border-subtle)] max-h-[52vh] overflow-y-auto no-scrollbar">
          {sortedModules.map((mod) => {
            const Icon = ICONS_MAP[mod.iconName] || Sparkles
            const isActive = activeModuleId === mod.id

            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => {
                  setActiveModule(mod.id as AppModuleId)
                }}
                className={`w-full flex items-center justify-between py-3 px-3 transition-all active:scale-[0.98] text-left hover:bg-[var(--bg-surface-2)] rounded-2xl ${
                  isActive ? "text-[var(--accent-primary)] font-bold" : "text-[var(--text-primary)]"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`flex size-10 items-center justify-center rounded-2xl transition-all shrink-0 ${
                      isActive
                        ? "bg-gradient-to-tr from-[#2B1776] to-[#7527C3] text-white shadow-md shadow-[#7527c3]/35"
                        : "bg-[var(--bg-surface-2)] text-[var(--text-secondary)]"
                    }`}
                  >
                    <Icon className="size-5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-[15px] font-bold tracking-tight truncate block ${
                        isActive ? "text-[var(--accent-primary)]" : "text-[var(--text-primary)]"
                      }`}
                    >
                      {mod.name}
                    </span>
                  </div>
                </div>

                {/* Indicador de Módulo Ativo */}
                {isActive && (
                  <div className="flex size-6 items-center justify-center rounded-full bg-[var(--accent-surface)] text-[var(--accent-primary)] shrink-0">
                    <Check className="size-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
