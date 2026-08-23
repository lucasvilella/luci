"use client"

import { useState } from "react"
import { UnifiedLuciView } from "@/components/unified-luci-view"
import { MusicPlayerView } from "@/components/music-player-view"
import { ProfileView } from "@/components/profile-view"
import { AuthView } from "@/components/auth-view"
import { DrawerMenu } from "@/components/drawer-menu"
import { useAuth } from "@/hooks/use-auth"

export default function Page() {
  const { user, mounted } = useAuth()
  const [currentModule, setCurrentModule] = useState<"luci" | "music" | "settings">("music")
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <main className="flex h-dvh w-full justify-center bg-[#F8FAFC] dark:bg-background p-0 select-none">
      {/* Container Principal do App */}
      <div className="relative flex h-full w-full max-w-[480px] flex-col overflow-hidden bg-[#F8FAFC] dark:bg-background shadow-2xl">
        {!mounted ? null : !user ? (
          <div className="min-h-0 flex-1 overflow-hidden">
            <AuthView />
          </div>
        ) : (
          <>
            {/* Drawer Lateral de Navegação */}
            <DrawerMenu
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              currentModule={currentModule}
              onSelectModule={(mod) => setCurrentModule(mod)}
              user={{ name: user.name, email: user.email }}
            />

            {/* Módulo Ativo Sem Barras Fixas Poluídas */}
            <div className="min-h-0 flex-1 overflow-hidden">
              {currentModule === "luci" && (
                <UnifiedLuciView onOpenMenu={() => setIsMenuOpen(true)} />
              )}
              {currentModule === "music" && (
                <MusicPlayerView
                  onOpenMenu={() => setIsMenuOpen(true)}
                  onSwitchToLuci={() => setCurrentModule("luci")}
                />
              )}
              {currentModule === "settings" && <ProfileView />}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
