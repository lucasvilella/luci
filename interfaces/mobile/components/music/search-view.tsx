"use client"

import { useState, useEffect } from "react"
import { Search, X, Music, Mic2, Disc, Play, ArrowLeft, Loader2, ListMusic, History, Trash2, ChevronRight, Sparkles } from "lucide-react"
import { searchMusic, fetchDynamicGenres, type LuciTrack } from "@/lib/lucimusic"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { TrackImage } from "./track-image"

// Paleta fixa em código CSS puro para garantir 100% de cor viva sem depender do Tailwind safelist
const GENRE_STYLES: Record<string, { bg: string; text: string }> = {
  "Sertanejo": { bg: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)", text: "#FFFFFF" },
  "Pop": { bg: "linear-gradient(135deg, #EA580C 0%, #C2410C 100%)", text: "#FFFFFF" },
  "Funk Brasil": { bg: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)", text: "#FFFFFF" },
  "Indie & Rock": { bg: "linear-gradient(135deg, #D946EF 0%, #A21CAF 100%)", text: "#FFFFFF" },
  "R&B & Soul": { bg: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)", text: "#FFFFFF" },
  "Eletrônica": { bg: "linear-gradient(135deg, #10B981 0%, #047857 100%)", text: "#FFFFFF" },
  "Trap & Rap": { bg: "linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)", text: "#FFFFFF" },
  "Pagode & Samba": { bg: "linear-gradient(135deg, #06B6D4 0%, #0E7490 100%)", text: "#FFFFFF" },
  "MPB & Acústico": { bg: "linear-gradient(135deg, #F97316 0%, #C2410C 100%)", text: "#FFFFFF" },
  "K-Pop": { bg: "linear-gradient(135deg, #84CC16 0%, #4D7C0F 100%)", text: "#FFFFFF" },
  "Lofi & Foco": { bg: "linear-gradient(135deg, #14B8A6 0%, #0F766E 100%)", text: "#FFFFFF" },
  "Reggaeton & Latino": { bg: "linear-gradient(135deg, #E11D48 0%, #9F1239 100%)", text: "#FFFFFF" },
}

