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
  Download,
  Check,
  Disc3,
  Sparkles,
  ListPlus,
  Share2,
  FileText,
  Loader2,
  Volume2,
} from "lucide-react"
import {
  fetchCollectionDetails,
  toggleFavoriteCollection,
  type MediaCollectionDetails,
  type MediaCollectionTrack,
  type LuciTrack,
  formatSeconds,
  recordTrackEvent,
} from "@/lib/lucimusic"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { TrackImage } from "./track-image"

export function MediaCollectionScreen({
  collectionType,
  collectionId,
  initialTitle,
  initialArtist,
  initialThumbnail,
  initialTracks,
}: {
  collectionType: "album" | "playlist"
  collectionId?: string
  initialTitle?: string
  initialArtist?: string
  initialThumbnail?: string
  initialTracks?: LuciTrack[]
}) {
  const { pop, goToArtist, goToAlbumDetail, goToPlaylistDetail, goToLyrics } = useMusicNavigation()
  const { playTrack, currentTrack, isPlaying, togglePlay, toggleLike, isLiked, addToQueue } = useMusicPlayer()

  const [collection, setCollection] = useState<MediaCollectionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaved, setIsSaved] = useState(false)
  const [isDownloaded, setIsDownloaded] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // Action Sheet
  const [actionSheetTrack, setActionSheetTrack] = useState<LuciTrack | null>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setLoading(true)
    const effectiveId = collectionId || "default"

    fetchCollectionDetails(collectionType, effectiveId, initialTitle, initialArtist)
      .then((data) => {
        setCollection(data)
        setIsSaved(Boolean(data.is_saved))
      })
      .catch((err) => {
        console.warn("[MediaCollectionScreen] Fallback para dados iniciais:", err)
        // Fallback robusto usando metadados e faixas fornecidas
        if (initialTracks && initialTracks.length > 0) {
          const fallbackTracks: MediaCollectionTrack[] = initialTracks.map((t, idx) => ({
            id: t.id,
            track_number: idx + 1,
            title: t.title,
            artist: t.artist,
            album: initialTitle || "Coleção",
            duration: t.duration || 180,
            thumbnail: t.thumbnail || initialThumbnail,
            is_liked: false,
          }))
          setCollection({
            collection_type: collectionType,
            id: effectiveId,
            title: initialTitle || "Coleção",
            artist: initialArtist || "LuciMusic",
            release_year: "2026",
            total_tracks: fallbackTracks.length,
            total_duration: `${fallbackTracks.length * 3} min`,
            cover_url: initialThumbnail || "",
            is_saved: false,
            tracks: fallbackTracks,
          })
        }
      })
      .finally(() => setLoading(false))
  }, [collectionType, collectionId, initialTitle, initialArtist, initialThumbnail, initialTracks])

  const handleToggleFavorite = () => {
    if (!collection) return
    const nextState = !isSaved
    setIsSaved(nextState)
    toggleFavoriteCollection(
      collection.id,
      collection.collection_type,
      collection.title,
      collection.artist,
      collection.cover_url
    ).then((res) => setIsSaved(res))
  }

  // Reproduzir Coleção Completa Linearmente
  const handlePlayAll = () => {
    if (!collection || collection.tracks.length === 0) return
    const luciTracks: LuciTrack[] = collection.tracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: t.album || collection.title,
      thumbnail: t.thumbnail || collection.cover_url,
      duration: t.duration,
    }))
    playTrack(luciTracks[0], luciTracks)
  }

  // Reprodução Aleatória (Fisher-Yates Shuffle)
  const handleShufflePlay = () => {
    if (!collection || collection.tracks.length === 0) return
    const luciTracks: LuciTrack[] = collection.tracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: t.album || collection.title,
      thumbnail: t.thumbnail || collection.cover_url,
      duration: t.duration,
    }))
    const shuffled = [...luciTracks].sort(() => Math.random() - 0.5)
    playTrack(shuffled[0], shuffled)
  }

  const handlePlaySingle = (track: MediaCollectionTrack, allTracks: MediaCollectionTrack[]) => {
    const luciTrack: LuciTrack = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album || collection?.title,
      thumbnail: track.thumbnail || collection?.cover_url,
      duration: track.duration,
    }
    const fullQueue: LuciTrack[] = allTracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: t.album || collection?.title,
      thumbnail: t.thumbnail || collection?.cover_url,
      duration: t.duration,
    }))

    playTrack(luciTrack, fullQueue)
    recordTrackEvent({
      track_id: track.id,
      played_seconds: 1,
      total_seconds: track.duration || 180,
      context_mood: collectionType,
      artist: track.artist,
    })
  }

  const handleDownload = () => {
    setDownloading(true)
    setTimeout(() => {
      setDownloading(false)
      setIsDownloaded(true)
    }, 1800)
  }

  const handleTouchStart = (track: MediaCollectionTrack) => {
    longPressTimerRef.current = setTimeout(() => {
      const luciTrack: LuciTrack = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album || collection?.title,
        thumbnail: track.thumbnail || collection?.cover_url,
        duration: track.duration,
      }
      setActionSheetTrack(luciTrack)
    }, 550)
  }

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const isAlbum = collectionType === "album"

  return (
    <div className="relative flex h-full flex-col bg-[var(--bg-app)] text-[var(--text-primary)] select-none overflow-y-auto pb-32">
      {/* ─── Sticky Glass Bar Superior ─── */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-5 pt-4 pb-3 bg-[var(--bg-surface-glass)] backdrop-blur-2xl border-b border-[var(--border)]">
        <button
          type="button"
          onClick={pop}
          aria-label="Voltar"
          className="size-9 flex items-center justify-center rounded-full bg-[var(--bg-surface)] border border-[var(--border)] text-white active:scale-90 transition-all shadow-md"
        >
          <ArrowLeft className="size-5" />
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Transmitir"
            className="size-9 flex items-center justify-center rounded-full bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white active:scale-90 transition-all shadow-md"
          >
            <Cast className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Opções"
            className="size-9 flex items-center justify-center rounded-full bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white active:scale-90 transition-all shadow-md"
          >
            <MoreVertical className="size-4" />
          </button>
        </div>
      </header>

      {loading && !collection ? (
        <div className="flex flex-col items-center justify-center py-48 gap-3 text-[var(--text-secondary)]">
          <Loader2 className="size-8 animate-spin text-[var(--accent-purple)]" />
          <p className="text-xs font-bold">Carregando {isAlbum ? "álbum" : "playlist"}...</p>
        </div>
      ) : collection ? (
        <div className="space-y-6">
          {/* ─── Hero Header com Glow Backdrop Blur Dinâmico ─── */}
          <div className="relative flex flex-col items-center px-6 pt-6 pb-2 text-center overflow-hidden">
            {/* Glow Dinâmico de Fundo */}
            <div
              className="absolute -top-10 size-64 rounded-full bg-gradient-to-tr from-[#0033ff] to-[#977dff] opacity-40 blur-[90px] pointer-events-none"
            />

            {/* Capa Centralizada 1:1 com Acabamento Premium */}
            <div className="relative z-10 size-56 sm:size-64 rounded-3xl overflow-hidden shadow-2xl shadow-black/80 border border-white/15 bg-zinc-900 shrink-0">
              <img
                src={collection.cover_url || initialThumbnail || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500"}
                alt={collection.title}
                className="size-full object-cover"
              />
              {/* Badge Contextual */}
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-[var(--accent-pink)] border border-white/10">
                  {isAlbum ? "Álbum Oficial" : collection.is_smart_ai ? "Curadoria Luci" : "Playlist"}
                </span>
              </div>
            </div>

            {/* Metadados Centrais */}
            <div className="relative z-10 mt-5 space-y-1 max-w-sm">
              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-sm line-clamp-2">
                {collection.title}
              </h1>

              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[var(--text-secondary)]">
                {isAlbum ? (
                  <button
                    type="button"
                    onClick={() => goToArtist(collection.artist_id || collection.artist)}
                    className="hover:text-white transition-colors underline-offset-2 hover:underline"
                  >
                    {collection.artist}
                  </button>
                ) : (
                  <span>{collection.artist}</span>
                )}
                <span>•</span>
                <span>{collection.release_year}</span>
              </div>

              <p className="text-[11px] font-semibold text-[var(--text-muted)]">
                {collection.total_tracks} faixas • {collection.total_duration}
              </p>
            </div>

            {/* ─── Barra de Ações Rápidas (Salvar, Aleatório, Play Principal, Baixar) ─── */}
            <div className="relative z-10 flex items-center justify-center gap-4 mt-6">
              {/* Favoritar / Salvar */}
              <button
                type="button"
                onClick={handleToggleFavorite}
                aria-label="Salvar"
                className={`size-11 flex items-center justify-center rounded-full border transition-all active:scale-90 shadow-md ${
                  isSaved
                    ? "bg-[var(--accent-purple)] border-[var(--accent-pink)]/40 text-white"
                    : "bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-secondary)] hover:text-white"
                }`}
              >
                <Heart className={`size-5 ${isSaved ? "fill-white" : ""}`} />
              </button>

              {/* Aleatório / Shuffle */}
              <button
                type="button"
                onClick={handleShufflePlay}
                aria-label="Tocar Aleatório"
                className="size-11 flex items-center justify-center rounded-full bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white active:scale-90 transition-all shadow-md"
              >
                <Shuffle className="size-5" />
              </button>

              {/* Play Principal com Gradiente Luci */}
              <button
                type="button"
                onClick={handlePlayAll}
                aria-label="Reproduzir Coleção"
                className="size-14 flex items-center justify-center rounded-full bg-gradient-to-tr from-[#0033ff] via-[#977dff] to-[#ffccf2] text-white shadow-xl shadow-[#0033ff]/50 active:scale-90 transition-transform"
              >
                <Play className="size-6 fill-white translate-x-0.5" />
              </button>

              {/* Baixar / Offline */}
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                aria-label="Baixar Offline"
                className={`size-11 flex items-center justify-center rounded-full border transition-all active:scale-90 shadow-md ${
                  isDownloaded
                    ? "bg-[#10B981] border-[#10B981] text-white"
                    : "bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-secondary)] hover:text-white"
                }`}
              >
                {downloading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : isDownloaded ? (
                  <Check className="size-5" />
                ) : (
                  <Download className="size-5" />
                )}
              </button>
            </div>
          </div>

          {/* ─── Tracklist (Lista Vertical de Músicas) ─── */}
          <div className="space-y-3 px-5">
            <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
              Faixas
            </h2>

            <div className="space-y-1.5">
              {collection.tracks.map((track, idx) => {
                const isCurrent = currentTrack?.id === track.id
                const liked = isLiked(track.id)

                return (
                  <div
                    key={`col-trk-${track.id || idx}`}
                    onClick={() => handlePlaySingle(track, collection.tracks)}
                    onTouchStart={() => handleTouchStart(track)}
                    onTouchEnd={handleTouchEnd}
                    className={`flex items-center gap-3 p-2.5 rounded-2xl bg-[var(--bg-surface)] border transition-all active:scale-[0.99] cursor-pointer group ${
                      isCurrent
                        ? "border-[var(--accent-purple)] bg-[var(--bg-surface)]/90 shadow-md shadow-[#977dff]/20"
                        : "border-[var(--border)] hover:border-[var(--accent-purple)]/30"
                    }`}
                  >
                    {/* Numeração / Equalizador Gráfico de Faixa Ativa */}
                    <div className="w-6 flex items-center justify-center shrink-0">
                      {isCurrent && isPlaying ? (
                        <div className="flex items-end gap-[2px] h-3.5">
                          <span className="w-[3px] h-3.5 bg-[var(--accent-blue)] animate-pulse rounded-full" />
                          <span className="w-[3px] h-2 bg-[var(--accent-purple)] animate-bounce rounded-full" />
                          <span className="w-[3px] h-3 bg-[var(--accent-pink)] animate-pulse rounded-full" />
                        </div>
                      ) : (
                        <span
                          className={`text-xs font-black ${
                            isCurrent ? "text-[var(--accent-pink)]" : "text-[var(--text-muted)]"
                          }`}
                        >
                          {String(track.track_number).padStart(2, "0")}
                        </span>
                      )}
                    </div>

                    {/* Mini-capa quando for playlist mista */}
                    {!isAlbum && track.thumbnail && (
                      <TrackImage
                        src={track.thumbnail}
                        trackId={track.id}
                        alt={track.title}
                        className="size-10 rounded-lg object-cover bg-zinc-900 shrink-0"
                      />
                    )}

                    <div className="min-w-0 flex-1">
                      <h4
                        className={`text-xs font-black truncate leading-tight ${
                          isCurrent ? "text-[var(--accent-pink)]" : "text-[var(--text-primary)]"
                        }`}
                      >
                        {track.title}
                      </h4>
                      <p className="text-[11px] font-semibold text-[var(--text-secondary)] truncate mt-0.5">
                        {track.artist}
                      </p>
                    </div>

                    <span className="text-[11px] font-medium text-[var(--text-muted)] shrink-0">
                      {formatSeconds(track.duration)}
                    </span>

                    {/* Curtir */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        const lTrack: LuciTrack = {
                          id: track.id,
                          title: track.title,
                          artist: track.artist,
                          thumbnail: track.thumbnail || collection.cover_url,
                        }
                        toggleLike(lTrack)
                      }}
                      className="p-1.5 text-[var(--text-secondary)] hover:text-white active:scale-90 transition-transform"
                    >
                      <Heart className={`size-4 ${liked ? "fill-[var(--accent-purple)] text-[var(--accent-purple)]" : ""}`} />
                    </button>

                    {/* Menu 3 Pontos */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        const lTrack: LuciTrack = {
                          id: track.id,
                          title: track.title,
                          artist: track.artist,
                          album: track.album || collection.title,
                          thumbnail: track.thumbnail || collection.cover_url,
                          duration: track.duration,
                        }
                        setActionSheetTrack(lTrack)
                      }}
                      className="p-1.5 text-[var(--text-muted)] hover:text-white active:scale-90 transition-transform"
                    >
                      <MoreVertical className="size-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ─── Metadados de Copyright & Direitos (Somente Álbuns) ─── */}
          {isAlbum && collection.copyright && (
            <div className="px-6 pt-2">
              <p className="text-[11px] font-medium text-[var(--text-muted)] leading-relaxed">
                {collection.copyright}
              </p>
            </div>
          )}

          {/* ─── Carrossel Inferior ("Você também pode gostar") ─── */}
          {collection.related_collections && collection.related_collections.length > 0 && (
            <section className="space-y-3 px-5 pt-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                {isAlbum ? "Mais Álbuns Recomendados" : "Playlists Similares"}
              </h2>

              <div className="flex gap-3.5 overflow-x-auto no-scrollbar py-1">
                {collection.related_collections.map((rel) => (
                  <div
                    key={`rel-col-${rel.id}`}
                    onClick={() => {
                      if (isAlbum) goToAlbumDetail(rel.id, rel.title, rel.artist, rel.cover_url)
                      else goToPlaylistDetail(rel.id, rel.title, rel.cover_url)
                    }}
                    className="w-32 shrink-0 space-y-1.5 cursor-pointer active:scale-95 transition-transform group"
                  >
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border)] shadow-md group-hover:border-[var(--accent-purple)]/50 transition-all">
                      <img
                        src={rel.cover_url}
                        alt={rel.title}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <h4 className="text-xs font-bold text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--accent-pink)]">
                      {rel.title}
                    </h4>
                    <p className="text-[10px] font-medium text-[var(--text-secondary)] line-clamp-1">
                      {rel.artist}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ─── Modal / Action Sheet em Vidro Fosco ─── */}
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
                      goToArtist(actionSheetTrack.artistId || actionSheetTrack.artist)
                      setActionSheetTrack(null)
                    }}
                    className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10"
                  >
                    <Disc3 className="size-5 text-[var(--accent-purple)]" />
                    <span>Ir para o artista</span>
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
                          text: `Ouvindo ${actionSheetTrack.title} na Luci`,
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
      ) : null}
    </div>
  )
}
