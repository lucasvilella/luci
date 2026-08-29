"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import {
  Heart,
  Plus,
  Play,
  Shuffle,
  LayoutGrid,
  List,
  Disc3,
  ListMusic,
  FolderPlus,
  Sparkles,
  Download,
  Check,
  MoreVertical,
  Loader2,
  X,
  Share2,
  ListPlus,
  FileText,
  Disc,
} from "lucide-react"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { TrackImage } from "./track-image"
import {
  fetchLibrarySummary,
  createPlaylist,
  type LibrarySummary,
  type LuciTrack,
  formatSeconds,
  recordTrackEvent,
} from "@/lib/lucimusic"

type LibraryFilter = "all" | "playlists" | "tracks" | "albums" | "artists" | "downloads"
type ViewMode = "list" | "grid"

export function LibraryScreen() {
  const { pop, goToPlaylistDetail, goToAlbumDetail, goToArtist, goToLyrics } = useMusicNavigation()
  const { playTrack, currentTrack, isPlaying, togglePlay, toggleLike, isLiked, addToQueue } = useMusicPlayer()

  const [data, setData] = useState<LibrarySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<LibraryFilter>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("list")

  // Modal Criar Playlist (Manual vs IA Inteligente)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isSmartAi, setIsSmartAi] = useState(false)
  const [playlistTitle, setPlaylistTitle] = useState("")
  const [aiPrompt, setAiPrompt] = useState("")
  const [creating, setCreating] = useState(false)

  // Action Sheet
  const [actionSheetTrack, setActionSheetTrack] = useState<LuciTrack | null>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)

  const loadData = () => {
    setLoading(true)
    fetchLibrarySummary(filter, viewMode)
      .then((res) => setData(res))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [filter, viewMode])

  const handleCreatePlaylist = async () => {
    if (!playlistTitle.trim()) return
    setCreating(true)
    try {
      await createPlaylist(
        playlistTitle.trim(),
        isSmartAi ? "Criada pela Inteligência da Luci" : "",
        isSmartAi,
        aiPrompt.trim()
      )
      setPlaylistTitle("")
      setAiPrompt("")
      setIsSmartAi(false)
      setShowCreateModal(false)
      loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  // Shuffle de toda a biblioteca (Mistura curtidas e faixas locais)
  const handleShuffleLibrary = () => {
    if (!data || data.tracks.length === 0) return
    const shuffled = [...data.tracks].sort(() => Math.random() - 0.5)
    playTrack(shuffled[0], shuffled)
  }

  // Tocar todas as mais queridas
  const handlePlayLiked = () => {
    if (!data || data.tracks.length === 0) return
    playTrack(data.tracks[0], data.tracks)
  }

  const handlePlaySingle = (track: LuciTrack, allTracks: LuciTrack[]) => {
    playTrack(track, allTracks)
    recordTrackEvent({
      track_id: track.id,
      played_seconds: 1,
      total_seconds: track.duration || 180,
      context_mood: "library",
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

  const FILTERS: { id: LibraryFilter; label: string }[] = [
    { id: "all", label: "Tudo" },
    { id: "playlists", label: "Playlists" },
    { id: "tracks", label: "Músicas" },
    { id: "albums", label: "Álbuns" },
    { id: "artists", label: "Artistas" },
    { id: "downloads", label: "⬇ Baixadas" },
  ]

  return (
    <div className="relative flex h-full flex-col bg-[var(--bg-app)] text-[var(--text-primary)] select-none overflow-y-auto pb-32">
      {/* ─── A. Header Principal da Biblioteca ─── */}
      <header className="sticky top-0 z-20 px-5 pt-5 pb-3 bg-[var(--bg-surface-glass)] backdrop-blur-2xl border-b border-[var(--border)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-gradient-to-tr from-[#0033ff] to-[#977dff] p-[2px] shadow-md">
              <div className="size-full rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-[10px] font-black text-white">
                LV
              </div>
            </div>
            <h1 className="text-xl font-black text-white">Sua Biblioteca</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Criar Nova */}
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              aria-label="Criar Playlist"
              className="size-9 flex items-center justify-center rounded-full bg-[var(--accent-blue)] text-white shadow-md active:scale-90 transition-transform"
            >
              <Plus className="size-4.5" />
            </button>

            {/* Alternador de Visualização List / Grid */}
            <button
              type="button"
              onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
              aria-label="Alternar Visualização"
              className="size-9 flex items-center justify-center rounded-full bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white active:scale-90 transition-all shadow-md"
            >
              {viewMode === "list" ? <LayoutGrid className="size-4" /> : <List className="size-4" />}
            </button>

            {/* Shuffle Geral da Biblioteca */}
            <button
              type="button"
              onClick={handleShuffleLibrary}
              aria-label="Shuffle Geral"
              className="size-9 flex items-center justify-center rounded-full bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white active:scale-90 transition-all shadow-md"
            >
              <Shuffle className="size-4" />
            </button>
          </div>
        </div>

        {/* ─── B. Barra de Filtros (Horizontal Pills) ─── */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {FILTERS.map((f) => {
            const isActive = filter === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                  isActive
                    ? "bg-[var(--accent-blue)] text-white shadow-md shadow-[#0033ff]/30"
                    : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-white border border-[var(--border)]"
                }`}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      </header>

      {/* ─── CONTEÚDO PRINCIPAL ─── */}
      <div className="p-5 space-y-6">
        {loading && !data ? (
          <div className="flex flex-col items-center justify-center py-36 gap-3 text-[var(--text-secondary)]">
            <Loader2 className="size-8 animate-spin text-[var(--accent-purple)]" />
            <p className="text-xs font-bold">Carregando coleções...</p>
          </div>
        ) : data ? (
          <>
            {/* ─── 1. CARD HERO: "MAIS QUERIDAS / CURTIDAS" (Destaque Fixo) ─── */}
            {(filter === "all" || filter === "tracks") && data.liked_summary.total_tracks > 0 && (
              <section className="space-y-3">
                <div
                  onClick={() => goToPlaylistDetail("liked_songs", "Músicas Curtidas", data.liked_summary.preview_tracks[0]?.cover)}
                  className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-[#0600ab] to-[#977dff] text-white shadow-xl shadow-[#0033ff]/20 cursor-pointer active:scale-[0.99] transition-transform flex items-center justify-between"
                >
                  <div className="space-y-1.5 z-10 max-w-[70%]">
                    <div className="flex items-center gap-2">
                      <Heart className="size-5 fill-[var(--accent-pink)] text-[var(--accent-pink)]" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-[var(--accent-pink)]">
                        Coleção Principal
                      </span>
                    </div>
                    <h2 className="text-lg font-black text-white leading-tight">
                      Músicas Curtidas
                    </h2>
                    <p className="text-xs font-semibold text-white/80">
                      {data.liked_summary.total_tracks} faixas favoritadas
                    </p>
                  </div>

                  {/* Botão Play Direto */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlayLiked()
                    }}
                    className="size-13 rounded-full bg-white text-black flex items-center justify-center shadow-2xl active:scale-90 transition-transform z-10"
                  >
                    <Play className="size-6 fill-black translate-x-0.5" />
                  </button>

                  <div className="absolute -right-6 -bottom-6 size-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
                </div>

                {/* 3 Últimas Músicas Favoritadas (Acesso Rápido) */}
                {data.liked_summary.preview_tracks.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {data.liked_summary.preview_tracks.map((preview) => {
                      const fullTrack: LuciTrack = {
                        id: preview.id,
                        title: preview.title,
                        artist: preview.artist,
                        thumbnail: preview.cover,
                      }
                      const isCurrent = currentTrack?.id === preview.id

                      return (
                        <div
                          key={`prev-${preview.id}`}
                          onClick={() => handlePlaySingle(fullTrack, data.tracks)}
                          onTouchStart={() => handleTouchStart(fullTrack)}
                          onTouchEnd={handleTouchEnd}
                          className={`flex items-center gap-3 p-2 rounded-2xl bg-[var(--bg-surface)] border transition-all active:scale-[0.99] cursor-pointer ${
                            isCurrent
                              ? "border-[var(--accent-purple)] shadow-md"
                              : "border-[var(--border)] hover:border-[var(--accent-purple)]/30"
                          }`}
                        >
                          <TrackImage
                            src={preview.cover}
                            trackId={preview.id}
                            alt={preview.title}
                            className="size-11 rounded-xl object-cover bg-zinc-900 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className={`text-xs font-black truncate ${isCurrent ? "text-[var(--accent-pink)]" : "text-white"}`}>
                              {preview.title}
                            </h4>
                            <p className="text-[11px] font-semibold text-[var(--text-secondary)] truncate">
                              {preview.artist}
                            </p>
                          </div>
                          <Heart className="size-4 fill-[var(--accent-purple)] text-[var(--accent-purple)] shrink-0 mr-2" />
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            )}

            {/* ─── 2. SEÇÃO DE PLAYLISTS ─── */}
            {(filter === "all" || filter === "playlists") && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                    Playlists ({data.playlists.length})
                  </h2>
                </div>

                <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3.5" : "space-y-2"}>
                  {/* Card Criar Nova Playlist (+) */}
                  <div
                    onClick={() => setShowCreateModal(true)}
                    className={`flex items-center justify-center border border-dashed border-[var(--accent-purple)]/50 rounded-2xl p-4 text-[var(--text-secondary)] hover:text-white cursor-pointer active:scale-95 transition-all ${
                      viewMode === "grid" ? "aspect-square flex-col gap-2" : "gap-3"
                    }`}
                  >
                    <FolderPlus className="size-6 text-[var(--accent-pink)]" />
                    <span className="text-xs font-bold text-[var(--accent-pink)]">Criar Playlist</span>
                  </div>

                  {data.playlists.map((pl) => (
                    <div
                      key={`pl-${pl.id}`}
                      onClick={() => goToPlaylistDetail(pl.id, pl.title, pl.thumbnail)}
                      className={`p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--accent-purple)]/40 cursor-pointer active:scale-95 transition-all shadow-md group ${
                        viewMode === "grid" ? "space-y-2" : "flex items-center gap-3.5"
                      }`}
                    >
                      <div
                        className={`rounded-xl overflow-hidden bg-zinc-900 flex items-center justify-center shrink-0 ${
                          viewMode === "grid" ? "relative aspect-square w-full" : "size-13"
                        }`}
                      >
                        {pl.thumbnail ? (
                          <img src={pl.thumbnail} alt={pl.title} className="size-full object-cover" />
                        ) : (
                          <ListMusic className="size-6 text-[var(--accent-purple)]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-black text-white truncate group-hover:text-[var(--accent-pink)]">
                          {pl.title}
                        </h4>
                        <p className="text-[10px] font-medium text-[var(--text-secondary)] truncate">
                          {pl.author || "Você"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ─── 3. SEÇÃO DE ARTISTAS SEGUIDOS ─── */}
            {(filter === "all" || filter === "artists") && data.artists.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                  Artistas Seguidos ({data.artists.length})
                </h2>

                <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3.5" : "space-y-2"}>
                  {data.artists.map((art) => (
                    <div
                      key={`art-${art.id}`}
                      onClick={() => goToArtist(art.id || art.name)}
                      className={`p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--accent-purple)]/40 cursor-pointer active:scale-95 transition-all shadow-md group ${
                        viewMode === "grid" ? "flex flex-col items-center text-center space-y-2" : "flex items-center gap-3.5"
                      }`}
                    >
                      <img
                        src={art.avatar || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200"}
                        alt={art.name}
                        className="size-14 rounded-full object-cover bg-zinc-900 shadow-sm"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-black text-white truncate group-hover:text-[var(--accent-pink)]">
                          {art.name}
                        </h4>
                        <p className="text-[10px] font-medium text-[var(--text-secondary)]">
                          Artista Seguido
                        </p>
                      </div>
                      <Heart className="size-4 fill-[var(--accent-purple)] text-[var(--accent-purple)] shrink-0" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ─── 4. SEÇÃO DE ÁLBUNS SALVOS ─── */}
            {(filter === "all" || filter === "albums") && data.albums.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                  Álbuns Salvos ({data.albums.length})
                </h2>

                <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3.5" : "space-y-2"}>
                  {data.albums.map((alb) => (
                    <div
                      key={`alb-${alb.id}`}
                      onClick={() => goToAlbumDetail(alb.id, alb.title, alb.artist, alb.cover)}
                      className={`p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--accent-purple)]/40 cursor-pointer active:scale-95 transition-all shadow-md group ${
                        viewMode === "grid" ? "space-y-2" : "flex items-center gap-3.5"
                      }`}
                    >
                      <img
                        src={alb.cover}
                        alt={alb.title}
                        className={`rounded-xl object-cover bg-zinc-900 shadow-sm shrink-0 ${
                          viewMode === "grid" ? "aspect-square w-full" : "size-13"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-black text-white truncate group-hover:text-[var(--accent-pink)]">
                          {alb.title}
                        </h4>
                        <p className="text-[10px] font-medium text-[var(--text-secondary)] truncate">
                          {alb.artist}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ─── 5. SEÇÃO DE BAIXADAS (OFFLINE) ─── */}
            {filter === "downloads" && (
              <div className="flex flex-col items-center justify-center py-24 text-center text-[var(--text-muted)] space-y-2">
                <Download className="size-12 text-[var(--accent-purple)]/40" />
                <h3 className="text-sm font-bold text-white">Nenhum download armazenado</h3>
                <p className="text-xs max-w-xs">
                  Suas faixas salvas para reprodução sem internet aparecerão aqui.
                </p>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* ─── MODAL: CRIAR PLAYLIST (MANUAL OU SMART AI) ─── */}
      {showCreateModal && (
        <div
          onClick={() => setShowCreateModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/80 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] rounded-3xl bg-[var(--bg-surface)] border border-[var(--border)] p-6 space-y-5 shadow-2xl animate-scale-up"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black text-white">Nova Playlist</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-xs font-bold text-[var(--text-secondary)] hover:text-white"
              >
                Cancelar
              </button>
            </div>

            {/* Alternador de Modo: Manual vs IA */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-black/40 border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setIsSmartAi(false)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  !isSmartAi ? "bg-[var(--accent-blue)] text-white shadow-md" : "text-[var(--text-secondary)] hover:text-white"
                }`}
              >
                Manual
              </button>
              <button
                type="button"
                onClick={() => setIsSmartAi(true)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isSmartAi ? "bg-gradient-to-r from-[#0033ff] to-[#977dff] text-white shadow-md" : "text-[var(--text-secondary)] hover:text-white"
                }`}
              >
                <Sparkles className="size-3.5 text-[var(--accent-pink)]" />
                <span>Smart IA</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[var(--text-secondary)] mb-1 block">
                  Nome da Playlist
                </label>
                <input
                  type="text"
                  value={playlistTitle}
                  onChange={(e) => setPlaylistTitle(e.target.value)}
                  placeholder="Ex: Treino Pesado 2026"
                  className="w-full h-11 px-4 rounded-xl bg-black/40 border border-[var(--border)] text-xs font-semibold text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-purple)]"
                />
              </div>

              {isSmartAi && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[var(--accent-pink)] flex items-center gap-1">
                    <Sparkles className="size-3" />
                    Prompt para a Luci
                  </label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Ex: Crie uma playlist de 20 faixas de pop rock e eletrônica para foco profundo..."
                    rows={3}
                    className="w-full p-3 rounded-xl bg-black/40 border border-[var(--border)] text-xs font-semibold text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-purple)] resize-none"
                  />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleCreatePlaylist}
              disabled={creating || !playlistTitle.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0033ff] to-[#977dff] text-white text-xs font-black shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isSmartAi ? (
                <>
                  <Sparkles className="size-4 text-[var(--accent-pink)]" />
                  <span>Gerar com Inteligência</span>
                </>
              ) : (
                <span>Salvar Playlist</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ─── ACTION SHEET DE FAIXA ─── */}
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
                <span>Ver letra</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  toggleLike(actionSheetTrack)
                  setActionSheetTrack(null)
                  loadData()
                }}
                className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10"
              >
                <Heart className={`size-5 ${isLiked(actionSheetTrack.id) ? "fill-[var(--accent-purple)] text-[var(--accent-purple)]" : "text-[var(--accent-purple)]"}`} />
                <span>{isLiked(actionSheetTrack.id) ? "Remover das curtidas" : "Curtir música"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: actionSheetTrack.title,
                      text: `Ouvindo ${actionSheetTrack.title} na biblioteca da Luci`,
                      url: window.location.href,
                    })
                  }
                  setActionSheetTrack(null)
                }}
                className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10"
              >
                <Share2 className="size-5 text-[var(--accent-purple)]" />
                <span>Compartilhar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
