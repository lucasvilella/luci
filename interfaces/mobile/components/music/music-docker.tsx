"use client"

import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { Home, Compass, Library } from "lucide-react"
import { OfflineStateBanner } from "./offline-state-banner"

export function MusicDocker() {
  const { screen, reset, goToSearch, goToLibrary } = useMusicNavigation()

  // O sub-header/tabs não deve aparecer nas telas cheias
  if (screen.type === "now-playing" || screen.type === "lyrics") return null

  const isHome = screen.type === "home" || screen.type === "playlist-detail" || screen.type === "album-detail" || screen.type === "artist"
  const isExplore = screen.type === "search"
  const isLibrary = screen.type === "library" || screen.type === "playlists"

  return (
    <div className="flex flex-col z-10 shrink-0">
      <OfflineStateBanner />
      <div
        aria-label="Sub-Navegação Topo LuciMusic"
        className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--bg-app)]/80 backdrop-blur-md border-b border-[var(--border)]"
      >
      <button
        type="button"
        onClick={reset}
        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
          isHome
            ? "bg-[var(--accent-blue)] text-white shadow-md shadow-[#0033ff]/30"
            : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-white"
        }`}
      >
        <Home className="size-3.5" />
        <span>Início</span>
      </button>

      <button
        type="button"
        onClick={goToSearch}
        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
          isExplore
            ? "bg-[var(--accent-blue)] text-white shadow-md shadow-[#0033ff]/30"
            : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-white"
        }`}
      >
        <Compass className="size-3.5" />
        <span>Explorar</span>
      </button>

      <button
        type="button"
        onClick={goToLibrary}
        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
          isLibrary
            ? "bg-[var(--accent-blue)] text-white shadow-md shadow-[#0033ff]/30"
            : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-white"
        }`}
      >
        <Library className="size-3.5" />
        <span>Biblioteca</span>
      </button>
      </div>
    </div>
  )
}
