"use client"

import { useState } from "react"
import {
  X,
  GripVertical,
  Trash2,
  ListMusic,
  Heart,
  MoreVertical,
  Play,
  Pause,
  Shuffle,
  Disc,
} from "lucide-react"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { TrackImage } from "./track-image"
import { syncQueueReorder, type LuciTrack } from "@/lib/lucimusic"
import { AddToPlaylistModal } from "./add-to-playlist-modal"

interface QueueScreenProps {
  isOpen: boolean
  onClose: () => void
}

export function QueueScreen({ isOpen, onClose }: QueueScreenProps) {
  const {
    currentTrack,
    queue,
    queueIndex,
    isPlaying,
    togglePlay,
    playTrack,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    toggleLike,
    isLiked,
  } = useMusicPlayer()

  const { goToArtist, goToAlbumDetail } = useMusicNavigation()

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [playlistModalTrack, setPlaylistModalTrack] = useState<LuciTrack | null>(null)
  const [actionSheetTrack, setActionSheetTrack] = useState<LuciTrack | null>(null)

  if (!isOpen) return null

  // Separação lógica: Faixa Tocando Agora vs Próximas Faixas
  const activeTrack = currentTrack || queue[queueIndex]
  const upNextTracks = queue.filter((_, idx) => idx !== queueIndex)

  // Drag and Drop simples e fluido
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newQueue = [...queue]
    const [draggedItem] = newQueue.splice(draggedIndex, 1)
    newQueue.splice(index, 0, draggedItem)

    reorderQueue(newQueue)
    setDraggedIndex(index)

    if (currentTrack) {
      syncQueueReorder(currentTrack.id, newQueue.map((t) => t.id))
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[500px] h-[90vh] flex flex-col rounded-t-3xl bg-[var(--bg-surface)] border-t border-[var(--border)] p-6 shadow-2xl animate-slide-up"
      >
        {/* ─── Header da Fila ─── */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-lg font-black text-white">Fila de Reprodução</h2>
            <p className="text-xs font-semibold text-[var(--text-secondary)] truncate max-w-[320px]">
              Reproduzindo de: {activeTrack?.album || "Mix da Luci"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Fila"
            className="size-8 flex items-center justify-center rounded-full bg-white/10 text-[var(--text-secondary)] hover:text-white active:scale-90 transition-all"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* ─── Corpo com Scroll ─── */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 no-scrollbar">
          {/* 1. FAIXA ATIVA (TOCANDO AGORA) */}
          {activeTrack && (
            <section className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--accent-pink)]">
                Tocando Agora
              </span>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--accent-blue)]/20 border border-[var(--accent-purple)] shadow-lg">
                {/* Equalizador Animado */}
                <div className="flex items-end gap-0.5 h-4 w-3 shrink-0">
                  <span className="w-0.5 h-full bg-[var(--accent-pink)] animate-bounce" style={{ animationDuration: "0.6s" }} />
                  <span className="w-0.5 h-2/3 bg-[var(--accent-pink)] animate-bounce" style={{ animationDuration: "0.8s" }} />
                  <span className="w-0.5 h-full bg-[var(--accent-pink)] animate-bounce" style={{ animationDuration: "0.5s" }} />
                </div>

                <TrackImage
                  src={activeTrack.thumbnail}
                  trackId={activeTrack.id}
                  alt={activeTrack.title}
                  className="size-12 rounded-xl object-cover bg-zinc-900 shadow-sm shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black text-[var(--accent-pink)] truncate">
                    {activeTrack.title}
                  </h4>
                  <p className="text-[11px] font-semibold text-[var(--text-secondary)] truncate">
                    {activeTrack.artist}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleLike(activeTrack)}
                  className="p-1.5 text-[var(--text-secondary)] hover:text-white active:scale-90 transition-transform"
                >
                  <Heart className={`size-4.5 ${isLiked(activeTrack.id) ? "fill-[var(--accent-purple)] text-[var(--accent-purple)]" : "text-white/60"}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setActionSheetTrack(activeTrack)}
                  className="p-1.5 text-[var(--text-secondary)] hover:text-white active:scale-90 transition-transform"
                >
                  <MoreVertical className="size-4" />
                </button>
              </div>
            </section>
          )}

          {/* 2. A SEGUIR / PRÓXIMAS FAIXAS (REORDENÁVEIS) */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
                A Seguir ({upNextTracks.length})
              </span>
            </div>

            {queue.length > 1 ? (
              <div className="space-y-2">
                {queue.map((track, idx) => {
                  if (idx === queueIndex) return null
                  const liked = isLiked(track.id)

                  return (
                    <div
                      key={`queue-${track.id}-${idx}`}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-3 p-2.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--accent-purple)]/40 active:scale-[0.99] transition-all group ${
                        draggedIndex === idx ? "opacity-40 border-dashed border-[var(--accent-purple)]" : ""
                      }`}
                    >
                      {/* Alça Drag */}
                      <div className="cursor-grab text-[var(--text-muted)] hover:text-white p-1">
                        <GripVertical className="size-4" />
                      </div>

                      {/* Capa */}
                      <div
                        onClick={() => playTrack(track, queue)}
                        className="cursor-pointer shrink-0"
                      >
                        <TrackImage
                          src={track.thumbnail}
                          trackId={track.id}
                          alt={track.title}
                          className="size-11 rounded-xl object-cover bg-zinc-900 shadow-sm"
                        />
                      </div>

                      {/* Info */}
                      <div
                        onClick={() => playTrack(track, queue)}
                        className="min-w-0 flex-1 cursor-pointer"
                      >
                        <h4 className="text-xs font-black text-white truncate group-hover:text-[var(--accent-pink)]">
                          {track.title}
                        </h4>
                        <p className="text-[11px] font-semibold text-[var(--text-secondary)] truncate">
                          {track.artist}
                        </p>
                      </div>

                      {/* Like */}
                      <button
                        type="button"
                        onClick={() => toggleLike(track)}
                        className="p-1.5 text-[var(--text-secondary)] hover:text-white active:scale-90 transition-transform"
                      >
                        <Heart className={`size-4 ${liked ? "fill-[var(--accent-purple)] text-[var(--accent-purple)]" : "text-white/40"}`} />
                      </button>

                      {/* Menu 3 Pontos */}
                      <button
                        type="button"
                        onClick={() => setActionSheetTrack(track)}
                        className="p-1.5 text-[var(--text-secondary)] hover:text-white active:scale-90 transition-transform"
                      >
                        <MoreVertical className="size-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)] text-center py-6">
                Nenhuma música a seguir. O modo de rádio infinita da Luci continuará tocando automaticamente.
              </p>
            )}
          </section>
        </div>

        {/* ─── 3. BOTÃO FIXO: LIMPAR FILA ─── */}
        <div className="pt-3 border-t border-white/10 shrink-0">
          <button
            type="button"
            onClick={clearQueue}
            className="w-full py-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-black text-[var(--text-secondary)] hover:text-white active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="size-4 text-red-400" />
            <span>Limpar Fila</span>
          </button>
        </div>
      </div>

      {/* ─── MODAL ADICIONAR À PLAYLIST ─── */}
      {playlistModalTrack && (
        <AddToPlaylistModal
          track={playlistModalTrack}
          isOpen={Boolean(playlistModalTrack)}
          onClose={() => setPlaylistModalTrack(null)}
        />
      )}

      {/* ─── ACTION SHEET DE OPÇÕES DE FAIXA NA FILA ─── */}
      {actionSheetTrack && (
        <div
          onClick={() => setActionSheetTrack(null)}
          className="fixed inset-0 z-60 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
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
                  setPlaylistModalTrack(actionSheetTrack)
                  setActionSheetTrack(null)
                }}
                className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10"
              >
                <ListMusic className="size-5 text-[var(--accent-purple)]" />
                <span>Adicionar à Playlist</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  goToArtist(actionSheetTrack.artistId || actionSheetTrack.artist)
                  setActionSheetTrack(null)
                  onClose()
                }}
                className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10"
              >
                <Disc className="size-5 text-[var(--accent-purple)]" />
                <span>Ver Artista</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const targetIdx = queue.findIndex((t) => t.id === actionSheetTrack.id)
                  if (targetIdx >= 0) removeFromQueue(targetIdx)
                  setActionSheetTrack(null)
                }}
                className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-500/10 text-red-400 active:bg-red-500/20"
              >
                <Trash2 className="size-5" />
                <span>Remover da Fila</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
