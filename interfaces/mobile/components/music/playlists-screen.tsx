"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, Plus, Play, MoreVertical, Users, Sparkles, Disc } from "lucide-react"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { useMusicPlayer } from "@/hooks/use-music-player"

const MOCK_PLAYLISTS = [
  {
    id: 1,
    title: "Sessões Neon da Meia-Noite",
    curator: "Lucas Vilella",
    tracksCount: 142,
    duration: "8h 15m",
    image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&q=80",
    gradient: "from-fuchsia-950/70 via-purple-900/40 to-black",
    featured: true,
  },
  {
    id: 2,
    title: "Cyberpunk Ressonância",
    curator: "Mente Sintética",
    tracksCount: 48,
    duration: "3h 12m",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80",
    gradient: "from-cyan-950/60 to-black",
  },
  {
    id: 3,
    title: "Ouro Líquido (Acústico)",
    curator: "Sons do Vazio",
    tracksCount: 36,
    duration: "2h 45m",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80",
    gradient: "from-amber-950/60 to-black",
  },
  {
    id: 4,
    title: "Foco Profundo & Sintonia",
    curator: "Estúdio Zero",
    tracksCount: 84,
    duration: "5h 20m",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
    gradient: "from-indigo-950/60 to-black",
  },
]

export function PlaylistsScreen() {
  const [filter, setFilter] = useState<"all" | "collab" | "owned">("all")
  const { pop } = useMusicNavigation()
  const { playTrack } = useMusicPlayer()

  return (
    <div className="flex h-full flex-col bg-[#08080A] text-white animate-view-in select-none">
      {/* ─── Header ─── */}
      <header className="flex items-center justify-between px-5 pt-3 pb-2 border-b border-white/5 bg-[#08080A]/90 backdrop-blur-xl">
        <button
          type="button"
          onClick={pop}
          className="flex size-9 items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:text-white transition-all active:scale-95"
          aria-label="Voltar"
        >
          <ChevronLeft className="size-5" />
        </button>

        <div className="text-center">
          <h1 className="text-sm font-bold text-white uppercase tracking-wider">
            Playlists Curadas
          </h1>
          <span className="text-[10px] text-cyan-400 font-mono">24 Playlists • 128h de som</span>
        </div>

        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all active:scale-95"
          aria-label="Criar Playlist"
        >
          <Plus className="size-4.5" />
        </button>
      </header>

      {/* ─── Body ─── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 scrollbar-none pb-28">
        {/* Filter Pills */}
        <div className="flex gap-2">
          {[
            { id: "all", label: "Todas" },
            { id: "collab", label: "Colaborativas" },
            { id: "owned", label: "Minhas Listas" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filter === tab.id
                  ? "bg-cyan-400 text-black shadow-[0_0_12px_rgba(0,242,254,0.4)]"
                  : "bg-zinc-900 text-zinc-400 border border-white/10 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Featured Playlist Card ─── */}
        {MOCK_PLAYLISTS.filter((p) => p.featured).map((fp) => (
          <div
            key={fp.id}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-fuchsia-950/80 via-purple-900/30 to-black border border-fuchsia-500/30 p-5 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-widest text-fuchsia-400 flex items-center gap-1">
                <Sparkles className="size-2.5" /> Em Destaque
              </span>
              <span className="text-xs text-zinc-400 font-mono">{fp.duration}</span>
            </div>

            <div className="relative h-40 w-full rounded-2xl overflow-hidden border border-white/10 shadow-lg">
              <Image src={fp.image} alt={fp.title} fill sizes="400px" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              <button
                type="button"
                className="absolute bottom-3 right-3 size-12 rounded-full bg-gradient-to-tr from-cyan-400 to-fuchsia-500 text-black flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                aria-label="Tocar Playlist"
              >
                <Play className="size-5 fill-current translate-x-0.5" />
              </button>

              <div className="absolute bottom-3 left-3">
                <h3 className="text-sm font-bold text-white">{fp.title}</h3>
                <p className="text-[11px] text-zinc-300 flex items-center gap-1 mt-0.5">
                  <Users className="size-3 text-cyan-400" /> {fp.tracksCount} Faixas • Por {fp.curator}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* ─── Other Curated Playlists ─── */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Coleções Pessoais
          </h3>

          <div className="space-y-3">
            {MOCK_PLAYLISTS.filter((p) => !p.featured).map((playlist) => (
              <div
                key={playlist.id}
                className="group relative overflow-hidden rounded-2xl bg-zinc-900/60 border border-white/10 p-3.5 flex items-center gap-4 hover:border-cyan-500/30 transition-all text-left"
              >
                <div className="relative size-16 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-md">
                  <Image
                    src={playlist.image}
                    alt={playlist.title}
                    fill
                    sizes="64px"
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate">{playlist.title}</h4>
                  <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                    {playlist.curator}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-cyan-400">
                    <span>{playlist.tracksCount} faixas</span>
                    <span>•</span>
                    <span>{playlist.duration}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="size-9 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-cyan-400 hover:bg-cyan-400/10 active:scale-95 transition-all shrink-0"
                  aria-label="Tocar"
                >
                  <Play className="size-4 fill-current translate-x-px" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
