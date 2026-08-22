// ─── Deezer API Client ───────────────────────────────────────────────
// Free, no-auth API for music metadata + 30s audio previews.
// Rate limit: ~50 req / 5 seconds.
// Docs: https://developers.deezer.com/api

// ─── Types ───────────────────────────────────────────────────────────

export type DeezerTrack = {
  id: number
  title: string
  title_short: string
  duration: number          // seconds
  preview: string           // 30s MP3 URL
  artist: DeezerArtistSmall
  album: DeezerAlbumSmall
  position?: number
}

export type DeezerArtistSmall = {
  id: number
  name: string
  picture: string
  picture_small: string
  picture_medium: string
  picture_big: string
  picture_xl: string
}

export type DeezerArtist = DeezerArtistSmall & {
  nb_album: number
  nb_fan: number
  tracklist: string
}

export type DeezerAlbumSmall = {
  id: number
  title: string
  cover: string
  cover_small: string
  cover_medium: string
  cover_big: string
  cover_xl: string
}

export type DeezerAlbum = DeezerAlbumSmall & {
  artist: DeezerArtistSmall
  genre_id: number
  nb_tracks: number
  duration: number
  release_date: string
  tracks?: { data: DeezerTrack[] }
}

export type DeezerChart = {
  tracks: { data: DeezerTrack[] }
  albums: { data: DeezerAlbum[] }
  artists: { data: DeezerArtist[] }
}

export type DeezerSearchResult = {
  data: DeezerTrack[]
  total: number
  next?: string
}

// ─── API Base ────────────────────────────────────────────────────────

const BASE = "https://api.deezer.com"

// Simple in-memory cache (5 min TTL)
const cache = new Map<string, { data: unknown; ts: number }>()
const CACHE_TTL = 5 * 60 * 1000

async function deezerFetch<T>(path: string): Promise<T> {
  const url = `${BASE}${path}`
  const cached = cache.get(url)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data as T
  }

  // Try direct first, fallback to CORS proxy via Next.js API route
  let res: Response
  try {
    res = await fetch(url)
  } catch {
    // If CORS blocks, route through our Next.js proxy
    res = await fetch(`/api/deezer?path=${encodeURIComponent(path)}`)
  }

  if (!res.ok) throw new Error(`Deezer API error: ${res.status}`)
  const data = await res.json()

  cache.set(url, { data, ts: Date.now() })
  return data as T
}

// ─── Public API ──────────────────────────────────────────────────────

/** Get chart (top tracks, albums, artists) */
export async function getChart(): Promise<DeezerChart> {
  return deezerFetch<DeezerChart>("/chart")
}

/** Search tracks by query */
export async function searchTracks(query: string, limit = 25): Promise<DeezerSearchResult> {
  return deezerFetch<DeezerSearchResult>(
    `/search?q=${encodeURIComponent(query)}&limit=${limit}`
  )
}

/** Search everything (tracks, albums, artists) */
export async function searchDeezer(query: string) {
  const tracksRes = await searchTracks(query, 15).catch(() => ({ data: [] }))
  const artistsRes = await deezerFetch<{ data: DeezerArtist[] }>(`/search/artist?q=${encodeURIComponent(query)}&limit=5`).catch(() => ({ data: [] }))
  const albumsRes = await deezerFetch<{ data: DeezerAlbum[] }>(`/search/album?q=${encodeURIComponent(query)}&limit=5`).catch(() => ({ data: [] }))
  return {
    tracks: tracksRes,
    artists: artistsRes,
    albums: albumsRes,
  }
}

/** Get artist details */
export async function getArtist(id: number): Promise<DeezerArtist> {
  return deezerFetch<DeezerArtist>(`/artist/${id}`)
}

/** Get artist's top tracks */
export async function getArtistTopTracks(id: number, limit = 10): Promise<{ data: DeezerTrack[] }> {
  return deezerFetch<{ data: DeezerTrack[] }>(`/artist/${id}/top?limit=${limit}`)
}

/** Get artist's albums */
export async function getArtistAlbums(id: number, limit = 10): Promise<{ data: DeezerAlbum[] }> {
  return deezerFetch<{ data: DeezerAlbum[] }>(`/artist/${id}/albums?limit=${limit}`)
}

/** Get album details */
export async function getAlbum(id: number): Promise<DeezerAlbum> {
  return deezerFetch<DeezerAlbum>(`/album/${id}`)
}

/** Get track details */
export async function getTrack(id: number): Promise<DeezerTrack> {
  return deezerFetch<DeezerTrack>(`/track/${id}`)
}

// ─── Helpers ─────────────────────────────────────────────────────────

/** Format seconds to mm:ss */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

/** Get high-resolution cover URL */
export function getHiResCover(track: DeezerTrack, size: "small" | "medium" | "big" | "xl" = "big"): string {
  return track.album[`cover_${size}`] || track.album.cover
}
