"use client"

import { useState } from "react"
import {
  ChevronLeft,
  Headphones,
  Sliders,
  WifiOff,
  Moon,
  Bell,
  LogOut,
  Info,
} from "lucide-react"
import { useMusicNavigation } from "@/hooks/use-music-navigation"

export function SettingsScreen() {
  const [offlineMode, setOfflineMode] = useState(false)
  const [darkTheme, setDarkTheme] = useState(true)
  const [audioQuality, setAudioQuality] = useState<"flac" | "high" | "normal">("flac")
  const { pop } = useMusicNavigation()

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
          Ajustes & Preferências
        </h1>

        <div className="size-9" />
      </header>

      {/* ─── Body ─── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 scrollbar-none pb-28">
        {/* ─── Audio Experience ─── */}
        <section className="space-y-3">
          <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">
            Experiência Sonora
          </span>

          <div className="space-y-2 bg-zinc-900/60 rounded-2xl p-3 border border-white/10">
            {/* Audio Quality */}
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-3">
                <Headphones className="size-4.5 text-cyan-400" />
                <div>
                  <h4 className="text-xs font-semibold text-white">Qualidade do Áudio</h4>
                  <p className="text-[10px] text-zinc-400">Transmissão em alta fidelidade</p>
                </div>
              </div>

              <select
                value={audioQuality}
                onChange={(e) => setAudioQuality(e.target.value as any)}
                className="rounded-xl bg-zinc-800 border border-white/10 px-2.5 py-1 text-xs font-semibold text-cyan-300 focus:outline-none"
              >
                <option value="flac">Ultra (320kbps / FLAC)</option>
                <option value="high">Alta (256kbps)</option>
                <option value="normal">Normal (160kbps)</option>
              </select>
            </div>

            {/* Equalizer */}
            <button
              type="button"
              className="flex w-full items-center justify-between py-2 border-t border-white/5 text-left hover:text-cyan-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Sliders className="size-4.5 text-fuchsia-400" />
                <div>
                  <h4 className="text-xs font-semibold text-white">Equalizador Ativo</h4>
                  <p className="text-[10px] text-zinc-400">Perfil: Graves Profundos (Bass Boost)</p>
                </div>
              </div>
              <ChevronLeft className="size-4 rotate-180 text-zinc-600" />
            </button>

            {/* Offline Mode Switch */}
            <div className="flex items-center justify-between py-2 border-t border-white/5">
              <div className="flex items-center gap-3">
                <WifiOff className="size-4.5 text-zinc-400" />
                <div>
                  <h4 className="text-xs font-semibold text-white">Modo Offline</h4>
                  <p className="text-[10px] text-zinc-400">Tocar apenas arquivos em cache</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOfflineMode(!offlineMode)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  offlineMode ? "bg-cyan-400" : "bg-zinc-800"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform ${
                    offlineMode ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* ─── Interface & Style ─── */}
        <section className="space-y-3">
          <span className="text-[10px] uppercase font-bold tracking-widest text-fuchsia-400">
            Interface do App
          </span>

          <div className="space-y-2 bg-zinc-900/60 rounded-2xl p-3 border border-white/10">
            {/* Dark Theme Switch */}
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-3">
                <Moon className="size-4.5 text-purple-400" />
                <div>
                  <h4 className="text-xs font-semibold text-white">Tema Escuro Profundo</h4>
                  <p className="text-[10px] text-zinc-400">Otimizado para telas OLED / AMOLED</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDarkTheme(!darkTheme)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  darkTheme ? "bg-cyan-400" : "bg-zinc-800"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform ${
                    darkTheme ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between py-2 border-t border-white/5">
              <div className="flex items-center gap-3">
                <Bell className="size-4.5 text-amber-400" />
                <div>
                  <h4 className="text-xs font-semibold text-white">Notificações</h4>
                  <p className="text-[10px] text-zinc-400">Alertas de novos álbuns e lançamentos</p>
                </div>
              </div>
              <ChevronLeft className="size-4 rotate-180 text-zinc-600" />
            </div>
          </div>
        </section>

        {/* ─── System Info & Logout ─── */}
        <div className="space-y-3 text-center pt-2">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400 hover:bg-red-500/20 active:scale-95 transition-all"
          >
            <LogOut className="size-4" />
            <span>Desconectar Sessão</span>
          </button>

          <p className="text-[10px] text-zinc-600 font-mono">
            Luci Music Cyber-Acoustic • v2.5.0 (Build 2026)
          </p>
        </div>
      </div>
    </div>
  )
}
