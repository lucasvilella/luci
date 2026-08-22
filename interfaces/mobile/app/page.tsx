"use client"

import { useState } from "react"
import { BottomNav, type TabId } from "@/components/bottom-nav"
import { VoiceOrbView } from "@/components/voice-orb-view"
import { ChatView } from "@/components/chat-view"
import { MusicPlayerView } from "@/components/music-player-view"
import { SmartHomeView } from "@/components/smart-home-view"
import { ProfileView } from "@/components/profile-view"
import { AuthView } from "@/components/auth-view"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/hooks/use-auth"
import { Signal, Wifi, BatteryFull } from "lucide-react"

type View = TabId | "profile"

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export default function Page() {
  const { user, mounted } = useAuth()
  const [view, setView] = useState<View>("voice")
  const firstName = user?.name.split(" ")[0] ?? ""

  return (
    <main className="flex h-dvh w-full justify-center bg-background p-0">
      {/* main app container */}
      <div className="relative flex h-full w-full max-w-[480px] flex-col overflow-hidden bg-background">
        {!mounted ? null : !user ? (
          <div className="min-h-0 flex-1 overflow-hidden">
            <AuthView />
          </div>
        ) : (
          <>
            {/* top bar */}
            <div className="flex items-center justify-between px-6 pb-1 pt-2">
              <div>
                <p className="text-xs text-muted-foreground">Bem-vindo de volta</p>
                <p className="text-base font-semibold text-foreground">Olá, {firstName}</p>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <button
                  type="button"
                  onClick={() => setView("profile")}
                  aria-label="Abrir perfil"
                  aria-current={view === "profile" ? "page" : undefined}
                  className={`flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-transform active:scale-95 ${
                    view === "profile" ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                  }`}
                >
                  {initials(user.name)}
                </button>
              </div>
            </div>

            {/* active view */}
            <div className="min-h-0 flex-1 overflow-hidden">
              {view === "voice" && <VoiceOrbView />}
              {view === "chat" && <ChatView />}
              {view === "music" && <MusicPlayerView />}
              {view === "home" && <SmartHomeView />}
              {view === "profile" && <ProfileView />}
            </div>

            {/* bottom navigation */}
            <BottomNav
              active={view === "profile" ? undefined : (view as TabId)}
              onChange={(id) => setView(id)}
            />
          </>
        )}
      </div>
    </main>
  )
}
