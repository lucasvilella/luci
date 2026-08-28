/**
 * Cliente de API e Tipos para o módulo LuciMusic.
 * Integração direta com o backend FastAPI (ytmusicapi, yt-dlp, LRCLIB e SQLite).
 */

import { luciApiFetch } from "./api"

export interface LuciTrack {
  id: string
  title: string
  artist: string
  artistId?: string
  album?: string
  thumbnail: string
  duration: number
  durationFormatted?: string
  audioUrl?: string
}

export interface DailyMix {
  id: string
  title: string
  subtitle: string
  gradient: string
  thumbnail: string
  tracks: LuciTrack[]
}

export interface CreatedByLuciPlaylist {
  id: string
  title: string
  subtitle: string
  gradient: string
  thumbnail?: string
  tracks_count?: number
  is_ai_generated?: boolean | number
}

export interface AlbumItem {
  id: string
  title: string
  artist: string
  year?: string
  thumbnail: string
}

export interface SimilarityPlaylist {
  id: string
  title: string
  subtitle: string
  gradient: string
  thumbnail?: string
  tracks: LuciTrack[]
}

export interface LuciMoment {
  id: string
  title: string
  subtitle: string
  type: string
  cover_gradient: string
}

export interface MadeForYouItem {
  playlist_id: string
  title: string
  subtitle: string
  reason: string
  cover: string
  gradient?: string
  tracks: LuciTrack[]
}

export interface MusicHomeFeed {
  greeting?: string
  mood_active?: string
  quick_access?: LuciTrack[]
  moments?: LuciMoment[]
  top_artists?: Array<{ id: string; name: string; thumbnail: string }>
  made_for_you?: MadeForYouItem[]
  discover_releases?: LuciTrack[]
  trending_brasil?: LuciTrack[]
  based_on_listened?: SimilarityPlaylist[]
  favorite_albums?: AlbumItem[]
  recommended_artists?: Array<{ id: string; name: string; thumbnail: string }>
  created_by_luci?: CreatedByLuciPlaylist[]
  daily_mixes?: DailyMix[]
  recently_played?: LuciTrack[]
  liked_preview?: LuciTrack[]
  trending_br?: LuciTrack[]
  new_releases?: LuciTrack[]
}

export interface LyricsLine {
  time: number
  timeFormatted: string
  text: string
}

export interface LyricsData {
  has_synced: boolean
  synced_lrc?: string | null
  lines: LyricsLine[]
  plain: string
}

export interface ArtistDetails {
  id: string
  name: string
  banner_url?: string
  avatar_url?: string
  thumbnail: string
  description?: string
  bio?: string
  listeners?: string
  subscribers?: string
  monthly_listeners?: string
  is_followed?: boolean
  top_tracks: LuciTrack[]
  latest_release?: {
    id: string
    title: string
    type: string
    release_date: string
    cover: string
  } | null
  albums: Array<{
    id: string
    title: string
    year?: string
    thumbnail: string
  }>
  singles?: Array<{
    id: string
    title: string
    year?: string
    thumbnail: string
  }>
  videos?: Array<{
    id: string
    title: string
    thumbnail: string
    views?: string
  }>
  similar_artists?: Array<{
    id: string
    name: string
    thumbnail: string
    avatar?: string
  }>
}

export interface MediaCollectionTrack {
  id: string
  track_number: number
  title: string
  artist: string
  album?: string
  duration: number
  thumbnail?: string
  is_liked?: boolean
}

export interface MediaCollectionDetails {
  collection_type: "album" | "playlist"
  id: string
  title: string
  artist: string
  artist_id?: string
  release_year: string
  total_tracks: number
  total_duration: string
  cover_url: string
  copyright?: string
  is_saved: boolean
  is_smart_ai?: boolean
  tracks: MediaCollectionTrack[]
  related_collections?: Array<{
    id: string
    title: string
    artist: string
    cover_url: string
  }>
}

export interface UserPlaylist {
  id: string
  title: string
  description?: string
  thumbnail?: string
  track_count: number
  created_at: number
  tracks?: LuciTrack[]
}

