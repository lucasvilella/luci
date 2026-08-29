"use client"

import { useState, useEffect } from "react"
import {
  X,
  Plus,
  ListMusic,
  Check,
  Loader2,
  FolderPlus,
  Sparkles,
} from "lucide-react"
import {
  fetchPlaylists,
  addTrackToPlaylist,
  createPlaylistWithTrack,
  type UserPlaylist,
  type LuciTrack,
} from "@/lib/lucimusic"

interface AddToPlaylistModalProps {
  track: LuciTrack
  isOpen: boolean
  onClose: () => void
}

export function AddToPlaylistModal({ track, isOpen, onClose }: AddToPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([])
  const [loading, setLoading] = useState(true)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const [showCreateInline, setShowCreateInline] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [creating, setCreating] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      fetchPlaylists()
        .then((data) => setPlaylists(data))
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [isOpen])

  const triggerFeedback = (message: string) => {
    setToastMessage(message)
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(40)
    }
    setTimeout(() => {
      setToastMessage(null)
      onClose()
    }, 1200)
  }

  const handleAddToExisting = async (playlist: UserPlaylist) => {
    try {
      await addTrackToPlaylist(playlist.id, track)
      setAddedIds((prev) => new Set(prev).add(playlist.id))
      triggerFeedback(`Adicionada à "${playlist.title}"`)
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreateAndAdd = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const pl = await createPlaylistWithTrack(newTitle.trim(), track)
      setAddedIds((prev) => new Set(prev).add(pl.id))
      setNewTitle("")
      setShowCreateInline(false)
      triggerFeedback(`Playlist "${pl.title}" criada!`)
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] max-h-[85vh] flex flex-col rounded-t-3xl bg-[var(--bg-surface)] border-t border-[var(--border)] p-6 space-y-5 shadow-2xl animate-slide-up"
      >
        {/* Drag Handle */}
        <div className="mx-auto h-1.5 w-12 rounded-full bg-white/20" />

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
          <div>
            <h3 className="text-base font-black text-white">Adicionar à Playlist</h3>
            <p className="text-xs text-[var(--text-secondary)] truncate max-w-[280px]">
              {track.title} • {track.artist}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-full bg-white/10 text-[var(--text-secondary)] hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Toast Notifier */}
        {toastMessage && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-[#0033ff] to-[#977dff] text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg animate-scale-up">
            <Check className="size-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Botão Nova Playlist */}
        {!showCreateInline ? (
          <button
            type="button"
            onClick={() => setShowCreateInline(true)}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-[var(--accent-blue)]/20 border border-[var(--accent-purple)]/50 text-white font-black text-xs hover:bg-[var(--accent-blue)]/30 active:scale-98 transition-all shrink-0"
          >
            <div className="size-9 rounded-xl bg-[var(--accent-blue)] flex items-center justify-center text-white shadow-md">
              <Plus className="size-5" />
            </div>
            <span>Nova Playlist</span>
          </button>
        ) : (
          <div className="p-3.5 rounded-2xl bg-black/40 border border-[var(--accent-purple)] space-y-3 animate-scale-up shrink-0">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Nome da nova playlist"
              className="w-full h-10 px-3 rounded-xl bg-black/50 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-[var(--accent-purple)]"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateInline(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--text-secondary)] hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateAndAdd}
                disabled={creating || !newTitle.trim()}
                className="px-4 py-1.5 rounded-lg bg-[var(--accent-blue)] text-white text-xs font-black shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                {creating ? <Loader2 className="size-3.5 animate-spin" /> : <span>Criar e Adicionar</span>}
              </button>
            </div>
          </div>
        )}

        {/* Lista de Playlists */}
        <div className="flex-1 overflow-y-auto space-y-2 py-2 no-scrollbar">
          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] block mb-1">
            Suas Playlists
          </span>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-[var(--text-secondary)]">
              <Loader2 className="size-6 animate-spin text-[var(--accent-purple)]" />
              <span className="text-xs font-bold">Carregando playlists...</span>
            </div>
          ) : playlists.length > 0 ? (
            playlists.map((pl) => {
              const isAdded = addedIds.has(pl.id)

              return (
                <div
                  key={`pl-add-${pl.id}`}
                  onClick={() => handleAddToExisting(pl)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--accent-purple)]/50 active:scale-[0.99] transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-12 rounded-xl bg-zinc-900 overflow-hidden flex items-center justify-center shrink-0">
                      {pl.thumbnail ? (
                        <img src={pl.thumbnail} alt={pl.title} className="size-full object-cover" />
                      ) : (
                        <ListMusic className="size-6 text-[var(--accent-purple)]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-white truncate group-hover:text-[var(--accent-pink)]">
                        {pl.title}
                      </h4>
                      <p className="text-[10.5px] font-medium text-[var(--text-secondary)] truncate">
                        {pl.track_count || 0} faixas • Privada
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`size-8 rounded-full flex items-center justify-center transition-all ${
                      isAdded
                        ? "bg-green-600 text-white shadow-md"
                        : "bg-white/10 text-[var(--text-secondary)] hover:bg-[var(--accent-blue)] hover:text-white"
                    }`}
                  >
                    {isAdded ? <Check className="size-4" /> : <Plus className="size-4" />}
                  </button>
                </div>
              )
            })
          ) : (
            <p className="text-xs text-[var(--text-muted)] text-center py-8">
              Você ainda não criou nenhuma playlist.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
