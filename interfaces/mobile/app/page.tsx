"use client"

import { useState } from "react"
import { UnifiedLuciView } from "@/components/unified-luci-view"
import { MusicPlayerView } from "@/components/music-player-view"
import { ProfileView } from "@/components/profile-view"
import { AuthView } from "@/components/auth-view"
import { DropdownMenu } from "@/components/dropdown-menu"
import { FloatingDeck, FloatingDeckTab } from "@/components/floating-deck"
import { useAuth } from "@/hooks/use-auth"
import { Menu } from "lucide-react"

export default function Page() {
  const { user, mounted } = useAuth()
  const [currentTab, setCurrentTab] = useState<FloatingDeckTab>("music")
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleTabChange = (tab: FloatingDeckTab) => {
    setCurrentTab(tab)
  }

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
            {/* Menu Dropdown Cascata */}
            <DropdownMenu
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              currentModule={currentTab}
              onSelectModule={(mod) => {
                if (mod === "luci") setCurrentTab("luci")
                else if (mod === "music") setCurrentTab("music")
                else if (mod === "films") setCurrentTab("films")
                else if (mod === "home-assistant") setCurrentTab("home-assistant")
                else if (mod === "settings") setCurrentTab("profile")
              }}
              user={{ name: user.name, email: user.email }}
            />

            {/* Visualização de Módulo Ativo */}
            <div className="min-h-0 flex-1 overflow-hidden relative pb-20">
              {/* Módulo 1: IA Multimodal & Voz */}
              {currentTab === "luci" && (
                <UnifiedLuciView onOpenMenu={() => setIsMenuOpen(true)} />
              )}

              {/* Módulo 2: LuciMusic (Player, Descoberta, Biblioteca) */}
              {currentTab === "music" && (
                <MusicPlayerView
                  onOpenMenu={() => setIsMenuOpen(true)}
                  onSwitchToLuci={() => setCurrentTab("luci")}
                />
              )}

              {/* Módulo 3: Filmes & Séries */}
              {currentTab === "films" && (
                <div className="flex flex-col items-center justify-center h-full gap-4 pt-14 px-6 text-center">
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(true)}
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

              {/* Módulo 4: Home Assistant (Automação Residencial) */}
              {currentTab === "home-assistant" && (
                <div className="flex flex-col items-center justify-center h-full gap-4 pt-14 px-6 text-center">
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(true)}
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

              {/* Módulo 5: Perfil & Configurações */}
              {currentTab === "profile" && (
                <div className="flex-1 h-full overflow-y-auto">
                  <ProfileView onOpenMenu={() => setIsMenuOpen(true)} />
                </div>
              )}
            </div>

            {/* Deck Flutuante Dinâmico dos 5 Módulos */}
            <FloatingDeck
              activeTab={currentTab}
              onTabChange={handleTabChange}
              unreadCount={0}
            />
          </>
        )}
      </div>
    </main>
  )
}
