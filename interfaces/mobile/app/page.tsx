"use client"

import { useState } from "react"
import { UnifiedLuciView } from "@/components/unified-luci-view"
import { MusicPlayerView } from "@/components/music-player-view"
import { ProfileView } from "@/components/profile-view"
import { AuthView } from "@/components/auth-view"
import { DropdownMenu } from "@/components/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"
import { Menu } from "lucide-react"

export default function Page() {
  const { user, mounted } = useAuth()
  const [currentModule, setCurrentModule] = useState<"luci" | "music" | "settings" | "films" | "home-assistant">("luci")
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <main className="flex h-dvh w-full justify-center bg-background p-0 select-none">
      {/* Container Principal do App */}
      <div className="relative flex h-full w-full max-w-[480px] flex-col overflow-hidden bg-background shadow-2xl">
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
              currentModule={currentModule}
              onSelectModule={(mod) => setCurrentModule(mod)}
              user={{ name: user.name, email: user.email }}
            />

            {/* Módulo Ativo */}
            <div className="min-h-0 flex-1 overflow-hidden relative">
              {currentModule === "luci" && (
                <UnifiedLuciView onOpenMenu={() => setIsMenuOpen(true)} />
              )}
              {currentModule === "music" && (
                <MusicPlayerView
                  onOpenMenu={() => setIsMenuOpen(true)}
                  onSwitchToLuci={() => setCurrentModule("luci")}
                />
              )}
              {currentModule === "settings" && <ProfileView onOpenMenu={() => setIsMenuOpen(true)} />}
              {(currentModule === "films" || currentModule === "home-assistant") && (
                <div className="flex flex-col items-center justify-center h-full gap-4 pt-14 px-6 text-center">
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(true)}
                    className="absolute top-4 left-4 size-10 flex items-center justify-center rounded-full bg-card border border-border shadow-sm text-foreground active:scale-95 transition-all"
                  >
                    <Menu className="size-5" />
                  </button>
                  <div className="size-16 rounded-3xl bg-secondary flex items-center justify-center text-muted-foreground shadow-inner">
                    <span className="text-xs font-bold uppercase tracking-wider">Breve</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Módulo em Desenvolvimento</h2>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                      Este recurso será disponibilizado nas próximas atualizações da plataforma Luci.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