// 12 Artistas Recomendados (3 linhas x 4 colunas) calibrados com o seu gosto musical
const SUGGESTED_ARTISTS = [
  { id: "UC86xOhUitK56NVSH1u-eldg", name: "Hugo & Guilherme", thumbnail: "https://yt3.googleusercontent.com/qU3srQm6y6J7ILCiGrqMWxUtJVQ_LfNJwf4L4dTtHjzY_uQkJbEyTIZLxCfhLnAyRy27cs8HLhOA_XQs=w400-h400-p-l90-rj" },
  { id: "UC6IT6ReWQ5UrfI5ctUDerSw", name: "Clayton & Romário", thumbnail: "https://lh3.googleusercontent.com/doaAu2-23IwQ3516OM0R_gMNQR6RnYQUqAaWK0ixKZP_hQ7gvM4BAvhGttkSosDms83WYcWsoFpvdco=w400-h400-p-l90-rj" },
  { id: "UC-g0dJZGCPLIb7yoFndqmRA", name: "Murilo Huff", thumbnail: "https://yt3.googleusercontent.com/fEBSbvm1h1v-N3vqhYQ6BLUP78tuk5M8M_SCwyKxfBqxb1Wcjpa4dBLxN81AyKTdZYFf8rgl=w400-h400-l90-rj" },
  { id: "UCMoYu0mVhcdW5IyZoWoYNBQ", name: "Felipe e Rodrigo", thumbnail: "https://yt3.googleusercontent.com/qtRxvWgQBPLRwlWIycKaj19ht6MVsAQe1H_0o5h4pRaF6rCTVj_lr4b4gqEpKG3cLrdxAV5ZEXJBAw=w400-h400-p-l90-rj" },
  { id: "UC4pGi_gzx-ZlR1VVhFSrG8w", name: "MC Kako", thumbnail: "https://yt3.googleusercontent.com/ehwx08Jl5k-sh49us0coaaIF4E6H7pjiIcmv5hX5lcQJTrFsjvMzskdmXqK_MC1m0vrEOXx-=w400-h400-l90-rj" },
  { id: "UCf28WctYS7hBbDQSgDdS_7w", name: "Jorge & Mateus", thumbnail: "https://lh3.googleusercontent.com/eaGuRLB-CrqZ2n_ZBcxJFWZsLqyHdSZINUnIBx6DJpPSDCgDlB6IsC-gC5Gd2b416s0oQbZ0zWgJqWI=w400-h400-p-l90-rj" },
  { id: "UCt8Ihy3hj9uHGXKTpO214AQ", name: "Henrique & Juliano", thumbnail: "https://lh3.googleusercontent.com/FkRYhIqHJj-8HFPeA6V_vqVIWTFoAh7LMWbZtDHl9TozaTXK3TLqrUJaCHFgn4Rryz7I5c5g5wFUmmtf=w400-h400-p-l90-rj" },
  { id: "UCm_-Z3AAyEEAciecu61h8XA", name: "Panda", thumbnail: "https://lh3.googleusercontent.com/H9p3PGJsPryag_qmCOfStskSHc7hYBrPsilqTpzGK-2mh6jsnDGuZ5vBieD1-3VDQJFY8eQyc0r4qPg=w400-h400-p-l90-rj" },
  { id: "UCtm1o_NsVVPW0zT25epyXEQ", name: "Belchior", thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80" },
  { id: "UCfNt4pLMJ0yBnl4Q8tbzOTw", name: "Jorge Vercillo", thumbnail: "https://lh3.googleusercontent.com/xLUmgapGyMiZCOYHwqz2zUmAaR5k5BtWBOEn4LRoupxPJ3Y8rB1VgSS_W_leXk6WqI2iT9OHN1x0t1A=w400-h400-p-l90-rj" },
  { id: "UCeEjdvNGeXbzCmuWrHp9lXw", name: "Liniker", thumbnail: "https://lh3.googleusercontent.com/v3T_rBFEX_PXq_qkUK9j2BFXLndVHsKnzZniHFISqUKerYuz6AiTYKqADDcUgnvCxZWz5kty5alYEA0=w400-h400-p-l90-rj" },
  { id: "UC2DXTFA6ACS0Qb9QtFlAVDg", name: "Lauana Prado", thumbnail: "https://yt3.googleusercontent.com/R25FLUYUZNQW8OjD-kVKMNfUP9NLMT2fyx9nr88DMDQ11uECMkoIvGo9r-O_9x8QeYf9cPnbWCkzGuI=w400-h400-p-l90-rj" },
]

export function SearchView() {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "songs" | "artists" | "albums">("all")
  const [dynamicGenres, setDynamicGenres] = useState<Array<{ name: string; color: string; artist_name: string; image: string }>>([])
  const [results, setResults] = useState<{
    songs: LuciTrack[]
    artists: any[]
    albums: any[]
    playlists: any[]
  }>({ songs: [], artists: [], albums: [], playlists: [] })
  const [searching, setSearching] = useState(false)

  const { playTrack, currentTrack } = useMusicPlayer()
  const { pop, goToArtist } = useMusicNavigation()

  useEffect(() => {
    fetchDynamicGenres().then((data) => {
      if (data && data.length > 0) {
        setDynamicGenres(data)
      } else {
        // Fallback robusto garantido com cores vivas
        setDynamicGenres([
          { name: "Sertanejo", color: "bg-[#F59E0B]", artist_name: "Gusttavo Lima", image: "https://yt3.googleusercontent.com/imUegM2yh9tclL4BBEdtfil_5T9pOItdZfnU4Rch-iAGCbQ65O_rR55Q2Lj9BtU9-6srQ_AVhIejSnxv=w400-h400-l90-rj" },
          { name: "Pop", color: "bg-[#EA580C]", artist_name: "Dua Lipa", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80" },
          { name: "Funk Brasil", color: "bg-[#8B5CF6]", artist_name: "MC Cabelinho", image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80" },
          { name: "Indie & Rock", color: "bg-[#D946EF]", artist_name: "Arctic Monkeys", image: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&q=80" },
          { name: "R&B & Soul", color: "bg-[#3B82F6]", artist_name: "The Weeknd", image: "https://yt3.googleusercontent.com/R_cjQK3wwLPEzri1jerx-79zgzGocoKvwGU3NMONaTsaMM0Idd641pfB8r5jgfpn6I8JAoFtf9RBIcI=w400-h400-l90-rj" },
          { name: "Eletrônica", color: "bg-[#10B981]", artist_name: "Alok", image: "https://yt3.googleusercontent.com/y_x4Zmg9v2k_pQ=w400-h400-l90-rj" },
          { name: "Trap & Rap", color: "bg-[#EF4444]", artist_name: "Matuê", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80" },
          { name: "Pagode & Samba", color: "bg-[#06B6D4]", artist_name: "Menos É Mais", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80" },
        ])
      }
    })
  }, [])

  // Busca debounced
  useEffect(() => {
    if (!query.trim()) {
      setResults({ songs: [], artists: [], albums: [], playlists: [] })
      return
    }

    const timer = setTimeout(() => {
      setSearching(true)
      const apiFilter = filter === "all" ? undefined : filter
      searchMusic(query, apiFilter)
        .then((res) => {
          setResults({
            songs: res.songs || [],
            artists: res.artists || [],
            albums: res.albums || [],
            playlists: res.playlists || [],
          })
        })
        .catch(console.error)
        .finally(() => setSearching(false))
    }, 300)

    return () => clearTimeout(timer)
  }, [query, filter])

  return (
    <div className="flex h-full flex-col bg-[#F8FAFC] text-zinc-900 animate-view-in select-none">
      {/* ─── Header de Busca ─── */}
      <header className="px-6 pt-5 pb-3 bg-white border-b border-zinc-200/60 space-y-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={pop}
            className="size-10 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-700 active:scale-95 transition-transform"
            aria-label="Voltar"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="O que você quer ouvir?"
              className="w-full bg-zinc-100 text-sm pl-10 pr-9 py-2.5 rounded-2xl outline-none text-zinc-900 border border-zinc-200 focus:border-[#22C55E]"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Chips de Filtro */}
        {query && (
          <div className="flex gap-2">
            {(["all", "songs", "artists", "albums"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                  filter === f
                    ? "bg-[#22C55E] text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {f === "all" ? "Tudo" : f === "songs" ? "Músicas" : f === "artists" ? "Artistas" : "Álbuns"}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ─── Conteúdo ─── */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-7 pb-28 no-scrollbar">
        {searching ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
            <Loader2 className="size-8 animate-spin text-[#22C55E]" />
            <p className="text-xs">Buscando...</p>
          </div>
        ) : query ? (
          /* 1. Resultados da Busca */
          <div className="space-y-6">
            {results.songs.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500">MÚSICAS</h3>
                <div className="space-y-2">
                  {results.songs.map((track) => {
                    const isThisPlaying = currentTrack?.id === track.id
                    return (
                      <div
                        key={track.id}
                        onClick={() => playTrack(track, results.songs)}
                        className="flex items-center gap-3.5 p-2 bg-white rounded-2xl border border-zinc-200/60 shadow-sm hover:border-zinc-300 transition-all cursor-pointer group"
                      >
                        <TrackImage
                          src={track.thumbnail}
                          trackId={track.id}
                          alt={track.title}
                          className="size-13 rounded-xl object-cover bg-zinc-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0 pr-2">
                          <p className={`text-sm font-bold truncate ${isThisPlaying ? "text-[#22C55E]" : "text-zinc-900"}`}>
                            {track.title}
                          </p>
                          <p className="text-xs text-zinc-500 truncate mt-0.5">{track.artist}</p>
                        </div>
                        <div className="size-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 group-hover:bg-[#22C55E] group-hover:text-white transition-colors">
                          <Play className="size-3.5 fill-current ml-0.5" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {results.artists.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500">ARTISTAS</h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
                  {results.artists.map((art) => (
                    <div
                      key={art.id}
                      onClick={() => goToArtist(art.id)}
                      className="shrink-0 w-24 flex flex-col items-center text-center cursor-pointer group"
                    >
                      <img
                        src={art.thumbnail || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&q=80"}
                        alt={art.name}
                        referrerPolicy="no-referrer"
                        className="size-20 rounded-full object-cover shadow-md group-hover:scale-105 transition-transform"
                      />
                      <p className="text-xs font-bold text-zinc-900 truncate w-full mt-2">
                        {art.name}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          /* 2. Tela Inicial da Busca: Artistas Recomendados + Gêneros em Alta */
          <>
            {/* Seção 1: Artistas Recomendados (3 linhas x 4 colunas = 12 artistas) */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 font-sans">
                  ARTISTAS SUGERIDOS
                </h2>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {SUGGESTED_ARTISTS.map((artist) => (
                  <div
                    key={artist.name}
                    onClick={() => goToArtist(artist.id)}
                    className="flex flex-col items-center text-center cursor-pointer group active:scale-95 transition-transform"
                  >
                    <div className="relative size-16 rounded-full overflow-hidden mb-1.5 shadow-md border-2 border-white bg-zinc-200">
                      <img
                        src={artist.thumbnail}
                        alt={artist.name}
                        referrerPolicy="no-referrer"
                        className="size-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <p className="text-[11px] font-bold text-zinc-800 truncate w-full leading-tight">
                      {artist.name}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Seção 2: Grade de Gêneros Rotativos com Cores Ricas e Títulos 100% Nítidos */}
            <section className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 font-sans">
                  NAVEGAR POR GÊNEROS
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {dynamicGenres.map((genre) => {
                  const style = GENRE_STYLES[genre.name] || {
                    bg: "linear-gradient(135deg, #4F46E5 0%, #312E81 100%)",
                    text: "#FFFFFF"
                  }
                  return (
                    <div
                      key={genre.name}
                      onClick={() => setQuery(genre.name)}
                      style={{ background: style.bg }}
                      className="relative h-28 rounded-3xl overflow-hidden p-4 shadow-md cursor-pointer transition-all active:scale-[0.98] hover:shadow-lg border border-black/5"
                    >
                      <div className="max-w-[55%] relative z-10 space-y-0.5">
                        <span className="text-sm font-extrabold text-white tracking-tight block leading-snug drop-shadow-sm">
                          {genre.name}
                        </span>
                        <span className="text-[11px] text-white/90 font-semibold truncate block drop-shadow-sm">
                          {genre.artist_name}
                        </span>
                      </div>

                      {/* Foto Real do Artista Recortada Inclinada */}
                      <img
                        src={genre.image}
                        alt={genre.artist_name || genre.name}
                        referrerPolicy="no-referrer"
                        className="absolute -right-2 -bottom-2 size-20 rounded-2xl object-cover rotate-[15deg] shadow-2xl border-2 border-white/30"
                      />
                    </div>
                  )
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
