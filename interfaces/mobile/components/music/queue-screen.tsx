"use client"

import { useState, useRef, useEffect } from "react"
import {
  X,
  Play,
  Pause,
  Trash2,
  GripVertical,
  Heart,
  MoreVertical,
  Disc,
  Disc3,
  ListPlus,
  Share2,
  FileText,
  Sparkles,
} from "lucide-react"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { TrackImage } from "./track-image"
import { AddToPlaylistModal } from "./add-to-playlist-modal"
import { type LuciTrack } from "@/lib/lucimusic"

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
    addToQueue,
  } = useMusicPlayer()

  const { goToArtist, goToAlbumDetail, goToLyrics } = useMusicNavigation()

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Action Sheet e Modal Playlist
  const [selectedTrackForMenu, setSelectedTrackForMenu] = useState<LuciTrack | null>(null)
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<LuciTrack | null>(null)

  if (!isOpen) return null

  // Separa as faixas: Próximas faixas (a partir da posição subsequente)
  const upcomingTracks = queue.slice(queueIndex + 1)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const fullDraggedIdx = queueIndex + 1 + draggedIndex
    const fullTargetIdx = queueIndex + 1 + targetIndex

    const newQueue = [...queue]
    const [movedItem] = newQueue.splice(fullDraggedIdx, 1)
    newQueue.splice(fullTargetIdx, 0, movedItem)

    reorderQueue(newQueue)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/85 backdrop-blur-xl animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[500px] h-[92vh] flex flex-col rounded-t-3xl bg-[var(--bg-surface)] border-t border-[var(--border)] p-6 shadow-2xl animate-slide-up relative overflow-hidden"
      >
        {/* ─── Fundo Dinâmico com Mesh e Overlay Escuro ─── */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 size-[380px] rounded-full bg-[#0033ff] opacity-30 blur-[80px]" />
          <div className="absolute top-1/3 -right-20 size-[320px] rounded-full bg-[#977dff] opacity-25 blur-[80px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#00001f]/75 via-[#00001f]/90 to-[#00001f]/98" />
        </div>

        {/* ─── Header ─── */}
        <header className="relative z-10 flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-lg font-black text-white">Fila de Reprodução</h2>
            <p className="text-xs text-[var(--text-secondary)] truncate max-w-[300px]">
              Reproduzindo de: {currentTrack?.album || "Luci Mix"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar Fila"
            className="size-9 flex items-center justify-center rounded-full bg-white/10 text-[var(--text-secondary)] hover:text-white active:scale-90 transition-transform"
          >
            <X className="size-5" />
          </button>
        </header>

        {/* ─── Conteúdo com Scroll ─── */}
        <div className="relative z-10 flex-1 overflow-y-auto py-4 space-y-6 no-scrollbar">
          {/* 1. FAIXA ATIVA (TOCANDO AGORA) */}
          {currentTrack && (
            <section className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--accent-pink)] block px-1">
                Tocando Agora
              </span>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--accent-blue)]/20 border border-[var(--accent-purple)] shadow-lg">
                {/* Equalizador Animado ou Botão Pause */}
                <div className="relative size-12 rounded-xl overflow-hidden bg-zinc-950 shrink-0 group">
                  <TrackImage
                    src={currentTrack.thumbnail}
                    trackId={currentTrack.id}
                    alt={currentTrack.title}
                    className="size-full object-cover"
                  />
                  <div
                    onClick={togglePlay}
                    className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center cursor-pointer"
                  >
                    {isPlaying ? (
                      <div className="flex items-end gap-0.5 h-3">
                        <span className="w-1 bg-[var(--accent-pink)] rounded-full animate-bounce [animation-delay:-0.3s] h-3" />
                        <span className="w-1 bg-[var(--accent-pink)] rounded-full animate-bounce [animation-delay:-0.15s] h-2" />
                        <span className="w-1 bg-[var(--accent-pink)] rounded-full animate-bounce h-3" />
                      </div>
                    ) : (
                      <Play className="size-4 fill-white text-white" />
                    )}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black text-[var(--accent-pink)] truncate">
                    {currentTrack.title}
                  </h4>
                  <p className="text-[11px] font-semibold text-[var(--text-secondary)] truncate">
                    {currentTrack.artist}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleLike(currentTrack)}
                    className="p-2 text-[var(--text-secondary)] hover:text-white active:scale-90"
                  >
                    <Heart className={`size-4.5 ${isLiked(currentTrack.id) ? "fill-[var(--accent-purple)] text-[var(--accent-purple)]" : "text-white/60"}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTrackForMenu(currentTrack)}
                    className="p-2 text-[var(--text-secondary)] hover:text-white active:scale-90"
                  >
                    <MoreVertical className="size-4.5" />
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* 2. A SEGUIR / PRÓXIMAS FAIXAS (REORDENÁVEIS VIA DRAG & DROP) */}
          <section className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
                A Seguir ({upcomingTracks.length})
              </span>
              <span className="text-[10px] font-semibold text-[var(--text-muted)]">
                Arraste pela alça (::) para reordenar
              </span>
            </div>

            {upcomingTracks.length > 0 ? (
              <div className="space-y-2">
                {upcomingTracks.map((track, idx) => {
                  const isDragging = draggedIndex === idx
                  const isOver = dragOverIndex === idx

                  return (
                    <div
                      key={`queue-${track.id}-${idx}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={(e) => handleDrop(e, idx)}
                      className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all ${
                        isOver
                          ? "border-[var(--accent-pink)] bg-white/10 scale-102"
                          : isDragging
                          ? "opacity-30 border-dashed border-white/40"
                          : "bg-[var(--bg-surface)]/70 border-[var(--border)] hover:bg-white/5"
                      }`}
                    >
                      {/* Alça Drag & Drop */}
                      <div className="cursor-grab active:cursor-grabbing p-1 text-[var(--text-muted)] hover:text-white">
                        <GripVertical className="size-4" />
                      </div>

                      {/* Capa & Play Direto */}
                      <div
                        onClick={() => playTrack(track, queue)}
                        className="size-11 rounded-xl overflow-hidden bg-zinc-900 shrink-0 cursor-pointer relative group"
                      >
                        <TrackImage
                          src={track.thumbnail}
                          trackId={track.id}
                          alt={track.title}
                          className="size-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Play className="size-4 fill-white text-white" />
                        </div>
                      </div>

                      {/* Título e Artista */}
                      <div
                        onClick={() => playTrack(track, queue)}
                        className="min-w-0 flex-1 cursor-pointer"
                      >
                        <h4 className="text-xs font-black text-white truncate">
                          {track.title}
                        </h4>
                        <p className="text-[11px] font-semibold text-[var(--text-secondary)] truncate">
                          {track.artist}
                        </p>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleLike(track)}
                          className="p-1.5 text-[var(--text-secondary)] hover:text-white active:scale-90"
                        >
                          <Heart className={`size-4 ${isLiked(track.id) ? "fill-[var(--accent-purple)] text-[var(--accent-purple)]" : "text-white/40"}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedTrackForMenu(track)}
                          className="p-1.5 text-[var(--text-secondary)] hover:text-white active:scale-90"
                        >
                          <MoreVertical className="size-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-[var(--text-muted)] space-y-2">
                <Sparkles className="size-8 text-[var(--accent-purple)]/50" />
                <p className="text-xs font-bold text-white">Rádio Infinita Ativada</p>
                <p className="text-[11px] max-w-xs">
                  A Luci continuará adicionando músicas automaticamente de acordo com o seu gosto.
                </p>
              </div>
            )}
          </section>

          {/* 3. BOTÃO FIXO/RODAPÉ: LIMPAR FILA */}
          {upcomingTracks.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={clearQueue}
                className="w-full py-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-red-950/40 hover:border-red-500/40 text-xs font-bold text-[var(--text-muted)] hover:text-red-400 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="size-4" />
                <span>Limpar Fila</span>
              </button>
            </div>
          )}
        </div>

        {/* ─── ACTION SHEET DE OPÇÕES DE FAIXA (⋮) ─── */}
        {selectedTrackForMenu && (
          <div
            onClick={() => setSelectedTrackForMenu(null)}
            className="fixed inset-0 z-60 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[480px] rounded-t-3xl bg-[var(--bg-surface)] border-t border-[var(--border)] p-6 space-y-4 shadow-2xl animate-slide-up"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                <TrackImage
                  src={selectedTrackForMenu.thumbnail}
                  trackId={selectedTrackForMenu.id}
                  alt={selectedTrackForMenu.title}
                  className="size-12 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-black text-white truncate">{selectedTrackForMenu.title}</h4>
                  <p className="text-xs text-[var(--text-secondary)] truncate">{selectedTrackForMenu.artist}</p>
                </div>
              </div>

              <div className="space-y-1 text-sm font-bold text-[var(--text-primary)]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTrackForPlaylist(selectedTrackForMenu)
                    setSelectedTrackForMenu(null)
                  }}
                  className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10"
                >
                  <ListPlus className="size-5 text-[var(--accent-purple)]" />
                  <span>Adicionar à Playlist</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    goToArtist(selectedTrackForMenu.artistId || selectedTrackForMenu.artist)
                    setSelectedTrackForMenu(null)
                    onClose()
                  }}
                  className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10"
                >
                  <Disc3 className="size-5 text-[var(--accent-purple)]" />
                  <span>Ver Artista</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedTrackForMenu.albumId) {
                      goToAlbumDetail(selectedTrackForMenu.albumId, selectedTrackForMenu.album, selectedTrackForMenu.artist)
                    }
                    setSelectedTrackForMenu(null)
                    onClose()
                  }}
                  className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10"
                >
                  <Disc className="size-5 text-[var(--accent-purple)]" />
                  <span>Ver Álbum</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const fullIdx = queue.findIndex((t) => t.id === selectedTrackForMenu.id)
                    if (fullIdx >= 0) removeFromQueue(fullIdx)
                    setSelectedTrackForMenu(null)
                  }}
                  className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-950/40 text-red-400 active:bg-red-900/40"
                >
                  <Trash2 className="size-5 text-red-400" />
                  <span>Remover da Fila</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── MODAL ADICIONAR À PLAYLIST INTEGRADO ─── */}
        <AddToPlaylistModal
          track={selectedTrackForPlaylist}
          isOpen={!!selectedTrackForPlaylist}
          onClose={() => setSelectedTrackForPlaylist(null)}
        />
      </div>
    </div>
  )
}
