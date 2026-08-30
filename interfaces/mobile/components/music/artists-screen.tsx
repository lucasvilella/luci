"use client"

import React, { useState } from "react"
import {
  ArrowLeft,
  Search,
  MoreHorizontal,
  MoreVertical,
  Sun,
  Moon,
  ArrowDownUp,
} from "lucide-react"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { useTheme } from "@/hooks/use-theme"

// Catálogo com dados oficiais dos mockups de Artistas Seguidos / Curtidos
const FOLLOWED_ARTISTS_CATALOG = [
  {
    id: "art_1",
    name: "The Weeknd",
    songCount: 20,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
  },
  {
    id: "art_2",
    name: "Ariana Grande",
    songCount: 35,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
  },
  {
    id: "art_3",
    name: "Acidrap",
    songCount: 18,
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300",
  },
  {
    id: "art_4",
    name: "Ania Szarmach",
    songCount: 15,
    avatarUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300",
  },
  {
    id: "art_5",
    name: "Troye Sivan",
    songCount: 12,
    avatarUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300",
  },
  {
    id: "art_6",
    name: "Ryan Jones",
    songCount: 24,
    avatarUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300",
  },
  {
    id: "art_7",
    name: "Conan Gray",
    songCount: 16,
    avatarUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300",
  },
]

export function ArtistsScreen() {
  const { goBack, goToArtist } = useMusicNavigation()
  const { theme, toggleTheme, mounted } = useTheme()

  const [sortOrder, setSortOrder] = useState<"recent" | "alphabetical">("recent")

  return (
    <div className="relative flex h-full flex-col bg-[var(--bg-app)] text-[var(--text-primary)] select-none overflow-y-auto pb-32">
      {/* ─── HEADER DE NAVEGAÇÃO DA TELA DE ARTISTAS ─── */}
      <header className="sticky top-0 z-20 px-5 pt-4 pb-3 bg-[var(--bg-app)]/90 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goBack}
              aria-label="Voltar"
              className="size-10 rounded-full bg-[var(--bg-surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-center transition-transform active:scale-90 shadow-sm"
            >
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Artistas
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Seletor Provisório de Tema */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
              aria-label="Alternar tema"
              className="size-9 rounded-full bg-[var(--bg-surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-center transition-transform active:scale-90"
            >
              {mounted && theme === "dark" ? (
                <Sun className="size-4.5 text-amber-400" />
              ) : (
                <Moon className="size-4.5 text-indigo-600" />
              )}
            </button>

            <button
              type="button"
              aria-label="Buscar"
              className="size-9 rounded-full bg-[var(--bg-surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-center transition-transform active:scale-90"
            >
              <Search className="size-4.5 stroke-[2]" />
            </button>

            <button
              type="button"
              aria-label="Mais opções"
              className="size-9 rounded-full bg-[var(--bg-surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-center transition-transform active:scale-90"
            >
              <MoreHorizontal className="size-4.5 stroke-[2]" />
            </button>
          </div>
        </div>

        {/* ─── LINHA DE ORDENAÇÃO (Sort by / Adicionados Recentemente) ─── */}
        <div className="flex items-center justify-between pt-3 pb-1">
          <span className="text-sm font-extrabold text-[var(--text-primary)]">
            Ordenar por
          </span>
          <button
            type="button"
            onClick={() =>
              setSortOrder(sortOrder === "recent" ? "alphabetical" : "recent")
            }
            className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent-primary)] hover:opacity-80 active:scale-95 transition-all"
          >
            <span>
              {sortOrder === "recent" ? "Adicionados Recentemente" : "A-Z"}
            </span>
            <ArrowDownUp className="size-3.5 stroke-[2.5]" />
          </button>
        </div>
      </header>

      {/* ─── LISTAGEM DE ARTISTAS COM AVATARES CIRCULARES DE 68PX ─── */}
      <div className="px-5 pt-2 space-y-3">
        {FOLLOWED_ARTISTS_CATALOG.map((artist) => (
          <div
            key={artist.id}
            onClick={() => goToArtist(artist.name)}
            className="flex items-center justify-between py-2 px-1 rounded-2xl hover:bg-[var(--bg-surface-1)] transition-colors cursor-pointer group active:scale-[0.99]"
          >
            <div className="flex items-center gap-4 min-w-0 flex-1 pr-2">
              {/* Avatar Circular 68x68 */}
              <div className="size-[68px] rounded-full overflow-hidden bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] shadow-sm shrink-0">
                <img
                  src={artist.avatarUrl}
                  alt={artist.name}
                  loading="lazy"
                  className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Nome do Artista e Quantidade de Músicas Salvas */}
              <div className="min-w-0 flex-1">
                <h4 className="text-base font-extrabold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors truncate">
                  {artist.name}
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                  {artist.songCount} músicas
                </p>
              </div>
            </div>

            {/* Botão Três Pontos */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
              }}
              aria-label="Opções do artista"
              className="size-8 rounded-full hover:bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center active:scale-90"
            >
              <MoreVertical className="size-4.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
