"use client"

import { useState } from "react"
import { Sparkles, Trash2, X, Image as ImageIcon, Loader2 } from "lucide-react"
import { updatePlaylistMetadata, deletePlaylistById } from "@/lib/lucimusic"

interface EditPlaylistModalProps {
  playlist: {
    id: string
    title: string
    description?: string
    thumbnail?: string
  } | null
  isOpen: boolean
  onClose: () => void
  onUpdated: () => void
  onDeleted: () => void
}

export function EditPlaylistModal({
  playlist,
  isOpen,
  onClose,
  onUpdated,
  onDeleted,
}: EditPlaylistModalProps) {
  const [title, setTitle] = useState(playlist?.title || "")
  const [description, setDescription] = useState(playlist?.description || "")
  const [customCoverUrl, setCustomCoverUrl] = useState(playlist?.thumbnail || "")
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen || !playlist) return null

  const handleSave = async () => {
    if (!title.trim()) return
    setIsSaving(true)
    try {
      await updatePlaylistMetadata(playlist.id, {
        title: title.trim(),
        description: description.trim(),
        cover_mode: "custom",
        custom_cover_url: customCoverUrl.trim(),
      })
      onUpdated()
      onClose()
    } catch (err) {
      console.error("Erro ao salvar playlist:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setIsDeleting(true)
    try {
      await deletePlaylistById(playlist.id)
      onDeleted()
      onClose()
    } catch (err) {
      console.error("Erro ao excluir playlist:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in select-none p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[440px] rounded-3xl bg-[var(--bg-surface)] border border-[var(--border)] p-6 space-y-5 shadow-2xl animate-slide-up"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="text-base font-black text-white">Editar Playlist</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Seletor de Capa */}
          <div className="flex items-center gap-3">
            <div className="size-20 rounded-2xl bg-zinc-900 border border-[var(--border)] overflow-hidden shrink-0 flex items-center justify-center">
              {customCoverUrl ? (
                <img src={customCoverUrl} alt="Capa" className="size-full object-cover" />
              ) : (
                <ImageIcon className="size-8 text-zinc-600" />
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--text-secondary)] block">
                URL da Capa Personalizada
              </label>
              <input
                type="text"
                value={customCoverUrl}
                onChange={(e) => setCustomCoverUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent-purple)]"
              />
            </div>
          </div>

          {/* Nome */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[var(--text-secondary)] block">
              Nome da Playlist
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Treino Pesado 2026"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent-purple)]"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-[var(--text-secondary)] block">
              Descrição / Mood
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição personalizada para a Luci calibrar..."
              className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent-purple)] resize-none"
            />
          </div>
        </div>

        {/* Ações */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#0033ff] to-[#977dff] text-white font-black text-sm shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : "Salvar Alterações"}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className={`w-full py-2.5 rounded-2xl border font-bold text-xs transition-all active:scale-98 ${
              confirmDelete
                ? "bg-rose-600 text-white border-rose-500"
                : "border-rose-500/20 text-rose-400 hover:bg-rose-500/10"
            }`}
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin mx-auto" />
            ) : confirmDelete ? (
              "Confirmar Exclusão Definitiva"
            ) : (
              "Excluir Playlist"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
