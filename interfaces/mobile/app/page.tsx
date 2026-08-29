"use client"

import React from "react"
import { UnifiedLuciView } from "@/components/unified-luci-view"
import { MusicPlayerView } from "@/components/music-player-view"
import { ProfileView } from "@/components/profile-view"
import { AuthView } from "@/components/auth-view"
import { ModularDeck } from "@/components/navigation/modular-deck"
import { ModuleSelectorModal } from "@/components/navigation/module-selector-modal"
import { PushToTalkOverlay } from "@/components/navigation/push-to-talk-overlay"
import { useAuth } from "@/hooks/use-auth"
import { useAppNavigationStore } from "@/stores/useAppNavigationStore"
import { Film, House, Dumbbell, Wallet, Calendar, Menu } from "lucide-react"

export default function Page() {
  const { user, mounted } = useAuth()
  const { activeModuleId, setModuleSelectorOpen } = useAppNavigationStore()

  return (
    <main className="flex h-dvh w-full justify-center bg-[var(--bg-app)] p-0 select-none">
      {/* Container Principal do App com suporte a Safe Area do Android */}
      <div className="relative flex h-full w-full max-w-[480px] flex-col overflow-hidden bg-[var(--bg-app)] shadow-2xl pt-[env(safe-area-inset-top,24px)]">
        {!mounted ? null : !user ? (
          <div className="min-h-0 flex-1 overflow-hidden">
            <AuthView />
          </div>
        ) : (
          <>
            {/* Visualização do Módulo Ativo */}
            <div className="min-h-0 flex-1 overflow-hidden relative pb-20">
              {/* Módulo 1: Luci Core (Orb & Chat) */}
              {activeModuleId === "orb" && (
                <UnifiedLuciView onOpenMenu={() => setModuleSelectorOpen(true)} />
              )}

              {/* Módulo 2: LuciMusic */}
              {activeModuleId === "music" && (
                <MusicPlayerView onOpenMenu={() => setModuleSelectorOpen(true)} />
              )}

              {/* Módulo 3: Cinema & Séries */}
              {activeModuleId === "cinema" && (
                <div className="flex flex-col items-center justify-center h-full gap-4 pt-14 px-6 text-center">
                  <button
                    type="button"
                    onClick={() => setModuleSelectorOpen(true)}
                    className="absolute top-4 left-4 size-10 flex items-center justify-center rounded-full bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] shadow-sm text-[var(--text-primary)] active:scale-95 transition-all"
                  >
                    <Menu className="size-5" />
                  </button>
                  <div className="size-16 rounded-3xl bg-[var(--bg-surface-2)] flex items-center justify-center text-[var(--text-secondary)] shadow-inner">
                    <Film className="size-8 text-[var(--accent-primary)]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">Cinema & Séries</h2>
                    <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs">
                      Catálogo inteligente e streaming integrado pela Luci. Em breve.
                    </p>
                  </div>
                </div>
              )}

              {/* Módulo 4: Casa Inteligente (Home Assistant) */}
              {activeModuleId === "home" && (
                <div className="flex flex-col items-center justify-center h-full gap-4 pt-14 px-6 text-center">
                  <button
                    type="button"
                    onClick={() => setModuleSelectorOpen(true)}
                    className="absolute top-4 left-4 size-10 flex items-center justify-center rounded-full bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] shadow-sm text-[var(--text-primary)] active:scale-95 transition-all"
                  >
                    <Menu className="size-5" />
                  </button>
                  <div className="size-16 rounded-3xl bg-[var(--bg-surface-2)] flex items-center justify-center text-[var(--text-secondary)] shadow-inner">
                    <House className="size-8 text-[var(--accent-primary)]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">Casa Inteligente</h2>
                    <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs">
                      Controle seus dispositivos, luzes e sensores com a inteligência da Luci.
                    </p>
                  </div>
                </div>
              )}

              {/* Módulo 5: Treino & Saúde */}
              {activeModuleId === "fitness" && (
                <div className="flex flex-col items-center justify-center h-full gap-4 pt-14 px-6 text-center">
                  <button
                    type="button"
                    onClick={() => setModuleSelectorOpen(true)}
                    className="absolute top-4 left-4 size-10 flex items-center justify-center rounded-full bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] shadow-sm text-[var(--text-primary)] active:scale-95 transition-all"
                  >
                    <Menu className="size-5" />
                  </button>
                  <div className="size-16 rounded-3xl bg-[var(--bg-surface-2)] flex items-center justify-center text-[var(--text-secondary)] shadow-inner">
                    <Dumbbell className="size-8 text-[var(--accent-primary)]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">Treino & Saúde</h2>
                    <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs">
                      Rotinas de treino, monitoramento de metas e evolução física.
                    </p>
                  </div>
                </div>
              )}

              {/* Módulo 6: Finanças */}
              {activeModuleId === "finance" && (
                <div className="flex flex-col items-center justify-center h-full gap-4 pt-14 px-6 text-center">
                  <button
                    type="button"
                    onClick={() => setModuleSelectorOpen(true)}
                    className="absolute top-4 left-4 size-10 flex items-center justify-center rounded-full bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] shadow-sm text-[var(--text-primary)] active:scale-95 transition-all"
                  >
                    <Menu className="size-5" />
                  </button>
                  <div className="size-16 rounded-3xl bg-[var(--bg-surface-2)] flex items-center justify-center text-[var(--text-secondary)] shadow-inner">
                    <Wallet className="size-8 text-[var(--accent-primary)]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">Finanças Pessoais</h2>
                    <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs">
                      Orçamentos inteligentes, despesas e planejamento com a Luci.
                    </p>
                  </div>
                </div>
              )}

              {/* Módulo 7: Agenda & Tarefas */}
              {activeModuleId === "tasks" && (
                <div className="flex flex-col items-center justify-center h-full gap-4 pt-14 px-6 text-center">
                  <button
                    type="button"
                    onClick={() => setModuleSelectorOpen(true)}
                    className="absolute top-4 left-4 size-10 flex items-center justify-center rounded-full bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] shadow-sm text-[var(--text-primary)] active:scale-95 transition-all"
                  >
                    <Menu className="size-5" />
                  </button>
                  <div className="size-16 rounded-3xl bg-[var(--bg-surface-2)] flex items-center justify-center text-[var(--text-secondary)] shadow-inner">
                    <Calendar className="size-8 text-[var(--accent-primary)]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">Agenda & Tarefas</h2>
                    <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs">
                      Seus compromissos, hábitos diários e lembretes integrados.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Deck Inferior Modular Fixo */}
            <ModularDeck />

            {/* Modal de Seleção de Módulos (1 Tap) */}
            <ModuleSelectorModal />

            {/* Overlay de Push-to-Talk (Hold) */}
            <PushToTalkOverlay />
          </>
        )}
      </div>
    </main>
  )
}
