"use client"

import React from "react"
import {
  Shuffle,
  ListPlus,
  Download,
  Trash2,
  User,
  Share2,
  X,
} from "lucide-react"

interface AlbumItem {
  id: string
  title: string
  artist: string
  year: string
  coverUrl: string
}

interface AlbumActionMenuProps {
  isOpen: boolean
  album: AlbumItem | null
  onClose: () => void
  onShufflePlay?: (album: AlbumItem) => void
  onAddToPlaylist?: (album: AlbumItem) => void
  onRemoveFromLibrary?: (albumId: string) => void
  onViewArtist?: (artistName: string) => void
  onShare?: (album: AlbumItem) => void
}

export function AlbumActionMenu({
  isOpen,
  album,
  onClose,
  onShufflePlay,
  onAddToPlaylist,
  onRemoveFromLibrary,
  onViewArtist,
  onShare,
}: AlbumActionMenuProps) {
  if (!isOpen || !album) return null

  const menuItems = [
    {
      id: "shuffle",
      label: "Modo Aleatório",
      icon: Shuffle,
      action: () => onShufflePlay?.(album),
    },
    {
      id: "playlist",
      label: "Adicionar à Playlist",
      icon: ListPlus,
      action: () => onAddToPlaylist?.(album),
    },
    {
      id: "download",
      label: "Baixar",
      icon: Download,
      action: () => {},
    },
    {
      id: "remove",
      label: "Remover da Biblioteca",
      icon: Trash2,
      action: () => onRemoveFromLibrary?.(album.id),
      danger: true,
    },
    {
      id: "artist",
      label: "Ver Artista",
      icon: User,
      action: () => onViewArtist?.(album.artist),
    },
    {
      id: "share",
      label: "Compartilhar",
      icon: Share2,
      action: () => onShare?.(album),
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end sm:justify-center p-4 animate-fade-in select-none">
      {/* Backdrop transparente com desfoque */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
      />

      {/* Menu Suspenso Flutuante (Exatamente no padrão visual do Mockup) */}
      <div
        className="relative z-10 w-64 rounded-3xl p-3 shadow-2xl border transition-all duration-200 animate-slide-up origin-top-right"
        style={{
          backgroundColor: "var(--bg-deck)",
          borderColor: "var(--border-subtle)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
        }}
      >
        {/* Header do Menu com Info do Álbum */}
        <div className="flex items-center gap-2.5 px-2 py-1.5 pb-2.5 border-b border-[var(--border-subtle)] mb-1">
          <div className="size-9 rounded-xl overflow-hidden bg-[var(--bg-surface-2)] shrink-0 border border-[var(--border-subtle)]">
            <img
              src={album.coverUrl}
              alt={album.title}
              className="size-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">
              {album.title}
            </h4>
            <p className="text-[10px] text-[var(--text-secondary)] truncate">
              {album.artist} • {album.year}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="size-6 rounded-full bg-[var(--bg-surface-1)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-90"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Lista de Ações */}
        <div className="space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  item.action()
                  onClose()
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-medium transition-all active:scale-95 ${
                  item.danger
                    ? "text-rose-500 hover:bg-rose-500/10 font-semibold"
                    : "text-[var(--text-primary)] hover:bg-[var(--bg-surface-1)]"
                }`}
              >
                <Icon className="size-4 stroke-[1.8] shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
