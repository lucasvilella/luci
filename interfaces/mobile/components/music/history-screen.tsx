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
import { type LuciTrack } from "@/lib/lucimusic"

// 3 Abas de Histórico Oficiais (Sem Podcasts)
const HISTORY_TABS = [
  { id: "songs", label: "Músicas" },
  { id: "playlists", label: "Playlists" },
  { id: "albums", label: "Álbuns" },
]

// Catálogo com dados oficiais dos mockups de Histórico
const HISTORY_SONGS_MOCK: LuciTrack[] = [
  { id: "h_1", title: "Somebody's Nobody", artist: "Alexander 23", thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300", duration: 210 },
  { id: "h_2", title: "Sharks", artist: "Imagine Dragons", thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300", duration: 195 },
  { id: "h_3", title: "Disaster", artist: "Conan Gray", thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300", duration: 180 },
  { id: "h_4", title: "HANDSOME", artist: "Warren Hue", thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300", duration: 205 },
  { id: "h_5", title: "God Is a Woman", artist: "Ariana Grande", thumbnail: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300", duration: 197 },
  { id: "h_6", title: "BREAK MY SOUL", artist: "Beyonce", thumbnail: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300", duration: 278 },
  { id: "h_7", title: "The Bended Man", artist: "Sunwich", thumbnail: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300", duration: 215 },
]

const HISTORY_PLAYLISTS_MOCK = [
  { id: "pl_hist_1", title: "Ariana Grande - Maiores Sucessos", coverUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400" },
  { id: "pl_hist_2", title: "Músicas Mais Tocadas 2026", coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400" },
  { id: "pl_hist_3", title: "Pop Internacional Acústico", coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400" },
  { id: "pl_hist_4", title: "Daily Mix 1", coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400" },
]

const HISTORY_ALBUMS_MOCK = [
  { id: "alb_hist_1", title: "Sweetener", artist: "Ariana Grande", year: "2018", coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400" },
  { id: "alb_hist_2", title: "Mercury - Act 1", artist: "Imagine Dragons", year: "2021", coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400" },
  { id: "alb_hist_3", title: "Superache", artist: "Conan Gray", year: "2022", coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400" },
  { id: "alb_hist_4", title: "Renaissance", artist: "Beyonce", year: "2022", coverUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400" },
]

export function HistoryScreen() {
  const { goBack, goToArtist, goToAlbumDetail, goToPlaylistDetail } = useMusicNavigation()
  const { playTrack, toggleLike, isLiked } = useMusicPlayer()
  const { theme, toggleTheme, mounted } = useTheme()

  const [activeTab, setActiveTab] = useState("songs")
  const [selectedTrack, setSelectedTrack] = useState<LuciTrack | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
        {/* Aba 1: Músicas Tocadas Recentemente */}
        {activeTab === "songs" && (
          <div className="space-y-1">
            {HISTORY_SONGS_MOCK.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                isArtist={false}
                onPlay={(t) => playTrack(t, HISTORY_SONGS_MOCK)}
                onMore={handleOpenMore}
              />
            ))}
          </div>
        )}

        {/* Aba 2: Playlists Tocadas Recentemente */}
        {activeTab === "playlists" && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 pt-1">
            {HISTORY_PLAYLISTS_MOCK.map((pl) => (
              <PlaylistGridCard
                key={pl.id}
                id={pl.id}
                title={pl.title}
                coverUrl={pl.coverUrl}
                onClick={() => goToPlaylistDetail(pl.id, pl.title, pl.coverUrl)}
              />
            ))}
          </div>
        )}

        {/* Aba 3: Álbuns Tocados Recentemente */}
        {activeTab === "albums" && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 pt-1">
            {HISTORY_ALBUMS_MOCK.map((album) => (
              <AlbumGridCard
                key={album.id}
                id={album.id}
                title={album.title}
                artist={album.artist}
                year={album.year}
                coverUrl={album.coverUrl}
                onClick={() => goToAlbumDetail(album.id, album.title, album.coverUrl)}
              />
            ))}
          </div>
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
