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
import { EditPlaylistModal } from "./edit-playlist-modal"

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
  const [showEditModal, setShowEditModal] = useState(false)

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
          {!isAlbum && (
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] text-xs font-bold text-[var(--accent-purple)] hover:text-white active:scale-90 transition-all shadow-md"
            >
              Editar
            </button>
          )}
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
          {/* ─── Hero Header (Clean Style) ─── */}
          <div className="w-full flex flex-col items-center pt-8 pb-4 px-6 text-center">
            {/* Capa com Sombra Soft-UI */}
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-[28px] overflow-hidden shadow-[var(--shadow-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] mb-5">
              <img
                src={collection.cover_url || initialThumbnail || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500"}
                alt={collection.title}
                className="size-full object-cover"
              />
              {/* Badge Contextual */}
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded-full bg-[var(--bg-surface-1)]/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-[var(--accent-primary)] border border-[var(--border-subtle)] shadow-sm">
                  {isAlbum ? "Álbum Oficial" : collection.is_smart_ai ? "Curadoria Luci" : "Playlist"}
                </span>
              </div>
            </div>

            {/* Metadados */}
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] leading-snug max-w-sm">
              {collection.title}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 font-medium">
              {isAlbum ? (
                <button
                  type="button"
                  onClick={() => goToArtist(collection.artist_id || collection.artist)}
                  className="hover:text-[var(--text-primary)] transition-colors underline-offset-2 hover:underline"
                >
                  {collection.artist}
                </button>
              ) : (
                collection.artist
              )}{" "}
              • {collection.total_tracks} faixas ({collection.total_duration})
            </p>

            {/* Botões de Ação Principais (Clean Style) */}
            <div className="flex items-center justify-center space-x-3 mt-6">
              <button
                type="button"
                onClick={handlePlayAll}
                className="flex items-center space-x-2 px-6 py-3 rounded-full bg-[var(--accent-primary)] text-white font-semibold text-sm shadow-[0_6px_20px_var(--accent-glow)] active:scale-95 transition-transform"
              >
                <Play fill="currentColor" size={18} />
                <span>Reproduzir</span>
              </button>

              <button
                type="button"
                onClick={handleShufflePlay}
                aria-label="Tocar Aleatório"
                className="p-3 rounded-full bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] active:scale-95 transition-all shadow-sm"
              >
                <Shuffle size={18} />
              </button>

              <button
                type="button"
                onClick={handleToggleFavorite}
                aria-label="Favoritar"
                className={`p-3 rounded-full bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] active:scale-95 transition-all shadow-sm ${
                  isSaved ? "text-[var(--accent-primary)]" : "text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]"
                }`}
              >
                <Heart fill={isSaved ? "currentColor" : "none"} size={18} />
              </button>
            </div>
          </div>

          {/* ─── Tracklist (Clean Style) ─── */}
          <div className="w-full flex flex-col space-y-1.5 px-4 pb-32">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] px-2 mb-1">
              Faixas
            </h2>

            {collection.tracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id
              const liked = isLiked(track.id)

              return (
                <div
                  key={`col-trk-${track.id || idx}`}
                  onClick={() => handlePlaySingle(track, collection.tracks)}
                  onTouchStart={() => handleTouchStart(track)}
                  onTouchEnd={handleTouchEnd}
                  className={`group w-full flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all duration-200 ${
                    isCurrent
                      ? "bg-[var(--accent-surface)] border border-[var(--border-subtle)] shadow-sm"
                      : "hover:bg-[var(--bg-surface-1)] active:scale-[0.99]"
                  }`}
                >
                  {/* Lado Esquerdo: Capa/Número e Nomes */}
                  <div className="flex items-center space-x-3.5 min-w-0 pr-2">
                    {!isAlbum && track.thumbnail ? (
                      <div className="relative size-11 rounded-xl overflow-hidden shrink-0 bg-[var(--bg-surface-2)] border border-[var(--border-subtle)]">
                        <img src={track.thumbnail} alt={track.title} className="size-full object-cover" />
                        {isCurrent && isPlaying && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Volume2 className="text-[var(--accent-primary)] animate-pulse" size={16} />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-7 text-center shrink-0">
                        {isCurrent && isPlaying ? (
                          <Volume2 className="text-[var(--accent-primary)] mx-auto animate-pulse" size={16} />
                        ) : (
                          <span
                            className={`text-xs font-semibold ${
                              isCurrent ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]"
                            }`}
                          >
                            {track.track_number || String(idx + 1).padStart(2, "0")}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col min-w-0">
                      <span
                        className={`text-sm font-semibold truncate ${
                          isCurrent ? "text-[var(--accent-primary)]" : "text-[var(--text-primary)]"
                        }`}
                      >
                        {track.title}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)] truncate">
                        {track.artist}
                      </span>
                    </div>
                  </div>

                  {/* Lado Direito: Duração, Curtida e Menu */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-xs text-[var(--text-muted)] font-medium mr-1 hidden sm:inline">
                      {formatSeconds(track.duration)}
                    </span>

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
                      className={`p-2 rounded-full transition-colors ${
                        liked ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <Heart fill={liked ? "currentColor" : "none"} size={16} />
                    </button>

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
                        setActionSheetTrack(lTrack)
                      }}
                      className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
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

      {/* ─── MODAL DE EDIÇÃO DE PLAYLIST ─── */}
      <EditPlaylistModal
        playlist={
          collection
            ? {
                id: collection.id,
                title: collection.title,
                description: collection.subtitle,
                thumbnail: collection.cover_url,
              }
            : null
        }
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onUpdated={() => {
          fetchCollectionDetails(collectionType, collectionId || "default", initialTitle, initialArtist).then((data) =>
            setCollection(data)
          )
        }}
        onDeleted={() => {
          pop()
        }}
      />
    </div>
  )
}
