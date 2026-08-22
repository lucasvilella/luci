"use client"

import { MusicPlayerProvider } from "@/hooks/use-music-player"
import { MusicNavigationProvider, useMusicNavigation } from "@/hooks/use-music-navigation"
import { MusicHome } from "@/components/music/music-home"
import { NowPlaying } from "@/components/music/now-playing"
import { ArtistPage } from "@/components/music/artist-page"
import { LyricsView } from "@/components/music/lyrics-view"
import { SearchView } from "@/components/music/search-view"
import { PlaylistsScreen } from "@/components/music/playlists-screen"
import { LibraryScreen } from "@/components/music/library-screen"
import { ProfileScreen } from "@/components/music/profile-screen"
import { SettingsScreen } from "@/components/music/settings-screen"
import { MiniPlayer } from "@/components/music/mini-player"

function MusicScreenRouter() {
  const { screen } = useMusicNavigation()

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#08080A]">
      <div className="flex-1 overflow-hidden">
        {screen.type === "home" && <MusicHome />}
        {screen.type === "now-playing" && <NowPlaying />}
        {screen.type === "artist" && <ArtistPage artistId={screen.artistId} />}
        {screen.type === "lyrics" && <LyricsView />}
        {screen.type === "search" && <SearchView />}
        {screen.type === "playlists" && <PlaylistsScreen />}
        {screen.type === "library" && <LibraryScreen />}
        {screen.type === "profile" && <ProfileScreen />}
        {screen.type === "settings" && <SettingsScreen />}
      </div>
      <MiniPlayer />
    </div>
  )
}

export function MusicPlayerView() {
  return (
    <MusicPlayerProvider>
      <MusicNavigationProvider>
        <MusicScreenRouter />
      </MusicNavigationProvider>
    </MusicPlayerProvider>
  )
}
