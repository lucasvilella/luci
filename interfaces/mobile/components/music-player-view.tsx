"use client"

import { MusicPlayerProvider } from "@/hooks/use-music-player"
import { MusicNavigationProvider, useMusicNavigation } from "@/hooks/use-music-navigation"
import { MusicHome } from "@/components/music/music-home"
import { NowPlaying } from "@/components/music/now-playing"
import { ArtistPage } from "@/components/music/artist-page"
import { LyricsView } from "@/components/music/lyrics-view"
import { SearchView } from "@/components/music/search-view"
import { PlaylistsScreen } from "@/components/music/playlists-screen"
import { PlaylistDetailView } from "@/components/music/playlist-detail-view"
import { AlbumDetailView } from "@/components/music/album-detail-view"
import { LibraryScreen } from "@/components/music/library-screen"
import { ProfileScreen } from "@/components/music/profile-screen"
import { SettingsScreen } from "@/components/music/settings-screen"
import { MiniPlayer } from "@/components/music/mini-player"

function MusicScreenRouter({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const { screen } = useMusicNavigation()

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#F8FAFC]">
      <div className="flex-1 overflow-hidden">
        {screen.type === "home" && <MusicHome onOpenMenu={onOpenMenu} />}
        {screen.type === "now-playing" && <NowPlaying />}
        {screen.type === "artist" && <ArtistPage artistId={screen.artistId} />}
        {screen.type === "lyrics" && <LyricsView />}
        {screen.type === "search" && <SearchView />}
        {screen.type === "playlists" && <PlaylistsScreen />}
        {screen.type === "playlist-detail" && (
          <PlaylistDetailView
            key={`${screen.playlistId || "detail"}-${screen.title || "mix"}`}
            playlistId={screen.playlistId}
            title={screen.title}
            thumbnail={screen.thumbnail}
            initialTracks={screen.initialTracks}
          />
        )}
        {screen.type === "album-detail" && (
          <AlbumDetailView
            key={`${screen.albumId || "album"}-${screen.title || "title"}`}
            albumId={screen.albumId}
            title={screen.title}
            artist={screen.artist}
            thumbnail={screen.thumbnail}
            initialTracks={screen.initialTracks}
          />
        )}
        {screen.type === "library" && <LibraryScreen />}
        {screen.type === "profile" && <ProfileScreen />}
        {screen.type === "settings" && <SettingsScreen />}
      </div>
      <MiniPlayer />
    </div>
  )
}

export function MusicPlayerView({ onOpenMenu }: { onOpenMenu?: () => void }) {
  return (
    <MusicPlayerProvider>
      <MusicNavigationProvider>
        <MusicScreenRouter onOpenMenu={onOpenMenu} />
      </MusicNavigationProvider>
    </MusicPlayerProvider>
  )
}
