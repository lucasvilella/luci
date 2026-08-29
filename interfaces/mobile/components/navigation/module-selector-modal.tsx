"use client"

import React from "react"
import {
  Sparkles,
  Music,
  Film,
  House,
  Dumbbell,
  Wallet,
  Calendar,
  X,
  ChevronRight,
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
  } = useAppNavigationStore()

  if (!isModuleSelectorOpen) return null

  const modulesList = Object.values(MODULES_REGISTRY)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-28 animate-fade-in select-none">
      {/* Backdrop com desfoque */}
      <div
        onClick={() => setModuleSelectorOpen(false)}
        className="fixed inset-0 bg-black/50 backdrop-blur-md transition-opacity"
      />

      {/* Card Flutuante de Seleção de Módulos */}
      <div
        className="relative z-10 w-full max-w-[420px] rounded-3xl p-5 shadow-2xl border transition-all duration-300 animate-slide-up"
        style={{
          backgroundColor: "var(--bg-deck)",
          borderColor: "var(--border-subtle)",
          boxShadow: "var(--shadow-deck)",
        }}
      >
        {/* Header do Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
            <h3 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
              Módulos da Luci
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setModuleSelectorOpen(false)}
            className="flex size-7 items-center justify-center rounded-full bg-[var(--bg-surface-1)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-90"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Grelha / Lista de Módulos */}
        <div className="grid grid-cols-2 gap-2.5 pt-4 max-h-[50vh] overflow-y-auto no-scrollbar">
          {modulesList.map((mod) => {
            const Icon = ICONS_MAP[mod.iconName] || Sparkles
            const isActive = activeModuleId === mod.id

            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => {
                  setActiveModule(mod.id as AppModuleId)
                }}
                className={`relative flex items-center gap-3 p-3 rounded-2xl transition-all active:scale-95 text-left border ${
                  isActive
                    ? "bg-[var(--accent-surface)] border-[var(--accent-primary)] shadow-sm"
                    : "bg-[var(--bg-surface-1)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
                }`}
              >
                <div
                  className={`flex size-10 items-center justify-center rounded-xl transition-colors shrink-0 ${
                    isActive
                      ? "bg-[var(--accent-primary)] text-white shadow-md shadow-[#5c62ec]/30"
                      : "bg-[var(--bg-surface-2)] text-[var(--text-primary)]"
                  }`}
                >
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold truncate ${
                        isActive
                          ? "text-[var(--accent-primary)]"
                          : "text-[var(--text-primary)]"
                      }`}
                    >
                      {mod.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                    {mod.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
