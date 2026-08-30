"use client"

import React, { useState } from "react"
import {
  ArrowLeft,
  Search,
  MoreHorizontal,
  Sun,
  Moon,
} from "lucide-react"
import { TrackRow } from "@/components/ui/track-row"
import { AlbumGridCard } from "@/components/ui/album-grid-card"
import { PlaylistGridCard } from "@/components/ui/playlist-grid-card"
import { TrackActionMenu } from "@/components/ui/track-action-menu"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { useTheme } from "@/hooks/use-theme"
import { type LuciTrack, fetchMusicHome, fetchLibrarySummary, fetchLikedTracks } from "@/lib/lucimusic"
import { Loader2 } from "lucide-react"

// 3 Abas de Histórico Oficiais (Sem Podcasts)
const HISTORY_TABS = [
  { id: "songs", label: "Músicas" },
  { id: "playlists", label: "Playlists" },
  { id: "albums", label: "Álbuns" },
]

export function HistoryScreen() {
  const { goBack, goToArtist, goToAlbumDetail, goToPlaylistDetail } = useMusicNavigation()
  const { playTrack, toggleLike, isLiked } = useMusicPlayer()
  const { theme, toggleTheme, mounted } = useTheme()

  const [activeTab, setActiveTab] = useState("songs")
  const [selectedTrack, setSelectedTrack] = useState<LuciTrack | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const [historySongs, setHistorySongs] = useState<LuciTrack[]>([])
  const [historyPlaylists, setHistoryPlaylists] = useState<Array<{ id: string; title: string; coverUrl: string }>>([])
  const [historyAlbums, setHistoryAlbums] = useState<Array<{ id: string; title: string; artist: string; year: string; coverUrl: string }>>([])

  React.useEffect(() => {
    let isCancelled = false
    setLoading(true)

    async function loadHistory() {
      try {
        const [homeData, libData, liked] = await Promise.all([
          fetchMusicHome().catch(() => null),
          fetchLibrarySummary().catch(() => null),
          fetchLikedTracks().catch(() => []),
        ])
        if (isCancelled) return

        // 1. Músicas do Histórico
        const songs: LuciTrack[] = []
        if (homeData && homeData.trending_brasil) {
          songs.push(...homeData.trending_brasil.slice(0, 10))
        }
        if (liked && liked.length > 0) {
          for (const l of liked) {
            if (!songs.some((s) => s.id === l.id)) songs.unshift(l)
          }
        }
        setHistorySongs(songs)

        // 2. Playlists
        const pls: Array<{ id: string; title: string; coverUrl: string }> = []
        if (homeData && homeData.continue_listening) {
          for (const item of homeData.continue_listening) {
            if (item.type === "playlist") {
              pls.push({
                id: item.id,
                title: item.title,
                coverUrl: item.cover_url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
              })
            }
          }
        }
        if (libData && libData.playlists) {
          for (const p of libData.playlists) {
            if (!pls.some((x) => x.id === p.id)) {
              pls.push({
                id: p.id,
                title: p.title,
                coverUrl: p.thumbnail || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400",
              })
            }
          }
        }
        setHistoryPlaylists(pls)

        // 3. Álbuns
        const albs: Array<{ id: string; title: string; artist: string; year: string; coverUrl: string }> = []
        if (homeData && homeData.continue_listening) {
          for (const item of homeData.continue_listening) {
            if (item.type === "album") {
              albs.push({
                id: item.id,
                title: item.title,
                artist: item.subtitle || "Artista",
                year: "Álbum",
                coverUrl: item.cover_url || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400",
              })
            }
          }
        }
        if (libData && libData.albums) {
          for (const a of libData.albums) {
            if (!albs.some((x) => x.id === a.id)) {
              albs.push({
                id: a.id,
                title: a.title,
                artist: a.artist || "Artista",
                year: "Álbum",
                coverUrl: a.cover || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
              })
            }
          }
        }
        setHistoryAlbums(albs)
      } catch (err) {
        console.warn("[HistoryScreen] Erro ao carregar histórico:", err)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    loadHistory()
    return () => {
      isCancelled = true
    }
  }, [])

  const handleOpenMore = (track: LuciTrack) => {
    setSelectedTrack(track)
    setIsMenuOpen(true)
  }

  return (
    <div className="relative flex h-full flex-col bg-[var(--bg-app)] text-[var(--text-primary)] select-none overflow-y-auto pb-32">
      {/* ─── HEADER DE HISTÓRICO COM VOLTAR, TÍTULO, TEMA, BUSCA E MENU ─── */}
      <header className="sticky top-0 z-20 px-5 pt-4 pb-2 bg-[var(--bg-app)]/90 backdrop-blur-xl space-y-3">
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
              Histórico
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

            {/* Busca no Histórico */}
            <button
              type="button"
              aria-label="Buscar no histórico"
              className="size-9 rounded-full bg-[var(--bg-surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-center transition-transform active:scale-90"
            >
              <Search className="size-4.5 stroke-[2]" />
            </button>

            {/* Mais Opções */}
            <button
              type="button"
              aria-label="Mais opções"
              className="size-9 rounded-full bg-[var(--bg-surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-center transition-transform active:scale-90"
            >
              <MoreHorizontal className="size-4.5 stroke-[2]" />
            </button>
          </div>
        </div>

        {/* ─── ABAS COM LINHA INDICADORA INFERIOR (Músicas | Playlists | Álbuns) ─── */}
        <div className="flex items-center border-b border-[var(--border-subtle)]">
          {HISTORY_TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-center text-sm font-bold transition-all relative ${
                  isActive
                    ? "text-[var(--accent-primary)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span>{tab.label}</span>
                {/* Linha Indicadora Ativa na Cor da Marca Luci */}
                {isActive && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--accent-primary)] rounded-full animate-fade-in" />
                )}
              </button>
            )
          })}
        </div>
      </header>

      {/* ─── CONTEÚDO DA ABA ATIVA DE HISTÓRICO ─── */}
      <div className="px-5 pt-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="size-8 text-[var(--accent-primary)] animate-spin" />
            <p className="text-xs font-medium text-[var(--text-secondary)]">Carregando histórico...</p>
          </div>
        ) : (
          <>
            {/* Aba 1: Músicas Tocadas Recentemente */}
            {activeTab === "songs" && (
              <div className="space-y-1">
                {historySongs.length === 0 ? (
                  <div className="text-center py-16 text-xs text-[var(--text-secondary)]">
                    Nenhuma música no histórico recente.
                  </div>
                ) : (
                  historySongs.map((track) => (
                    <TrackRow
                      key={track.id}
                      track={track}
                      isArtist={false}
                      onPlay={(t) => playTrack(t, historySongs)}
                      onMore={handleOpenMore}
                    />
                  ))
                )}
              </div>
            )}

            {/* Aba 2: Playlists Tocadas Recentemente */}
            {activeTab === "playlists" && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-6 pt-1">
                {historyPlaylists.length === 0 ? (
                  <div className="col-span-2 text-center py-16 text-xs text-[var(--text-secondary)]">
                    Nenhuma playlist no histórico recente.
                  </div>
                ) : (
                  historyPlaylists.map((pl) => (
                    <PlaylistGridCard
                      key={pl.id}
                      id={pl.id}
                      title={pl.title}
                      coverUrl={pl.coverUrl}
                      onClick={() => goToPlaylistDetail(pl.id, pl.title, pl.coverUrl)}
                    />
                  ))
                )}
              </div>
            )}

            {/* Aba 3: Álbuns Tocados Recentemente */}
            {activeTab === "albums" && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-6 pt-1">
                {historyAlbums.length === 0 ? (
                  <div className="col-span-2 text-center py-16 text-xs text-[var(--text-secondary)]">
                    Nenhum álbum no histórico recente.
                  </div>
                ) : (
                  historyAlbums.map((album) => (
                    <AlbumGridCard
                      key={album.id}
                      id={album.id}
                      title={album.title}
                      artist={album.artist}
                      year={album.year}
                      coverUrl={album.coverUrl}
                      onClick={() => goToAlbumDetail(album.id, album.title, album.coverUrl)}
                    />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── MENU SUSPENSO DE AÇÕES FLUTUANTE (TrackActionMenu) ─── */}
      <TrackActionMenu
        isOpen={isMenuOpen}
        track={selectedTrack}
        onClose={() => setIsMenuOpen(false)}
        onToggleLike={(t) => toggleLike(t)}
        onAddToPlaylist={() => {}}
        onViewArtist={(artist) => goToArtist(artist)}
        onGoToAlbum={() => {}}
        onShare={() => {}}
        isLiked={selectedTrack ? isLiked(selectedTrack.id) : false}
      />
    </div>
  )
}
