"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, Play, Disc, Music, Loader2 } from "lucide-react"
import { fetchArtist, type ArtistDetails } from "@/lib/lucimusic"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { TrackImage } from "./track-image"

export function ArtistPage({ artistId }: { artistId: string | number }) {
  const { pop } = useMusicNavigation()
  const { playTrack, currentTrack, isPlaying } = useMusicPlayer()
  const [artist, setArtist] = useState<ArtistDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchArtist(String(artistId))
      .then((data) => setArtist(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [artistId])

  return (
    <div className="flex h-full flex-col bg-[#08080A] text-white animate-view-in select-none">
      {/* ─── Header Controls ─── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-3 pb-2 bg-gradient-to-b from-black/80 to-transparent">
        <button
          type="button"
          onClick={pop}
          aria-label="Voltar"
          className="flex size-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-md text-white border border-white/10"
        >
          <ChevronLeft className="size-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-28">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-zinc-500">
            <Loader2 className="size-7 animate-spin text-indigo-400" />
            <p className="text-xs">Carregando perfil do artista...</p>
          </div>
        ) : artist ? (
          <>
            {/* ─── Hero Artista ─── */}
            <div className="relative h-60 w-full overflow-hidden">
              <TrackImage
                src={artist.thumbnail}
                alt={artist.name}
                className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#08080A] via-[#08080A]/40 to-transparent" />
              <div className="absolute bottom-4 left-5 right-5 flex justify-between items-end">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">
                    Artista Verificado
                  </span>
                  <h1 className="text-xl font-bold text-white leading-tight mt-0.5">
                    {artist.name}
                  </h1>
                </div>
                {artist.top_tracks.length > 0 && (
                  <button
                    onClick={() => playTrack(artist.top_tracks[0], artist.top_tracks)}
                    className="size-11 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                    aria-label="Tocar Artista"
                  >
                    <Play className="size-5 fill-white ml-0.5" />
                  </button>
                )}
              </div>
            </div>

            {/* ─── Top Músicas ─── */}
            <div className="px-5 py-4 space-y-4">
              {artist.top_tracks.length > 0 && (
                <section className="space-y-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Music className="size-3.5 text-indigo-400" /> Populares
                  </h2>
                  <div className="space-y-1">
                    {artist.top_tracks.map((track, idx) => (
                      <div
                        key={track.id}
                        onClick={() => playTrack(track, artist.top_tracks)}
                        className={`flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer ${
                          currentTrack?.id === track.id ? "bg-indigo-500/15 border border-indigo-500/30" : "hover:bg-white/5"
                        }`}
                      >
                        <span className="w-4 text-center text-xs text-zinc-500 font-mono">{idx + 1}</span>
                        <TrackImage
                          src={track.thumbnail}
                          trackId={track.id}
                          alt={track.title}
                          className="size-10 rounded-lg object-cover bg-zinc-800 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold truncate ${currentTrack?.id === track.id ? "text-indigo-400" : "text-white"}`}>
                            {track.title}
                          </p>
                          <p className="text-[10px] text-zinc-400 truncate mt-0.5">{track.album || artist.name}</p>
                        </div>
                        <span className="text-[11px] text-zinc-400 px-2">{track.durationFormatted}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ─── Álbuns & Singles ─── */}
              {artist.albums.length > 0 && (
                <section className="space-y-2 pt-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Disc className="size-3.5 text-purple-400" /> Discografia & Álbuns
                  </h2>
                  <div className="grid grid-cols-2 gap-2.5">
                    {artist.albums.map((album) => (
                      <div
                        key={album.id}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/15 transition-all cursor-pointer"
                      >
                        <TrackImage
                          src={album.thumbnail}
                          alt={album.title}
                          className="size-12 rounded-lg object-cover bg-zinc-800 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{album.title}</p>
                          <p className="text-[10px] text-zinc-400 truncate mt-0.5">{album.year || "Álbum"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
