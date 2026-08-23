"use client"

import { Sparkles, Music, Film, House, Settings, X, Sun, Moon } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"

export interface DropdownMenuProps {
  isOpen: boolean
  onClose: () => void
  currentModule: "luci" | "music" | "settings" | "films" | "home-assistant"
  onSelectModule: (module: "luci" | "music" | "settings" | "films" | "home-assistant") => void
  user?: { name: string; email?: string }
}

export function DropdownMenu({
  isOpen,
  onClose,
  currentModule,
  onSelectModule,
  user = { name: "Lucas Vilella", email: "lucas@luci.ai" },
}: DropdownMenuProps) {
  const { theme, toggleTheme, mounted } = useTheme()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in select-none">
      {/* Backdrop transparente com blur suave */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
      />

      {/* Menu Cascata Top-Left com Design Neumórfico e Premium */}
      <div className="absolute top-14 left-4 w-68 bg-card border border-border/80 shadow-2xl rounded-3xl flex flex-col p-2.5 animate-slide-up origin-top-left z-10 overflow-hidden">
        
        {/* Header do Menu com Perfil + Seletor Dark/Light + Fechar */}
        <div className="px-3 py-2.5 border-b border-border/60 mb-2 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold truncate text-foreground tracking-tight">{user.name}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Conta Pessoal</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Botão Seletor de Tema Dark/Light */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
              aria-label={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
              className="size-8 rounded-full bg-secondary text-foreground hover:text-primary hover:bg-secondary/80 flex items-center justify-center transition-all active:scale-90"
            >
              {mounted && theme === "dark" ? (
                <Sun className="size-4 text-amber-400" />
              ) : (
                <Moon className="size-4 text-indigo-600" />
              )}
            </button>

            {/* Fechar */}
            <button
              type="button"
              onClick={onClose}
              className="size-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90 transition-transform"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Lista de Módulos */}
        <div className="space-y-1">
          {/* Luci */}
          <button
            type="button"
            onClick={() => {
              onSelectModule("luci")
              onClose()
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all font-medium ${
              currentModule === "luci"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 font-bold"
                : "text-foreground hover:bg-secondary active:scale-[0.98]"
            }`}
          >
            <Sparkles className="size-4.5 shrink-0" />
            <span className="text-sm">Assistente IA</span>
          </button>

          {/* Música */}
          <button
            type="button"
            onClick={() => {
              onSelectModule("music")
              onClose()
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all font-medium ${
              currentModule === "music"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 font-bold"
                : "text-foreground hover:bg-secondary active:scale-[0.98]"
            }`}
          >
            <Music className="size-4.5 shrink-0" />
            <span className="text-sm">Player Inteligente</span>
          </button>

          {/* Filmes e Séries (Disabled) */}
          <button
            type="button"
            onClick={() => {
              onSelectModule("films")
              onClose()
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all font-medium opacity-60 ${
              currentModule === "films"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 font-bold opacity-100"
                : "text-foreground hover:bg-secondary active:scale-[0.98]"
            }`}
          >
            <Film className="size-4.5 shrink-0" />
            <span className="text-sm">Filmes e Séries</span>
            <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground font-semibold uppercase">Breve</span>
          </button>

          {/* Home Assistant (Disabled) */}
          <button
            type="button"
            onClick={() => {
              onSelectModule("home-assistant")
              onClose()
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all font-medium opacity-60 ${
              currentModule === "home-assistant"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 font-bold opacity-100"
                : "text-foreground hover:bg-secondary active:scale-[0.98]"
            }`}
          >
            <House className="size-4.5 shrink-0" />
            <span className="text-sm">Home Assistant</span>
            <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground font-semibold uppercase">Breve</span>
          </button>
        </div>

        {/* Rodapé do menu */}
        <div className="pt-2 mt-2 border-t border-border/60">
          <button
            type="button"
            onClick={() => {
              onSelectModule("settings")
              onClose()
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all font-medium ${
              currentModule === "settings"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-[0.98]"
            }`}
          >
            <Settings className="size-4.5 shrink-0" />
            <span className="text-sm font-bold">Configurações</span>
          </button>
        </div>
      </div>
    </div>
  )
}

