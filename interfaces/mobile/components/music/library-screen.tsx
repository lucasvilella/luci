"use client"

import Image from "next/image"
import {
  ChevronLeft,
  Heart,
  DownloadCloud,
  Disc,
  Mic2,
  Radio,
  Plus,
  Play,
  MoreVertical,
} from "lucide-react"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { useMusicPlayer } from "@/hooks/use-music-player"

export function LibraryScreen() {
  const { pop, goToPlaylists } = useMusicNavigation()
  const { liked } = useMusicPlayer()

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
          <span className="text-[10px] uppercase font-bold tracking-widest text-fuchsia-400">
            Seu Universo
          </span>
          <h1 className="text-sm font-bold text-white uppercase tracking-wider">
            Sua Biblioteca
          </h1>
        </div>

        <button
          type="button"
          onClick={goToPlaylists}
          className="flex size-9 items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:text-white transition-all active:scale-95"
          aria-label="Playlists"
        >
          <Plus className="size-4.5" />
        </button>
      </header>

      {/* ─── Body ─── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 scrollbar-none pb-28">
        {/* ─── Liked Songs Mega Card ─── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-700 p-5 shadow-[0_0_30px_rgba(233,64,87,0.25)] border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="size-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Heart className="size-6 fill-current" />
            </div>
            <button
              type="button"
              className="size-11 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform"
              aria-label="Tocar Músicas Curtidas"
            >
              <Play className="size-5 fill-current translate-x-0.5" />
            </button>
          </div>

          <div>
            <h2 className="text-lg font-extrabold text-white">Músicas Curtidas</h2>
            <p className="text-xs text-white/80 mt-0.5 font-medium">
              {liked.size > 0 ? `${liked.size} faixas salvas` : "124 faixas salvas"}
            </p>
          </div>
        </div>

        {/* ─── 4 Quick Categories Grid ─── */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Baixadas", count: "3.2 GB", icon: DownloadCloud, color: "text-cyan-400" },
            { label: "Álbuns Salvos", count: "21 Álbuns", icon: Disc, color: "text-fuchsia-400" },
            { label: "Artistas Seguidos", count: "38 Artistas", icon: Mic2, color: "text-amber-400" },
            { label: "Podcasts & Shows", count: "12 Séries", icon: Radio, color: "text-emerald-400" },
          ].map((cat) => {
            const Icon = cat.icon
            return (
              <div
                key={cat.label}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-900/60 border border-white/5 hover:border-white/15 transition-all text-left"
              >
                <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  <Icon className={`size-5 ${cat.color}`} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-zinc-100 truncate">{cat.label}</h4>
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5">{cat.count}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* ─── Recently Added Section ─── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Adicionados Recentemente
            </h3>
            <span className="text-[11px] text-cyan-400 font-semibold cursor-pointer">Ver Todos</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              {
                title: "Dark Synth Vibe",
                artist: "Lucas Vilella",
                image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&q=80",
              },
              {
                title: "Acoustic Horizon",
                artist: "Sons do Vazio",
                image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group relative overflow-hidden rounded-2xl bg-zinc-900/60 border border-white/10 p-3 hover:border-cyan-500/30 transition-all text-left"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-2 bg-black">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="180px"
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <p className="text-xs font-bold text-zinc-200 truncate">{item.title}</p>
                <p className="text-[10px] text-zinc-500 truncate">{item.artist}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
