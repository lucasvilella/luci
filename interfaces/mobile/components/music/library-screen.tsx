"use client"

import React from "react"
import {
  Music2,
  Search,
  MoreHorizontal,
  Sun,
  Moon,
  ListMusic,
  Disc3,
  Music,
  Users,
} from "lucide-react"
import { SectionHeader } from "@/components/ui/section-header"
import { MediaCard } from "@/components/ui/media-card"
import { ArtistCircle } from "@/components/ui/artist-circle"
import { LibraryMenuRow } from "@/components/ui/library-menu-row"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { useAppNavigationStore } from "@/stores/useAppNavigationStore"
import { useTheme } from "@/hooks/use-theme"

// Histórico de reprodução oficial
const YOUR_HISTORY_MOCK = [
  {
    id: "hist_1",
    title: "Shades of Love",
    subtitle: "Ania Szarmach",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
  },
  {
    id: "hist_2",
    title: "Starboy",
    subtitle: "The Weeknd",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
  },
  {
    id: "hist_3",
    title: "Sweetener",
    subtitle: "Ariana Grande",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
  },
  {
    id: "hist_4",
    title: "Without You",
    subtitle: "The Kid LAROI",
    imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400",
  },
]

export function LibraryScreen() {
  const { playTrack } = useMusicPlayer()
  const {
    goToPlaylists,
    goToAlbums,
    goToSongs,
    goToArtists,
    goToSearch,
    goToHistory,
  } = useMusicNavigation()
  const { setActiveTab } = useAppNavigationStore()
  const { theme, toggleTheme, mounted } = useTheme()

  const handlePlayHistory = (item: typeof YOUR_HISTORY_MOCK[0]) => {
    playTrack(
      {
        id: item.id,
        title: item.title,
        artist: item.subtitle,
        thumbnail: item.imageUrl,
        duration: 210,
      },
      YOUR_HISTORY_MOCK.map((t) => ({
        id: t.id,
        title: t.title,
        artist: t.subtitle,
        thumbnail: t.imageUrl,
        duration: 210,
      }))
    )
  }

  return (
    <div className="relative flex h-full flex-col bg-[var(--bg-app)] text-[var(--text-primary)] select-none overflow-y-auto pb-32">
      {/* ─── HEADER SUPERIOR COM IDENTIDADE LUCI E SELETOR DE TEMA ─── */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-5 pt-4 pb-3 bg-[var(--bg-app)]/90 backdrop-blur-xl">
        {/* Logo da Marca + Título Minha Biblioteca */}
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#5c62ec] to-[#7c82ff] text-white shadow-md shadow-[#5c62ec]/30">
            <Music2 className="size-5" />
          </div>
          <h1 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Minha Biblioteca
          </h1>
        </div>

        {/* Ações Top-Right: Tema + Busca + Menu */}
        <div className="flex items-center gap-2">
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

          <button
            type="button"
            onClick={() => setActiveTab("search")}
            aria-label="Buscar"
            className="size-9 rounded-full bg-[var(--bg-surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-center transition-transform active:scale-90"
          >
            <Search className="size-4.5 stroke-[2]" />
          </button>

          <button
            type="button"
            aria-label="Mais opções"
            className="size-9 rounded-full bg-[var(--bg-surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-center transition-transform active:scale-90"
          >
            <MoreHorizontal className="size-4.5 stroke-[2]" />
          </button>
        </div>
      </header>

      <div className="px-5 pt-3 space-y-6">
        {/* ─── 01. SEU HISTÓRICO (Your History) ─── */}
        <section>
          <SectionHeader
            title="Seu Histórico"
            seeAllText="Ver tudo"
            onSeeAll={goToHistory}
          />
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
            {YOUR_HISTORY_MOCK.map((item) => (
              <MediaCard
                key={item.id}
                id={item.id}
                title={item.title}
                subtitle={item.subtitle}
                imageUrl={item.imageUrl}
                onClick={() => handlePlayHistory(item)}
              />
            ))}
          </div>
        </section>

        {/* Divisor sutil */}
        <div className="h-[1px] bg-[var(--border-subtle)]" />

        {/* ─── 02. LISTA DE CATEGORIAS DA BIBLIOTECA (SEM DOWNLOADS E SEM PODCASTS) ─── */}
        <section className="space-y-1">
          {/* Playlists */}
          <LibraryMenuRow
            id="playlists"
            label="Playlists"
            icon={ListMusic}
            badgeCount={12}
            onClick={goToPlaylists}
          />

          {/* Álbuns */}
          <LibraryMenuRow
            id="albums"
            label="Álbuns"
            icon={Disc3}
            badgeCount={8}
            onClick={goToAlbums}
          />

          {/* Músicas */}
          <LibraryMenuRow
            id="songs"
            label="Músicas"
            icon={Music}
            badgeCount={145}
            onClick={goToSongs}
          />

          {/* Artistas */}
          <LibraryMenuRow
            id="artists"
            label="Artistas"
            icon={Users}
            badgeCount={24}
            onClick={goToArtists}
          />
        </section>
      </div>
    </div>
  )
}
