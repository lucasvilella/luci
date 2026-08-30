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
    <div className="fixed inset-0 z-50 flex items-end justify-center select-none animate-fade-in pointer-events-auto">
      {/* Backdrop com desfoque suave */}
      <div
        onClick={() => setModuleSelectorOpen(false)}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Bottom Sheet subindo a partir do Deck Inferior */}
      <div
        className="relative z-10 w-full max-w-[480px] rounded-t-[36px] px-6 pt-3 pb-8 shadow-2xl border-t transition-all duration-300 animate-slide-up"
        style={{
          backgroundColor: "var(--bg-deck)",
          borderColor: "var(--border-subtle)",
          boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.4)",
        }}
      >
        {/* Pílula / Handle Superior de Arrasto */}
        <div className="flex justify-center mb-3">
          <span className="h-1.5 w-10 rounded-full bg-[var(--text-muted)]/40" />
        </div>

        {/* Título Centralizado do Bottom Sheet */}
        <div className="text-center mb-5">
          <h3 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
            Módulos da Luci
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Selecione o módulo para alternar no SuperApp
          </p>
        </div>

        {/* Grelha de Módulos no Formato Cards Pílula do Design System */}
        <div className="grid grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto no-scrollbar pb-2">
          {modulesList.map((mod) => {
            const Icon = ICONS_MAP[mod.iconName] || Sparkles
            const isActive = activeModuleId === mod.id

            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => {
                  setActiveModule(mod.id as AppModuleId)
                  setModuleSelectorOpen(false)
                }}
                className={`relative flex items-center gap-3 p-3 rounded-2xl transition-all active:scale-95 text-left border ${
                  isActive
                    ? "bg-[var(--accent-surface)] border-[var(--accent-primary)] shadow-sm ring-1 ring-[var(--accent-primary)]/40"
                    : "bg-[var(--bg-surface-1)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
                }`}
              >
                <div
                  className={`flex size-11 items-center justify-center rounded-2xl transition-colors shrink-0 ${
                    isActive
                      ? "bg-gradient-to-tr from-[#2B1776] to-[#7527C3] text-white shadow-md shadow-[#7527c3]/30"
                      : "bg-[var(--bg-surface-2)] text-[var(--text-primary)]"
                  }`}
                >
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span
                    className={`text-xs font-bold block truncate ${
                      isActive
                        ? "text-[var(--accent-primary)]"
                        : "text-[var(--text-primary)]"
                    }`}
                  >
                    {mod.name}
                  </span>
                  <p className="text-[10px] text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                    {mod.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Botão de Fechar / Cancelar Estilo Pílula */}
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setModuleSelectorOpen(false)}
            className="w-full max-w-[200px] py-2.5 rounded-full bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95 transition-all shadow-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
