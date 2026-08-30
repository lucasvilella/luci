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
import { AlbumActionMenu } from "@/components/ui/album-action-menu"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { useTheme } from "@/hooks/use-theme"
import { fetchLibrarySummary, fetchMusicHome } from "@/lib/lucimusic"
import { Loader2 } from "lucide-react"

interface SavedAlbum {
  id: string
  title: string
  artist: string
  year: string
  coverUrl: string
}

export function AlbumsScreen() {
  const { goBack, goToAlbumDetail, goToArtist } = useMusicNavigation()
  const { theme, toggleTheme, mounted } = useTheme()

  const [albums, setAlbums] = useState<SavedAlbum[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAlbum, setSelectedAlbum] = useState<SavedAlbum | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [sortOrder, setSortOrder] = useState<"recent" | "alphabetical">("recent")

  React.useEffect(() => {
    let isCancelled = false
    setLoading(true)

    async function loadAlbums() {
      try {
        const [libData, homeData] = await Promise.all([
          fetchLibrarySummary("albums").catch(() => null),
          fetchMusicHome().catch(() => null),
        ])
        if (isCancelled) return

        const merged: SavedAlbum[] = []

        if (libData && libData.albums && libData.albums.length > 0) {
          for (const a of libData.albums) {
            merged.push({
              id: a.id,
              title: a.title,
              artist: a.artist || "Artista",
              year: "Álbum",
              coverUrl: a.cover || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
            })
          }
        }

        // Se a biblioteca ainda não tem álbuns salvos, busca os do feed home (continue_listening / discovery)
        if (homeData && homeData.continue_listening) {
          for (const item of homeData.continue_listening) {
            if (item.type === "album" && !merged.some((m) => m.id === item.id)) {
              merged.push({
                id: item.id,
                title: item.title,
                artist: item.subtitle || "Artista",
                year: "Álbum",
                coverUrl: item.cover_url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400",
              })
            }
          }
        }

        setAlbums(merged)
      } catch (err) {
        console.warn("[AlbumsScreen] Erro ao carregar álbuns:", err)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    loadAlbums()
    return () => {
      isCancelled = true
    }
  }, [])

  const sortedAlbums = [...albums].sort((a, b) => {
    if (sortOrder === "alphabetical") return a.title.localeCompare(b.title)
    return 0
  })

  const handleOpenMore = (e: React.MouseEvent, album: SavedAlbum) => {
    e.stopPropagation()
    setSelectedAlbum(album)
    setIsMenuOpen(true)
  }

  const handleRemoveAlbum = (albumId: string) => {
    setAlbums(albums.filter((a) => a.id !== albumId))
  }

  return (
    <div className="relative flex h-full flex-col bg-[var(--bg-app)] text-[var(--text-primary)] select-none overflow-y-auto pb-32">
      {/* ─── HEADER DE NAVEGAÇÃO DA TELA DE ÁLBUNS ─── */}
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
              Álbuns
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

      {/* ─── LISTAGEM DE ÁLBUNS SALVOS COM CAPAS ARREDONDADAS DE 22PX ─── */}
      <div className="px-5 pt-2 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="size-8 text-[var(--accent-primary)] animate-spin" />
            <p className="text-xs font-medium text-[var(--text-secondary)]">Carregando álbuns...</p>
          </div>
        ) : sortedAlbums.length === 0 ? (
          <div className="text-center py-16 text-xs text-[var(--text-secondary)]">
            Nenhum álbum salvo na biblioteca ainda.
          </div>
        ) : (
          sortedAlbums.map((album) => (
            <div
              key={album.id}
              onClick={() => goToAlbumDetail(album.id, album.title, album.coverUrl)}
              className="flex items-center justify-between py-2 px-1 rounded-2xl hover:bg-[var(--bg-surface-1)] transition-colors cursor-pointer group active:scale-[0.99]"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1 pr-2">
                <div className="size-[68px] rounded-[10px] overflow-hidden bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] shadow-sm shrink-0">
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    loading="lazy"
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400"
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-extrabold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors truncate">
                    {album.title}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                    {album.artist} &nbsp;|&nbsp; {album.year}
                  </p>
                </div>
              </div>

              {/* Botão Três Pontos (Abre Menu Suspenso do Álbum) */}
              <button
                type="button"
                onClick={(e) => handleOpenMore(e, album)}
                aria-label="Opções do álbum"
                className="size-8 rounded-full hover:bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center active:scale-90"
              >
                <MoreVertical className="size-4.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* ─── MENU SUSPENSO DE AÇÕES DO ÁLBUM (AlbumActionMenu) ─── */}
      <AlbumActionMenu
        isOpen={isMenuOpen}
        album={selectedAlbum}
        onClose={() => setIsMenuOpen(false)}
        onShufflePlay={(alb) => {}}
        onAddToPlaylist={(alb) => {}}
        onRemoveFromLibrary={handleRemoveAlbum}
        onViewArtist={(artist) => goToArtist(artist)}
        onShare={(alb) => {}}
      />
    </div>
  )
}
