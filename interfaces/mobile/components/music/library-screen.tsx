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
    <div className="flex h-full flex-col bg-[#0b0c10] text-white animate-view-in select-none">
      {/* ─── Header SimpMusic Library ─── */}
      <header className="px-5 pt-4 pb-2 bg-[#0b0c10] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={pop}
              className="p-1 text-zinc-300 hover:text-white transition-colors"
              aria-label="Voltar"
            >
              <ChevronLeft className="size-6" />
            </button>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Library
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex size-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
            aria-label="New Playlist"
          >
            <Plus className="size-5" />
          </button>
        </div>

        {/* ─── Chips Material You SimpMusic ─── */}
        <div className="flex items-center gap-2">
          {[
            { id: "songs", label: "Songs" },
            { id: "playlists", label: "Playlists" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-white text-black shadow-sm"
                  : "bg-white/10 text-zinc-300 hover:bg-white/15"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ─── Conteúdo ─── */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4 pb-28 no-scrollbar">
        {activeTab === "songs" ? (
          <>
            {/* Card de Músicas Curtidas Especial (SimpMusic Favorite Gradient Card) */}
            <div
              onClick={() => likedSongs.length > 0 && playTrack(likedSongs[0], likedSongs)}
              className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-[#4b2f8a] via-[#311f63] to-[#1e1342] border border-white/10 shadow-xl cursor-pointer active:scale-98 transition-transform group"
            >
              <div className="flex justify-between items-start">
                <div className="size-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center">
                  <Heart className="size-6 fill-white text-white" />
                </div>
                <div className="size-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Play className="size-5 fill-black ml-0.5" />
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-xl font-bold text-white tracking-tight">Favorite Songs</h3>
                <p className="text-xs text-white/70 mt-1 font-medium">
                  {likedSongs.length} songs
                </p>
              </div>
            </div>

            {/* Lista de Faixas */}
            <div className="space-y-1.5 pt-2">
              {likedSongs.map((track) => (
                <div
                  key={track.id}
                  onClick={() => playTrack(track, likedSongs)}
                  className="flex items-center gap-3.5 p-1.5 rounded-xl hover:bg-white/[0.06] transition-all cursor-pointer group"
                >
                  <TrackImage
                    src={track.thumbnail}
                    trackId={track.id}
                    alt={track.title}
                    className="size-12 rounded-xl object-cover bg-zinc-800 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${
                      currentTrack?.id === track.id ? "text-indigo-400" : "text-white"
                    }`}>
                      {track.title}
                    </p>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">{track.artist}</p>
                  </div>
                  <span className="text-xs text-zinc-400 font-mono pr-2">{track.durationFormatted}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Playlists */
          <div className="space-y-2">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                className="flex items-center gap-3.5 p-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] transition-all cursor-pointer"
              >
                <div className="size-13 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
                  {pl.thumbnail ? (
                    <TrackImage src={pl.thumbnail} alt={pl.title} className="size-full object-cover" />
                  ) : (
                    <ListMusic className="size-6 text-zinc-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{pl.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{pl.tracks?.length || 0} songs</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Criar Playlist */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-5 animate-view-in">
          <div className="w-full max-w-xs rounded-3xl bg-[#181820] border border-white/10 p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">New Playlist</h3>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Playlist title"
              className="w-full h-11 px-4 rounded-xl bg-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-white"
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreatePlaylist}
                className="px-5 py-2 rounded-full bg-white text-black text-xs font-bold shadow-md active:scale-95"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