export function formatSeconds(s: number): string {
  if (!s || isNaN(s) || s < 0) return "0:00"
  const mins = Math.floor(s / 60)
  const secs = Math.floor(s % 60)
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`
}

// ─── Chamadas de API ───

export async function fetchMusicHome(mood = "all"): Promise<MusicHomeFeed> {
  const res = await luciApiFetch(`/api/v1/music/home?mood=${encodeURIComponent(mood)}`)
  if (!res.ok) throw new Error("Falha ao carregar feed de música")
  return res.json()
}

export async function recordTrackEvent(payload: {
  track_id: string
  played_seconds: number
  total_seconds: number
  liked?: boolean
  skipped?: boolean
  context_mood?: string
  artist?: string
}): Promise<void> {
  try {
    await luciApiFetch("/api/v1/music/track-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  } catch {}
}

export interface SearchSuggestionEntity {
  id: string
  type: "artist" | "album" | "song"
  name: string
  avatar: string
  subtitle: string
}

export interface SearchSuggestionsResponse {
  entities: SearchSuggestionEntity[]
  queries: string[]
}

export interface SearchHistoryItem {
  id: number
  query_text: string
  entity_type: string
  target_id: string
  searched_at: string
}

export interface TopSearchResult {
  id: string
  type: "artist" | "album" | "song"
  name: string
  followers: string
  avatar: string
  has_radio: boolean
}

export interface SearchResultsResponse {
  type?: string
  reasoning?: string
  top_result?: TopSearchResult | null
  tracks: LuciTrack[]
  songs: LuciTrack[]
  artists: any[]
  albums: any[]
  playlists: any[]
}

export async function fetchSearchSuggestions(q: string): Promise<SearchSuggestionsResponse> {
  const res = await luciApiFetch(`/api/v1/music/search/suggestions?q=${encodeURIComponent(q)}`)
  if (!res.ok) return { entities: [], queries: [] }
  return res.json()
}

export async function fetchSearchHistory(limit = 5): Promise<SearchHistoryItem[]> {
  const res = await luciApiFetch(`/api/v1/music/search/history?limit=${limit}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.history || []
}

export async function clearSearchHistory(): Promise<void> {
  await luciApiFetch("/api/v1/music/search/history", { method: "DELETE" })
}

export async function deleteSearchHistoryItem(id: number): Promise<void> {
  await luciApiFetch(`/api/v1/music/search/history/${id}`, { method: "DELETE" })
}

export async function searchMusic(q: string, filter?: string): Promise<SearchResultsResponse> {
  const params = new URLSearchParams({ q })
  if (filter && filter !== "all") params.append("filter", filter)
  const res = await luciApiFetch(`/api/v1/music/search?${params.toString()}`)
  if (!res.ok) throw new Error("Falha na busca")
  return res.json()
}

export function getAudioStreamUrl(trackId: string): string {
  if (typeof window === "undefined") return `/api/v1/music/play/${trackId}`
  return `${window.location.origin}/api/v1/music/play/${trackId}`
}

export async function fetchTrackStream(trackId: string): Promise<{ stream_url: string }> {
  const res = await luciApiFetch(`/api/v1/music/stream/${trackId}`)
  if (!res.ok) throw new Error("Falha ao resolver áudio")
  return res.json()
}

export async function fetchLyrics(trackId: string, title: string, artist: string, duration = 0): Promise<LyricsData> {
  const params = new URLSearchParams({
    track_id: trackId,
    title,
    artist,
    duration: duration.toString()
  })
  const res = await luciApiFetch(`/api/v1/music/lyrics?${params.toString()}`)
  if (!res.ok) throw new Error("Falha ao obter letras")
  return res.json()
}

export async function fetchRadioTracks(trackId: string): Promise<LuciTrack[]> {
  const res = await luciApiFetch(`/api/v1/music/radio/${trackId}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.tracks || []
}

export async function fetchArtist(artistId: string): Promise<ArtistDetails> {
  const res = await luciApiFetch(`/api/v1/music/artist/${encodeURIComponent(artistId)}`)
  if (!res.ok) throw new Error("Falha ao buscar artista")
  return res.json()
}

export async function fetchArtistRadio(artistId: string): Promise<LuciTrack[]> {
  const res = await luciApiFetch(`/api/v1/music/artist/${encodeURIComponent(artistId)}/radio`)
  if (!res.ok) return []
  const data = await res.json()
  return data.tracks || []
}

export async function toggleFollowArtist(artistId: string, artistName: string, avatarUrl = ""): Promise<boolean> {
  const res = await luciApiFetch(`/api/v1/music/artist/${encodeURIComponent(artistId)}/follow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ follow: true, artist_name: artistName, avatar_url: avatarUrl })
  })
  if (!res.ok) return false
  const data = await res.json()
  return data.is_followed
}

