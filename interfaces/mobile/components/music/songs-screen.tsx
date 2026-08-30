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
import { type LuciTrack, fetchLikedTracks, fetchLibrarySummary } from "@/lib/lucimusic"
import { Loader2 } from "lucide-react"

export function SongsScreen() {
  const { goBack, goToArtist, goToAlbumDetail } = useMusicNavigation()
  const { currentTrack, isPlaying, playTrack, togglePlay, toggleLike, isLiked } = useMusicPlayer()
  const { theme, toggleTheme, mounted } = useTheme()

  const [tracks, setTracks] = useState<LuciTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [sortOrder, setSortOrder] = useState<"recent" | "title" | "artist">("recent")
  const [selectedTrack, setSelectedTrack] = useState<LuciTrack | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  React.useEffect(() => {
    let isCancelled = false
    setLoading(true)

    async function loadSavedSongs() {
      try {
        const [likedList, libData] = await Promise.all([
          fetchLikedTracks().catch(() => []),
          fetchLibrarySummary("tracks").catch(() => null),
        ])
        if (isCancelled) return

        let combined: LuciTrack[] = []
        if (likedList && likedList.length > 0) {
          combined = likedList
        } else if (libData && libData.tracks && libData.tracks.length > 0) {
          combined = libData.tracks
        }

        setTracks(combined)
      } catch (err) {
        console.warn("[SongsScreen] Erro ao carregar músicas salvas:", err)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    loadSavedSongs()
    return () => {
      isCancelled = true
    }
  }, [])

  const sortedTracks = [...tracks].sort((a, b) => {
    if (sortOrder === "title") return a.title.localeCompare(b.title)
    if (sortOrder === "artist") return a.artist.localeCompare(b.artist)
    return 0
  })

  const isAnySavedSongPlaying =
    isPlaying &&
    currentTrack &&
    sortedTracks.some((s) => s.id === currentTrack.id)

  const handlePlayAll = () => {
    if (isAnySavedSongPlaying) {
      togglePlay()
    } else if (sortedTracks.length > 0) {
      playTrack(sortedTracks[0], sortedTracks)
    }
  }

  const handleShufflePlay = () => {
    const shuffled = [...sortedTracks].sort(() => Math.random() - 0.5)
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
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="size-8 text-[var(--accent-primary)] animate-spin" />
            <p className="text-xs font-medium text-[var(--text-secondary)]">Carregando músicas...</p>
          </div>
        ) : sortedTracks.length === 0 ? (
          <div className="text-center py-16 text-xs text-[var(--text-secondary)]">
            Nenhuma música curtida ainda.
          </div>
        ) : (
          sortedTracks.map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              isArtist={false}
              onPlay={(t) => playTrack(t, sortedTracks)}
              onMore={handleOpenMore}
            />
          ))
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
