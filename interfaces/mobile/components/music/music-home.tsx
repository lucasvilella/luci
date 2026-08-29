"use client"

import { useState, useEffect, useRef } from "react"
import {
  Clock,
  Sparkles,
  Zap,
  Target,
  Moon,
  Rocket,
  Coffee,
  Play,
  Flame,
  ChevronRight,
  MoreVertical,
  Heart,
  ListPlus,
  Share2,
  Disc3,
  FileText,
  Radio,
  Disc,
  ListMusic,
  Plus,
  Loader2,
} from "lucide-react"
import {
  type LuciTrack,
  type MusicHomeFeed,
  fetchMusicHome,
  recordTrackEvent,
} from "@/lib/lucimusic"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { TrackImage } from "./track-image"
import { AddToPlaylistModal } from "./add-to-playlist-modal"

const MOOD_PILLS = [
  { id: "all", label: "Todos", icon: null },
  { id: "treino", label: "Treino", icon: Zap },
  { id: "foco", label: "Foco", icon: Target },
  { id: "relax", label: "Relax", icon: Moon },
  { id: "energia", label: "Energia", icon: Rocket },
  { id: "acustico", label: "Acústico", icon: Coffee },
]

export function MusicHome({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const [activeMood, setActiveMood] = useState("all")
  const [feed, setFeed] = useState<MusicHomeFeed | null>(null)
  const [loading, setLoading] = useState(true)

  // Modais de Ação
  const [actionSheetTrack, setActionSheetTrack] = useState<LuciTrack | null>(null)
  const [playlistModalTrack, setPlaylistModalTrack] = useState<LuciTrack | null>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)

  const { playTrack, currentTrack, isPlaying, addToQueue, toggleLike, isLiked } = useMusicPlayer()
  const { goToArtist, goToPlaylistDetail, goToAlbumDetail, goToLyrics } = useMusicNavigation()

  // Carrega feed da Home conforme o mood ativo
  useEffect(() => {
    let isMounted = true
    setLoading(true)
    fetchMusicHome(activeMood)
      .then((data) => {
        if (isMounted) setFeed(data)
      })
      .catch((err) => console.error("[MusicHome] Erro ao carregar feed:", err))
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [activeMood])

  const handlePlaySingle = (track: LuciTrack, allTracks: LuciTrack[]) => {
    playTrack(track, allTracks)
    recordTrackEvent({
      track_id: track.id,
      played_seconds: 1,
      total_seconds: track.duration || 180,
      context_mood: activeMood,
      artist: track.artist,
    })
  }

  const handleTouchStart = (track: LuciTrack) => {
    longPressTimerRef.current = setTimeout(() => {
      setActionSheetTrack(track)
    }, 500)
  }

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  return (
    <div className="relative flex h-full flex-col bg-[var(--bg-app)] text-[var(--text-primary)] select-none overflow-y-auto pb-32">
      {/* ─── HEADER SUPERIOR CONTEXTUAL (CLEAN STYLE) ─── */}
      <header className="sticky top-0 z-20 px-5 pt-6 pb-3 bg-[var(--bg-deck)] backdrop-blur-xl border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[var(--text-secondary)] block">
              {feed?.greeting || "Boa tarde"}
            </span>
            <h1 className="text-xl font-bold text-[var(--text-primary)] leading-tight">
              Lucas
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] shadow-sm">
              <span className="size-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
              <span className="text-[11px] font-semibold text-[var(--text-primary)]">Luci Hub</span>
            </div>
          </div>
        </div>

        {/* ─── PÍLULAS DE MOOD / FILTROS RÁPIDOS (CLEAN SOFT-UI) ─── */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-3 pb-1">
          {MOOD_PILLS.map((pill) => {
            const Icon = pill.icon
            const isActive = activeMood === pill.id
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setActiveMood(pill.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all active:scale-95 ${
                  isActive
                    ? "bg-[var(--accent-primary)] text-white shadow-sm shadow-[var(--accent-glow)] font-semibold"
                    : "bg-[var(--bg-surface-1)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]"
                }`}
              >
                {Icon && <Icon className="size-3" />}
                <span>{pill.label}</span>
              </button>
            )
          })}
        </div>
      </header>

      {/* ─── CONTEÚDO PRINCIPAL DAS 8 SEÇÕES ─── */}
      <div className="p-5 space-y-8">
        {loading && !feed ? (
          <div className="flex flex-col items-center justify-center py-36 gap-3 text-[var(--text-secondary)]">
            <Loader2 className="size-8 animate-spin text-[var(--accent-primary)]" />
            <p className="text-xs font-medium">Calibrando seu fluxo musical...</p>
          </div>
        ) : feed ? (
          <>
            {/* ─── 01 (IMEDIATO): CONTINUAR OUVINDO (Cards 140x140 com border-radius: 20px) ─── */}
            {feed.continue_listening && feed.continue_listening.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Continuar Ouvindo
                  </h2>
                </div>

                <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar py-1">
                  {feed.continue_listening.map((item) => (
                    <div
                      key={`cont-${item.id}`}
                      onClick={() => {
                        if (item.type === "album") {
                          goToAlbumDetail(item.id, item.title, item.subtitle, item.cover_url)
                        } else {
                          goToPlaylistDetail(item.id, item.title, item.cover_url)
                        }
                      }}
                      className="w-[140px] shrink-0 space-y-2 cursor-pointer group active:scale-95 transition-all"
                    >
                      <div className="relative size-[140px] rounded-[20px] overflow-hidden bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)]">
                        <img
                          src={item.cover_url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300"}
                          alt={item.title}
                          className="size-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-black/20">
                          <div className="h-full bg-[var(--accent-primary)] w-1/2 rounded-full" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-[13px] font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-primary)]">
                          {item.title}
                        </h4>
                        <p className="text-[11px] font-normal text-[var(--text-secondary)] truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ─── 02 (PRINCIPAL): SEUS 5 DAILY MIXES (Cards Clean) ─── */}
            {feed.daily_mixes && feed.daily_mixes.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="size-4 text-[var(--accent-primary)]" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Seus 5 Daily Mixes
                    </h2>
                  </div>
                  <span className="text-[11px] font-medium text-[var(--accent-primary)]">Atualizado hoje</span>
                </div>

                <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar py-1">
                  {feed.daily_mixes.map((mix) => (
                    <div
                      key={`mix-${mix.mix_id}`}
                      onClick={() => goToPlaylistDetail(`daily_mix_${mix.mix_id}`, mix.title, mix.cover_url)}
                      className="w-40 shrink-0 space-y-2 cursor-pointer group active:scale-95 transition-all"
                    >
                      <div
                        className="relative aspect-square w-full rounded-[20px] overflow-hidden p-3.5 flex flex-col justify-between shadow-[var(--shadow-card)] border border-[var(--border-subtle)] group-hover:border-[var(--accent-primary)] transition-colors bg-[var(--bg-surface-1)]"
                      >
                        <div className="size-7 rounded-lg bg-[var(--bg-surface-2)] flex items-center justify-center text-[11px] font-bold text-[var(--accent-primary)] border border-[var(--border-subtle)]">
                          #{mix.mix_id}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[var(--text-primary)] leading-tight">
                            {mix.title}
                          </h4>
                        </div>
                      </div>
                      <p className="text-[11px] font-normal text-[var(--text-secondary)] line-clamp-2 leading-tight">
                        {mix.subtitle}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ─── 03 (AFINIDADE): SEUS ARTISTAS FAVORITOS (Avatares 80x80) ─── */}
            {feed.favorite_artists && feed.favorite_artists.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                  Artistas Favoritos
                </h2>

                <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
                  {feed.favorite_artists.map((art) => (
                    <div
                      key={`fav-art-${art.id}`}
                      onClick={() => goToArtist(art.id || art.name)}
                      className="flex flex-col items-center gap-1.5 w-20 shrink-0 cursor-pointer active:scale-95 transition-all group"
                    >
                      <div className="size-18 rounded-full p-[2px] bg-gradient-to-tr from-[#0033ff] to-[#977dff] shadow-md">
                        <img
                          src={art.thumbnail || art.avatar || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200"}
                          alt={art.name}
                          className="size-full rounded-full object-cover bg-zinc-900"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-white text-center truncate w-full group-hover:text-[var(--accent-pink)]">
                        {art.name}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ─── 04 (DESCOBERTA): PONTES DA LUCI (Artistas com Badge Porque você ouve X) ─── */}
            {feed.recommended_artists && feed.recommended_artists.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="size-4 text-[var(--accent-pink)]" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                    Pontes de Descoberta
                  </h2>
                </div>

                <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar py-1">
                  {feed.recommended_artists.map((rec) => (
                    <div
                      key={`rec-art-${rec.id}`}
                      onClick={() => goToArtist(rec.id || rec.name)}
                      className="w-36 shrink-0 p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--accent-purple)]/40 cursor-pointer active:scale-95 transition-all space-y-2 group shadow-md"
                    >
                      <img
                        src={rec.avatar || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200"}
                        alt={rec.name}
                        className="size-16 rounded-full mx-auto object-cover bg-zinc-900 shadow-sm"
                      />
                      <div className="text-center">
                        <h4 className="text-xs font-black text-white truncate group-hover:text-[var(--accent-pink)]">
                          {rec.name}
                        </h4>
                        <p className="text-[9.5px] font-medium text-[var(--accent-pink)] mt-0.5 line-clamp-1">
                          {rec.reason || "Recomendado para você"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ─── 05 (CONTEXTUAL 1): RADAR DE ALTA ENERGIA & TREINO (BPM > 125) ─── */}
            {feed.custom_workout && feed.custom_workout.tracks.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Zap className="size-4 text-yellow-400" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                    {feed.custom_workout.title}
                  </h2>
                </div>

                <div className="space-y-2">
                  {feed.custom_workout.tracks.slice(0, 4).map((trk) => (
                    <div
                      key={`work-${trk.id}`}
                      onClick={() => handlePlaySingle(trk, feed.custom_workout?.tracks || [])}
                      className="flex items-center gap-3 p-2.5 rounded-2xl bg-gradient-to-r from-[#0033ff]/20 to-[#06003d] border border-[var(--border)] hover:border-[var(--accent-purple)]/40 cursor-pointer active:scale-[0.99] transition-all"
                    >
                      <TrackImage
                        src={trk.thumbnail}
                        trackId={trk.id}
                        alt={trk.title}
                        className="size-11 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-black text-white truncate">{trk.title}</h4>
                        <p className="text-[11px] font-semibold text-[var(--text-secondary)] truncate">{trk.artist}</p>
                      </div>
                      <div className="size-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                        <Play className="size-3.5 fill-white translate-x-0.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ─── 06 (CONTEXTUAL 2): SESSÃO FOCO & MADRUGADA (BPM 60-95) ─── */}
            {feed.custom_focus && feed.custom_focus.tracks.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <Moon className="size-4 text-[var(--accent-purple)]" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                    {feed.custom_focus.title}
                  </h2>
                </div>

                <div className="space-y-2">
                  {feed.custom_focus.tracks.slice(0, 4).map((trk) => (
                    <div
                      key={`focus-${trk.id}`}
                      onClick={() => handlePlaySingle(trk, feed.custom_focus?.tracks || [])}
                      className="flex items-center gap-3 p-2.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--accent-purple)]/40 cursor-pointer active:scale-[0.99] transition-all"
                    >
                      <TrackImage
                        src={trk.thumbnail}
                        trackId={trk.id}
                        alt={trk.title}
                        className="size-11 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-black text-white truncate">{trk.title}</h4>
                        <p className="text-[11px] font-semibold text-[var(--text-secondary)] truncate">{trk.artist}</p>
                      </div>
                      <div className="size-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                        <Play className="size-3.5 fill-white translate-x-0.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ─── 07 (MERCADO): LANÇAMENTOS RELEVANTES ─── */}
            {feed.new_releases && feed.new_releases.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                  Lançamentos Relevantes
                </h2>

                <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar py-1">
                  {feed.new_releases.map((rel) => (
                    <div
                      key={`rel-${rel.id}`}
                      onClick={() => handlePlaySingle(rel, feed.new_releases || [])}
                      className="w-36 shrink-0 space-y-2 cursor-pointer group active:scale-95 transition-all"
                    >
                      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-900 shadow-md">
                        <TrackImage
                          src={rel.thumbnail}
                          trackId={rel.id}
                          alt={rel.title}
                          className="size-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-black text-[var(--accent-pink)] border border-white/10">
                          Novo
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white truncate group-hover:text-[var(--accent-pink)]">
                          {rel.title}
                        </h4>
                        <p className="text-[10px] font-semibold text-[var(--text-secondary)] truncate">
                          {rel.artist}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ─── 08 (GLOBAL): EM ALTA NO BRASIL (Charts Top 50) ─── */}
            {feed.trending_brasil && feed.trending_brasil.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Flame className="size-4 text-orange-500" />
                    <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                      Em Alta no Brasil
                    </h2>
                  </div>
                </div>

                <div className="space-y-2">
                  {feed.trending_brasil.slice(0, 5).map((track, idx) => {
                    const isCurrent = currentTrack?.id === track.id
                    return (
                      <div
                        key={`trend-${track.id}-${idx}`}
                        onClick={() => handlePlaySingle(track, feed.trending_brasil || [])}
                        onTouchStart={() => handleTouchStart(track)}
                        onTouchEnd={handleTouchEnd}
                        className={`flex items-center gap-3 p-2.5 rounded-2xl bg-[var(--bg-surface)] border transition-all active:scale-[0.99] cursor-pointer ${
                          isCurrent
                            ? "border-[var(--accent-purple)] shadow-md"
                            : "border-[var(--border)] hover:border-[var(--accent-purple)]/40"
                        }`}
                      >
                        <span className="text-xs font-black text-[var(--accent-secondary)] w-4 text-center">
                          {idx + 1}
                        </span>
                        <TrackImage
                          src={track.thumbnail}
                          trackId={track.id}
                          alt={track.title}
                          className="size-11 rounded-xl object-cover bg-zinc-900 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className={`text-xs font-black truncate ${isCurrent ? "text-[var(--accent-pink)]" : "text-white"}`}>
                            {track.title}
                          </h4>
                          <p className="text-[11px] font-semibold text-[var(--text-secondary)] truncate">
                            {track.artist}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActionSheetTrack(track)
                          }}
                          className="p-1.5 text-[var(--text-secondary)] hover:text-white"
                        >
                          <MoreVertical className="size-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </>
        ) : null}
      </div>

      {/* ─── ACTION SHEET DE OPÇÕES DA FAIXA ─── */}
      {actionSheetTrack && (
        <div
          onClick={() => setActionSheetTrack(null)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
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
                <h4 className="text-sm font-black text-white truncate">{actionSheetTrack.title}</h4>
                <p className="text-xs text-[var(--text-secondary)] truncate">{actionSheetTrack.artist}</p>
              </div>
            </div>

            <div className="space-y-1 text-sm font-bold text-[var(--text-primary)]">
              <button
                type="button"
                onClick={() => {
                  setPlaylistModalTrack(actionSheetTrack)
                  setActionSheetTrack(null)
                }}
                className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10"
              >
                <Plus className="size-5 text-[var(--accent-purple)]" />
                <span>Adicionar à Playlist</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  addToQueue(actionSheetTrack)
                  setActionSheetTrack(null)
                }}
                className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10"
              >
                <ListPlus className="size-5 text-[var(--accent-purple)]" />
                <span>Adicionar à Fila</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  goToArtist(actionSheetTrack.artistId || actionSheetTrack.artist)
                  setActionSheetTrack(null)
                }}
                className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10"
              >
                <Disc3 className="size-5 text-[var(--accent-purple)]" />
                <span>Ver Artista</span>
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
                <span>Ver Letra</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL ADICIONAR À PLAYLIST ─── */}
      <AddToPlaylistModal
        track={playlistModalTrack}
        isOpen={!!playlistModalTrack}
        onClose={() => setPlaylistModalTrack(null)}
      />
    </div>
  )
}
