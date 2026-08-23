"use client"

import { House, Search, Library } from "lucide-react"
import { useMusicNavigation } from "@/hooks/use-music-navigation"

export function MusicDocker() {
  const { screen, reset, goToSearch, goToLibrary } = useMusicNavigation()

  // O docker não deve aparecer nas telas de now-playing e lyrics
  if (screen.type === "now-playing" || screen.type === "lyrics") return null

  const tabs = [
    { id: "home", label: "Início", icon: House, action: reset },
    { id: "search", label: "Buscar", icon: Search, action: goToSearch },
    { id: "library", label: "Sua Biblioteca", icon: Library, action: goToLibrary },
  ]

  return (
    <nav
      aria-label="Navegação do Player de Música"
      className="flex items-center justify-around bg-card/90 border-t border-border/50 px-2 py-3 backdrop-blur-xl z-20"
    >
      {tabs.map(({ id, label, icon: Icon, action }) => {
        const isActive = screen.type === id || (id === "home" && (screen.type === "playlist-detail" || screen.type === "album-detail" || screen.type === "artist"))
        // O isActive é aproximado. "home" pega detalhes de álbuns também se quisermos, 
        // ou podemos apenas verificar a exatidão, mas no Spotify, "home" fica ativo se você navegou a partir de home.
        // Por simplicidade:
        const isStrictlyActive = screen.type === id

        return (
          <button
            key={id}
            type="button"
            onClick={action}
            aria-current={isStrictlyActive ? "page" : undefined}
            className="flex flex-1 flex-col items-center gap-1.5 rounded-xl transition-colors active:scale-95"
          >
            <span
              className={`flex items-center justify-center transition-all ${
                isStrictlyActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`size-6 ${isStrictlyActive ? "fill-primary" : ""}`} aria-hidden="true" />
            </span>
            <span className={`text-[10px] font-medium ${isStrictlyActive ? "text-primary" : "text-muted-foreground"}`}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
