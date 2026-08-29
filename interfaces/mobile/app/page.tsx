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
  const [currentTab, setCurrentTab] = useState<FloatingDeckTab>("home")
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
              currentModule={currentTab === "luci" ? "luci" : currentTab === "library" ? "settings" : "music"}
              onSelectModule={(mod) => {
                if (mod === "luci") setCurrentTab("luci")
                else if (mod === "music") setCurrentTab("home")
                else if (mod === "settings") setCurrentTab("library")
              }}
              user={{ name: user.name, email: user.email }}
            />

            {/* Visualização de Módulo Ativo */}
            <div className="min-h-0 flex-1 overflow-hidden relative pb-20">
              {currentTab === "luci" && (
                <UnifiedLuciView onOpenMenu={() => setIsMenuOpen(true)} />
              )}
              {(currentTab === "home" || currentTab === "explore" || currentTab === "library") && (
                <MusicPlayerView
                  onOpenMenu={() => setIsMenuOpen(true)}
                  onSwitchToLuci={() => setCurrentTab("luci")}
                  initialTab={currentTab}
                />
              )}
              {currentTab === "notifications" && (
                <div className="flex flex-col items-center justify-center h-full gap-4 pt-14 px-6 text-center">
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(true)}
                    className="absolute top-4 left-4 size-10 flex items-center justify-center rounded-full bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] shadow-sm text-[var(--text-primary)] active:scale-95 transition-all"
                  >
                    <Menu className="size-5" />
                  </button>
                  <div className="size-16 rounded-3xl bg-[var(--bg-surface-2)] flex items-center justify-center text-[var(--text-secondary)] shadow-inner">
                    <span className="text-xs font-bold uppercase tracking-wider">Alertas</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">Central de Notificações</h2>
                    <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs">
                      Suas atualizações, automações e insights inteligentes da Luci aparecerão aqui.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Deck Flutuante Dinâmico */}
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
