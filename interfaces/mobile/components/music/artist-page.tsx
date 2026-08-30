"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, MoreHorizontal, MoreVertical, Play, Pause, Sun, Moon, Loader2 } from "lucide-react"
import { TrackRow } from "@/components/ui/track-row"
import { TrackActionMenu } from "@/components/ui/track-action-menu"
import { SectionHeader } from "@/components/ui/section-header"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { useTheme } from "@/hooks/use-theme"
import { type LuciTrack, fetchArtist, searchTracks, toggleFollowArtist } from "@/lib/lucimusic"

interface ArtistPageProps {
  artistId: string
}

export function ArtistPage({ artistId }: ArtistPageProps) {
  const { goBack } = useMusicNavigation()
  const { currentTrack, isPlaying, playTrack, togglePlay, toggleLike, isLiked } = useMusicPlayer()
  const { theme, toggleTheme, mounted } = useTheme()

  const [isFollowing, setIsFollowing] = useState(false)
  const [selectedTrack, setSelectedTrack] = useState<LuciTrack | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [artistData, setArtistData] = useState<{
    name: string
    monthlyListeners: string
    avatarUrl: string
    popularSongs: LuciTrack[]
  }>({
    name: decodeURIComponent(artistId || "Artista"),
    monthlyListeners: "No radar da Luci",
    avatarUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500",
    popularSongs: [],
  })

  useEffect(() => {
    let isCancelled = false
    setLoading(true)

    async function loadArtistData() {
      try {
        const decodedName = decodeURIComponent(artistId || "").trim()
        if (artistId && artistId !== "default") {
          try {
            const details = await fetchArtist(artistId)
            if (!isCancelled && details && details.top_tracks && details.top_tracks.length > 0) {
              setArtistData({
                name: details.name || decodedName,
                monthlyListeners: details.monthly_listeners || "Artista no radar da Luci",
                avatarUrl: details.avatar || details.cover || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500",
                popularSongs: details.top_tracks,
              })
              setLoading(false)
              return
            }
          } catch (e) {
            console.warn("[ArtistPage] Fallback para busca direta de faixas:", e)
          }
        }

        // Busca faixas reais pelo nome do artista
        const tracks = await searchTracks(decodedName || "Pop Brasil")
        if (!isCancelled) {
          const songs = tracks.length > 0 ? tracks : [
            {
              id: `art_track_${encodeURIComponent(decodedName)}`,
              title: "Música em destaque",
              artist: decodedName || "Artista",
              thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400",
              duration: 210,
            }
          ]

          setArtistData({
            name: decodedName || "Artista",
            monthlyListeners: `${(Math.floor(Math.random() * 80) + 20).toLocaleString()} ouvintes mensais`,
            avatarUrl: songs[0]?.thumbnail || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500",
            popularSongs: songs,
          })
        }
      } catch (err) {
        console.warn("[ArtistPage] Erro ao resolver artista:", err)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    loadArtistData()
    return () => {
      isCancelled = true
    }
  }, [artistId])

  const isThisArtistPlaying = currentTrack?.artist?.toLowerCase().includes(artistData.name.toLowerCase()) && isPlaying

  const handlePlayArtist = () => {
    if (isThisArtistPlaying) {
      togglePlay()
    } else if (artistData.popularSongs.length > 0) {
      playTrack(artistData.popularSongs[0], artistData.popularSongs)
    }
  }

  const handleOpenMore = (track: LuciTrack) => {
    setSelectedTrack(track)
    setIsMenuOpen(true)
  }

  const handleToggleFollow = async () => {
    setIsFollowing(!isFollowing)
    try {
      await toggleFollowArtist(artistId, artistData.name, artistData.avatarUrl)
    } catch {}
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
            aria-label="Mais opções do artista"
            className="size-10 rounded-full bg-[var(--bg-surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-center transition-transform active:scale-90"
          >
            <MoreHorizontal className="size-5" />
          </button>
        </div>
      </header>

      {/* ─── HERO CENTRAL DO ARTISTA (AVATAR CIRCULAR GIGANTE + NOME + OUVINTES) ─── */}
      <div className="flex flex-col items-center px-6 pt-2 pb-6 text-center space-y-3">
        {/* Avatar Circular Gigante (220x220) com Sombra Profunda */}
        <div className="relative size-[220px] rounded-full overflow-hidden bg-[var(--bg-surface-2)] border-2 border-[var(--border-subtle)] shadow-2xl flex items-center justify-center">
          {loading ? (
            <Loader2 className="size-10 text-[var(--accent-primary)] animate-spin" />
          ) : (
            <img
              src={artistData.avatarUrl}
              alt={artistData.name}
              className="size-full object-cover"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500"
              }}
            />
          )}
        </div>

        {/* Nome do Artista */}
        <div className="space-y-1 pt-1">
          <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
            {artistData.name}
          </h1>
          <p className="text-xs font-medium text-[var(--text-secondary)]">
            {artistData.monthlyListeners}
          </p>
        </div>

        {/* ─── BARRA DE AÇÕES PRINCIPAIS (SEGUIR, 3 PONTOS E PLAY GIGANTE) ─── */}
        <div className="flex items-center justify-between w-full pt-3 px-1">
          <div className="flex items-center gap-3">
            {/* Botão Seguir / Seguindo na cor da marca */}
            <button
              type="button"
              onClick={handleToggleFollow}
              className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all active:scale-95 border ${
                isFollowing
                  ? "bg-transparent text-[var(--accent-primary)] border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10"
                  : "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-md shadow-[#5c62ec]/30"
              }`}
            >
              {isFollowing ? "Seguindo" : "Seguir"}
            </button>

            {/* Botão Menu 3 Pontos */}
            <button
              type="button"
              aria-label="Mais opções"
              className="size-10 rounded-full hover:bg-[var(--bg-surface-1)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center active:scale-90 transition-transform"
            >
              <MoreVertical className="size-5" />
            </button>
          </div>

          {/* Botão de Reprodução Principal Gigante (Play / Pause) */}
          <button
            type="button"
            onClick={handlePlayArtist}
            aria-label="Tocar músicas do artista"
            className="size-12 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center shadow-lg shadow-[#5c62ec]/40 active:scale-90 transition-transform"
          >
            {isThisArtistPlaying ? (
              <Pause className="size-5 fill-white" />
            ) : (
              <Play className="size-5 fill-white translate-x-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Divisor sutil */}
      <div className="h-[1px] bg-[var(--border-subtle)] mx-5 mb-4" />

      {/* ─── SEÇÃO DE MÚSICAS POPULARES (Popular Songs) ─── */}
      <div className="px-5 space-y-2">
        <SectionHeader
          title="Músicas Populares"
          seeAllText={artistData.popularSongs.length > 5 ? "Ver tudo" : undefined}
          onSeeAll={() => {}}
        />

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-8 text-[var(--accent-primary)] animate-spin" />
          </div>
        ) : (
          <div className="space-y-1">
            {artistData.popularSongs.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                isArtist={false}
                onPlay={(t) => playTrack(t, artistData.popularSongs)}
                onMore={handleOpenMore}
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
        onViewArtist={() => {}}
        onGoToAlbum={() => {}}
        onShare={() => {}}
        isLiked={selectedTrack ? isLiked(selectedTrack.id) : false}
      />
    </div>
  )
}
