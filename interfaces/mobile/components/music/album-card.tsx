"use client"

import Image from "next/image"
import { Play } from "lucide-react"
import type { DeezerAlbum, DeezerTrack } from "@/lib/deezer"
import { useMusicPlayer } from "@/hooks/use-music-player"

type Props = {
  album: DeezerAlbum
  tracks?: DeezerTrack[]
}

export function AlbumCard({ album, tracks }: Props) {
  const { playTrack } = useMusicPlayer()

  function handlePlay() {
    if (tracks && tracks.length > 0) {
      playTrack(tracks[0], tracks)
    }
  }

  return (
    <button
      type="button"
      onClick={handlePlay}
      className="group flex w-40 shrink-0 flex-col gap-2 text-left transition-transform active:scale-[0.97]"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
        <Image
          src={album.cover_big || album.cover_medium || album.cover}
          alt={album.title}
          fill
          sizes="160px"
          className="object-cover transition-transform group-hover:scale-105"
        />
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/50 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex size-9 items-center justify-center rounded-full bg-music-accent shadow-lg">
            <Play className="size-4 fill-current text-black" aria-hidden="true" />
          </span>
        </div>
      </div>
      <div className="px-0.5">
        <p className="truncate text-sm font-semibold text-white">{album.title}</p>
        {album.artist && (
          <p className="truncate text-xs text-white/50">{album.artist.name}</p>
        )}
      </div>
    </button>
  )
}
