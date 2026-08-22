"use client"

import { useState, useEffect } from "react"
import { Search, X, Music, Mic2, Disc, Play, ArrowLeft, Loader2, ListMusic } from "lucide-react"
import { searchMusic, type LuciTrack } from "@/lib/lucimusic"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { TrackImage } from "./track-image"

const MOODS_AND_GENRES = [
  { name: "Pop", color: "from-pink-600 to-rose-700" },
  { name: "Hip-Hop", color: "from-amber-600 to-orange-700" },
  { name: "Rock", color: "from-red-600 to-rose-900" },
  { name: "Dance & Eletrônica", color: "from-indigo-600 to-purple-700" },
  { name: "Lofi & Chill", color: "from-teal-600 to-emerald-700" },
  { name: "Sertanejo", color: "from-yellow-600 to-amber-800" },
  { name: "Funk & Brasil", color: "from-violet-600 to-purple-800" },
  { name: "R&B & Soul", color: "from-cyan-600 to-blue-800" },
]

export function SearchView() {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "songs" | "artists" | "albums">("all")
  const [results, setResults] = useState<{
    songs: LuciTrack[]
    artists: any[]
    albums: any[]
    playlists: any[]
  }>({ songs: [], artists: [], albums: [], playlists: [] })
  const [searching, setSearching] = useState(false)

  const { playTrack, currentTrack } = useMusicPlayer()
  const { pop, goToArtist } = useMusicNavigation()

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ songs: [], artists: [], albums: [], playlists: [] })
      return
    }

    const timer = setTimeout(() => {
      setSearching(true)
      const apiFilter = filter === "all" ? undefined : filter
      searchMusic(query, apiFilter)
        .then((res) => {
          setResults({
            songs: res.songs || [],
            artists: res.artists || [],
            albums: res.albums || [],
            playlists: res.playlists || [],
          })
        })
        .catch(console.error)
        .finally(() => setSearching(false))
    }, 300)

    return () => clearTimeout(timer)
  }, [query, filter])

  return (
    <div className="flex h-full flex-col bg-[#0b0c10] text-white animate-view-in select-none">
      {/* ─── Search Header SimpMusic ─── */}
      <header className="p-4 bg-[#0b0c10] space-y-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={pop}
            className="p-2 text-zinc-300 hover:text-white transition-colors active:scale-95"
            aria-label="Voltar"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-3.5 size-4 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search songs, artists, podcasts..."
              className="w-full h-11 pl-10 pr-10 rounded-2xl bg-white/[0.08] text-sm text-white placeholder-zinc-400 focus:outline-none focus:bg-white/[0.12] transition-colors"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3.5 text-zinc-400 hover:text-white"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* ─── Filtros SimpMusic Chips ─── */}
        {query.trim() && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            {[
              { id: "all", label: "Top" },
              { id: "songs", label: "Songs" },
              { id: "artists", label: "Artists" },
              { id: "albums", label: "Albums" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-3.5 py-1.5 rounded-full font-medium transition-all shrink-0 ${
                  filter === f.id
                    ? "bg-white text-black font-bold shadow-sm"
                    : "bg-white/10 text-zinc-300 hover:bg-white/15"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ─── Conteúdo ─── */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-6 pb-28 no-scrollbar">
        {searching && (
          <div className="flex items-center justify-center py-20 gap-2 text-zinc-400">
            <Loader2 className="size-5 animate-spin text-white" />
            <span className="text-xs">Searching YouTube Music...</span>
          </div>
        )}

        {!searching && !query.trim() && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white tracking-tight">Moods & Genres</h3>
            <div className="grid grid-cols-2 gap-3">
              {MOODS_AND_GENRES.map((g) => (
                <div
                  key={g.name}
                  onClick={() => setQuery(g.name)}
                  className={`h-24 rounded-2xl p-3.5 flex items-end justify-start bg-gradient-to-br ${g.color} cursor-pointer active:scale-95 transition-transform shadow-md`}
                >
                  <span className="font-bold text-base text-white tracking-tight leading-tight">
                    {g.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!searching && query.trim() && (
          <>
            {/* Músicas */}
            {results.songs.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-lg font-bold text-white tracking-tight">Songs</h3>
                <div className="space-y-2">
                  {results.songs.map((track) => (
                    <div
                      key={track.id}
                      onClick={() => playTrack(track, results.songs)}
                      className="flex items-center gap-3.5 p-1.5 rounded-xl hover:bg-white/[0.06] transition-all cursor-pointer group"
                    >
                      <TrackImage
                        src={track.thumbnail}
                        trackId={track.id}
                        alt={track.title}
                        className="size-12 rounded-xl object-cover bg-zinc-800 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${
                          currentTrack?.id === track.id ? "text-indigo-400" : "text-white"
                        }`}>
                          {track.title}
                        </p>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">{track.artist}</p>
                      </div>
                      <span className="text-xs text-zinc-400 font-mono pr-2">{track.durationFormatted}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Artistas */}
            {results.artists.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-lg font-bold text-white tracking-tight">Artists</h3>
                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                  {results.artists.map((artist) => (
                    <div
                      key={artist.id}
                      onClick={() => goToArtist(artist.id)}
                      className="flex flex-col items-center gap-2 shrink-0 w-24 cursor-pointer group active:scale-95"
                    >
                      <div className="size-20 rounded-full overflow-hidden bg-zinc-800 border border-white/10 shadow-md">
                        <TrackImage
                          src={artist.thumbnail}
                          alt={artist.name}
                          className="size-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <p className="text-xs font-bold text-center text-white line-clamp-1 w-full">
                        {artist.name}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
