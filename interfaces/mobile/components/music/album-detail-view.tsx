"use client"

import React, { useState } from "react"
import {
  ArrowLeft,
  MoreHorizontal,
  MoreVertical,
  Play,
  Pause,
  Heart,
  ListPlus,
  Sun,
  Moon,
} from "lucide-react"
import { TrackRow } from "@/components/ui/track-row"
import { TrackActionMenu } from "@/components/ui/track-action-menu"
import { SectionHeader } from "@/components/ui/section-header"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { useTheme } from "@/hooks/use-theme"
import { type LuciTrack } from "@/lib/lucimusic"

interface AlbumDetailViewProps {
  albumId?: string
  title?: string
  coverUrl?: string
}

// Catálogo com dados oficiais dos mockups
const ALBUM_DATA: Record<
  string,
  {
    title: string
    artist: string
    year: string
    coverUrl: string
    songs: LuciTrack[]
  }
> = {
  default: {
    title: "Sweetener",
    artist: "Ariana Grande",
    year: "2018",
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500",
    songs: [
      { id: "sw_1", title: "Raindrops (An Angel Cried)", artist: "Ariana Grande", thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300", duration: 37 },
      { id: "sw_2", title: "God Is a Woman", artist: "Ariana Grande", thumbnail: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300", duration: 197 },
      { id: "sw_3", title: "The Light Is Coming", artist: "Ariana Grande", thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300", duration: 228 },
      { id: "sw_4", title: "R.E.M", artist: "Ariana Grande", thumbnail: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300", duration: 245 },
      { id: "sw_5", title: "Sweetener", artist: "Ariana Grande", thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300", duration: 208 },
      { id: "sw_6", title: "Successful", artist: "Ariana Grande", thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300", duration: 227 },
      { id: "sw_7", title: "Everytime", artist: "Ariana Grande", thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300", duration: 172 },
      { id: "sw_8", title: "Breathin", artist: "Ariana Grande", thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300", duration: 198 },
      { id: "sw_9", title: "No Tears Left to Cry", artist: "Ariana Grande", thumbnail: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300", duration: 205 },
    ],
  },
}

export function AlbumDetailView({
  albumId = "alb_sweetener",
  title,
  coverUrl,
}: AlbumDetailViewProps) {
  const { goBack, goToArtist } = useMusicNavigation()
  const { currentTrack, isPlaying, playTrack, togglePlay, toggleLike, isLiked } = useMusicPlayer()
  const { theme, toggleTheme, mounted } = useTheme()

  const [isAlbumLiked, setIsAlbumLiked] = useState(false)
  const [selectedTrack, setSelectedTrack] = useState<LuciTrack | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const album = ALBUM_DATA[albumId] || {
    ...ALBUM_DATA.default,
    title: title || ALBUM_DATA.default.title,
    coverUrl: coverUrl || ALBUM_DATA.default.coverUrl,
  }

  const isThisAlbumPlaying =
    isPlaying &&
    currentTrack &&
    album.songs.some((s) => s.id === currentTrack.id)

  const handlePlayAlbum = () => {
    if (isThisAlbumPlaying) {
      togglePlay()
    } else if (album.songs.length > 0) {
      playTrack(album.songs[0], album.songs)
    }
  }

  const handleOpenMore = (track: LuciTrack) => {
    setSelectedTrack(track)
    setIsMenuOpen(true)
  }

  return (
    <div className="relative flex h-full flex-col bg-[var(--bg-app)] text-[var(--text-primary)] select-none overflow-y-auto pb-32">
      {/* ─── HEADER DE NAVEGAÇÃO SUPERIOR COM VOLTAR, TEMA E MAIS OPÇÕES ─── */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-5 pt-4 pb-2 bg-[var(--bg-app)]/90 backdrop-blur-xl">
        <button
          type="button"
          onClick={goBack}
          aria-label="Voltar"
          className="size-10 rounded-full bg-[var(--bg-surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-center transition-transform active:scale-90 shadow-sm"
        >
          <ArrowLeft className="size-5" />
        </button>

        <div className="flex items-center gap-2">
          {/* Seletor Provisório de Tema */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
            aria-label="Alternar tema"
            className="size-10 rounded-full bg-[var(--bg-surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-center transition-transform active:scale-90"
          >
            {mounted && theme === "dark" ? (
              <Sun className="size-4.5 text-amber-400" />
            ) : (
              <Moon className="size-4.5 text-indigo-600" />
            )}
          </button>

          {/* Mais Opções */}
          <button
            type="button"
            aria-label="Mais opções do álbum"
            className="size-10 rounded-full bg-[var(--bg-surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-center transition-transform active:scale-90"
          >
            <MoreHorizontal className="size-5" />
          </button>
        </div>
      </header>

      {/* ─── HERO CENTRAL DO ÁLBUM (CAPA GIGANTE 220X220 + TÍTULO + METADADOS) ─── */}
      <div className="flex flex-col items-center px-6 pt-2 pb-5 text-center space-y-3">
        {/* Capa Quadrada com Raio de 22px (10% da altura) */}
        <div className="relative size-[220px] rounded-[22px] overflow-hidden bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] shadow-2xl">
          <img
            src={album.coverUrl}
            alt={album.title}
            className="size-full object-cover"
          />
        </div>

        {/* Título do Álbum & Artista */}
        <div className="space-y-1 pt-1">
          <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
            {album.title}
          </h1>
          <p
            onClick={() => goToArtist(album.artist)}
            className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:underline cursor-pointer transition-colors"
          >
            {album.artist}
          </p>
          <p className="text-xs font-normal text-[var(--text-muted)]">
            Álbum &nbsp;|&nbsp; {album.year}
          </p>
        </div>

        {/* ─── BARRA DE AÇÕES (CURTIR, ADICIONAR PLAYLIST, 3 PONTOS E BOTÃO PLAY EM PÍLULA) ─── */}
        <div className="flex items-center justify-between w-full pt-2 px-1">
          {/* Ações Secundárias (Esquerda) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAlbumLiked(!isAlbumLiked)}
              aria-label="Curtir álbum"
              className={`size-10 rounded-full hover:bg-[var(--bg-surface-1)] flex items-center justify-center active:scale-90 transition-transform ${
                isAlbumLiked ? "text-rose-500" : "text-[var(--text-secondary)]"
              }`}
            >
              <Heart
                className={`size-5.5 ${isAlbumLiked ? "fill-rose-500" : ""}`}
              />
            </button>

            <button
              type="button"
              aria-label="Adicionar à playlist"
              className="size-10 rounded-full hover:bg-[var(--bg-surface-1)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center active:scale-90 transition-transform"
            >
              <ListPlus className="size-5.5" />
            </button>

            <button
              type="button"
              aria-label="Mais opções"
              className="size-10 rounded-full hover:bg-[var(--bg-surface-1)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center active:scale-90 transition-transform"
            >
              <MoreVertical className="size-5" />
            </button>
          </div>

          {/* Botão Play em Pílula Ampla com Ícone e Texto (Conforme o Mockup) */}
          <button
            type="button"
            onClick={handlePlayAlbum}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--accent-primary)] text-white font-bold text-sm shadow-lg shadow-[#5c62ec]/35 active:scale-95 transition-all"
          >
            {isThisAlbumPlaying ? (
              <>
                <Pause className="size-4.5 fill-white" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="size-4.5 fill-white translate-x-0.5" />
                <span>Tocar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Divisor sutil */}
      <div className="h-[1px] bg-[var(--border-subtle)] mx-5 mb-4" />

      {/* ─── SEÇÃO DE MÚSICAS DO ÁLBUM (Songs) ─── */}
      <div className="px-5 space-y-2">
        <SectionHeader
          title="Músicas"
          seeAllText="Ver tudo"
          onSeeAll={() => {}}
        />

        <div className="space-y-1">
          {album.songs.map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              isArtist={false}
              onPlay={(t) => playTrack(t, album.songs)}
              onMore={handleOpenMore}
            />
          ))}
        </div>
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