export async function toggleLikeTrack(track: LuciTrack): Promise<boolean> {
  const res = await luciApiFetch("/api/v1/music/like", {
    method: "POST",
    body: JSON.stringify(track)
  })
  if (!res.ok) return false
  const data = await res.json()
  return data.is_liked
}

export async function fetchLikedTracks(): Promise<LuciTrack[]> {
  const res = await luciApiFetch("/api/v1/music/liked")
  if (!res.ok) return []
  const data = await res.json()
  return data.liked_songs || []
}

export async function recordTrackPlayed(track: LuciTrack): Promise<void> {
  try {
    await luciApiFetch("/api/v1/music/history", {
      method: "POST",
      body: JSON.stringify(track)
    })
  } catch {}
}

export async function fetchPlaylists(): Promise<UserPlaylist[]> {
  const res = await luciApiFetch("/api/v1/music/playlists")
  if (!res.ok) return []
  const data = await res.json()
  return data.playlists || []
}

export async function fetchDynamicGenres(): Promise<Array<{ name: string; color: string; artist_name: string; image: string }>> {
  try {
    const res = await luciApiFetch("/api/v1/music/genres")
    if (!res.ok) return []
    const data = await res.json()
    return data.genres || []
  } catch {
    return []
  }
}

export async function createPlaylist(title: string, description = ""): Promise<UserPlaylist> {
  const res = await luciApiFetch("/api/v1/music/playlists", {
    method: "POST",
    body: JSON.stringify({ title, description })
  })
  if (!res.ok) throw new Error("Erro ao criar playlist")
  return res.json()
}

export async function addTrackToPlaylist(playlistId: string, track: LuciTrack): Promise<void> {
  await luciApiFetch(`/api/v1/music/playlists/${encodeURIComponent(playlistId)}/tracks`, {
    method: "POST",
    body: JSON.stringify(track)
  })
}

export interface AlbumDetails {
  id: string
  title: string
  artist: string
  artist_id?: string
  artist_thumbnail?: string
  year?: string
  thumbnail: string
  tracks: LuciTrack[]
  more_from_artist?: Array<{
    id: string
    title: string
    artist: string
    year: string
    thumbnail: string
  }>
  you_might_like?: Array<{
    id: string
    title: string
    artist: string
    year: string
    thumbnail: string
  }>
}

export async function fetchCollectionDetails(
  collectionType: "album" | "playlist",
  collectionId: string,
  title?: string,
  artist?: string
): Promise<MediaCollectionDetails> {
  if (collectionType === "playlist") {
    const res = await luciApiFetch(`/api/v1/music/playlist/${encodeURIComponent(collectionId)}`)
    if (!res.ok) throw new Error("Falha ao buscar playlist")
    return res.json()
  } else {
    const params = new URLSearchParams()
    if (title) params.append("title", title)
    if (artist) params.append("artist", artist)
    const res = await luciApiFetch(`/api/v1/music/album/${encodeURIComponent(collectionId)}?${params.toString()}`)
    if (!res.ok) throw new Error("Falha ao buscar álbum")
    return res.json()
  }
}

export async function toggleFavoriteCollection(
  collectionId: string,
  collectionType: "album" | "playlist",
  title = "",
  artist = "",
  coverUrl = ""
): Promise<boolean> {
  const res = await luciApiFetch(`/api/v1/music/collection/${encodeURIComponent(collectionId)}/favorite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ collection_type: collectionType, favorite: true, title, artist, cover_url: coverUrl })
  })
  if (!res.ok) return false
  const data = await res.json()
  return data.is_saved
}

export async function fetchAlbumDetails(
  albumId: string,
  title?: string,
  artist?: string
): Promise<AlbumDetails> {
  const params = new URLSearchParams()
  if (title) params.append("title", title)
  if (artist) params.append("artist", artist)
  const res = await luciApiFetch(`/api/v1/music/album/${encodeURIComponent(albumId)}?${params.toString()}`)
  if (!res.ok) throw new Error("Falha ao buscar detalhes do álbum")
  return res.json()
}

export async function recordTasteSignal(
  trackId: string,
  artist: string,
  signalType: "completed" | "skipped_early" | "liked" | "replayed" | "added_to_playlist",
  context = "app_playback"
): Promise<void> {
  try {
    await luciApiFetch("/api/v1/music/signal", {
      method: "POST",
      body: JSON.stringify({
        track_id: trackId,
        artist: artist,
        signal_type: signalType,
        context: context
      })
    })
  } catch {}
}


