"use client"

import { useState, useEffect, useRef } from "react"
import {
  Clock,
  Settings,
  Sparkles,
  Zap,
  Target,
  Moon,
  Rocket,
  Coffee,
  Play,
  Flame,
  Radio,
  ChevronRight,
  MoreVertical,
  Heart,
  ListPlus,
  Share2,
  Disc3,
  FileText,
} from "lucide-react"
import {
  type LuciTrack,
  type DailyMix,
  type MusicHomeFeed,
  type MadeForYouItem,
  fetchMusicHome,
  recordTrackEvent,
} from "@/lib/lucimusic"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { TrackImage } from "./track-image"

const MOOD_PILLS = [
  { id: "all", label: "Todos", icon: null },
  { id: "treino", label: "Treino", icon: Zap },
  { id: "foco", label: "Foco / Trabalho", icon: Target },
  { id: "relax", label: "Relaxante", icon: Moon },
  { id: "energia", label: "Energia", icon: Rocket },
  { id: "acustico", label: "Acústico", icon: Coffee },
]

export function MusicHome({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const [activeMood, setActiveMood] = useState("all")
  const [feed, setFeed] = useState<MusicHomeFeed | null>(null)
  const [loading, setLoading] = useState(true)

  // Action Sheet (Long-press / menu de 3 pontinhos)
  const [actionSheetTrack, setActionSheetTrack] = useState<LuciTrack | null>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)

  const { playTrack, currentTrack, isPlaying, addToQueue, toggleLike, isLiked } = useMusicPlayer()
  const { goToArtist, goToPlaylistDetail, goToLyrics } = useMusicNavigation()

  // Carrega feed da Home conforme o mood ativo
  useEffect(() => {
    let isMounted = true
    setLoading(true)
    fetchMusicHome(activeMood)
      .then((data) => {
        if (isMounted) {
          setFeed(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error("[LuciMusic] Erro ao buscar feed:", err)
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [activeMood])

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

  const handlePlayTrack = (track: LuciTrack, context?: LuciTrack[]) => {
    playTrack(track, context)
    recordTrackEvent({
      track_id: track.id,
      played_seconds: 1,
      total_seconds: track.duration || 180,
      context_mood: activeMood,
      artist: track.artist,
    })
  }

  return (
    <div className="relative flex h-full flex-col bg-[var(--bg-app)] text-[var(--text-primary)] select-none overflow-y-auto pb-32">
      {/* ─── A. Header Contextual ─── */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-5 pt-4 pb-3 bg-[var(--bg-surface-glass)] backdrop-blur-xl border-b border-[var(--border)]">
        {/* Saudação e Avatar */}
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-gradient-to-tr from-[#0033ff] via-[#977dff] to-[#ffccf2] p-[1.5px] shadow-sm">
            <div className="size-full rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-xs font-black text-[var(--accent-pink)]">
              LV
            </div>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block leading-none">
              Módulo de Música
            </span>
            <h1 className="text-base font-bold text-[var(--text-primary)] mt-0.5 leading-tight">
              {feed?.greeting || "Olá, Lucas"}
            </h1>
          </div>
        </div>

        {/* Indicador de Status & Atalhos */}
        <div className="flex items-center gap-2">
          {/* Status Servidor Luci */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border)]">
            <span className="size-2 rounded-full bg-[#00ff88] animate-pulse" />
            <span className="text-[10px] font-semibold text-[var(--text-secondary)]">Luci Online</span>
          </div>

          <button
            type="button"
            aria-label="Histórico Recente"
            className="size-8 flex items-center justify-center rounded-full bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white active:scale-95 transition-all"
          >
            <Clock className="size-4" />
          </button>

          <button
            type="button"
            aria-label="Configurações"
            onClick={onOpenMenu}
            className="size-8 flex items-center justify-center rounded-full bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white active:scale-95 transition-all"
          >
            <Settings className="size-4" />
          </button>
        </div>
      </header>

      {/* ─── B. Seção 1: Filtros de Mood / Pílulas Dinâmicas (Scroll Horizontal) ─── */}
      <div className="flex items-center gap-2.5 overflow-x-auto px-5 py-3.5 no-scrollbar shrink-0">
        {MOOD_PILLS.map((pill) => {
          const isActive = activeMood === pill.id
          const Icon = pill.icon

          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => setActiveMood(pill.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 backdrop-blur-md ${
                isActive
                  ? "bg-gradient-to-r from-[#0033ff] to-[#977dff] text-white shadow-lg shadow-[#0033ff]/30 border border-white/20"
                  : "bg-[var(--bg-surface-glass)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]"
              }`}
            >
              {Icon && <Icon className="size-3.5" />}
              <span>{pill.label}</span>
            </button>
          )
        })}
      </div>

      <div className="space-y-7 px-5 pt-1">
        {/* ─── C. Seção 2: "Flow Luci" & Dashboard de Momentos ─── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-[var(--accent-pink)]" />
              <h2 className="text-sm font-black uppercase tracking-wider text-[var(--text-primary)]">
                Flow & Momentos Inteligentes
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-[var(--text-secondary)]">IA Ativa</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Card Principal: Flow Infinito com Efeito Orb */}
            <div
              onClick={() => {
                const first = feed?.discover_releases?.[0] || feed?.trending_brasil?.[0]
                if (first) handlePlayTrack(first, feed?.trending_brasil)
              }}
              className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-[#0033ff] via-[#977dff] to-[#ffccf2] text-white shadow-xl shadow-[#0033ff]/20 cursor-pointer active:scale-[0.99] transition-transform group"
            >
              <div className="absolute -right-6 -bottom-6 size-28 rounded-full bg-white/20 blur-2xl group-hover:scale-125 transition-transform" />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/20 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md">
                    <Radio className="size-3 text-[#ffccf2] animate-pulse" />
                    Autônomo
                  </span>
                  <h3 className="text-lg font-black text-white leading-tight">Flow Infinito</h3>
                  <p className="text-xs text-white/80 font-medium">
                    Mix contínuo calibrado para o momento atual
                  </p>
                </div>
                <div className="size-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                  <Play className="size-6 fill-white text-white translate-x-0.5" />
                </div>
              </div>
            </div>

            {/* Momentos Contextuais (Cards Quadrados Médios) */}
            {feed?.moments && feed.moments.length > 0 && (
              <div className="flex gap-3 overflow-x-auto no-scrollbar py-0.5">
                {feed.moments.slice(0, 3).map((moment) => (
                  <div
                    key={moment.id}
                    onClick={() => {
                      const first = feed?.discover_releases?.[0] || feed?.trending_brasil?.[0]
                      if (first) handlePlayTrack(first, feed?.trending_brasil)
                    }}
                    className="w-44 shrink-0 rounded-2xl p-3.5 bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--accent-purple)]/40 cursor-pointer active:scale-95 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-[var(--accent-pink)] uppercase tracking-wider block">
                        Momento
                      </span>
                      <h4 className="text-xs font-black text-[var(--text-primary)] mt-1 line-clamp-1">
                        {moment.title}
                      </h4>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-2">
                        {moment.subtitle}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/5">
                      <span className="text-[10px] font-semibold text-[var(--text-secondary)]">Ouvir agora</span>
                      <div className="size-6 rounded-full bg-[var(--accent-blue)] flex items-center justify-center">
                        <Play className="size-3 fill-white text-white translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ─── D. Seção 3: "Direto ao Ponto" (Grelha 2x3 de Acesso Rápido) ─── */}
        {feed?.quick_access && feed.quick_access.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
              Direto ao Ponto
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {feed.quick_access.slice(0, 6).map((track) => {
                const isCurrent = currentTrack?.id === track.id
                return (
                  <div
                    key={`quick-${track.id}`}
                    onClick={() => handlePlayTrack(track, feed.quick_access)}
                    onTouchStart={() => handleTouchStart(track)}
                    onTouchEnd={handleTouchEnd}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      setActionSheetTrack(track)
                    }}
                    className={`flex items-center gap-2.5 rounded-xl bg-[var(--bg-surface)] border p-2 cursor-pointer transition-all active:scale-95 group ${
                      isCurrent
                        ? "border-[var(--accent-purple)] bg-[var(--bg-surface)]/90 shadow-md shadow-[#977dff]/15"
                        : "border-[var(--border)] hover:border-[var(--accent-purple)]/30"
                    }`}
                  >
                    <TrackImage
                      src={track.thumbnail}
                      trackId={track.id}
                      alt={track.title}
                      className="size-11 shrink-0 rounded-lg object-cover bg-zinc-900"
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-black truncate leading-tight ${
                        isCurrent ? "text-[var(--accent-pink)]" : "text-[var(--text-primary)]"
                      }`}>
                        {track.title}
                      </p>
                      <p className="text-[10.5px] font-semibold text-[var(--text-secondary)] truncate mt-0.5">
                        {track.artist}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ─── E. Seção 4: Artistas Mais Ouvidos (Círculos Horizontais) ─── */}
        {feed?.top_artists && feed.top_artists.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                Artistas em Destaque
              </h2>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar py-1">
              {feed.top_artists.map((artist) => (
                <div
                  key={`artist-${artist.id}`}
                  onClick={() => goToArtist(artist.id)}
                  className="flex flex-col items-center gap-1.5 w-20 shrink-0 cursor-pointer active:scale-95 transition-transform group"
                >
                  <div className="size-18 rounded-full p-[2px] bg-gradient-to-br from-[var(--border)] to-[var(--accent-purple)]/40 group-hover:to-[var(--accent-pink)] transition-all">
                    <img
                      src={artist.thumbnail}
                      alt={artist.name}
                      className="size-full rounded-full object-cover bg-zinc-900"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-[11px] font-bold text-[var(--text-primary)] text-center line-clamp-1 group-hover:text-[var(--accent-pink)] transition-colors">
                    {artist.name}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── F. Seção 5: Recomendações da Luci ("Feito para Você") ─── */}
        {feed?.made_for_you && feed.made_for_you.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Flame className="size-4 text-[var(--accent-purple)]" />
                <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                  Feito para Você
                </h2>
              </div>
            </div>

            <div className="flex gap-3.5 overflow-x-auto no-scrollbar py-1">
              {feed.made_for_you.map((item) => (
                <div
                  key={`made-for-you-${item.playlist_id}`}
                  onClick={() => {
                    if (item.tracks && item.tracks.length > 0) {
                      goToPlaylistDetail(item.playlist_id, item.title, item.cover, item.tracks)
                    }
                  }}
                  className="w-36 shrink-0 space-y-2 cursor-pointer active:scale-95 transition-transform group"
                >
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border)] group-hover:border-[var(--accent-purple)]/50 shadow-lg transition-all">
                    <img
                      src={item.cover}
                      alt={item.title}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute bottom-2 right-2 size-8 rounded-full bg-[var(--accent-blue)] text-white flex items-center justify-center shadow-md">
                      <Play className="size-4 fill-white translate-x-0.5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--accent-pink)] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[10px] font-medium text-[var(--text-muted)] line-clamp-2 mt-0.5">
                      {item.reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── G. Seção 6: Lançamentos & Novidades (Descoberta 10%) ─── */}
        {feed?.discover_releases && feed.discover_releases.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-4 text-[var(--accent-pink)]" />
                <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                  Lançamentos & Novidades
                </h2>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent-pink)]/15 text-[var(--accent-pink)]">
                Descoberta
              </span>
            </div>

            <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
              {feed.discover_releases.map((track) => (
                <div
                  key={`release-${track.id}`}
                  onClick={() => handlePlayTrack(track, feed.discover_releases)}
                  onTouchStart={() => handleTouchStart(track)}
                  onTouchEnd={handleTouchEnd}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setActionSheetTrack(track)
                  }}
                  className="w-32 shrink-0 space-y-1.5 cursor-pointer active:scale-95 transition-transform group"
                >
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border)] group-hover:border-[var(--accent-pink)]/40 shadow-md transition-all">
                    <TrackImage
                      src={track.thumbnail}
                      trackId={track.id}
                      alt={track.title}
                      className="size-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-[var(--bg-app)]/80 backdrop-blur-md text-[9px] font-black text-[var(--accent-pink)]">
                      Novo
                    </div>
                  </div>
                  <p className="text-xs font-bold text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--accent-pink)]">
                    {track.title}
                  </p>
                  <p className="text-[10px] font-medium text-[var(--text-secondary)] line-clamp-1">
                    {track.artist}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ─── Modal / Action Sheet em Vidro Fosco (Toque Longo) ─── */}
      {actionSheetTrack && (
        <div
          onClick={() => setActionSheetTrack(null)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[480px] rounded-t-3xl bg-[var(--bg-surface)] border-t border-[var(--border)] p-6 space-y-4 shadow-2xl animate-slide-up"
          >
            {/* Header da Faixa */}
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

            {/* Ações */}
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
                  goToArtist(actionSheetTrack.artistId || actionSheetTrack.artist)
                  setActionSheetTrack(null)
                }}
                className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10"
              >
                <Disc3 className="size-5 text-[var(--accent-purple)]" />
                <span>Ir para página do artista</span>
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
    </div>
  )
}
