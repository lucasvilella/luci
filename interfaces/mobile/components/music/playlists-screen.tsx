"use client"

import React, { useState } from "react"
import {
  ArrowLeft,
  Search,
  MoreHorizontal,
  Plus,
  Heart,
  MoreVertical,
  Sun,
  Moon,
  ArrowDownUp,
} from "lucide-react"
import { TrackActionMenu } from "@/components/ui/track-action-menu"
import { NewPlaylistModal } from "@/components/ui/new-playlist-modal"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { useTheme } from "@/hooks/use-theme"
import {
  fetchLibrarySummary,
  fetchPlaylists,
  fetchLikedTracks,
  createPlaylist,
} from "@/lib/lucimusic"
import { Loader2 } from "lucide-react"

interface PlaylistItem {
  id: string
  title: string
  songCount: number
  isSpecialLikes?: boolean
  coverUrl: string
}

export function PlaylistsScreen() {
  const { goBack, goToPlaylistDetail } = useMusicNavigation()
  const { theme, toggleTheme, mounted } = useTheme()

  const [playlists, setPlaylists] = useState<PlaylistItem[]>([])
  const [likedCount, setLikedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [sortOrder, setSortOrder] = useState<"recent" | "alphabetical">("recent")

  const loadAllPlaylists = async () => {
    try {
      setLoading(true)
      const [libData, userPls, liked] = await Promise.all([
        fetchLibrarySummary("playlists").catch(() => null),
        fetchPlaylists().catch(() => []),
        fetchLikedTracks().catch(() => []),
      ])

      setLikedCount(liked.length || libData?.liked_summary?.total_tracks || 0)

      const merged: PlaylistItem[] = []

      // Adiciona playlists do usuário e da biblioteca
      if (userPls && userPls.length > 0) {
        for (const pl of userPls) {
          merged.push({
            id: pl.id,
            title: pl.title,
            songCount: pl.track_count || pl.tracks_count || (pl.tracks ? pl.tracks.length : 0),
            coverUrl: pl.cover_url || pl.thumbnail || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
          })
        }
      }

      if (libData && libData.playlists) {
        for (const pl of libData.playlists) {
          if (!merged.some((m) => m.id === pl.id)) {
            merged.push({
              id: pl.id,
              title: pl.title,
              songCount: pl.count || pl.track_count || 0,
              coverUrl: pl.thumbnail || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400",
            })
          }
        }
      }

      setPlaylists(merged)
    } catch (err) {
      console.warn("[PlaylistsScreen] Erro ao carregar playlists:", err)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadAllPlaylists()
  }, [])

  const handleCreatePlaylist = async (data: { title: string; description: string; isPublic: boolean }) => {
    try {
      const created = await createPlaylist(data.title, data.description)
      const newPl: PlaylistItem = {
        id: created.id,
        title: created.title,
        songCount: 0,
        coverUrl: created.cover_url || created.thumbnail || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
      }
      setPlaylists((prev) => [newPl, ...prev])
    } catch (err) {
      console.warn("[PlaylistsScreen] Erro ao criar playlist no backend:", err)
      const newPl: PlaylistItem = {
        id: `pl_custom_${Date.now()}`,
        title: data.title,
        songCount: 0,
        coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
      }
      setPlaylists((prev) => [newPl, ...prev])
    }
  }

  const displayedPlaylists = [...playlists].sort((a, b) => {
    if (sortOrder === "alphabetical") {
      return a.title.localeCompare(b.title)
    }
    return 0
  })

  return (
    <div className="relative flex h-full flex-col bg-[var(--bg-app)] text-[var(--text-primary)] select-none overflow-y-auto pb-32">
      {/* ─── HEADER DE NAVEGAÇÃO DA TELA DE PLAYLISTS ─── */}
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
              Playlists
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

      {/* ─── LISTA DE PLAYLISTS COM BOTÃO DE CRIAR NOVO E LINHAS DEDICADAS ─── */}
      <div className="px-5 pt-2 space-y-3">
        {/* 01. BOTÃO "CRIAR NOVA PLAYLIST" (Círculo 68x68 com ícone + na cor da marca) */}
        <div
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-4 py-2 px-1 rounded-2xl hover:bg-[var(--bg-surface-1)] transition-colors cursor-pointer group active:scale-[0.99]"
        >
          <div className="size-[68px] rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center shadow-lg shadow-[#5c62ec]/35 shrink-0 group-hover:scale-105 transition-transform">
            <Plus className="size-8 stroke-[2.5]" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-base font-extrabold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
              Criar Nova Playlist
            </h4>
          </div>
        </div>

        {/* 02. PLAYLIST ESPECIAL "MÚSICAS CURTIDAS" (Your Likes - Ícone de Coração em Círculo) */}
        <div
          onClick={() =>
            goToPlaylistDetail(
              "pl_likes",
              "Músicas Curtidas",
              "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400"
            )
          }
          className="flex items-center justify-between py-2 px-1 rounded-2xl hover:bg-[var(--bg-surface-1)] transition-colors cursor-pointer group active:scale-[0.99]"
        >
          <div className="flex items-center gap-4 min-w-0 flex-1 pr-2">
            <div className="size-[68px] rounded-full bg-gradient-to-tr from-[#5c62ec] to-[#7c82ff] text-white flex items-center justify-center shadow-md shadow-[#5c62ec]/30 shrink-0">
              <Heart className="size-8 fill-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-base font-extrabold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors truncate">
                Músicas Curtidas
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {likedCount} {likedCount === 1 ? "música" : "músicas"}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Opções"
            className="size-8 rounded-full hover:bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center active:scale-90"
          >
            <MoreVertical className="size-4.5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 text-[var(--accent-primary)] animate-spin" />
          </div>
        ) : (
          /* 03. LISTAGEM DE PLAYLISTS DO USUÁRIO */
          displayedPlaylists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => goToPlaylistDetail(pl.id, pl.title, pl.coverUrl)}
              className="flex items-center justify-between py-2 px-1 rounded-2xl hover:bg-[var(--bg-surface-1)] transition-colors cursor-pointer group active:scale-[0.99]"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1 pr-2">
                <div className="size-[68px] rounded-[10px] overflow-hidden bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] shadow-sm shrink-0">
                  <img
                    src={pl.coverUrl}
                    alt={pl.title}
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
                    {pl.title}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {pl.songCount} {pl.songCount === 1 ? "música" : "músicas"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                }}
                aria-label="Opções"
                className="size-8 rounded-full hover:bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center active:scale-90"
              >
                <MoreVertical className="size-4.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* ─── MODAL DE CRIAÇÃO DE NOVA PLAYLIST (BOTTOM SHEET) ─── */}
      <NewPlaylistModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreate={handleCreatePlaylist}
      />
    </div>
  )
}
