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
    setModuleSelectorOpen,
    activeModuleId,
    setActiveModule,
    moduleUsageCounts,
  } = useAppNavigationStore()

  // Ordenação Inteligente Omnipresente da Luci:
  // 1. Luci Assistant ('orb') é SEMPRE o primeiro.
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
    <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-20 select-none animate-slide-up pointer-events-none">
      {/* Backdrop transparente/suave que fecha ao clicar fora */}
      <div
        onClick={() => setModuleSelectorOpen(false)}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity"
      />

      {/* 
        Menu Flutuante que sobe a partir do Deck Inferior (ancorado com pb-20 no z-30, logo acima do deck z-40)
        Design System minimalista: 1 módulo por linha, apenas ícone e nome, sem pills pesadas, com linha separadora sutil.
      */}
      <div
        className="pointer-events-auto relative z-10 w-full max-w-[404px] overflow-hidden rounded-[28px] border p-4 shadow-2xl backdrop-blur-2xl transition-all"
        style={{
          backgroundColor: "var(--bg-deck)",
          borderColor: "var(--border-subtle)",
          boxShadow: "0 -10px 36px rgba(0, 0, 0, 0.35), var(--shadow-deck)",
        }}
      >
        {/* Cabeçalho Minimalista da Luci */}
        <div className="flex items-center justify-between px-2 pb-2.5 mb-1 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Módulos Inteligentes
            </h4>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] font-medium">
            Ordenado por afinidade
          </span>
        </div>

        {/* Lista Vertical de Módulos (1 por linha, sem pill, com divisores) */}
        <div className="divide-y divide-[var(--border-subtle)] max-h-[48vh] overflow-y-auto no-scrollbar">
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
                className={`w-full flex items-center justify-between py-3 px-2 transition-all active:scale-[0.98] text-left hover:bg-[var(--bg-surface-1)] rounded-xl ${
                  isActive ? "text-[var(--accent-primary)] font-bold" : "text-[var(--text-primary)]"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`flex size-9 items-center justify-center rounded-full transition-all shrink-0 ${
                      isActive
                        ? "bg-gradient-to-tr from-[#2B1776] to-[#7527C3] text-white shadow-md shadow-[#7527c3]/30"
                        : "bg-[var(--bg-surface-2)] text-[var(--text-secondary)]"
                    }`}
                  >
                    <Icon className="size-4 stroke-[2]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-sm font-semibold truncate block ${
                        isActive ? "text-[var(--accent-primary)] font-bold" : "text-[var(--text-primary)]"
                      }`}
                    >
                      {mod.name}
                    </span>
                  </div>
                </div>

                {/* Indicador de Módulo Ativo */}
                {isActive && (
                  <div className="flex size-6 items-center justify-center rounded-full bg-[var(--accent-surface)] text-[var(--accent-primary)]">
                    <Check className="size-3.5 stroke-[2.5]" />
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
