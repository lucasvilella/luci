"use client"

import React, { useState } from "react"
import {
  ArrowLeft,
  Search,
  MoreHorizontal,
  Shuffle,
  Play,
  Pause,
  Sun,
  Moon,
  ArrowDownUp,
} from "lucide-react"
import { TrackRow } from "@/components/ui/track-row"
import { TrackActionMenu } from "@/components/ui/track-action-menu"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { useTheme } from "@/hooks/use-theme"
import { type LuciTrack } from "@/lib/lucimusic"

// Catálogo com dados oficiais dos mockups de Músicas Salvas / Curtidas
const SAVED_SONGS_CATALOG: LuciTrack[] = [
  { id: "s_1", title: "BREAK MY SOUL", artist: "Beyonce", thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300", duration: 320 },
  { id: "s_2", title: "Fly Me To The Sun", artist: "Romantic Echoes", thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300", duration: 238 },
  { id: "s_3", title: "God Is a Woman", artist: "Ariana Grande", thumbnail: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300", duration: 265 },
  { id: "s_4", title: "The Bended Man", artist: "Sunwich", thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300", duration: 226 },
  { id: "s_5", title: "HANDSOME", artist: "Warren Hue", thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300", duration: 232 },
  { id: "s_6", title: "Sharks", artist: "Imagine Dragons", thumbnail: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300", duration: 288 },
  { id: "s_7", title: "Somebody's Nobody", artist: "Alexander 23", thumbnail: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300", duration: 210 },
  { id: "s_8", title: "Starboy", artist: "The Weeknd", thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300", duration: 230 },
]

export function SongsScreen() {
  const { goBack, goToArtist, goToAlbumDetail } = useMusicNavigation()
  const { currentTrack, isPlaying, playTrack, togglePlay, toggleLike, isLiked } = useMusicPlayer()
  const { theme, toggleTheme, mounted } = useTheme()

  const [sortOrder, setSortOrder] = useState<"recent" | "title" | "artist">("recent")
  const [selectedTrack, setSelectedTrack] = useState<LuciTrack | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const isAnySavedSongPlaying =
    isPlaying &&
    currentTrack &&
    SAVED_SONGS_CATALOG.some((s) => s.id === currentTrack.id)

  const handlePlayAll = () => {
    if (isAnySavedSongPlaying) {
      togglePlay()
    } else if (SAVED_SONGS_CATALOG.length > 0) {
      playTrack(SAVED_SONGS_CATALOG[0], SAVED_SONGS_CATALOG)
    }
  }

  const handleShufflePlay = () => {
    const shuffled = [...SAVED_SONGS_CATALOG].sort(() => Math.random() - 0.5)
    if (shuffled.length > 0) {
      playTrack(shuffled[0], shuffled)
    }
  }

  const handleOpenMore = (track: LuciTrack) => {
    setSelectedTrack(track)
    setIsMenuOpen(true)
  }

  return (
    <div className="relative flex h-full flex-col bg-[var(--bg-app)] text-[var(--text-primary)] select-none overflow-y-auto pb-32">
      {/* ─── HEADER DE NAVEGAÇÃO DA TELA DE MÚSICAS ─── */}
      <header className="sticky top-0 z-20 px-5 pt-4 pb-3 bg-[var(--bg-app)]/90 backdrop-blur-xl space-y-3">
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
              Músicas
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
        <div className="flex items-center justify-between pt-1 pb-1">
          <span className="text-sm font-extrabold text-[var(--text-primary)]">
            Ordenar por
          </span>
          <button
            type="button"
            onClick={() =>
              setSortOrder(sortOrder === "recent" ? "title" : "recent")
            }
            className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent-primary)] hover:opacity-80 active:scale-95 transition-all"
          >
            <span>
              {sortOrder === "recent" ? "Adicionados Recentemente" : "Título"}
            </span>
            <ArrowDownUp className="size-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* ─── BOTÕES DE REPRODUÇÃO (ALEATÓRIO / TOCAR EM PÍLULAS LADO A LADO) ─── */}
        <div className="flex items-center gap-3.5 pt-1">
          {/* Botão Modo Aleatório (Pílula com Sombra na Cor da Marca) */}
          <button
            type="button"
            onClick={handleShufflePlay}
            className="flex-1 h-13 rounded-full bg-[var(--accent-primary)] text-white font-bold text-sm shadow-lg shadow-[#5c62ec]/35 flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
          >
            <Shuffle className="size-4.5 stroke-[2.5]" />
            <span>Aleatório</span>
          </button>

          {/* Botão Tocar / Pausar (Pílula Superfície Suave) */}
          <button
            type="button"
            onClick={handlePlayAll}
            className="flex-1 h-13 rounded-full bg-[var(--bg-surface-1)] text-[var(--accent-primary)] font-extrabold text-sm border border-[var(--border-subtle)] flex items-center justify-center gap-2 hover:bg-[var(--bg-surface-2)] active:scale-95 transition-all shadow-sm"
          >
            {isAnySavedSongPlaying ? (
              <>
                <Pause className="size-4.5 fill-[var(--accent-primary)]" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="size-4.5 fill-[var(--accent-primary)] translate-x-0.5" />
                <span>Tocar</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ─── LISTAGEM DE MÚSICAS CURTIDAS (TrackRow) ─── */}
      <div className="px-5 pt-3 space-y-1">
        {SAVED_SONGS_CATALOG.map((track) => (
          <TrackRow
            key={track.id}
            track={track}
            isArtist={false}
            onPlay={(t) => playTrack(t, SAVED_SONGS_CATALOG)}
            onMore={handleOpenMore}
          />
        ))}
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
