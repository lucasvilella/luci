"use client"

import { useState, useEffect } from "react"
import { Moon, Clock, Check, X } from "lucide-react"

interface SleepTimerSheetProps {
  isOpen: boolean
  onClose: () => void
  onSetTimer: (minutes: number | null) => void
  activeMinutes: number | null
}

const TIMER_OPTIONS = [
  { label: "15 minutos", value: 15 },
  { label: "30 minutos", value: 30 },
  { label: "45 minutos", value: 45 },
  { label: "1 hora", value: 60 },
  { label: "Fim da faixa atual", value: -1 },
]

export function SleepTimerSheet({
  isOpen,
  onClose,
  onSetTimer,
  activeMinutes,
}: SleepTimerSheetProps) {
  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] rounded-t-3xl bg-[var(--bg-surface)] border-t border-[var(--border)] p-6 space-y-5 shadow-2xl animate-slide-up"
      >
        {/* Handle / Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-[var(--accent-purple)]/20 flex items-center justify-center text-[var(--accent-purple)]">
              <Moon className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Temporizador de Sono</h3>
              <p className="text-[11px] font-semibold text-[var(--text-secondary)]">
                O áudio fará fade out suave ao terminar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Lista de Opções */}
        <div className="space-y-1.5">
          {TIMER_OPTIONS.map((opt) => {
            const isSelected = activeMinutes === opt.value
            return (
              <button
                key={`timer-${opt.value}`}
                type="button"
                onClick={() => {
                  onSetTimer(opt.value)
                  onClose()
                }}
                className={`flex w-full items-center justify-between p-3.5 rounded-2xl transition-all active:scale-[0.99] ${
                  isSelected
                    ? "bg-gradient-to-r from-[#0033ff] to-[#977dff] text-white shadow-lg font-black"
                    : "bg-white/5 hover:bg-white/10 text-white font-bold"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock className={`size-4 ${isSelected ? "text-white" : "text-[var(--text-secondary)]"}`} />
                  <span className="text-sm">{opt.label}</span>
                </div>
                {isSelected && <Check className="size-4 text-white" />}
              </button>
            )
          })}

          {activeMinutes !== null && (
            <button
              type="button"
              onClick={() => {
                onSetTimer(null)
                onClose()
              }}
              className="flex w-full items-center justify-center p-3 rounded-2xl text-rose-400 hover:bg-rose-500/10 active:scale-[0.99] font-bold text-xs mt-2"
            >
              Desativar Temporizador
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
