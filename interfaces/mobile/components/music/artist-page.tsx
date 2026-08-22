"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ChevronLeft, MoreVertical } from "lucide-react"
import {
  getArtist,
  getArtistTopTracks,
  getArtistAlbums,
  type DeezerArtist,
  type DeezerTrack,
  type DeezerAlbum,
} from "@/lib/deezer"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { TrackRow } from "./track-row"

export function ArtistPage({ artistId }: { artistId: number }) {
  const { pop } = useMusicNavigation()
  const [artist, setArtist] = useState<DeezerArtist | null>(null)
  const [tracks, setTracks] = useState<DeezerTrack[]>([])
  const [albums, setAlbums] = useState<DeezerAlbum[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getArtist(artistId),
      getArtistTopTracks(artistId, 10),
      getArtistAlbums(artistId, 6),
    ])
      .then(([a, t, alb]) => {
        setArtist(a)
        setTracks(t.data)
        setAlbums(alb.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [artistId])

  return (
    <div className="flex h-full flex-col bg-[#0d0d0d] animate-view-in">
      {/* Header controls overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 pb-2 pt-4">
        <button
          type="button"
          onClick={pop}
          aria-label="Voltar"
          className="flex size-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md"
        >
          <ChevronLeft className="size-6 text-white" />
        </button>
        <button
          type="button"
          aria-label="Mais opções"
          className="flex size-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md"
        >
          <MoreVertical className="size-5 text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {loading ? (
          <div className="flex h-60 items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-2 border-music-accent border-t-transparent" />
          </div>
        ) : artist ? (
          <>
            {/* Hero Image */}
            <div className="relative h-64 w-full">
              <Image
                src={artist.picture_xl || artist.picture_big || artist.picture}
                alt={artist.name}
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-black/30" />
            </div>

            {/* Artist Info */}
            <div className="px-5 -mt-6 relative z-10 text-center">
              <h1 className="text-2xl font-bold text-white">{artist.name}</h1>
              <p className="mt-1 text-xs text-white/50">
                {artist.nb_album} Álbuns · {artist.nb_fan.toLocaleString("pt-BR")} Fãs
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white/40 line-clamp-3">
                Ouça os maiores sucessos, novos lançamentos e álbuns completos de {artist.name}.
              </p>
            </div>

            {/* Albums horizontal scroll */}
            {albums.length > 0 && (
              <div className="mt-6">
                <div className="mb-3 px-5">
                  <h2 className="text-base font-bold text-white">Álbuns</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto px-5 scrollbar-hide">
                  {albums.map((album) => (
                    <div
                      key={album.id}
                      className="flex w-32 shrink-0 flex-col gap-2 transition-transform active:scale-[0.97]"
                    >
                      <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
                        <Image
                          src={album.cover_medium || album.cover}
                          alt={album.title}
                          fill
                          sizes="128px"
                          className="object-cover"
                        />
                      </div>
                      <p className="truncate text-xs font-semibold text-white">{album.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Songs */}
            <div className="mt-6 px-2">
              <div className="mb-2 flex items-center justify-between px-3">
                <h2 className="text-base font-bold text-white">Músicas Populares</h2>
              </div>
              {tracks.map((track) => (
                <TrackRow key={track.id} track={track} context={tracks} />
              ))}
            </div>
          </>
        ) : (
          <p className="p-5 text-center text-white/40">Artista não encontrado</p>
        )}
      </div>
    </div>
  )
}
