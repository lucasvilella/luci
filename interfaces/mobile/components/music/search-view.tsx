"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Search, X, TrendingUp, Music, Mic2, Disc, Play } from "lucide-react"
import { searchDeezer, type DeezerTrack, type DeezerAlbum, type DeezerArtist } from "@/lib/deezer"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"

const GENRES = [
  { name: "Pop", gradient: "from-fuchsia-600 to-pink-500", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80" },
  { name: "Hip-Hop", gradient: "from-orange-600 to-red-600", image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&q=80" },
  { name: "Rock", gradient: "from-zinc-700 to-zinc-950", image: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&q=80" },
  { name: "Jazz & Blues", gradient: "from-teal-600 to-emerald-800", image: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=300&q=80" },
  { name: "Eletrônica", gradient: "from-cyan-500 to-blue-600", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80" },
  { name: "Chill & Relax", gradient: "from-purple-600 to-indigo-800", image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&q=80" },
]

export function SearchView() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{
    tracks: DeezerTrack[]
    albums: DeezerAlbum[]
    artists: DeezerArtist[]
  }>({ tracks: [], albums: [], artists: [] })
  const [searching, setSearching] = useState(false)

  const { playTrack, currentTrack, isPlaying } = useMusicPlayer()
  const { pop, goToArtist } = useMusicNavigation()

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ tracks: [], albums: [], artists: [] })
      return
    }

    const timer = setTimeout(() => {
      setSearching(true)
      searchDeezer(query)
        .then((res) => {
          setResults({
            tracks: res.tracks.data || [],
            albums: res.albums.data || [],
            artists: res.artists.data || [],
          })
        })
        .catch(console.error)
        .finally(() => setSearching(false))
    }, 350)

    return () => clearTimeout(timer)
  }, [query])

  return (
    <div className="flex h-full flex-col bg-[#08080A] text-white animate-view-in select-none">
      {/* ─── Search Header ─── */}
      <header className="p-5 border-b border-white/5 bg-[#08080A]/90 backdrop-blur-xl">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 size-4.5 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Artistas, músicas ou podcasts..."
            autoFocus
            className="w-full rounded-2xl bg-zinc-900/90 py-3 pl-11 pr-10 text-sm font-medium text-white placeholder-zinc-500 border border-white/10 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all shadow-inner"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3.5 text-zinc-400 hover:text-white"
              aria-label="Limpar busca"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </header>

      {/* ─── Body: Results or Browse All ─── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 scrollbar-none pb-28">
        {searching ? (
          <div className="flex h-60 items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          </div>
        ) : query.trim() ? (
          /* ─── Active Search Results ─── */
          <div className="space-y-6">
            {/* Tracks */}
            {results.tracks.length > 0 && (
              <section className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Músicas Encontradas
                </h3>
                <div className="space-y-1 bg-zinc-950/60 rounded-2xl p-2 border border-white/5">
                  {results.tracks.slice(0, 8).map((t) => {
                    const active = currentTrack?.id === t.id
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => playTrack(t, results.tracks)}
                        className={`flex w-full items-center gap-3 p-2 rounded-xl text-left transition-all ${
                          active ? "bg-cyan-500/10 border border-cyan-500/20" : "hover:bg-white/5"
                        }`}
                      >
                        <div className="relative size-11 rounded-lg overflow-hidden shrink-0 border border-white/10">
                          <Image
                            src={t.album.cover_small || t.album.cover}
                            alt={t.title}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                          {active && isPlaying && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="size-2.5 rounded-full bg-cyan-400 animate-ping" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-semibold truncate ${active ? "text-cyan-400" : "text-zinc-100"}`}>
                            {t.title}
                          </p>
                          <p className="text-[10px] text-zinc-400 truncate">{t.artist.name}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Artists */}
            {results.artists.length > 0 && (
              <section className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-fuchsia-400">
                  Artistas
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {results.artists.slice(0, 3).map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => goToArtist(a.id)}
                      className="flex flex-col items-center p-3 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-fuchsia-500/30 transition-all text-center"
                    >
                      <div className="relative size-14 rounded-full overflow-hidden mb-1.5 border-2 border-white/10 shadow-md">
                        <Image
                          src={a.picture_medium || a.picture}
                          alt={a.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-zinc-200 truncate w-full">
                        {a.name}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          /* ─── Default: Browse All Genres & Trends ─── */
          <>
            <section className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Navegar por Todos os Gêneros
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {GENRES.map((g) => (
                  <button
                    key={g.name}
                    type="button"
                    onClick={() => setQuery(g.name)}
                    className={`relative h-28 overflow-hidden rounded-2xl p-3.5 text-left bg-gradient-to-br ${g.gradient} border border-white/15 shadow-lg group active:scale-[0.98] transition-all`}
                  >
                    <span className="text-sm font-extrabold text-white tracking-wide z-10 relative">
                      {g.name}
                    </span>

                    <div className="absolute -right-3 -bottom-3 size-20 rounded-xl overflow-hidden shadow-2xl rotate-12 group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300">
                      <Image src={g.image} alt={g.name} fill sizes="80px" className="object-cover" />
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Trending Tags */}
            <section className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <TrendingUp className="size-3.5 text-cyan-400" /> Buscas Mais Populares
                </h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {["Billie Eilish", "Cyberpunk Synth", "The Weeknd", "Alok", "Vintage Lo-Fi"].map(
                  (tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setQuery(tag)}
                      className="rounded-full bg-zinc-900 border border-white/10 px-3.5 py-1.5 text-xs text-zinc-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-all active:scale-95"
                    >
                      {tag}
                    </button>
                  )
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
