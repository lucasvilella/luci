"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Search,
  X,
  MoreHorizontal,
  Sun,
  Moon,
  Flame,
  Radio,
  Star,
  ListMusic,
  RotateCcw,
  Sparkles,
  SunMedium,
  Smile,
  Dumbbell,
  Coffee,
  Heart,
  Compass,
} from "lucide-react"
import { GenreBrowseCard } from "@/components/ui/genre-browse-card"
import { MoodFeatureCard } from "@/components/ui/mood-feature-card"
import { TrackRow } from "@/components/ui/track-row"
import { ArtistRow } from "@/components/ui/artist-row"
import { AlbumGridCard } from "@/components/ui/album-grid-card"
import { PlaylistGridCard } from "@/components/ui/playlist-grid-card"
import { TrackActionMenu } from "@/components/ui/track-action-menu"
import { SectionHeader } from "@/components/ui/section-header"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { useTheme } from "@/hooks/use-theme"
import { searchMusic, type SearchResultsResponse, type LuciTrack } from "@/lib/lucimusic"

// ─── 01. Músicas por Gênero ───
const GENRE_CARDS_MOCK = [
  { id: "country", title: "Sertanejo & Country", bgGradient: "linear-gradient(135deg, #b45309 0%, #d97706 100%)", artistImageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300" },
  { id: "rock", title: "Rock", bgGradient: "linear-gradient(135deg, #991b1b 0%, #dc2626 100%)", artistImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300" },
  { id: "hiphop", title: "Hip-Hop & Trap", bgGradient: "linear-gradient(135deg, #581c87 0%, #7e22ce 100%)", artistImageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300" },
  { id: "pop", title: "Pop Internacional", bgGradient: "linear-gradient(135deg, #86198f 0%, #c026d3 100%)", artistImageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300" },
  { id: "latin", title: "Música Latina", bgGradient: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)", artistImageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300" },
  { id: "rnb", title: "R&B & Soul", bgGradient: "linear-gradient(135deg, #c2410c 0%, #ea580c 100%)", artistImageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300" },
]

// ─── 02. Ouça como quiser ───
const EXPLORE_MODES_MOCK = [
  { id: "top_played", title: "Os Mais Tocados", bgGradient: "linear-gradient(135deg, #854d0e 0%, #ca8a04 100%)", icon: Star },
  { id: "playlists", title: "Playlists", bgGradient: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)", icon: ListMusic },
  { id: "releases", title: "Lançamentos", bgGradient: "linear-gradient(135deg, #6b21a8 0%, #9333ea 100%)", icon: Flame },
  { id: "stations", title: "Estações", bgGradient: "linear-gradient(135deg, #9a3412 0%, #c2410c 100%)", icon: Radio },
  { id: "rediscover", title: "Redescobrir", bgGradient: "linear-gradient(135deg, #3730a3 0%, #6366f1 100%)", icon: RotateCcw },
  { id: "luci_curation", title: "Luci Exclusivos", bgGradient: "linear-gradient(135deg, #1e3a8a 0%, #5c62ec 100%)", icon: Sparkles },
]

// ─── 03. Moods & Atividades (Indicações da Luci) ───
const LUCI_MOODS_MOCK = [
  { id: "mood_vibes", title: "Vibes do Dia", bgGradient: "linear-gradient(135deg, #831843 0%, #db2777 100%)", icon: SunMedium },
  { id: "mood_activities", title: "Foco & Trabalho", bgGradient: "linear-gradient(135deg, #3f6212 0%, #65a30d 100%)", icon: Compass },
  { id: "mood_wellness", title: "Bem-estar & Paz", bgGradient: "linear-gradient(135deg, #701a75 0%, #a21caf 100%)", icon: Heart },
  { id: "mood_happy", title: "Felicidade & Festa", bgGradient: "linear-gradient(135deg, #9a3412 0%, #ea580c 100%)", icon: Smile },
  { id: "mood_workout", title: "Treino & Energia", bgGradient: "linear-gradient(135deg, #991b1b 0%, #ef4444 100%)", icon: Dumbbell },
  { id: "mood_chill", title: "Relaxar & Dormir", bgGradient: "linear-gradient(135deg, #1e40af 0%, #0284c7 100%)", icon: Coffee },
]

// Pílulas de filtro da busca com 100% de correspondência ao carrossel do print
const SEARCH_FILTER_PILLS = [
  { id: "top", label: "Top" },
  { id: "songs", label: "Músicas" },
  { id: "artists", label: "Artistas" },
  { id: "albums", label: "Álbuns" },
  { id: "playlists", label: "Playlists" },
]

// Catálogo de Artistas
const POPULAR_ARTISTS_CATALOG = [
  { id: "art_ariana", name: "Ariana Grande", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300" },
  { id: "art_weeknd", name: "The Weeknd", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300" },
  { id: "art_billie", name: "Billie Eilish", avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300" },
  { id: "art_drake", name: "Drake", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300" },
]

// Catálogo de Álbuns
const ALBUMS_CATALOG = [
  { id: "alb_sweetener", title: "Sweetener", artist: "Ariana Grande", year: "2018", coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400" },
  { id: "alb_starboy", title: "Starboy", artist: "The Weeknd", year: "2016", coverUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400" },
  { id: "alb_hit_me", title: "HIT ME HARD AND SOFT", artist: "Billie Eilish", year: "2024", coverUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400" },
]

// Catálogo de Playlists
const PLAYLISTS_CATALOG = [
  { id: "pl_all_songs", title: "Ariana Grande - Maiores Sucessos", coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400" },
  { id: "pl_pop_hits", title: "Top 50 Hits Internacionais", coverUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400" },
]

export function SearchView() {
  const { playTrack } = useMusicPlayer()
  const { goToArtist, goToAlbumDetail, goToPlaylistDetail } = useMusicNavigation()
  const { theme, toggleTheme, mounted } = useTheme()

  const [query, setQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("top")
  const [searchData, setSearchData] = useState<SearchResultsResponse | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedTrack, setSelectedTrack] = useState<LuciTrack | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!query.trim()) {
      setSearchData(null)
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timeout = setTimeout(async () => {
      try {
        const filterParam = activeFilter === "top" ? "all" : activeFilter
        const res = await searchMusic(query.trim(), filterParam)
        setSearchData(res)
      } catch (err) {
        console.error("[SearchView] Erro na busca:", err)
      } finally {
        setIsSearching(false)
      }
    }, 350)

    return () => clearTimeout(timeout)
  }, [query, activeFilter])

  const handleOpenMore = (track: LuciTrack) => {
    setSelectedTrack(track)
    setIsMenuOpen(true)
  }

  const isBrowsing = query.trim().length === 0
  const tracksList: LuciTrack[] = searchData?.tracks || searchData?.songs || []
  const artistsList = searchData?.artists || []
  const albumsList = searchData?.albums || []
  const playlistsList = searchData?.playlists || []
  const hasResults = tracksList.length > 0 || artistsList.length > 0 || albumsList.length > 0 || playlistsList.length > 0

  return (
    <div className="relative flex h-full flex-col bg-[var(--bg-app)] text-[var(--text-primary)] select-none overflow-y-auto pb-32">
      {/* ─── HEADER DE BUSCA SUPERIOR COM BARRA DE INPUT E SELETOR DE TEMA ─── */}
      <header className="sticky top-0 z-20 px-5 pt-4 pb-3 bg-[var(--bg-app)]/90 backdrop-blur-xl space-y-3">
        <div className="flex items-center justify-between gap-3">
          {/* Barra de Pesquisa em Pílula */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[var(--text-secondary)] stroke-[2]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="O que você quer ouvir?"
              className="w-full h-12 pl-11 pr-10 rounded-full bg-[var(--bg-surface-1)] text-sm font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all shadow-inner"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 size-7 rounded-full bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors active:scale-90"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Seletor Provisório de Tema */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
            aria-label="Alternar tema"
            className="size-11 rounded-full bg-[var(--bg-surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-center transition-transform active:scale-90 shadow-sm shrink-0"
          >
            {mounted && theme === "dark" ? (
              <Sun className="size-5 text-amber-400" />
            ) : (
              <Moon className="size-5 text-indigo-600" />
            )}
          </button>
        </div>

        {/* ─── PÍLULAS DE FILTRO QUANDO ESTIVER PESQUISANDO ─── */}
        {!isBrowsing && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {SEARCH_FILTER_PILLS.map((pill) => {
              const isActive = activeFilter === pill.id
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setActiveFilter(pill.id)}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all shrink-0 active:scale-95 ${
                    isActive
                      ? "bg-[var(--accent-primary)] text-white shadow-md shadow-[#5c62ec]/30"
                      : "bg-[var(--bg-surface-1)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]"
                  }`}
                >
                  {pill.label}
                </button>
              )
            })}
          </div>
        )}
      </header>

      {/* ─── CONTEÚDO PRINCIPAL ─── */}
      <div className="px-5 pt-2 space-y-7">
        {isBrowsing ? (
          <>
            {/* ─── 01. SEÇÃO: MÚSICAS POR GÊNERO (GenreBrowseCard) ─── */}
            <section className="space-y-3">
              <SectionHeader
                title="Músicas por gênero"
                seeAllText="Ver mais"
                onSeeAll={() => {}}
              />
              <div className="grid grid-cols-2 gap-3">
                {GENRE_CARDS_MOCK.map((genre) => (
                  <GenreBrowseCard
                    key={genre.id}
                    id={genre.id}
                    title={genre.title}
                    bgGradient={genre.bgGradient}
                    artistImageUrl={genre.artistImageUrl}
                    onClick={() => setQuery(genre.title)}
                  />
                ))}
              </div>
            </section>

            {/* ─── 02. SEÇÃO: OUÇA COMO QUISER (MoodFeatureCard) ─── */}
            <section className="space-y-3">
              <SectionHeader
                title="Ouça como quiser"
                seeAllText="Ver mais"
                onSeeAll={() => {}}
              />
              <div className="grid grid-cols-2 gap-3">
                {EXPLORE_MODES_MOCK.map((mode) => (
                  <MoodFeatureCard
                    key={mode.id}
                    id={mode.id}
                    title={mode.title}
                    bgGradient={mode.bgGradient}
                    icon={mode.icon}
                    onClick={() => setQuery(mode.title)}
                  />
                ))}
              </div>
            </section>

            {/* ─── 03. SEÇÃO: MOODS & ATIVIDADES (Indicações da Luci) ─── */}
            <section className="space-y-3">
              <SectionHeader
                title="Moods & Atividades da Luci"
                seeAllText="Ver mais"
                onSeeAll={() => {}}
              />
              <div className="grid grid-cols-2 gap-3">
                {LUCI_MOODS_MOCK.map((mood) => (
                  <MoodFeatureCard
                    key={mood.id}
                    id={mood.id}
                    title={mood.title}
                    bgGradient={mood.bgGradient}
                    icon={mood.icon}
                    onClick={() => setQuery(mood.title)}
                  />
                ))}
              </div>
            </section>
          </>
        ) : (
          /* ─── RESULTADOS DA PESQUISA REAL VINDOS DA API ─── */
          <div className="space-y-6">
            {isSearching ? (
              <div className="py-16 text-center text-sm font-semibold text-[var(--text-secondary)] animate-pulse">
                Buscando faixas, artistas e álbuns...
              </div>
            ) : hasResults ? (
              <>
                {/* 1. Faixas Encontradas */}
                {tracksList.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                      Músicas
                    </h3>
                    <div className="space-y-1">
                      {tracksList.map((track) => (
                        <TrackRow
                          key={track.id}
                          track={track}
                          isArtist={false}
                          onPlay={(t) => playTrack(t, tracksList)}
                          onMore={handleOpenMore}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Artistas Relacionados */}
                {artistsList.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                      Artistas
                    </h3>
                    <div className="space-y-1">
                      {artistsList.map((artist: any) => (
                        <ArtistRow
                          key={artist.id || artist.name}
                          artist={{
                            id: artist.id || artist.name,
                            name: artist.name,
                            avatarUrl: artist.thumbnail || artist.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
                          }}
                          onFollowToggle={() => {}}
                          onClick={() => goToArtist(artist.name || artist.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Álbuns Relacionados */}
                {albumsList.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                      Álbuns
                    </h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                      {albumsList.map((album: any) => (
                        <AlbumGridCard
                          key={album.id}
                          id={album.id}
                          title={album.title}
                          artist={album.artist || ""}
                          year={album.year || ""}
                          coverUrl={album.thumbnail || album.coverUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400"}
                          onClick={() =>
                            goToAlbumDetail(album.id, album.title, album.thumbnail || album.coverUrl)
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Playlists Relacionadas */}
                {playlistsList.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                      Playlists
                    </h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                      {playlistsList.map((playlist: any) => (
                        <PlaylistGridCard
                          key={playlist.id}
                          id={playlist.id}
                          title={playlist.title}
                          author={playlist.author || playlist.subtitle || "Luci"}
                          coverUrl={playlist.thumbnail || playlist.coverUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400"}
                          onClick={() =>
                            goToPlaylistDetail(playlist.id, playlist.title, playlist.thumbnail || playlist.coverUrl)
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-16 text-center text-sm font-semibold text-[var(--text-secondary)]">
                Nenhum resultado encontrado para &quot;{query}&quot;
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── MENU SUSPENSO DE AÇÕES FLUTUANTE (TrackActionMenu) ─── */}
      <TrackActionMenu
        isOpen={isMenuOpen}
        track={selectedTrack}
        onClose={() => setIsMenuOpen(false)}
        onToggleLike={() => {}}
        onAddToPlaylist={() => {}}
        onViewArtist={(artist) => goToArtist(artist)}
        onGoToAlbum={() => {}}
        onShare={() => {}}
        isLiked={false}
      />
    </div>
  )
}
