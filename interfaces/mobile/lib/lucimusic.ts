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

export interface MusicHomeFeed {
  created_by_luci?: CreatedByLuciPlaylist[]
  daily_mixes: DailyMix[]
  recently_played: LuciTrack[]
  liked_preview: LuciTrack[]
  trending_brasil: LuciTrack[]
  new_releases?: LuciTrack[]
  based_on_listened?: SimilarityPlaylist[]
  favorite_albums?: AlbumItem[]
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
  description?: string
  thumbnail: string
  top_tracks: LuciTrack[]
  albums: Array<{
    id: string
    title: string
    year?: string
    thumbnail: string
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

export async function fetchMusicHome(): Promise<MusicHomeFeed> {
  const res = await luciApiFetch("/api/v1/music/home")
  if (!res.ok) throw new Error("Falha ao carregar feed de música")
  return res.json()
}

export async function searchMusic(q: string, filter?: string): Promise<{
  songs: LuciTrack[]
  artists: any[]
  albums: any[]
  playlists: any[]
}> {
  const params = new URLSearchParams({ q })
  if (filter) params.append("filter", filter)
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
  const res = await luciApiFetch(`/api/v1/music/artist/${artistId}`)
  if (!res.ok) throw new Error("Falha ao buscar artista")
  return res.json()
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

