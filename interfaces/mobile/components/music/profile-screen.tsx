"use client"

import Image from "next/image"
import {
  ChevronLeft,
  Share2,
  Edit3,
  TrendingUp,
  Flame,
  Shield,
  Bell,
  HardDrive,
  LogOut,
  Sparkles,
} from "lucide-react"
import { useMusicNavigation } from "@/hooks/use-music-navigation"

export function ProfileScreen() {
  const { pop, goToSettings } = useMusicNavigation()

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

        <h1 className="text-sm font-bold text-white uppercase tracking-wider">
          Perfil & Hábitos
        </h1>

        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:text-white transition-all active:scale-95"
          aria-label="Compartilhar"
        >
          <Share2 className="size-4" />
        </button>
      </header>

      {/* ─── Body ─── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 scrollbar-none pb-28">
        {/* ─── User Profile Card ─── */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative size-24 rounded-full p-1 bg-gradient-to-tr from-cyan-400 via-fuchsia-500 to-purple-600 shadow-[0_0_25px_rgba(0,242,254,0.3)]">
            <div className="relative size-full rounded-full overflow-hidden bg-black">
              <Image
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
                alt="Avatar"
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
            <div className="absolute bottom-0 right-1 size-5 rounded-full bg-cyan-400 border-2 border-black flex items-center justify-center">
              <Sparkles className="size-2.5 text-black" />
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-fuchsia-400">
              Curador Elite
            </span>
            <h2 className="text-lg font-bold text-white">Lucas Vilella</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Sintetizando frequências desde 2024</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-semibold text-white border border-white/10 active:scale-95 transition-all"
            >
              Editar Perfil
            </button>
            <button
              type="button"
              className="px-4 py-1.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 text-xs font-semibold text-cyan-300 border border-cyan-500/30 active:scale-95 transition-all"
            >
              Compartilhar ID
            </button>
          </div>
        </div>

        {/* ─── Listening Velocity Metric ─── */}
        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Velocidade de Escuta
            </span>
            <TrendingUp className="size-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">1.284</span>
            <span className="text-xs font-semibold text-zinc-400">horas ouvidas no total</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500" />
          </div>
        </div>

        {/* ─── Current Vibe ─── */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-zinc-900 to-zinc-900/60 border border-purple-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-fuchsia-400">
              Vibe Atual
            </span>
            <h3 className="text-sm font-bold text-white mt-0.5">Ambient Techno & Synth</h3>
            <p className="text-xs text-zinc-400">Neon Nocturne (Onda Contínua)</p>
          </div>
          <div className="size-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400">
            <Flame className="size-5" />
          </div>
        </div>

        {/* ─── Settings / Actions List ─── */}
        <div className="space-y-2 bg-zinc-950/60 rounded-2xl p-2 border border-white/5">
          {[
            { label: "Privacidade & Segurança", icon: Shield, action: goToSettings },
            { label: "Notificações Sonoras", icon: Bell, action: goToSettings },
            { label: "Gerenciamento de Dados", icon: HardDrive, action: goToSettings },
            { label: "Desconectar Sessão", icon: LogOut, action: goToSettings, danger: true },
          ].map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className={`flex w-full items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors text-left ${
                  item.danger ? "text-red-400 hover:text-red-300" : "text-zinc-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="size-4.5" />
                  <span className="text-xs font-semibold">{item.label}</span>
                </div>
                <ChevronLeft className="size-4 rotate-180 text-zinc-600" />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
