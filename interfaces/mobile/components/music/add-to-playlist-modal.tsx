"use client"

import { useState, useRef, useEffect } from "react"
import {
  X,
  Plus,
  Check,
  ListMusic,
  FolderPlus,
  Sparkles,
  Loader2,
  Lock,
} from "lucide-react"
import { useMusicPlayer } from "@/hooks/use-music-player"
import {
  fetchPlaylists,
  addTrackToPlaylistById,
  createPlaylistWithTrack,
  type UserPlaylist,
  type LuciTrack,
} from "@/lib/lucimusic"

interface AddToPlaylistModalProps {
  track: LuciTrack | null
  isOpen: boolean
  onClose: () => void
}

export function AddToPlaylistModal({ track, isOpen, onClose }: AddToPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([])
  const [loading, setLoading] = useState(true)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [addedSuccessId, setAddedSuccessId] = useState<string | null>(null)

  // Criar Nova Playlist inline
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [creating, setCreating] = useState(false)

  const loadUserPlaylists = async () => {
    setLoading(true)
    try {
      const pl = await fetchPlaylists()
      setPlaylists(pl)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadUserPlaylists()
      setIsCreatingNew(false)
      setNewTitle("")
      setAddedSuccessId(null)
    }
  }, [isOpen])

  if (!isOpen || !track) return null

  const handleSelectPlaylist = async (pl: UserPlaylist) => {
    setAddingId(pl.id)
    try {
      // Haptics se disponível
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(35)
      }

      await addTrackToPlaylistById(pl.id, track)
      setAddedSuccessId(pl.id)

      setTimeout(() => {
        setAddedSuccessId(null)
        onClose()
      }, 900)
    } catch (err) {
      console.error(err)
    } finally {
      setAddingId(null)
    }
  }

  const handleCreateAndAdd = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(45)
      }
      const newPl = await createPlaylistWithTrack(newTitle.trim(), track)
      setAddedSuccessId(newPl.id)
      setTimeout(() => {
        onClose()
      }, 900)
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] max-h-[82vh] flex flex-col rounded-t-3xl bg-[var(--bg-surface)] border-t border-[var(--border)] p-6 shadow-2xl animate-slide-up"
      >
        {/* Drag Handle Topo */}
        <div className="w-12 h-1 rounded-full bg-white/20 mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div>
            <h3 className="text-base font-black text-white leading-tight">Adicionar à playlist</h3>
            <p className="text-xs text-[var(--text-secondary)] truncate max-w-[280px]">
              {track.title} • {track.artist}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-full bg-white/10 text-[var(--text-secondary)] hover:text-white active:scale-90 transition-transform"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Formulário Nova Playlist */}
        <div className="pt-4 pb-2">
          {isCreatingNew ? (
            <div className="p-3 rounded-2xl bg-black/40 border border-[var(--accent-purple)]/50 space-y-3 animate-scale-up">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Nome da nova playlist"
                className="w-full h-10 px-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-xs font-semibold text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-purple)]"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--text-secondary)] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateAndAdd}
                  disabled={creating || !newTitle.trim()}
                  className="px-4 py-1.5 rounded-lg bg-[var(--accent-blue)] text-white text-xs font-black shadow-md active:scale-95 transition-transform flex items-center gap-1.5 disabled:opacity-50"
                >
                  {creating ? <Loader2 className="size-3.5 animate-spin" /> : <span>Criar e Adicionar</span>}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreatingNew(true)}
              className="flex w-full items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-[#0033ff]/20 to-[#977dff]/20 border border-[var(--accent-purple)]/40 hover:bg-white/10 active:scale-98 transition-all group"
            >
              <div className="size-10 rounded-xl bg-[var(--accent-blue)] text-white flex items-center justify-center shadow-md">
                <Plus className="size-5" />
              </div>
              <span className="text-xs font-black text-white group-hover:text-[var(--accent-pink)]">
                Nova playlist
              </span>
            </button>
          )}
        </div>

        {/* Lista de Playlists */}
        <div className="flex-1 overflow-y-auto space-y-2 py-2 no-scrollbar">
          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] block px-1 pb-1">
            Suas Playlists
          </span>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-[var(--text-secondary)]">
              <Loader2 className="size-6 animate-spin text-[var(--accent-purple)]" />
              <p className="text-xs font-bold">Carregando suas playlists...</p>
            </div>
          ) : playlists.length > 0 ? (
            playlists.map((pl) => {
              const isAdded = addedSuccessId === pl.id
              const isProcessing = addingId === pl.id

              return (
                <div
                  key={`pl-add-${pl.id}`}
                  onClick={() => handleSelectPlaylist(pl)}
                  className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    isAdded
                      ? "bg-emerald-950/40 border-emerald-500 shadow-md"
                      : "bg-[var(--bg-surface)]/70 border-[var(--border)] hover:bg-white/5 hover:border-[var(--accent-purple)]/40"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="size-11 rounded-xl overflow-hidden bg-zinc-900 flex items-center justify-center shrink-0">
                      {pl.thumbnail ? (
                        <img src={pl.thumbnail} alt={pl.title} className="size-full object-cover" />
                      ) : (
                        <ListMusic className="size-5 text-[var(--accent-purple)]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-black text-white truncate">{pl.title}</h4>
                      <p className="text-[10.5px] font-semibold text-[var(--text-secondary)] truncate flex items-center gap-1.5">
                        <span>{pl.track_count || 0} faixas</span>
                        <span>•</span>
                        <span>{pl.author || "Privada"}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`size-8 rounded-full flex items-center justify-center transition-all ${
                      isAdded
                        ? "bg-emerald-500 text-white"
                        : "bg-white/10 text-[var(--text-secondary)] group-hover:text-white"
                    }`}
                  >
                    {isProcessing ? (
                      <Loader2 className="size-4 animate-spin text-white" />
                    ) : isAdded ? (
                      <Check className="size-4 text-white" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                  </button>
                </div>
              )
            })
          ) : (
            <p className="text-xs font-bold text-[var(--text-muted)] text-center py-8">
              Você ainda não tem playlists criadas.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
