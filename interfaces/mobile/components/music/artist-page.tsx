"use client"

import { useEffect, useState, useRef } from "react"
import {
  ArrowLeft,
  Cast,
  MoreVertical,
  Heart,
  Shuffle,
  Play,
  Pause,
  ChevronRight,
  Disc3,
  Video,
  Sparkles,
  Users,
  Info,
  Loader2,
  ListPlus,
  Share2,
  FileText,
  Radio,
} from "lucide-react"
import {
  fetchArtist,
  fetchArtistRadio,
  toggleFollowArtist,
  type ArtistDetails,
  type LuciTrack,
  recordTrackEvent,
} from "@/lib/lucimusic"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { TrackImage } from "./track-image"

export function ArtistPage({ artistId }: { artistId: string | number }) {
  const { pop, goToAlbumDetail, goToArtist, goToLyrics } = useMusicNavigation()
  const { playTrack, currentTrack, isPlaying, togglePlay, toggleLike, isLiked, addToQueue } = useMusicPlayer()

  const [artist, setArtist] = useState<ArtistDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAllTracks, setShowAllTracks] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [showBioModal, setShowBioModal] = useState(false)
  const [generatingRadio, setGeneratingRadio] = useState(false)

  // Action Sheet
  const [actionSheetTrack, setActionSheetTrack] = useState<LuciTrack | null>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setLoading(true)
    setShowAllTracks(false)
    fetchArtist(String(artistId))
      .then((data) => {
        if (data) {
          setArtist(data)
          setIsFollowing(Boolean(data.is_followed))
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [artistId])

  const handleFollowToggle = () => {
    if (!artist) return
    const nextState = !isFollowing
    setIsFollowing(nextState)
    toggleFollowArtist(artist.id, artist.name, artist.thumbnail).then((res) => {
      setIsFollowing(res)
    })
  }

  const handlePlayArtistRadio = () => {
    if (!artist) return
    setGeneratingRadio(true)
    fetchArtistRadio(artist.id)
      .then((tracks) => {
        if (tracks.length > 0) {
          playTrack(tracks[0], tracks)
        } else if (artist.top_tracks.length > 0) {
          playTrack(artist.top_tracks[0], artist.top_tracks)
        }
      })
      .catch(() => {
        if (artist.top_tracks.length > 0) {
          playTrack(artist.top_tracks[0], artist.top_tracks)
        }
      })
      .finally(() => setGeneratingRadio(false))
  }

  const handlePlaySingle = (track: LuciTrack, context?: LuciTrack[]) => {
    playTrack(track, context)
    recordTrackEvent({
      track_id: track.id,
      played_seconds: 1,
      total_seconds: track.duration || 180,
      context_mood: "artist_page",
      artist: track.artist,
    })
  }

  const handleTouchStart = (track: LuciTrack) => {
    longPressTimerRef.current = setTimeout(() => {
      setActionSheetTrack(track)
    }, 550)
  }

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  return (
    <div className="relative flex h-full flex-col bg-[var(--bg-app)] text-[var(--text-primary)] select-none overflow-y-auto pb-32">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-48 gap-3 text-[var(--text-secondary)]">
          <Loader2 className="size-8 animate-spin text-[var(--accent-purple)]" />
          <p className="text-xs font-bold">Carregando universo do artista...</p>
        </div>
      ) : artist ? (
        <>
          {/* ─── Hero Header com Foto / Banner Parallax ─── */}
          <div className="relative h-80 w-full overflow-hidden bg-zinc-950 shrink-0">
            <img
              src={artist.banner_url || artist.thumbnail}
              alt={artist.name}
              className="size-full object-cover object-top opacity-90 scale-105"
            />
            {/* Gradiente de Fusão Escura Inferior para #00001F */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[var(--bg-app)]" />

            {/* Sticky Glass Bar Superior (Voltar, Cast, Menu) */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-4 pb-3">
              <button
                type="button"
                onClick={pop}
                aria-label="Voltar"
                className="size-9 flex items-center justify-center rounded-full bg-[var(--bg-surface-glass)] backdrop-blur-xl border border-[var(--border)] text-white active:scale-90 transition-all shadow-md"
              >
                <ArrowLeft className="size-5" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Transmitir"
                  className="size-9 flex items-center justify-center rounded-full bg-[var(--bg-surface-glass)] backdrop-blur-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-white active:scale-90 transition-all shadow-md"
                >
                  <Cast className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Opções"
                  className="size-9 flex items-center justify-center rounded-full bg-[var(--bg-surface-glass)] backdrop-blur-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-white active:scale-90 transition-all shadow-md"
                >
                  <MoreVertical className="size-4" />
                </button>
              </div>
            </div>

            {/* Informações Centrais do Artista */}
            <div className="absolute bottom-4 left-5 right-5 z-10 space-y-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[var(--accent-blue)]/80 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                Artista Verificado
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-md">
                {artist.name}
              </h1>
              <p className="text-xs font-semibold text-[var(--text-secondary)] drop-shadow-sm">
                {artist.listeners || "Artista em destaque na Luci"}
              </p>
            </div>
          </div>

          {/* ─── Bloco de Ações do Artista (Seguir, Mix/Rádio, Play Flutuante) ─── */}
          <div className="flex items-center justify-between px-5 -mt-3 relative z-20">
            <div className="flex items-center gap-2.5">
              {/* Botão Seguir */}
              <button
                type="button"
                onClick={handleFollowToggle}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 shadow-md ${
                  isFollowing
                    ? "bg-[var(--accent-purple)] text-white border border-[var(--accent-pink)]/40 shadow-[#977dff]/20"
                    : "bg-[var(--bg-surface-glass)] border border-[var(--border)] text-[var(--text-primary)] hover:text-white backdrop-blur-xl"
                }`}
              >
                <Heart className={`size-3.5 ${isFollowing ? "fill-white" : ""}`} />
                <span>{isFollowing ? "Seguindo" : "Seguir"}</span>
              </button>

              {/* Botão Mix / Rádio Infinita */}
              <button
                type="button"
                onClick={handlePlayArtistRadio}
                disabled={generatingRadio}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--bg-surface-glass)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white text-xs font-bold backdrop-blur-xl active:scale-95 transition-all shadow-md"
              >
                {generatingRadio ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Radio className="size-3.5 text-[var(--accent-pink)] animate-pulse" />
                )}
                <span>Mix / Rádio</span>
              </button>
            </div>

            {/* Play Geral Flutuante com Gradiente Luci */}
            <button
              type="button"
              onClick={() => {
                if (artist.top_tracks.length > 0) {
                  const isCurArt = currentTrack?.artist === artist.name
                  if (isCurArt && isPlaying) togglePlay()
                  else handlePlaySingle(artist.top_tracks[0], artist.top_tracks)
                }
              }}
              className="size-14 rounded-full bg-gradient-to-tr from-[#0033ff] via-[#977dff] to-[#ffccf2] text-white flex items-center justify-center shadow-xl shadow-[#0033ff]/50 active:scale-90 transition-transform"
              aria-label="Reproduzir Artista"
            >
              {currentTrack?.artist === artist.name && isPlaying ? (
                <Pause className="size-6 fill-white text-white" />
              ) : (
                <Play className="size-6 fill-white text-white translate-x-0.5" />
              )}
            </button>
          </div>

          <div className="space-y-7 px-5 pt-5">
            {/* ─── 1. Top Músicas (Populares) ─── */}
            {artist.top_tracks && artist.top_tracks.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                    Músicas Populares
                  </h2>
                </div>

                <div className="space-y-2">
                  {(showAllTracks ? artist.top_tracks : artist.top_tracks.slice(0, 5)).map((track, idx) => {
                    const isCurrent = currentTrack?.id === track.id
                    const liked = isLiked(track.id)

                    return (
                      <div
                        key={`top-track-${track.id}`}
                        onClick={() => handlePlaySingle(track, artist.top_tracks)}
                        onTouchStart={() => handleTouchStart(track)}
                        onTouchEnd={handleTouchEnd}
                        className={`flex items-center gap-3 p-2 rounded-xl bg-[var(--bg-surface)] border transition-all active:scale-[0.99] cursor-pointer group ${
                          isCurrent
                            ? "border-[var(--accent-purple)] bg-[var(--bg-surface)]/90 shadow-md shadow-[#977dff]/15"
                            : "border-[var(--border)] hover:border-[var(--accent-purple)]/30"
                        }`}
                      >
                        {/* Numeração */}
                        <span className={`w-5 text-center text-xs font-black shrink-0 ${
                          isCurrent ? "text-[var(--accent-pink)]" : "text-[var(--text-muted)]"
                        }`}>
                          {idx + 1}
                        </span>

                        <TrackImage
                          src={track.thumbnail}
                          trackId={track.id}
                          alt={track.title}
                          className="size-11 rounded-lg object-cover bg-zinc-900 shrink-0"
                        />

                        <div className="min-w-0 flex-1">
                          <h4 className={`text-xs font-black truncate leading-tight ${
                            isCurrent ? "text-[var(--accent-pink)]" : "text-[var(--text-primary)]"
                          }`}>
                            {track.title}
                          </h4>
                          <p className="text-[11px] font-semibold text-[var(--text-secondary)] truncate mt-0.5">
                            {track.album || artist.name}
                          </p>
                        </div>

                        {/* Curtir */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleLike(track)
                          }}
                          className="p-2 text-[var(--text-secondary)] hover:text-white active:scale-90 transition-transform"
                        >
                          <Heart className={`size-4 ${liked ? "fill-[var(--accent-purple)] text-[var(--accent-purple)]" : ""}`} />
                        </button>

                        {/* Menu de Ações */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActionSheetTrack(track)
                          }}
                          className="p-2 text-[var(--text-muted)] hover:text-white active:scale-90 transition-transform"
                        >
                          <MoreVertical className="size-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>

                {artist.top_tracks.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setShowAllTracks(!showAllTracks)}
                    className="w-full py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-xs font-bold text-[var(--text-secondary)] hover:text-white active:scale-98 transition-all text-center"
                  >
                    {showAllTracks ? "Ver menos" : "Exibir mais músicas"}
                  </button>
                )}
              </section>
            )}

            {/* ─── 2. Último Lançamento ─── */}
            {artist.latest_release && (
              <section className="space-y-3">
                <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                  Último Lançamento
                </h2>
                <div
                  onClick={() => {
                    if (artist.top_tracks[0]) handlePlaySingle(artist.top_tracks[0], artist.top_tracks)
                  }}
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--accent-purple)]/40 cursor-pointer active:scale-98 transition-all shadow-md group"
                >
                  <img
                    src={artist.latest_release.cover}
                    alt={artist.latest_release.title}
                    className="size-16 rounded-xl object-cover bg-zinc-900 shadow-sm shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-[var(--accent-pink)]/15 text-[9.5px] font-black text-[var(--accent-pink)] uppercase">
                      {artist.latest_release.type} • {artist.latest_release.release_date}
                    </span>
                    <h3 className="text-xs font-bold text-[var(--text-primary)] truncate mt-1">
                      {artist.latest_release.title}
                    </h3>
                    <p className="text-[11px] font-medium text-[var(--text-secondary)] truncate">
                      {artist.name}
                    </p>
                  </div>
                  <div className="size-9 rounded-full bg-[var(--accent-blue)] text-white flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform">
                    <Play className="size-4 fill-white translate-x-0.5" />
                  </div>
                </div>
              </section>
            )}

            {/* ─── 3. Discografia / Álbuns ─── */}
            {artist.albums && artist.albums.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                    Discografia & Álbuns
                  </h2>
                </div>

                <div className="flex gap-3.5 overflow-x-auto no-scrollbar py-1">
                  {artist.albums.map((alb) => (
                    <div
                      key={`album-${alb.id}`}
                      onClick={() => goToAlbumDetail(alb.id, alb.title, artist.name, alb.thumbnail)}
                      className="w-32 shrink-0 space-y-1.5 cursor-pointer active:scale-95 transition-transform group"
                    >
                      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border)] shadow-md group-hover:border-[var(--accent-purple)]/50 transition-all">
                        <img
                          src={alb.thumbnail}
                          alt={alb.title}
                          className="size-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <h4 className="text-xs font-bold text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--accent-pink)]">
                        {alb.title}
                      </h4>
                      <p className="text-[10px] font-medium text-[var(--text-secondary)] line-clamp-1">
                        {alb.year || "Álbum"}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ─── 4. Vídeos & Clipes (16:9) ─── */}
            {artist.videos && artist.videos.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Video className="size-4 text-[var(--accent-pink)]" />
                    <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                      Vídeos & Clipes Oficiais
                    </h2>
                  </div>
                </div>

                <div className="flex gap-3.5 overflow-x-auto no-scrollbar py-1">
                  {artist.videos.map((vid) => (
                    <div
                      key={`vid-${vid.id}`}
                      onClick={() => {
                        const fakeTrack: LuciTrack = {
                          id: vid.id,
                          title: vid.title,
                          artist: artist.name,
                          thumbnail: vid.thumbnail,
                          duration: 240,
                        }
                        handlePlaySingle(fakeTrack)
                      }}
                      className="w-52 shrink-0 space-y-1.5 cursor-pointer active:scale-95 transition-transform group"
                    >
                      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border)] shadow-md">
                        <img
                          src={vid.thumbnail}
                          alt={vid.title}
                          className="size-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                          <div className="size-8 rounded-full bg-[var(--accent-blue)] text-white flex items-center justify-center shadow-lg">
                            <Play className="size-3.5 fill-white translate-x-0.5" />
                          </div>
                        </div>
                      </div>
                      <h4 className="text-xs font-bold text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--accent-pink)]">
                        {vid.title}
                      </h4>
                      <p className="text-[10px] font-medium text-[var(--text-muted)]">
                        {vid.views || "YouTube Vídeo"}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ─── 5. Curadoria Cognitiva da Luci ("Mix do Artista") ─── */}
            <section className="space-y-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-4 text-[var(--accent-pink)]" />
                <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                  Mix Inspirado em {artist.name}
                </h2>
              </div>

              <div
                onClick={handlePlayArtistRadio}
                className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-[#06003d] via-[#0033ff] to-[#977dff] text-white shadow-xl shadow-[#0033ff]/20 cursor-pointer active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1 max-w-[75%]">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 text-[9.5px] font-black uppercase text-white backdrop-blur-md">
                      Curadoria Inteligente
                    </span>
                    <h3 className="text-sm font-black text-white leading-tight">
                      Rádio Infinita Balanceada
                    </h3>
                    <p className="text-[11px] text-white/80 font-medium leading-tight">
                      40% {artist.name}, 40% artistas do mesmo nicho e 20% novidades selecionadas
                    </p>
                  </div>
                  <div className="size-11 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                    <Play className="size-5 fill-white text-white translate-x-0.5" />
                  </div>
                </div>
              </div>
            </section>

            {/* ─── 6. Artistas Similares / Pontes de Descoberta ─── */}
            {artist.similar_artists && artist.similar_artists.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                    Os Fãs Também Ouvem
                  </h2>
                </div>

                <div className="flex gap-4 overflow-x-auto no-scrollbar py-1">
                  {artist.similar_artists.map((sim) => (
                    <div
                      key={`sim-${sim.id}`}
                      onClick={() => goToArtist(sim.id || sim.name)}
                      className="flex flex-col items-center gap-1.5 w-20 shrink-0 cursor-pointer active:scale-95 transition-transform group"
                    >
                      <div className="size-18 rounded-full p-[2px] bg-gradient-to-br from-[var(--border)] to-[var(--accent-purple)]/40 group-hover:to-[var(--accent-pink)] transition-all">
                        <img
                          src={sim.thumbnail || sim.avatar || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200"}
                          alt={sim.name}
                          className="size-full rounded-full object-cover bg-zinc-900"
                          loading="lazy"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-[var(--text-primary)] text-center line-clamp-1 group-hover:text-[var(--accent-pink)]">
                        {sim.name}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ─── 7. Biografia & Sobre ─── */}
            {artist.bio && (
              <section className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Info className="size-4 text-[var(--accent-purple)]" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                    Sobre o Artista
                  </h2>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] space-y-2.5">
                  <p className="text-xs font-medium text-[var(--text-primary)]/80 leading-relaxed line-clamp-3">
                    {artist.bio}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowBioModal(true)}
                    className="text-[11px] font-bold text-[var(--accent-pink)] hover:underline block"
                  >
                    Ler biografia completa
                  </button>
                </div>
              </section>
            )}
          </div>

          {/* ─── Modal Biografia Completa ─── */}
          {showBioModal && (
            <div
              onClick={() => setShowBioModal(false)}
              className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/80 backdrop-blur-md animate-fade-in"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[480px] max-h-[75vh] overflow-y-auto rounded-3xl bg-[var(--bg-surface)] border border-[var(--border)] p-6 space-y-4 shadow-2xl animate-scale-up"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-base font-black text-[var(--text-primary)]">
                    Biografia • {artist.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowBioModal(false)}
                    className="text-xs font-bold text-[var(--text-secondary)] hover:text-white"
                  >
                    Fechar
                  </button>
                </div>
                <p className="text-xs font-medium text-[var(--text-primary)]/90 leading-relaxed whitespace-pre-line">
                  {artist.bio}
                </p>
              </div>
            </div>
          )}

          {/* ─── Action Sheet de Faixa ─── */}
          {actionSheetTrack && (
            <div
              onClick={() => setActionSheetTrack(null)}
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[480px] rounded-t-3xl bg-[var(--bg-surface)] border-t border-[var(--border)] p-6 space-y-4 shadow-2xl animate-slide-up"
              >
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <TrackImage
                    src={actionSheetTrack.thumbnail}
                    trackId={actionSheetTrack.id}
                    alt={actionSheetTrack.title}
                    className="size-12 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-black text-[var(--text-primary)] truncate">
                      {actionSheetTrack.title}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] truncate">
                      {actionSheetTrack.artist}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 text-sm font-bold text-[var(--text-primary)]">
                  <button
                    type="button"
                    onClick={() => {
                      addToQueue(actionSheetTrack)
                      setActionSheetTrack(null)
                    }}
                    className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10"
                  >
                    <ListPlus className="size-5 text-[var(--accent-purple)]" />
                    <span>Adicionar à fila</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      goToLyrics()
                      setActionSheetTrack(null)
                    }}
                    className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10"
                  >
                    <FileText className="size-5 text-[var(--accent-purple)]" />
                    <span>Ver letra da música</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      toggleLike(actionSheetTrack)
                      setActionSheetTrack(null)
                    }}
                    className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10"
                  >
                    <Heart className={`size-5 ${isLiked(actionSheetTrack.id) ? "fill-[var(--accent-purple)] text-[var(--accent-purple)]" : "text-[var(--accent-purple)]"}`} />
                    <span>{isLiked(actionSheetTrack.id) ? "Remover dos favoritos" : "Favoritar música"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: actionSheetTrack.title,
                          text: `Ouvindo ${actionSheetTrack.title} de ${actionSheetTrack.artist} na Luci`,
                          url: window.location.href,
                        })
                      }
                      setActionSheetTrack(null)
                    }}
                    className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10"
                  >
                    <Share2 className="size-5 text-[var(--accent-purple)]" />
                    <span>Compartilhar no Chat da Luci</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
