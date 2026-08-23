"use client"

import { useState, useEffect } from "react"
import {
  ChevronLeft,
  Heart,
  Plus,
  Play,
  ListMusic,
  Clock,
  Music,
  Trash2,
  FolderPlus,
  Sparkles,
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
} from "@/lib/lucimusic"

export function LibraryScreen() {
  const { pop } = useMusicNavigation()
  const { playTrack, currentTrack, isPlaying } = useMusicPlayer()

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

  return (
    <div className="flex h-full flex-col bg-[#F8FAFC] text-zinc-900 animate-view-in select-none">
      {/* ─── Header Biblioteca (Light Mode) ─── */}
      <header className="px-6 pt-5 pb-3 bg-white border-b border-zinc-200/60 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={pop}
              className="size-10 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-700 active:scale-95 transition-transform"
              aria-label="Voltar"
            >
              <ChevronLeft className="size-5" />
            </button>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight font-sans">
              Central de Memória
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="size-10 flex items-center justify-center rounded-full bg-[#22C55E] text-white shadow-md active:scale-95 transition-transform"
            aria-label="Nova Playlist"
          >
            <Plus className="size-5" />
          </button>
        </div>

        {/* Abas Superiores */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("songs")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "songs"
                ? "bg-zinc-900 text-white shadow-sm"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Músicas Curtidas ({likedSongs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("playlists")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "playlists"
                ? "bg-zinc-900 text-white shadow-sm"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Playlists ({playlists.length})
          </button>
        </div>
      </header>

      {/* ─── Conteúdo da Biblioteca ─── */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 pb-28 no-scrollbar">
        {activeTab === "songs" ? (
          /* Lista de Músicas Curtidas */
          likedSongs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
              <Heart className="size-12 stroke-[1.5]" />
              <p className="text-sm font-medium">Nenhuma música curtida ainda.</p>
              <p className="text-xs text-zinc-400 text-center max-w-xs">
                Toque no coração de qualquer faixa para salvar na sua biblioteca.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {likedSongs.map((track) => {
                const isThisPlaying = currentTrack?.id === track.id && isPlaying
                return (
                  <div
                    key={track.id}
                    onClick={() => playTrack(track, likedSongs)}
                    className="flex items-center gap-3.5 p-2 bg-white rounded-2xl border border-zinc-200/60 shadow-sm hover:border-zinc-300 transition-all cursor-pointer group"
                  >
                    <TrackImage
                      src={track.thumbnail}
                      trackId={track.id}
                      alt={track.title}
                      className="size-13 rounded-xl object-cover bg-zinc-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0 pr-2">
                      <p className={`text-sm font-bold truncate ${isThisPlaying ? "text-[#22C55E]" : "text-zinc-900"}`}>
                        {track.title}
                      </p>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">
                        {track.artist}
                      </p>
                    </div>
                    <div className="size-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 group-hover:bg-[#22C55E] group-hover:text-white transition-colors">
                      <Play className="size-3.5 fill-current ml-0.5" />
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ) : (
          /* Lista de Playlists */
          playlists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
              <FolderPlus className="size-12 stroke-[1.5]" />
              <p className="text-sm font-medium">Nenhuma playlist criada.</p>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="px-4 py-2 rounded-xl bg-[#22C55E] text-white text-xs font-bold shadow-md"
              >
                Criar Primeira Playlist
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  className="p-4 rounded-2xl bg-white border border-zinc-200/60 shadow-sm flex flex-col justify-between h-36 cursor-pointer hover:border-zinc-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="p-2 rounded-xl bg-zinc-100 text-zinc-700">
                      <ListMusic className="size-5" />
                    </span>
                    {pl.is_ai_generated ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded-full">
                        <Sparkles className="size-3" /> IA
                      </span>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 truncate">
                      {pl.title}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {pl.track_count || 0} faixas
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Modal Criar Playlist */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-5 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-zinc-200 space-y-4">
            <h3 className="text-lg font-bold text-zinc-900">Nova Playlist</h3>
            <input
              type="text"
              placeholder="Nome da Playlist (ex: Foco, Churrasco)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-100 rounded-2xl text-sm outline-none text-zinc-900 border border-zinc-200 focus:border-[#22C55E]"
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 bg-zinc-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreatePlaylist}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#22C55E] shadow-md active:scale-95"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
