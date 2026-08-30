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
import { fetchLibrarySummary, fetchMusicHome } from "@/lib/lucimusic"
import { Loader2 } from "lucide-react"

interface FollowedArtist {
  id: string
  name: string
  songCount?: number | string
  avatarUrl: string
}

export function ArtistsScreen() {
  const { goBack, goToArtist } = useMusicNavigation()
  const { theme, toggleTheme, mounted } = useTheme()

  const [artists, setArtists] = useState<FollowedArtist[]>([])
  const [loading, setLoading] = useState(true)
  const [sortOrder, setSortOrder] = useState<"recent" | "alphabetical">("recent")

  React.useEffect(() => {
    let isCancelled = false
    setLoading(true)

    async function loadArtists() {
      try {
        const [libData, homeData] = await Promise.all([
          fetchLibrarySummary("artists").catch(() => null),
          fetchMusicHome().catch(() => null),
        ])
        if (isCancelled) return

        const merged: FollowedArtist[] = []

        if (libData && libData.artists && libData.artists.length > 0) {
          for (const a of libData.artists) {
            merged.push({
              id: a.id,
              name: a.name,
              songCount: "Artista seguido",
              avatarUrl: a.avatar || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300",
            })
          }
        }

        if (homeData && homeData.favorite_artists && homeData.favorite_artists.length > 0) {
          for (const a of homeData.favorite_artists) {
            if (!merged.some((m) => m.name.toLowerCase() === a.name.toLowerCase())) {
              merged.push({
                id: a.id || `fav_art_${encodeURIComponent(a.name)}`,
                name: a.name,
                songCount: "Favorito",
                avatarUrl: a.avatar || a.thumbnail || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300",
              })
            }
          }
        }

        setArtists(merged)
      } catch (err) {
        console.warn("[ArtistsScreen] Erro ao carregar artistas:", err)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    loadArtists()
    return () => {
      isCancelled = true
    }
  }, [])

  const sortedArtists = [...artists].sort((a, b) => {
    if (sortOrder === "alphabetical") return a.name.localeCompare(b.name)
    return 0
  })

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
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="size-8 text-[var(--accent-primary)] animate-spin" />
            <p className="text-xs font-medium text-[var(--text-secondary)]">Carregando artistas...</p>
          </div>
        ) : sortedArtists.length === 0 ? (
          <div className="text-center py-16 text-xs text-[var(--text-secondary)]">
            Nenhum artista seguido ainda.
          </div>
        ) : (
          sortedArtists.map((artist) => (
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
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300"
                    }}
                  />
                </div>

                {/* Nome do Artista e Quantidade de Músicas Salvas */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-extrabold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors truncate">
                    {artist.name}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                    {artist.songCount}
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
          ))
        )}
      </div>
    </div>
  )
}
