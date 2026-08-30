"use client"

import React, { useState } from "react"
import {
  ArrowLeft,
  MoreHorizontal,
  Play,
  Pause,
  MoreVertical,
  Sun,
  Moon,
} from "lucide-react"
import { TrackActionMenu } from "@/components/ui/track-action-menu"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { useTheme } from "@/hooks/use-theme"
import { type LuciTrack } from "@/lib/lucimusic"

interface NotificationItem {
  id: string
  title: string
  artist: string
  type: "Single" | "Álbum" | "EP"
  timeAgo: string
  durationText: string
  thumbnail: string
}

// Dados oficiais dos mockups de Notificações organizados por período
const TODAY_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif_1",
    title: "BREAK MY SOUL",
    artist: "Beyonce",
    type: "Álbum",
    timeAgo: "Hoje",
    durationText: "04:36 min",
    thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300",
  },
  {
    id: "notif_2",
    title: "Disaster",
    artist: "Conan Gray",
    type: "Single",
    timeAgo: "Hoje",
    durationText: "03:58 min",
    thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300",
  },
  {
    id: "notif_3",
    title: "HANDSOME",
    artist: "Warren Hue",
    type: "Single",
    timeAgo: "Hoje",
    durationText: "04:45 min",
    thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300",
  },
]

const YESTERDAY_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif_4",
    title: "Sharks",
    artist: "Imagine Dragons",
    type: "Single",
    timeAgo: "Ontem",
    durationText: "05:23 min",
    thumbnail: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300",
  },
  {
    id: "notif_5",
    title: "Fly Me To The Sun",
    artist: "Romantic Echoes",
    type: "Álbum",
    timeAgo: "Ontem",
    durationText: "04:20 min",
    thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300",
  },
  {
    id: "notif_6",
    title: "The Bended Man",
    artist: "Sunwich",
    type: "Single",
    timeAgo: "Ontem",
    durationText: "03:48 min",
    thumbnail: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300",
  },
]

