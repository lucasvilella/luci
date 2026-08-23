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
    <div className="flex h-full flex-col bg-[#F8FAFC] text-zinc-900 animate-view-in select-none">
      {/* ─── Header Controls Flutuante ─── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 pt-5 pb-2">
        <button
          type="button"
          onClick={pop}
          aria-label="Voltar"
          className="flex size-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-zinc-700 shadow-md border border-zinc-200/60 active:scale-95 transition-transform"
        >
          <ChevronLeft className="size-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-28 no-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-zinc-400">
            <Loader2 className="size-8 animate-spin text-[#22C55E]" />
            <p className="text-xs">Carregando perfil do artista...</p>
          </div>
        ) : artist ? (
          <>
            {/* ─── Hero Artista (Light Mode com Transição Curva) ─── */}
            <div className="relative h-64 w-full overflow-hidden bg-zinc-200">
              <TrackImage
                src={artist.thumbnail}
                alt={artist.name}
                className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/30 to-transparent" />
              <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#22C55E]">
                    Artista Verificado
                  </span>
                  <h1 className="text-2xl font-bold text-zinc-900 leading-tight mt-0.5 font-sans">
                    {artist.name}
                  </h1>
                </div>
                {artist.top_tracks.length > 0 && (
                  <button
                    onClick={() => playTrack(artist.top_tracks[0], artist.top_tracks)}
                    className="size-13 rounded-full bg-[#22C55E] text-white flex items-center justify-center shadow-xl shadow-[#22C55E]/30 active:scale-95 transition-transform"
                    aria-label="Tocar Artista"
                  >
                    <Play className="size-6 fill-white ml-0.5" />
                  </button>
                )}
              </div>
            </div>

            {/* ─── Top Músicas e Discografia ─── */}
            <div className="px-6 py-4 space-y-6">
              {artist.top_tracks.length > 0 && (
                <section className="space-y-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <Music className="size-3.5 text-[#22C55E]" /> Populares
                  </h2>

                  <div className="space-y-2">
                    {artist.top_tracks.map((track, i) => {
                      const isThisPlaying = currentTrack?.id === track.id && isPlaying
                      return (
                        <div
                          key={track.id}
                          onClick={() => playTrack(track, artist.top_tracks)}
                          className="flex items-center gap-3.5 p-2 bg-white rounded-2xl border border-zinc-200/60 shadow-sm hover:border-zinc-300 transition-all cursor-pointer group"
                        >
                          <span className="w-4 text-center text-xs font-bold text-zinc-400">
                            {i + 1}
                          </span>
                          <TrackImage
                            src={track.thumbnail}
                            trackId={track.id}
                            alt={track.title}
                            className="size-12 rounded-xl object-cover bg-zinc-100 shrink-0"
                          />
                          <div className="flex-1 min-w-0 pr-2">
                            <p className={`text-sm font-bold truncate ${isThisPlaying ? "text-[#22C55E]" : "text-zinc-900"}`}>
                              {track.title}
                            </p>
                            <p className="text-xs text-zinc-500 truncate mt-0.5">
                              {track.album || artist.name}
                            </p>
                          </div>
                          <span className="text-xs text-zinc-400 pr-2">
                            {track.durationFormatted || "0:00"}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Discografia & Álbuns */}
              {artist.albums && artist.albums.length > 0 && (
                <section className="space-y-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <Disc className="size-3.5 text-[#22C55E]" /> Discografia & Álbuns
                  </h2>

                  <div className="grid grid-cols-2 gap-3">
                    {artist.albums.map((album) => (
                      <div
                        key={album.id}
                        className="p-3 rounded-2xl bg-white border border-zinc-200/60 shadow-sm flex items-center gap-3 cursor-pointer hover:border-zinc-300 transition-all"
                      >
                        <TrackImage
                          src={album.thumbnail}
                          alt={album.title}
                          className="size-12 rounded-xl object-cover bg-zinc-100 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-zinc-900 truncate">
                            {album.title}
                          </p>
                          <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                            {album.year || "Álbum"}
                          </p>
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
