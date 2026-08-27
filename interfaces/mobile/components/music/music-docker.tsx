"use client"

import { useMusicNavigation } from "@/hooks/use-music-navigation"

export function MusicDocker() {
  const { screen, reset, goToSearch, goToLibrary } = useMusicNavigation()

  // O docker não deve aparecer nas telas de now-playing e lyrics
  if (screen.type === "now-playing" || screen.type === "lyrics") return null

  const isHome = screen.type === "home" || screen.type === "playlist-detail" || screen.type === "album-detail" || screen.type === "artist"
  const isSearch = screen.type === "search"
  const isLibrary = screen.type === "library" || screen.type === "playlists"

  return (
    <nav
      aria-label="Navegação Principal"
      className="flex items-center justify-around bg-[#F8FAFC]/95 border-t border-zinc-200/80 px-6 py-3 backdrop-blur-lg z-20"
    >
      {/* Botão Home */}
      <button
        type="button"
        onClick={reset}
        aria-label="Início"
        className="flex flex-col items-center justify-center p-1.5 transition-transform active:scale-90"
      >
        <svg
          className={`size-6 transition-colors ${
            isHome ? "text-[#62CF5E] stroke-[#62CF5E]" : "text-zinc-400 hover:text-zinc-600 stroke-zinc-400"
          }`}
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </button>

      {/* Botão Busca */}
      <button
        type="button"
        onClick={goToSearch}
        aria-label="Buscar"
        className="flex flex-col items-center justify-center p-1.5 transition-transform active:scale-90"
      >
        <svg
          className={`size-6 transition-colors ${
            isSearch ? "text-[#62CF5E] stroke-[#62CF5E]" : "text-zinc-400 hover:text-zinc-600 stroke-zinc-400"
          }`}
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

      {/* Botão Biblioteca */}
      <button
        type="button"
        onClick={goToLibrary}
        aria-label="Sua Biblioteca"
        className="flex flex-col items-center justify-center p-1.5 transition-transform active:scale-90"
      >
        <svg
          className={`size-6 transition-colors ${
            isLibrary ? "text-[#62CF5E] stroke-[#62CF5E]" : "text-zinc-400 hover:text-zinc-600 stroke-zinc-400"
          }`}
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </button>
    </nav>
  )
}
