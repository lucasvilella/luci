"use client"

import { useEffect, useState } from "react"
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
  Loader2,
} from "lucide-react"
import { TrackRow } from "@/components/ui/track-row"
import { TrackActionMenu } from "@/components/ui/track-action-menu"
import { SectionHeader } from "@/components/ui/section-header"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { useTheme } from "@/hooks/use-theme"
import { type LuciTrack, fetchCollectionDetails, searchTracks } from "@/lib/lucimusic"

interface AlbumDetailViewProps {
  albumId?: string
  title?: string
  artist?: string
  coverUrl?: string
  initialTracks?: LuciTrack[]
}

export function AlbumDetailView({
  albumId,
  title = "Álbum",
  artist = "Artista",
  coverUrl = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500",
  initialTracks = [],
}: AlbumDetailViewProps) {
  const { goBack, goToArtist } = useMusicNavigation()
  const { currentTrack, isPlaying, playTrack, togglePlay, toggleLike, isLiked } = useMusicPlayer()
  const { theme, toggleTheme, mounted } = useTheme()

  const [isAlbumLiked, setIsAlbumLiked] = useState(false)
  const [selectedTrack, setSelectedTrack] = useState<LuciTrack | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [albumData, setAlbumData] = useState<{
    title: string
    artist: string
    year: string
    coverUrl: string
    songs: LuciTrack[]
  }>({
    title,
    artist,
    year: "2024",
    coverUrl,
    songs: initialTracks,
  })

  useEffect(() => {
    let isCancelled = false
    setLoading(true)

    async function loadAlbum() {
      try {
        if (albumId && albumId !== "default" && !albumId.startsWith("cont_")) {
          const details = await fetchCollectionDetails("album", albumId, title, artist)
          if (!isCancelled && details) {
            setAlbumData({
              title: details.title || title,
              artist: details.artist || artist,
              year: details.release_year || "2024",
              coverUrl: details.cover_url || coverUrl,
              songs: details.tracks.map((t) => ({
                id: t.id,
                title: t.title,
                artist: t.artist || details.artist || artist,
                thumbnail: t.thumbnail || details.cover_url || coverUrl,
                duration: t.duration || 210,
              })),
            })
            setLoading(false)
            return
          }
        }

        // Busca faixas reais pelo título e artista do álbum
        const searchQuery = `${title} ${artist}`.trim()
        const tracks = await searchTracks(searchQuery)
        if (!isCancelled) {
          const dynamicSongs = tracks.length > 0 ? tracks : [
            {
              id: `track_${encodeURIComponent(title)}`,
              title: title,
              artist: artist,
              thumbnail: coverUrl,
              duration: 210,
            }
          ]

          setAlbumData({
            title,
            artist,
            year: "2024",
            coverUrl,
            songs: dynamicSongs,
          })
        }
      } catch (err) {
        console.warn("[AlbumDetailView] Erro ao carregar faixas dinâmicas:", err)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    loadAlbum()
    return () => {
      isCancelled = true
    }
  }, [albumId, title, artist, coverUrl])

  const isThisAlbumPlaying =
    isPlaying &&
    currentTrack &&
    albumData.songs.some((s) => s.id === currentTrack.id)

  const handlePlayAlbum = () => {
    if (isThisAlbumPlaying) {
      togglePlay()
    } else if (albumData.songs.length > 0) {
      playTrack(albumData.songs[0], albumData.songs)
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
          {loading ? (
            <div className="size-full flex items-center justify-center bg-[var(--bg-surface-1)]">
              <Loader2 className="size-8 animate-spin text-[var(--accent-primary)]" />
            </div>
          ) : (
            <img
              src={albumData.coverUrl}
              alt={albumData.title}
              className="size-full object-cover"
            />
          )}
        </div>

        {/* Título do Álbum & Artista */}
        <div className="space-y-1 pt-1">
          <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
            {albumData.title}
          </h1>
          <p
            onClick={() => goToArtist(albumData.artist)}
            className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:underline cursor-pointer transition-colors"
          >
            {albumData.artist}
          </p>
          <p className="text-xs font-normal text-[var(--text-muted)]">
            Álbum &nbsp;|&nbsp; {albumData.year}
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
          {albumData.songs.map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              isArtist={false}
              onPlay={(t) => playTrack(t, albumData.songs)}
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
