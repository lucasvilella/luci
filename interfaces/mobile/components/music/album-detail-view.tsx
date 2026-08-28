"use client"

import { MediaCollectionScreen } from "./media-collection-screen"
import type { LuciTrack } from "@/lib/lucimusic"

interface AlbumDetailProps {
  albumId?: string | number
  title?: string
  artist?: string
  thumbnail?: string
  initialTracks?: LuciTrack[]
}

export function AlbumDetailView({
  albumId,
  title,
  artist,
  thumbnail,
  initialTracks,
}: AlbumDetailProps) {
  return (
    <MediaCollectionScreen
      collectionType="album"
      collectionId={albumId ? String(albumId) : undefined}
      initialTitle={title}
      initialArtist={artist}
      initialThumbnail={thumbnail}
      initialTracks={initialTracks}
    />
  )
}
