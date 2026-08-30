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

interface PlaylistDetailViewProps {
  playlistId?: string
  title?: string
  thumbnail?: string
  initialTracks?: LuciTrack[]
}

export function PlaylistDetailView({
  playlistId,
  title = "Playlist",
  thumbnail = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500",
  initialTracks = [],
}: PlaylistDetailViewProps) {
  const { goBack, goToArtist } = useMusicNavigation()
  const { currentTrack, isPlaying, playTrack, togglePlay, toggleLike, isLiked } = useMusicPlayer()
  const { theme, toggleTheme, mounted } = useTheme()

  const [isPlaylistLiked, setIsPlaylistLiked] = useState(false)
  const [selectedTrack, setSelectedTrack] = useState<LuciTrack | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [playlistData, setPlaylistData] = useState<{
    title: string
    creator: string
    year: string
    coverUrl: string
    songs: LuciTrack[]
  }>({
    title,
    creator: "Luci Intelligence",
    year: "2024",
    coverUrl: thumbnail,
    songs: initialTracks,
  })

  useEffect(() => {
    let isCancelled = false
    setLoading(true)

    async function loadPlaylist() {
      try {
        if (initialTracks && initialTracks.length > 0) {
          setPlaylistData({
            title,
            creator: "Luci Intelligence",
            year: "2024",
            coverUrl: thumbnail,
            songs: initialTracks,
          })
          setLoading(false)
          return
        }

        if (playlistId && playlistId !== "default" && !playlistId.startsWith("pump_")) {
          const details = await fetchCollectionDetails("playlist", playlistId, title)
          if (!isCancelled && details && details.tracks.length > 0) {
            setPlaylistData({
              title: details.title || title,
              creator: details.artist || "Luci Intelligence",
              year: details.release_year || "2024",
              coverUrl: details.cover_url || thumbnail,
              songs: details.tracks.map((t) => ({
                id: t.id,
                title: t.title,
                artist: t.artist || "Artista",
                thumbnail: t.thumbnail || details.cover_url || thumbnail,
                duration: t.duration || 210,
              })),
            })
            setLoading(false)
            return
          }
        }

        // Se for uma playlist de treino/foco ou busca dinâmica
        const searchQuery = title || "Hits Brasil"
        const tracks = await searchTracks(searchQuery)
        if (!isCancelled) {
          const dynamicSongs = tracks.length > 0 ? tracks : [
            {
              id: `pl_track_${encodeURIComponent(title)}`,
              title: title,
              artist: "Luci Curadoria",
              thumbnail: thumbnail,
              duration: 210,
            }
          ]

          setPlaylistData({
            title,
            creator: "Luci Intelligence",
            year: "2024",
            coverUrl: thumbnail,
            songs: dynamicSongs,
          })
        }
      } catch (err) {
        console.warn("[PlaylistDetailView] Erro ao carregar playlist dinâmica:", err)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    loadPlaylist()
    return () => {
      isCancelled = true
    }
  }, [playlistId, title, thumbnail, initialTracks])

  const isThisPlaylistPlaying =
    isPlaying &&
    currentTrack &&
    playlistData.songs.some((s) => s.id === currentTrack.id)

  const handlePlayPlaylist = () => {
    if (isThisPlaylistPlaying) {
      togglePlay()
    } else if (playlistData.songs.length > 0) {
      playTrack(playlistData.songs[0], playlistData.songs)
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
            aria-label="Mais opções da playlist"
            className="size-10 rounded-full bg-[var(--bg-surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-center transition-transform active:scale-90"
          >
            <MoreHorizontal className="size-5" />
          </button>
        </div>
      </header>

      {/* ─── HERO CENTRAL DA PLAYLIST (CAPA GIGANTE 220X220 + TÍTULO + CRIADOR) ─── */}
      <div className="flex flex-col items-center px-6 pt-2 pb-5 text-center space-y-3">
        {/* Capa Quadrada com Raio de 22px (10% da altura) */}
        <div className="relative size-[220px] rounded-[22px] overflow-hidden bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] shadow-2xl">
          {loading ? (
            <div className="size-full flex items-center justify-center bg-[var(--bg-surface-1)]">
              <Loader2 className="size-8 animate-spin text-[var(--accent-primary)]" />
            </div>
          ) : (
            <img
              src={playlistData.coverUrl}
              alt={playlistData.title}
              className="size-full object-cover"
            />
          )}
        </div>

        {/* Título da Playlist & Criador */}
        <div className="space-y-1 pt-1">
          <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight line-clamp-2 max-w-xs">
            {playlistData.title}
          </h1>
          <p className="text-sm font-semibold text-[var(--text-secondary)]">
            por {playlistData.creator}
          </p>
          <p className="text-xs font-normal text-[var(--text-muted)]">
            Playlist &nbsp;|&nbsp; {playlistData.year}
          </p>
        </div>

        {/* ─── BARRA DE AÇÕES (CURTIR, ADICIONAR PLAYLIST, 3 PONTOS E BOTÃO PLAY EM PÍLULA) ─── */}
        <div className="flex items-center justify-between w-full pt-2 px-1">
          {/* Ações Secundárias (Esquerda) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlaylistLiked(!isPlaylistLiked)}
              aria-label="Curtir playlist"
              className={`size-10 rounded-full hover:bg-[var(--bg-surface-1)] flex items-center justify-center active:scale-90 transition-transform ${
                isPlaylistLiked ? "text-rose-500" : "text-[var(--text-secondary)]"
              }`}
            >
              <Heart
                className={`size-5.5 ${isPlaylistLiked ? "fill-rose-500" : ""}`}
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
            onClick={handlePlayPlaylist}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--accent-primary)] text-white font-bold text-sm shadow-lg shadow-[#5c62ec]/35 active:scale-95 transition-all"
          >
            {isThisPlaylistPlaying ? (
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

      {/* ─── SEÇÃO DE MÚSICAS DA PLAYLIST (Songs) ─── */}
      <div className="px-5 space-y-2">
        <SectionHeader
          title="Músicas"
          seeAllText="Ver tudo"
          onSeeAll={() => {}}
        />

        <div className="space-y-1">
          {playlistData.songs.map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              isArtist={false}
              onPlay={(t) => playTrack(t, playlistData.songs)}
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
