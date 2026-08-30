"use client"

import React from "react"
import {
  Music2,
  Search,
  MoreHorizontal,
  Sun,
  Moon,
  ListMusic,
  Disc3,
  Music,
  Users,
} from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"
import { MediaCard } from "@/components/ui/media-card"
import { ArtistCircle } from "@/components/ui/artist-circle"
import { LibraryMenuRow } from "@/components/ui/library-menu-row"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { useAppNavigationStore } from "@/stores/useAppNavigationStore"
import { useTheme } from "@/hooks/use-theme"
import { fetchLibrarySummary, fetchMusicHome, type LuciTrack } from "@/lib/lucimusic"
import { Loader2 } from "lucide-react"

interface HistoryItem {
  id: string
  title: string
  subtitle: string
  imageUrl: string
}

export function LibraryScreen() {
  const { playTrack } = useMusicPlayer()
  const {
    goToPlaylists,
    goToAlbums,
    goToSongs,
    goToArtists,
    goToSearch,
    goToHistory,
  } = useMusicNavigation()
  const { setActiveTab } = useAppNavigationStore()
  const { theme, toggleTheme, mounted } = useTheme()

  const [historyItems, setHistoryItems] = React.useState<HistoryItem[]>([])
  const [counts, setCounts] = React.useState({
    playlists: 0,
    albums: 0,
    songs: 0,
    artists: 0,
  })
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let isCancelled = false
    setLoading(true)

    async function loadLibraryData() {
      try {
        const [libData, homeData] = await Promise.all([
          fetchLibrarySummary().catch(() => null),
          fetchMusicHome().catch(() => null),
        ])
        if (isCancelled) return

        if (libData) {
          setCounts({
            playlists: libData.playlists?.length || 0,
            albums: libData.albums?.length || 0,
            songs: libData.liked_summary?.total_tracks || libData.tracks?.length || 0,
            artists: libData.artists?.length || 0,
          })
        }

        // Constrói itens do histórico a partir do continue_listening ou trending
        const items: HistoryItem[] = []
        if (homeData && homeData.continue_listening && homeData.continue_listening.length > 0) {
          for (const cl of homeData.continue_listening.slice(0, 6)) {
            items.push({
              id: cl.id,
              title: cl.title,
              subtitle: cl.subtitle || "Continuar",
              imageUrl: cl.cover_url || cl.thumbnail || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
            })
          }
        } else if (homeData && homeData.trending_brasil) {
          for (const t of homeData.trending_brasil.slice(0, 6)) {
            items.push({
              id: t.id,
              title: t.title,
              subtitle: t.artist,
              imageUrl: t.thumbnail || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400",
            })
          }
        }

        setHistoryItems(items)
      } catch (err) {
        console.warn("[LibraryScreen] Erro ao carregar resumo da biblioteca:", err)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    loadLibraryData()
    return () => {
      isCancelled = true
    }
  }, [])

  const handlePlayHistory = (item: HistoryItem) => {
    playTrack(
      {
        id: item.id,
        title: item.title,
        artist: item.subtitle,
        thumbnail: item.imageUrl,
        duration: 210,
      },
      historyItems.map((t) => ({
        id: t.id,
        title: t.title,
        artist: t.subtitle,
        thumbnail: t.imageUrl,
        duration: 210,
      }))
    )
  }

  return (
    <div className="relative flex h-full flex-col bg-[var(--bg-app)] text-[var(--text-primary)] select-none overflow-y-auto pb-32">
      {/* ─── HEADER SUPERIOR COM IDENTIDADE LUCI E SELETOR DE TEMA ─── */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-5 pt-4 pb-3 bg-[var(--bg-app)]/90 backdrop-blur-xl">
        {/* Logo da Marca + Título Minha Biblioteca */}
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#5c62ec] to-[#7c82ff] text-white shadow-md shadow-[#5c62ec]/30">
            <Music2 className="size-5" />
          </div>
          <h1 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Minha Biblioteca
          </h1>
        </div>

        {/* Ações Top-Right: Tema + Busca + Menu */}
        <div className="flex items-center gap-2">
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
            onClick={() => setActiveTab("search")}
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
      </header>

      <div className="px-5 pt-3 space-y-6">
        {/* ─── 01. SEU HISTÓRICO (Your History) ─── */}
        <section>
          <SectionHeader
            title="Seu Histórico"
            seeAllText="Ver tudo"
            onSeeAll={goToHistory}
          />
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 text-[var(--accent-primary)] animate-spin" />
            </div>
          ) : historyItems.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)] py-3">Nenhum histórico recente.</p>
          ) : (
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
              {historyItems.map((item) => (
                <MediaCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  subtitle={item.subtitle}
                  imageUrl={item.imageUrl}
                  onClick={() => handlePlayHistory(item)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Divisor sutil */}
        <div className="h-[1px] bg-[var(--border-subtle)]" />

        {/* ─── 02. LISTA DE CATEGORIAS DA BIBLIOTECA (SEM DOWNLOADS E SEM PODCASTS) ─── */}
        <section className="space-y-1">
          {/* Playlists */}
          <LibraryMenuRow
            id="playlists"
            label="Playlists"
            icon={ListMusic}
            badgeCount={counts.playlists}
            onClick={goToPlaylists}
          />

          {/* Álbuns */}
          <LibraryMenuRow
            id="albums"
            label="Álbuns"
            icon={Disc3}
            badgeCount={counts.albums}
            onClick={goToAlbums}
          />

          {/* Músicas */}
          <LibraryMenuRow
            id="songs"
            label="Músicas"
            icon={Music}
            badgeCount={counts.songs}
            onClick={goToSongs}
          />

          {/* Artistas */}
          <LibraryMenuRow
            id="artists"
            label="Artistas"
            icon={Users}
            badgeCount={counts.artists}
            onClick={goToArtists}
          />
        </section>
      </div>
    </div>
  )
}