export function NotificationsScreen() {
  const { goBack, goToArtist } = useMusicNavigation()
  const { currentTrack, isPlaying, playTrack, togglePlay, toggleLike, isLiked } = useMusicPlayer()
  const { theme, toggleTheme, mounted } = useTheme()

  const [selectedTrack, setSelectedTrack] = useState<LuciTrack | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handlePlayItem = (item: NotificationItem) => {
    const trackObj: LuciTrack = {
      id: item.id,
      title: item.title,
      artist: item.artist,
      thumbnail: item.thumbnail,
      duration: 240,
    }
    if (currentTrack?.id === item.id) {
      togglePlay()
    } else {
      playTrack(trackObj, [
        ...TODAY_NOTIFICATIONS,
        ...YESTERDAY_NOTIFICATIONS,
      ].map((n) => ({
        id: n.id,
        title: n.title,
        artist: n.artist,
        thumbnail: n.thumbnail,
        duration: 240,
      })))
    }
  }

  const handleOpenMore = (e: React.MouseEvent, item: NotificationItem) => {
    e.stopPropagation()
    setSelectedTrack({
      id: item.id,
      title: item.title,
      artist: item.artist,
      thumbnail: item.thumbnail,
      duration: 240,
    })
    setIsMenuOpen(true)
  }

  const renderNotificationRow = (item: NotificationItem) => {
    const isThisPlaying = isPlaying && currentTrack?.id === item.id

    return (
      <div
        key={item.id}
        onClick={() => handlePlayItem(item)}
        className="flex items-center justify-between py-2.5 px-1 rounded-2xl hover:bg-[var(--bg-surface-1)] transition-colors cursor-pointer group active:scale-[0.99]"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
          {/* Capa com cantos arredondados de 10px (12-15% da altura) */}
          <div className="size-[64px] rounded-[10px] overflow-hidden bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] shadow-sm shrink-0">
            <img
              src={item.thumbnail}
              alt={item.title}
              loading="lazy"
              className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Metadados: Linha Superior (Hoje | Duração) + Título + Linha Inferior (Artista | Tipo) */}
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-[11px] font-medium text-[var(--text-secondary)]">
              {item.timeAgo} &nbsp;|&nbsp; {item.durationText}
            </p>
            <h4
              className={`text-base font-extrabold truncate transition-colors ${
                isThisPlaying
                  ? "text-[var(--accent-primary)]"
                  : "text-[var(--text-primary)] group-hover:text-[var(--accent-primary)]"
              }`}
            >
              {item.title}
            </h4>
            <p className="text-xs font-semibold text-[var(--text-secondary)] truncate">
              {item.artist} &nbsp;|&nbsp; {item.type}
            </p>
          </div>
        </div>

        {/* Lado Direito: Botão Play Circular + Botão Três Pontos */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handlePlayItem(item)
            }}
            aria-label={isThisPlaying ? "Pausar" : "Tocar"}
            className="size-8 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center shadow-md shadow-[#5c62ec]/30 hover:scale-110 active:scale-95 transition-all"
          >
            {isThisPlaying ? (
              <Pause className="size-3.5 fill-white" />
            ) : (
              <Play className="size-3.5 fill-white translate-x-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={(e) => handleOpenMore(e, item)}
            aria-label="Mais opções"
            className="size-8 rounded-full hover:bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center active:scale-90"
          >
            <MoreVertical className="size-4.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-full flex-col bg-[var(--bg-app)] text-[var(--text-primary)] select-none overflow-y-auto pb-32">
      {/* ─── HEADER DE NAVEGAÇÃO SUPERIOR (Notificações) ─── */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-5 pt-4 pb-3 bg-[var(--bg-app)]/90 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            aria-label="Voltar"
            className="size-10 rounded-full bg-[var(--bg-surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-center transition-transform active:scale-90 shadow-sm"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Notificações
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Seletor Provisório de Tema */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
            aria-label="Alternar tema"
            className="size-9 rounded-full bg-[var(--bg-surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-center transition-transform active:scale-90"
          >
            {mounted && theme === "dark" ? (
              <Sun className="size-4.5 text-amber-400" />
            ) : (
              <Moon className="size-4.5 text-indigo-600" />
            )}
          </button>

          {/* Mais Opções */}
          <button
            type="button"
            aria-label="Mais opções"
            className="size-9 rounded-full bg-[var(--bg-surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-center transition-transform active:scale-90"
          >
            <MoreHorizontal className="size-4.5 stroke-[2]" />
          </button>
        </div>
      </header>

      {/* ─── FEED CONTÍNUO DE LANÇAMENTOS E NOTIFICAÇÕES ─── */}
      <div className="px-5 pt-2 space-y-6">
        {/* 01. LANÇAMENTOS DE HOJE */}
        <section className="space-y-2">
          <h3 className="text-base font-black text-[var(--text-primary)] tracking-tight">
            Lançamentos de Hoje
          </h3>
          <div className="space-y-1">
            {TODAY_NOTIFICATIONS.map((item) => renderNotificationRow(item))}
          </div>
        </section>

        {/* Divisor sutil */}
        <div className="h-[1px] bg-[var(--border-subtle)]" />

        {/* 02. LANÇAMENTOS DE ONTEM */}
        <section className="space-y-2">
          <h3 className="text-base font-black text-[var(--text-primary)] tracking-tight">
            Ontem
          </h3>
          <div className="space-y-1">
            {YESTERDAY_NOTIFICATIONS.map((item) => renderNotificationRow(item))}
          </div>
        </section>
      </div>

      {/* ─── MENU SUSPENSO DE AÇÕES FLUTUANTE (TrackActionMenu) ─── */}
      <TrackActionMenu
        isOpen={isMenuOpen}
        track={selectedTrack}
        onClose={() => setIsMenuOpen(false)}
        onToggleLike={(t) => toggleLike(t)}
        onAddToPlaylist={() => {}}
        onViewArtist={(artist) => goToArtist(artist)}
        onGoToAlbum={() => {}}
        onShare={() => {}}
        isLiked={selectedTrack ? isLiked(selectedTrack.id) : false}
      />
    </div>
  )
}
