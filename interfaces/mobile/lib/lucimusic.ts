/**
 * Cliente de API e Tipos para o módulo LuciMusic.
 * Integração direta com o backend FastAPI (ytmusicapi, yt-dlp, LRCLIB e SQLite).
 */

import { luciApiFetch, getApiBaseUrl } from "./api"

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

export interface ContinueListeningItem {
  id: string
  type: "album" | "playlist"
  title: string
  subtitle: string
  cover_url: string
  last_track_index?: number
}

export interface StructuredDailyMix {
  mix_id: number
  title: string
  subtitle: string
  gradient: string
  cover_url: string
  tracks?: LuciTrack[]
}

export interface RecommendedArtistItem {
  id: string
  name: string
  avatar: string
  reason?: string
}

export interface MusicHomeFeed {
  greeting?: string
  mood_active?: string
  continue_listening?: ContinueListeningItem[]
  daily_mixes?: StructuredDailyMix[]
  favorite_artists?: Array<{ id: string; name: string; thumbnail?: string; avatar?: string }>
  recommended_artists?: RecommendedArtistItem[]
  trending_brasil?: LuciTrack[]
  new_releases?: LuciTrack[]
  custom_workout?: {
    title: string
    subtitle: string
    tracks: LuciTrack[]
  }
  custom_focus?: {
    title: string
    subtitle: string
    tracks: LuciTrack[]
  }
  quick_access?: LuciTrack[]
  moments?: LuciMoment[]
  top_artists?: Array<{ id: string; name: string; thumbnail: string }>
  made_for_you?: MadeForYouItem[]
  discover_releases?: LuciTrack[]
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
  try {
    const res = await luciApiFetch(`/api/v1/music/home?mood=${encodeURIComponent(mood)}`)
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.warn("[LuciMusic] Backend offline ou bloqueado por CORS, usando catálogo local:", err)
  }

  // Fallback offline com catálogo oficial
  return {
    hero: {
      id: "hero_trend_1",
      title: "Starboy",
      artist: "The Weeknd",
      description: "Top 1 Global • Mais tocada da semana",
      thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
      stream_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      duration: 230,
    },
    moods: ["all", "relax", "workout", "focus", "party", "sleep"],
    sections: [
      {
        id: "trending_now",
        title: "Em Alta",
        type: "tracks",
        items: [
          { id: "tr_1", title: "Starboy", artist: "The Weeknd", thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400", duration: 230 },
          { id: "tr_2", title: "Sweetener", artist: "Ariana Grande", thumbnail: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400", duration: 208 },
          { id: "tr_3", title: "Sharks", artist: "Imagine Dragons", thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400", duration: 195 },
          { id: "tr_4", title: "BREAK MY SOUL", artist: "Beyonce", thumbnail: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400", duration: 278 },
        ],
      },
    ],
  }
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

export async function searchTracks(q: string): Promise<LuciTrack[]> {
  try {
    const data = await searchMusic(q)
    return data.tracks || data.songs || []
  } catch {
    return []
  }
}

export function getAudioStreamUrl(trackId: string, title?: string, artist?: string): string {
  const base = getApiBaseUrl()
  const params = new URLSearchParams()
  params.set("ngrok-skip-browser-warning", "1")
  if (title) params.set("title", title)
  if (artist) params.set("artist", artist)
  return `${base}/api/v1/music/play/${encodeURIComponent(trackId)}?${params.toString()}`
}

export async function fetchTrackStream(trackId: string, title?: string, artist?: string): Promise<{ stream_url: string }> {
  const params = new URLSearchParams()
  if (title) params.set("title", title)
  if (artist) params.set("artist", artist)
  const qs = params.toString() ? `?${params.toString()}` : ""
  const res = await luciApiFetch(`/api/v1/music/stream/${encodeURIComponent(trackId)}${qs}`)
  if (!res.ok) throw new Error("Falha ao resolver áudio")
  const data = await res.json()
  if (data?.stream_url && data.stream_url.startsWith("/")) {
    data.stream_url = `${getApiBaseUrl()}${data.stream_url}${data.stream_url.includes("?") ? "&" : "?"}ngrok-skip-browser-warning=1`
  }
  return data
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

export interface LibrarySummary {
  liked_summary: {
    total_tracks: number
    preview_tracks: Array<{
      id: string
      title: string
      artist: string
      cover: string
    }>
  }
  tracks: LuciTrack[]
  playlists: Array<{
    id: string
    title: string
    author?: string
    count?: number
    track_count?: number
    thumbnail?: string
  }>
  artists: Array<{
    id: string
    name: string
    avatar: string
    is_followed: boolean
  }>
  albums: Array<{
    id: string
    title: string
    artist: string
    cover: string
  }>
  downloads: LuciTrack[]
}

export async function fetchLibrarySummary(filter = "all", view = "list"): Promise<LibrarySummary> {
  const params = new URLSearchParams({ filter, view })
  const res = await luciApiFetch(`/api/v1/music/library?${params.toString()}`)
  if (!res.ok) throw new Error("Falha ao carregar biblioteca")
  return res.json()
}

export async function createPlaylist(
  title: string,
  description = "",
  isSmartAi = false,
  prompt = ""
): Promise<UserPlaylist> {
  const res = await luciApiFetch("/api/v1/music/library/playlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description, is_smart_ai: isSmartAi, prompt })
  })
  if (!res.ok) throw new Error("Erro ao criar playlist")
  return res.json()
}

export async function addTrackToPlaylistById(playlistId: string, track: LuciTrack): Promise<void> {
  await luciApiFetch(`/api/v1/music/playlist/${encodeURIComponent(playlistId)}/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      track_id: track.id,
      title: track.title,
      artist: track.artist,
      duration: track.duration || 0,
      cover_url: track.thumbnail || "",
    }),
  })
}

export async function createPlaylistWithTrack(
  title: string,
  track: LuciTrack,
  description = ""
): Promise<UserPlaylist> {
  const res = await luciApiFetch("/api/v1/music/playlist/create-with-track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      description,
      initial_track: {
        track_id: track.id,
        title: track.title,
        artist: track.artist,
        duration: track.duration || 0,
        cover_url: track.thumbnail || "",
      },
    }),
  })
  if (!res.ok) throw new Error("Erro ao criar playlist com faixa inicial")
  const data = await res.json()
  return data.playlist
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

export async function updatePlaylistMetadata(
  playlistId: string,
  data: { title: string; description?: string; cover_mode?: string; custom_cover_url?: string }
): Promise<boolean> {
  const res = await luciApiFetch(`/api/v1/music/playlist/${encodeURIComponent(playlistId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  return res.ok
}

export async function deletePlaylistById(playlistId: string): Promise<boolean> {
  const res = await luciApiFetch(`/api/v1/music/playlist/${encodeURIComponent(playlistId)}`, {
    method: "DELETE",
  })
  return res.ok
}

export async function fetchAudioSettings(): Promise<any> {
  const res = await luciApiFetch("/api/v1/music/settings/audio")
  if (!res.ok) return null
  return res.json()
}

export async function updateAudioSettings(data: any): Promise<any> {
  const res = await luciApiFetch("/api/v1/music/settings/audio", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) return null
  return res.json()
}


