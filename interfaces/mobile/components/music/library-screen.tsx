"use client"

import { useState, useEffect } from "react"
import {
  Heart,
  Plus,
  Play,
  ListMusic,
  Clock,
  Music,
  Trash2,
  FolderPlus,
  Sparkles,
  Users,
  Disc,
  Shuffle,
  Loader2,
  X,
  Check,
} from "lucide-react"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { TrackImage } from "./track-image"
import {
  fetchLikedTracks,
  fetchPlaylists,
  createPlaylist,
  type LuciTrack,
  type UserPlaylist,
  type ArtistDetails,
  formatSeconds,
} from "@/lib/lucimusic"

export function LibraryScreen() {
  const { pop, goToPlaylistDetail, goToArtist } = useMusicNavigation()
  const { playTrack, currentTrack, isPlaying, togglePlay } = useMusicPlayer()

  const [likedSongs, setLikedSongs] = useState<LuciTrack[]>([])
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"songs" | "playlists">("songs")
  const [showModal, setShowModal] = useState(false)
  const [newTitle, setNewTitle] = useState("")

  const loadData = () => {
    setLoading(true)
    Promise.all([fetchLikedTracks(), fetchPlaylists()])
      .then(([liked, pl]) => {
        setLikedSongs(liked)
        setPlaylists(pl)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreatePlaylist = async () => {
    if (!newTitle.trim()) return
    try {
      await createPlaylist(newTitle.trim())
      setNewTitle("")
      setShowModal(false)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const handlePlayAllLiked = () => {
    if (likedSongs.length > 0) {
      playTrack(likedSongs[0], likedSongs)
    }
  }

  const handleShuffleLiked = () => {
    if (likedSongs.length > 0) {
      const shuffled = [...likedSongs].sort(() => Math.random() - 0.5)
      playTrack(shuffled[0], shuffled)
    }
  }

  return (
    <div className="relative flex h-full flex-col bg-[var(--bg-app)] text-[var(--text-primary)] select-none overflow-y-auto pb-32">
      {/* Header Superior */}
      <header className="sticky top-0 z-20 px-6 pt-5 pb-3 bg-[var(--bg-surface-glass)] backdrop-blur-2xl border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-white">Sua Biblioteca</h1>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--accent-blue)] text-white text-xs font-bold shadow-md active:scale-95 transition-all"
          >
            <Plus className="size-4" />
            <span>Criar</span>
          </button>
        </div>

        {/* Tabs de Filtro */}
        <div className="flex items-center gap-2 mt-4">
          <button
            type="button"
            onClick={() => setActiveTab("songs")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
              activeTab === "songs"
                ? "bg-[var(--accent-blue)] text-white shadow-md shadow-[#0033ff]/30"
                : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-white border border-[var(--border)]"
            }`}
          >
            Músicas Curtidas ({likedSongs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("playlists")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
              activeTab === "playlists"
                ? "bg-[var(--accent-blue)] text-white shadow-md shadow-[#0033ff]/30"
                : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-white border border-[var(--border)]"
            }`}
          >
            Playlists ({playlists.length})
          </button>
        </div>
      </header>

      {/* Conteúdo da Biblioteca */}
      <div className="p-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-36 gap-3 text-[var(--text-secondary)]">
            <Loader2 className="size-8 animate-spin text-[var(--accent-purple)]" />
            <p className="text-xs font-bold">Carregando biblioteca...</p>
          </div>
        ) : activeTab === "songs" ? (
          <div className="space-y-4">
            {/* Banner de Ações Rápidas para Músicas Curtidas */}
            {likedSongs.length > 0 && (
              <div className="flex items-center justify-between p-4 rounded-3xl bg-gradient-to-r from-[#0033ff] to-[#977dff] text-white shadow-xl shadow-[#0033ff]/20">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Heart className="size-6 fill-white text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Músicas Favoritas</h3>
                    <p className="text-xs text-white/80">{likedSongs.length} faixas salvas</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShuffleLiked}
                    aria-label="Aleatório"
                    className="size-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform"
                  >
                    <Shuffle className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handlePlayAllLiked}
                    aria-label="Tocar Tudo"
                    className="size-11 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                  >
                    <Play className="size-5 fill-black translate-x-0.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Lista de Faixas Curtidas */}
            {likedSongs.length > 0 ? (
              <div className="space-y-2">
                {likedSongs.map((track, idx) => {
                  const isCurrent = currentTrack?.id === track.id
                  return (
                    <div
                      key={`liked-${track.id}-${idx}`}
                      onClick={() => playTrack(track, likedSongs)}
                      className={`flex items-center gap-3 p-2.5 rounded-2xl bg-[var(--bg-surface)] border transition-all active:scale-[0.99] cursor-pointer ${
                        isCurrent
                          ? "border-[var(--accent-purple)] shadow-md"
                          : "border-[var(--border)] hover:border-[var(--accent-purple)]/40"
                      }`}
                    >
                      <TrackImage
                        src={track.thumbnail}
                        trackId={track.id}
                        alt={track.title}
                        className="size-12 rounded-xl object-cover bg-zinc-900 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className={`text-xs font-black truncate ${isCurrent ? "text-[var(--accent-pink)]" : "text-white"}`}>
                          {track.title}
                        </h4>
                        <p className="text-[11px] font-semibold text-[var(--text-secondary)] truncate">
                          {track.artist}
                        </p>
                      </div>
                      <Heart className="size-4 fill-[var(--accent-purple)] text-[var(--accent-purple)] shrink-0" />
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center text-[var(--text-muted)] space-y-2">
                <Heart className="size-12 text-[var(--accent-purple)]/40" />
                <p className="text-sm font-bold text-white">Nenhuma música favoritada</p>
                <p className="text-xs">Toque no ícone de coração em qualquer música para salvar aqui.</p>
              </div>
            )}
          </div>
        ) : (
          /* Grid de Playlists */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3.5">
              {playlists.map((pl) => (
                <div
                  key={`pl-${pl.id}`}
                  onClick={() => goToPlaylistDetail(pl.id, pl.title, pl.thumbnail)}
                  className="space-y-2 p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--accent-purple)]/40 cursor-pointer active:scale-95 transition-all shadow-md group"
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-900 flex items-center justify-center">
                    {pl.thumbnail ? (
                      <img src={pl.thumbnail} alt={pl.title} className="size-full object-cover" />
                    ) : (
                      <ListMusic className="size-10 text-[var(--accent-purple)]" />
                    )}
                  </div>
                  <h4 className="text-xs font-black text-white truncate group-hover:text-[var(--accent-pink)]">
                    {pl.title}
                  </h4>
                  <p className="text-[10px] font-medium text-[var(--text-secondary)]">
                    {pl.track_count || 0} faixas
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Criar Playlist */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/80 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[380px] rounded-3xl bg-[var(--bg-surface)] border border-[var(--border)] p-6 space-y-4 shadow-2xl animate-scale-up"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-black text-white">Criar Nova Playlist</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-xs font-bold text-[var(--text-secondary)] hover:text-white"
              >
                Cancelar
              </button>
            </div>

            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Nome da Playlist"
              className="w-full h-11 px-4 rounded-xl bg-black/40 border border-[var(--border)] text-xs font-semibold text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-purple)]"
              autoFocus
            />

            <button
              type="button"
              onClick={handleCreatePlaylist}
              className="w-full py-2.5 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-black shadow-lg active:scale-95 transition-transform"
            >
              Salvar Playlist
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
