"use client"

import { MediaCollectionScreen } from "./media-collection-screen"
import type { LuciTrack } from "@/lib/lucimusic"

interface PlaylistDetailProps {
  playlistId?: string | number
  title?: string
  thumbnail?: string
  initialTracks?: LuciTrack[]
}

export function PlaylistDetailView({
  playlistId,
  title,
  thumbnail,
  initialTracks,
}: PlaylistDetailProps) {
  return (
    <MediaCollectionScreen
      collectionType="playlist"
      collectionId={playlistId ? String(playlistId) : undefined}
      initialTitle={title}
      initialArtist="Curadoria Luci"
      initialThumbnail={thumbnail}
      initialTracks={initialTracks}
    />
  )
}
