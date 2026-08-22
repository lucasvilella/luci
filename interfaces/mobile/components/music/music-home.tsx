"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
  Search,
  Sparkles,
  Play,
  Pause,
  MoreVertical,
  ChevronRight,
  Flame,
  Radio,
  Sliders,
  User,
  Library as LibraryIcon,
} from "lucide-react"
import { getChart, type DeezerTrack, type DeezerAlbum, type DeezerArtist } from "@/lib/deezer"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"

export function MusicHome() {
  const [tracks, setTracks] = useState<DeezerTrack[]>([])
  const [albums, setAlbums] = useState<DeezerAlbum[]>([])
  const [artists, setArtists] = useState<DeezerArtist[]>([])
  const [loading, setLoading] = useState(true)

  const { playTrack, currentTrack, isPlaying, togglePlay } = useMusicPlayer()
  const { goToSearch, goToArtist, goToPlaylists, goToLibrary, goToProfile, goToSettings } =
    useMusicNavigation()

  useEffect(() => {
    setLoading(true)
    getChart()
      .then((chart) => {
        setTracks(chart.tracks.data || [])
        setAlbums(chart.albums.data || [])
        setArtists(chart.artists.data || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const featured = tracks[0]
  const liveSession = tracks[1]
  const recentlyPlayed = tracks.slice(2, 6)
  const trendingNow = tracks.slice(6, 9)
  const popularArtists = artists.slice(0, 4)
  const newReleases = albums.slice(0, 4)

  return (
    <div className="flex h-full flex-col bg-[#08080A] text-white animate-view-in select-none">
      {/* ─── Header: Avatar, Greeting & Actions ─── */}
      <header className="flex items-center justify-between px-5 pt-3 pb-2 border-b border-white/5 bg-[#08080A]/90 backdrop-blur-xl z-20">
        <button
          type="button"
          onClick={goToProfile}
          className="flex items-center gap-3 group text-left"
          aria-label="Abrir Perfil"
        >
          <div className="relative size-9 rounded-full overflow-hidden ring-2 ring-cyan-400/40 p-0.5 bg-gradient-to-tr from-cyan-500 to-fuchsia-500">
            <div className="relative size-full rounded-full overflow-hidden bg-zinc-900">
              <Image
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                alt="Avatar"
                fill
                sizes="36px"
                className="object-cover"
              />
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 flex items-center gap-1">
              <Sparkles className="size-2.5" /> Curador
            </span>
            <h2 className="text-sm font-semibold text-zinc-100 group-hover:text-cyan-300 transition-colors">
              Lucas Vilella
            </h2>
          </div>
        </button>

        {/* Quick Top Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToSearch}
            className="flex size-9 items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            aria-label="Buscar"
          >
            <Search className="size-4" />
          </button>
          <button
            type="button"
            onClick={goToSettings}
            className="flex size-9 items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            aria-label="Configurações"
          >
            <Sliders className="size-4" />
          </button>
        </div>
      </header>

      {/* ─── Scrollable Content ─── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4 space-y-6 scrollbar-none pb-28">
        {loading ? (
          <div className="flex h-72 items-center justify-center">
            <div className="size-9 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent shadow-[0_0_15px_rgba(0,242,254,0.4)]" />
          </div>
        ) : (
          <>
            {/* ─── 1. Featured Card: Daily Resonance (Curated) ─── */}
            {featured && (
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E112A] via-[#120F1F] to-[#0A111C] p-4.5 border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-fuchsia-400/90 bg-fuchsia-500/10 px-2.5 py-1 rounded-full border border-fuchsia-500/20">
                    Curadoria Para Você
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">Ressonância Diária</span>
                </div>

                <div className="relative h-36 w-full rounded-2xl overflow-hidden mb-3 group">
                  <Image
                    src={featured.album.cover_xl || featured.album.cover_big || featured.album.cover}
                    alt={featured.title}
                    fill
                    sizes="440px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Floating Vinyl Play Button */}
                  <button
                    type="button"
                    onClick={() => playTrack(featured, tracks)}
                    className="absolute bottom-3 right-3 size-12 rounded-full bg-gradient-to-tr from-cyan-400 to-fuchsia-500 text-black flex items-center justify-center shadow-[0_0_20px_rgba(0,242,254,0.6)] hover:scale-105 active:scale-95 transition-all"
                    aria-label="Tocar Destaque"
                  >
                    {currentTrack?.id === featured.id && isPlaying ? (
                      <Pause className="size-5 fill-current" />
                    ) : (
                      <Play className="size-5 fill-current translate-x-0.5" />
                    )}
                  </button>

                  <div className="absolute bottom-3 left-3 pr-16">
                    <p className="text-xs font-semibold text-zinc-300">Teoria da Meia-Noite</p>
                    <p className="text-sm font-bold text-white truncate max-w-[200px]">
                      {featured.title}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ─── 2. Live in the Void / Sessions Banner ─── */}
            {liveSession && (
              <button
                type="button"
                onClick={() => playTrack(liveSession, tracks)}
                className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-950/40 via-zinc-900/60 to-black p-3.5 border border-cyan-500/20 flex items-center justify-between text-left hover:border-cyan-500/40 transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="relative size-12 rounded-xl overflow-hidden shrink-0 border border-white/10">
                    <Image
                      src={liveSession.album.cover_small || liveSession.album.cover}
                      alt={liveSession.title}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-cyan-400 flex items-center gap-1">
                      <Radio className="size-2.5 animate-pulse text-cyan-400" /> Ao Vivo no Vazio
                    </span>
                    <p className="text-xs font-bold text-zinc-100 truncate max-w-[210px]">
                      {liveSession.title}
                    </p>
                    <p className="text-[11px] text-zinc-400">{liveSession.artist.name}</p>
                  </div>
                </div>

                <div className="size-8 rounded-full bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Play className="size-3.5 fill-current translate-x-px" />
                </div>
              </button>
            )}

            {/* ─── 3. Recently Played (Horizontal Scroll) ─── */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold tracking-wide text-zinc-200 uppercase text-[11px]">
                  Tocadas Recentemente
                </h3>
                <button
                  type="button"
                  onClick={goToLibrary}
                  className="text-[11px] text-cyan-400 font-semibold hover:underline"
                >
                  Ver Tudo
                </button>
              </div>

              <div className="flex gap-3.5 overflow-x-auto scrollbar-none pb-1 -mx-5 px-5">
                {recentlyPlayed.map((t) => {
                  const active = currentTrack?.id === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => playTrack(t, tracks)}
                      className="group flex flex-col w-28 shrink-0 text-left"
                    >
                      <div className="relative size-28 rounded-2xl overflow-hidden mb-2 border border-white/10 bg-zinc-900 shadow-md">
                        <Image
                          src={t.album.cover_medium || t.album.cover}
                          alt={t.title}
                          fill
                          sizes="112px"
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                        {active && isPlaying && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="size-3 rounded-full bg-cyan-400 animate-ping" />
                          </div>
                        )}
                      </div>
                      <p className={`text-xs font-semibold truncate ${active ? "text-cyan-400" : "text-zinc-200"}`}>
                        {t.title}
                      </p>
                      <p className="text-[10px] text-zinc-500 truncate">{t.artist.name}</p>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* ─── 4. Trending Now (Vertical Ranked List) ─── */}
            <section className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold tracking-wide text-zinc-200 uppercase text-[11px] flex items-center gap-1.5">
                  <Flame className="size-3.5 text-orange-400" /> Em Alta Agora
                </h3>
                <button
                  type="button"
                  onClick={goToPlaylists}
                  className="text-[11px] text-zinc-400 hover:text-cyan-400 transition-colors"
                >
                  Explorar
                </button>
              </div>

              <div className="space-y-1.5 bg-zinc-950/60 rounded-2xl p-2 border border-white/5">
                {trendingNow.map((t, idx) => {
                  const active = currentTrack?.id === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => playTrack(t, tracks)}
                      className={`flex w-full items-center justify-between p-2 rounded-xl transition-all ${
                        active ? "bg-cyan-500/10 border border-cyan-500/20" : "hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-extrabold text-zinc-500 w-4 text-center">
                          0{idx + 1}
                        </span>
                        <div className="relative size-10 rounded-lg overflow-hidden shrink-0 border border-white/10">
                          <Image
                            src={t.album.cover_small || t.album.cover}
                            alt={t.title}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <div className="text-left min-w-0">
                          <p className={`text-xs font-semibold truncate max-w-[180px] ${active ? "text-cyan-400" : "text-zinc-100"}`}>
                            {t.title}
                          </p>
                          <p className="text-[10px] text-zinc-400 truncate">{t.artist.name}</p>
                        </div>
                      </div>

                      <MoreVertical className="size-4 text-zinc-500 hover:text-zinc-300 shrink-0" />
                    </button>
                  )
                })}
              </div>
            </section>

            {/* ─── 5. Popular Artists (Circle Avatars) ─── */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold tracking-wide text-zinc-200 uppercase text-[11px]">
                Artistas Populares
              </h3>

              <div className="grid grid-cols-4 gap-3 text-center">
                {popularArtists.map((artist) => (
                  <button
                    key={artist.id}
                    type="button"
                    onClick={() => goToArtist(artist.id)}
                    className="flex flex-col items-center group"
                  >
                    <div className="relative size-16 rounded-full overflow-hidden mb-1.5 border-2 border-white/10 group-hover:border-cyan-400 transition-colors shadow-lg">
                      <Image
                        src={artist.picture_medium || artist.picture}
                        alt={artist.name}
                        fill
                        sizes="64px"
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-zinc-300 truncate w-full group-hover:text-cyan-300">
                      {artist.name}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* ─── 6. New Releases (2x2 Grid) ─── */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold tracking-wide text-zinc-200 uppercase text-[11px]">
                Novos Lançamentos
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {newReleases.map((album) => (
                  <div
                    key={album.id}
                    className="group relative overflow-hidden rounded-2xl bg-zinc-900/60 border border-white/10 p-3 hover:border-cyan-500/30 transition-all"
                  >
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-2 bg-black">
                      <Image
                        src={album.cover_medium || album.cover}
                        alt={album.title}
                        fill
                        sizes="180px"
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <p className="text-xs font-bold text-zinc-200 truncate">{album.title}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{album.artist.name}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
