"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Search,
  X,
  Mic,
  Radio,
  Clock,
  Trash2,
  ArrowUpRight,
  Play,
  Shuffle,
  Heart,
  MoreVertical,
  Loader2,
  Sparkles,
  Disc,
  Users,
  Music2,
  ListPlus,
  Share2,
  Disc3,
  FileText,
} from "lucide-react"
import {
  type LuciTrack,
  type SearchSuggestionEntity,
  type SearchHistoryItem,
  type TopSearchResult,
  type SearchResultsResponse,
  fetchSearchSuggestions,
  fetchSearchHistory,
  clearSearchHistory,
  deleteSearchHistoryItem,
  searchMusic,
  recordTrackEvent,
} from "@/lib/lucimusic"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { TrackImage } from "./track-image"

// Categorias fixas de Gêneros & Moods (Cards 2 colunas com gradientes elegantes)
const GENRE_CARDS = [
  { name: "Sertanejo", query: "Sertanejo Sucessos", gradient: "from-[#F59E0B] to-[#B45309]" },
  { name: "MPB & Acústico", query: "MPB Acustico Clássicos", gradient: "from-[#F97316] to-[#C2410C]" },
  { name: "Rock Clássico", query: "Rock Classico Anos 70 80", gradient: "from-[#EF4444] to-[#991B1B]" },
  { name: "Forró & Piseiro", query: "Forro Piseiro Sucessos", gradient: "from-[#8B5CF6] to-[#5B21B6]" },
  { name: "Synthwave", query: "Synthwave Instrumental Retrowave", gradient: "from-[#D946EF] to-[#86198F]" },
  { name: "Foco / Deep Work", query: "Lofi Beats Foco Estudo", gradient: "from-[#0033ff] to-[#06003d]" },
  { name: "Treino / Workout", query: "Eletronica Treino Academia", gradient: "from-[#10B981] to-[#047857]" },
  { name: "Relax / Dormir", query: "Musica Relaxante Calma", gradient: "from-[#3B82F6] to-[#1E3A8A]" },
]

const SEARCH_TABS = [
  { id: "all", label: "Tudo" },
  { id: "songs", label: "Músicas" },
  { id: "artists", label: "Artistas" },
  { id: "albums", label: "Álbuns" },
  { id: "playlists", label: "Playlists" },
]

export function SearchView() {
  const [query, setQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  // Estado 1: Histórico Recente
  const [historyItems, setHistoryItems] = useState<SearchHistoryItem[]>([])

  // Estado 2: Autocomplete / Typing
  const [suggestions, setSuggestions] = useState<{ entities: SearchSuggestionEntity[]; queries: string[] }>({
    entities: [],
    queries: [],
  })
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  // Estado 3: Resultados Estruturados
  const [hasSearched, setHasSearched] = useState(false)
  const [results, setResults] = useState<SearchResultsResponse | null>(null)
  const [searching, setSearching] = useState(false)

  // Action Sheet de Faixa
  const [actionSheetTrack, setActionSheetTrack] = useState<LuciTrack | null>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { playTrack, currentTrack, addToQueue, toggleLike, isLiked } = useMusicPlayer()
  const { goToArtist, goToAlbumDetail, goToPlaylistDetail, goToLyrics } = useMusicNavigation()

  // Carrega histórico recente ao montar
  const loadHistory = useCallback(() => {
    fetchSearchHistory(5).then((data) => setHistoryItems(data))
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // Debounce de 250ms para Autocomplete (Estado 2)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!query.trim() || hasSearched) {
      setSuggestions({ entities: [], queries: [] })
      setLoadingSuggestions(false)
      return
    }

    setLoadingSuggestions(true)
    debounceTimerRef.current = setTimeout(() => {
      fetchSearchSuggestions(query.trim())
        .then((data) => {
          setSuggestions(data)
          setLoadingSuggestions(false)
        })
        .catch(() => setLoadingSuggestions(false))
    }, 250)

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [query, hasSearched])

  // Executa busca completa (Estado 3)
  const executeSearch = (searchTerm: string, tab = activeTab) => {
    const term = searchTerm.trim()
    if (!term) return

    setQuery(term)
    setHasSearched(true)
    setIsFocused(false)
    setSearching(true)

    searchMusic(term, tab)
      .then((data) => {
        setResults(data)
        setSearching(false)
        loadHistory()
      })
      .catch((err) => {
        console.error("[SearchView] Erro busca:", err)
        setSearching(false)
      })
  }

  const handleClearQuery = () => {
    setQuery("")
    setHasSearched(false)
    setResults(null)
    setSuggestions({ entities: [], queries: [] })
    inputRef.current?.focus()
  }

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    if (query.trim()) {
      executeSearch(query, tabId)
    }
  }

  const handlePlaySingle = (track: LuciTrack, context?: LuciTrack[]) => {
    playTrack(track, context)
    recordTrackEvent({
      track_id: track.id,
      played_seconds: 1,
      total_seconds: track.duration || 180,
      context_mood: "search",
      artist: track.artist,
    })
  }

  const handleTouchStart = (track: LuciTrack) => {
    longPressTimerRef.current = setTimeout(() => {
      setActionSheetTrack(track)
    }, 550)
  }

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  // Define qual estado exibir
  const isTypingState = Boolean(query.trim() && !hasSearched)
  const isResultsState = Boolean(hasSearched)
  const isInitialState = !isTypingState && !isResultsState

  return (
    <div className="relative flex h-full flex-col bg-[var(--bg-app)] text-[var(--text-primary)] select-none overflow-y-auto pb-32">
      {/* ─── A. Barra de Busca Inteligente (Sticky Top Bar) ─── */}
      <header className="sticky top-0 z-20 px-5 pt-4 pb-3 bg-[var(--bg-surface-glass)] backdrop-blur-xl border-b border-[var(--border)]">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            executeSearch(query)
          }}
          className="relative flex items-center w-full"
        >
          {/* Ícone Lupa Esquerdo */}
          <Search className="absolute left-4 size-4.5 text-[var(--text-secondary)] pointer-events-none" />

          {/* Input de Texto */}
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (hasSearched) setHasSearched(false)
            }}
            onFocus={() => setIsFocused(true)}
            placeholder="Artistas, músicas, humores ou peça à Luci..."
            className="w-full h-12 pl-11 pr-12 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] text-sm font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-secondary)] focus:ring-2 focus:ring-[var(--accent-secondary)]/20 transition-all"
          />

          {/* Ícone Direito Dinâmico (Limpar ou Orb/Mic) */}
          {query ? (
            <button
              type="button"
              onClick={handleClearQuery}
              aria-label="Limpar texto"
              className="absolute right-3.5 size-7 flex items-center justify-center rounded-full bg-white/10 text-[var(--text-secondary)] hover:text-white active:scale-90 transition-all"
            >
              <X className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              aria-label="Identificar Som ou Falar"
              className="absolute right-3.5 size-7 flex items-center justify-center rounded-full bg-gradient-to-tr from-[#0033ff] to-[#977dff] text-white shadow-md active:scale-90 transition-all"
            >
              <Mic className="size-3.5" />
            </button>
          )}
        </form>
      </header>

      {/* ─── ESTADO 1: INICIAL / DESCOBERTA (Input Vazio) ─── */}
      {isInitialState && (
        <div className="space-y-6 px-5 pt-4">
          {/* Banner Cognitivo: Reconhecer Som / Identificar com o Orb */}
          <div
            onClick={() => executeSearch("Top Brasil Reconhecimento Inteligente")}
            className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-r from-[#0033ff] via-[#977dff] to-[#ffccf2] text-white shadow-lg shadow-[#0033ff]/20 cursor-pointer active:scale-[0.99] transition-transform flex items-center justify-between"
          >
            <div className="space-y-1 z-10 max-w-[70%]">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/25 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md">
                <Sparkles className="size-3 text-[var(--accent-pink)]" />
                Luci Cognitiva
              </span>
              <h3 className="text-sm font-black text-white leading-tight">
                Ouvir Som / Cantarolar
              </h3>
              <p className="text-[11px] text-white/80 font-medium leading-tight">
                Identifique músicas no ambiente ou busque por vibe
              </p>
            </div>
            <div className="size-11 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Radio className="size-5 text-white animate-pulse" />
            </div>
          </div>

          {/* Histórico Recente */}
          {historyItems.length > 0 && (
            <section className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                  Buscas Recentes
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    clearSearchHistory().then(() => setHistoryItems([]))
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <Trash2 className="size-3.5" />
                  <span>Limpar</span>
                </button>
              </div>

              <div className="space-y-1">
                {historyItems.map((item) => (
                  <div
                    key={`hist-${item.id}`}
                    onClick={() => executeSearch(item.query_text)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--accent-purple)]/30 cursor-pointer active:scale-95 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Clock className="size-4 text-[var(--text-secondary)] shrink-0" />
                      <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {item.query_text}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteSearchHistoryItem(item.id).then(() => {
                          setHistoryItems((prev) => prev.filter((h) => h.id !== item.id))
                        })
                      }}
                      className="p-1 text-[var(--text-muted)] hover:text-white transition-colors"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Grade de Gêneros & Moods (2 Colunas) */}
          <section className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
              Navegar por Gêneros & Moods
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {GENRE_CARDS.map((genre) => (
                <div
                  key={genre.name}
                  onClick={() => executeSearch(genre.query)}
                  className={`relative overflow-hidden h-24 rounded-2xl p-3.5 bg-gradient-to-br ${genre.gradient} text-white shadow-md cursor-pointer active:scale-95 transition-transform flex flex-col justify-between group`}
                >
                  <div className="absolute -right-4 -bottom-4 size-16 rounded-full bg-white/10 blur-md group-hover:scale-125 transition-transform" />
                  <span className="text-xs font-black text-white leading-tight drop-shadow-sm">
                    {genre.name}
                  </span>
                  <div className="flex justify-end">
                    <div className="size-6 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center">
                      <Play className="size-3 fill-white text-white translate-x-0.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ─── ESTADO 2: AUTOCOMPLETE / TYPING (Enquanto Digita) ─── */}
      {isTypingState && (
        <div className="space-y-4 px-5 pt-3">
          {loadingSuggestions ? (
            <div className="flex items-center justify-center py-16 gap-2 text-[var(--text-secondary)]">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-xs font-bold">Buscando sugestões...</span>
            </div>
          ) : (
            <>
              {/* Entidades Diretas (Artistas / Álbuns) */}
              {suggestions.entities && suggestions.entities.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
                    Acesso Direto
                  </h3>
                  <div className="space-y-1.5">
                    {suggestions.entities.map((entity) => (
                      <div
                        key={`ent-${entity.id}`}
                        onClick={() => {
                          if (entity.type === "artist") goToArtist(entity.id)
                          else if (entity.type === "album") goToAlbumDetail(entity.id, entity.name)
                          else executeSearch(entity.name)
                        }}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--accent-purple)]/40 cursor-pointer active:scale-95 transition-all"
                      >
                        <img
                          src={entity.avatar || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200"}
                          alt={entity.name}
                          className={`size-11 object-cover bg-zinc-900 ${
                            entity.type === "artist" ? "rounded-full" : "rounded-lg"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">
                            {entity.name}
                          </h4>
                          <span className="text-[10px] font-semibold text-[var(--text-secondary)]">
                            {entity.subtitle}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Lista de Termos Sugeridos com botão (↗) */}
              {suggestions.queries && suggestions.queries.length > 0 && (
                <section className="space-y-1">
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                    Sugestões
                  </h3>
                  {suggestions.queries.map((qText, idx) => (
                    <div
                      key={`sug-${idx}`}
                      onClick={() => executeSearch(qText)}
                      className="flex items-center justify-between px-3 py-3 rounded-xl bg-[var(--bg-surface)]/60 hover:bg-[var(--bg-surface)] border border-[var(--border)] cursor-pointer active:scale-95 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Search className="size-4 text-[var(--text-secondary)] shrink-0" />
                        <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {qText}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setQuery(qText)
                        }}
                        className="p-1 text-[var(--text-secondary)] hover:text-white"
                      >
                        <ArrowUpRight className="size-4" />
                      </button>
                    </div>
                  ))}
                </section>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── ESTADO 3: RESULTADOS ESTRUTURADOS (Submissão) ─── */}
      {isResultsState && (
        <div className="space-y-6 px-5 pt-3">
          {/* Pílulas de Filtro (Sticky Horizontal Tabs) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {SEARCH_TABS.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                    isActive
                      ? "bg-[var(--accent-blue)] text-white shadow-md shadow-[#0033ff]/30"
                      : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-white border border-[var(--border)]"
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          {searching ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-[var(--text-secondary)]">
              <Loader2 className="size-7 animate-spin text-[var(--accent-purple)]" />
              <p className="text-xs font-bold">Processando busca inteligente...</p>
            </div>
          ) : results ? (
            <div className="space-y-6">
              {/* Resumo / Raciocínio Semântico da Luci (se houver) */}
              {results.reasoning && (
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--accent-purple)]/30 text-xs">
                  <Sparkles className="size-4 text-[var(--accent-pink)] shrink-0 mt-0.5" />
                  <p className="text-[11.5px] font-semibold text-[var(--text-primary)] leading-snug">
                    {results.reasoning}
                  </p>
                </div>
              )}

              {/* Card "Melhor Resultado" (Top Result) */}
              {results.top_result && activeTab === "all" && (
                <section className="space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                    Melhor Resultado
                  </h3>
                  <div className="relative overflow-hidden rounded-2xl p-4 bg-[var(--bg-surface-glass)] border border-[var(--border)] backdrop-blur-xl shadow-xl space-y-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={results.top_result.avatar}
                        alt={results.top_result.name}
                        className="size-16 rounded-2xl object-cover bg-zinc-900 shadow-md"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-[var(--accent-purple)]/20 text-[10px] font-bold text-[var(--accent-pink)] uppercase">
                          {results.top_result.type === "artist" ? "Artista Principal" : "Faixa Principal"}
                        </span>
                        <h4 className="text-base font-black text-[var(--text-primary)] truncate mt-1">
                          {results.top_result.name}
                        </h4>
                        <p className="text-xs font-medium text-[var(--text-secondary)] truncate">
                          {results.top_result.followers}
                        </p>
                      </div>
                    </div>

                    {/* Botões de Ação do Top Result */}
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          const firstSong = results.tracks[0] || results.songs[0]
                          if (firstSong) handlePlaySingle(firstSong, results.tracks)
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--accent-blue)] text-white text-xs font-black shadow-lg shadow-[#0033ff]/30 active:scale-95 transition-transform"
                      >
                        <Play className="size-3.5 fill-white" />
                        <span>Top Músicas</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (results.top_result?.id) goToArtist(results.top_result.id)
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--accent-purple)] text-[var(--accent-pink)] text-xs font-bold active:scale-95 transition-transform"
                      >
                        <Shuffle className="size-3.5" />
                        <span>Mix do Artista</span>
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* Seção de Músicas (Lista Vertical) */}
              {results.tracks && results.tracks.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                    Músicas
                  </h3>
                  <div className="space-y-2">
                    {results.tracks.slice(0, activeTab === "songs" ? 50 : 6).map((track) => {
                      const isCurrent = currentTrack?.id === track.id
                      const liked = isLiked(track.id)

                      return (
                        <div
                          key={`track-${track.id}`}
                          onClick={() => handlePlaySingle(track, results.tracks)}
                          onTouchStart={() => handleTouchStart(track)}
                          onTouchEnd={handleTouchEnd}
                          className={`flex items-center gap-3 p-2 rounded-xl bg-[var(--bg-surface)] border transition-all active:scale-[0.99] cursor-pointer group ${
                            isCurrent
                              ? "border-[var(--accent-purple)] bg-[var(--bg-surface)]/90 shadow-md shadow-[#977dff]/15"
                              : "border-[var(--border)] hover:border-[var(--accent-purple)]/30"
                          }`}
                        >
                          <TrackImage
                            src={track.thumbnail}
                            trackId={track.id}
                            alt={track.title}
                            className="size-12 rounded-lg object-cover bg-zinc-900 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className={`text-xs font-black truncate leading-tight ${
                              isCurrent ? "text-[var(--accent-pink)]" : "text-[var(--text-primary)]"
                            }`}>
                              {track.title}
                            </h4>
                            <p className="text-[11px] font-semibold text-[var(--text-secondary)] truncate mt-0.5">
                              {track.artist}
                            </p>
                          </div>

                          {/* Curtir */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleLike(track)
                            }}
                            className="p-2 text-[var(--text-secondary)] hover:text-white active:scale-90 transition-transform"
                          >
                            <Heart className={`size-4 ${liked ? "fill-[var(--accent-purple)] text-[var(--accent-purple)]" : ""}`} />
                          </button>

                          {/* Menu 3 Pontos */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActionSheetTrack(track)
                            }}
                            className="p-2 text-[var(--text-muted)] hover:text-white active:scale-90 transition-transform"
                          >
                            <MoreVertical className="size-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Carrossel de Artistas Relacionados */}
              {results.artists && results.artists.length > 0 && activeTab !== "songs" && (
                <section className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                    Artistas
                  </h3>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar py-1">
                    {results.artists.map((art) => (
                      <div
                        key={`art-res-${art.id || art.browseId}`}
                        onClick={() => goToArtist(art.id || art.browseId || art.name)}
                        className="flex flex-col items-center gap-1.5 w-20 shrink-0 cursor-pointer active:scale-95 transition-transform group"
                      >
                        <div className="size-18 rounded-full p-[2px] bg-gradient-to-br from-[var(--border)] to-[var(--accent-purple)]/40 group-hover:to-[var(--accent-pink)] transition-all">
                          <img
                            src={art.thumbnail || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200"}
                            alt={art.name || art.artist}
                            className="size-full rounded-full object-cover bg-zinc-900"
                            loading="lazy"
                          />
                        </div>
                        <span className="text-[11px] font-bold text-[var(--text-primary)] text-center line-clamp-1 group-hover:text-[var(--accent-pink)]">
                          {art.name || art.artist}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Carrossel de Álbuns */}
              {results.albums && results.albums.length > 0 && activeTab !== "songs" && (
                <section className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                    Álbuns
                  </h3>
                  <div className="flex gap-3.5 overflow-x-auto no-scrollbar py-1">
                    {results.albums.map((alb) => (
                      <div
                        key={`alb-res-${alb.id || alb.browseId}`}
                        onClick={() => goToAlbumDetail(alb.id || alb.browseId, alb.title, alb.artist, alb.thumbnail)}
                        className="w-32 shrink-0 space-y-1.5 cursor-pointer active:scale-95 transition-transform group"
                      >
                        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border)] shadow-md">
                          <img
                            src={alb.thumbnail}
                            alt={alb.title}
                            className="size-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <h4 className="text-xs font-bold text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--accent-pink)]">
                          {alb.title}
                        </h4>
                        <p className="text-[10px] font-medium text-[var(--text-secondary)] line-clamp-1">
                          {alb.artist || "Álbum"}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* ─── Modal / Action Sheet em Vidro Fosco ─── */}
      {actionSheetTrack && (
        <div
          onClick={() => setActionSheetTrack(null)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[480px] rounded-t-3xl bg-[var(--bg-surface)] border-t border-[var(--border)] p-6 space-y-4 shadow-2xl animate-slide-up"
          >
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <TrackImage
                src={actionSheetTrack.thumbnail}
                trackId={actionSheetTrack.id}
                alt={actionSheetTrack.title}
                className="size-12 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-black text-[var(--text-primary)] truncate">
                  {actionSheetTrack.title}
                </h4>
                <p className="text-xs text-[var(--text-secondary)] truncate">
                  {actionSheetTrack.artist}
                </p>
              </div>
            </div>

            <div className="space-y-1 text-sm font-bold text-[var(--text-primary)]">
              <button
                type="button"
                onClick={() => {
                  addToQueue(actionSheetTrack)
                  setActionSheetTrack(null)
                }}
                className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10"
              >
                <ListPlus className="size-5 text-[var(--accent-purple)]" />
                <span>Adicionar à fila</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  goToArtist(actionSheetTrack.artistId || actionSheetTrack.artist)
                  setActionSheetTrack(null)
                }}
                className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10"
              >
                <Disc3 className="size-5 text-[var(--accent-purple)]" />
                <span>Ir para página do artista</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  goToLyrics()
                  setActionSheetTrack(null)
                }}
                className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10"
              >
                <FileText className="size-5 text-[var(--accent-purple)]" />
                <span>Ver letra da música</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  toggleLike(actionSheetTrack)
                  setActionSheetTrack(null)
                }}
                className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10"
              >
                <Heart className={`size-5 ${isLiked(actionSheetTrack.id) ? "fill-[var(--accent-purple)] text-[var(--accent-purple)]" : "text-[var(--accent-purple)]"}`} />
                <span>{isLiked(actionSheetTrack.id) ? "Remover dos favoritos" : "Favoritar música"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: actionSheetTrack.title,
                      text: `Ouvindo ${actionSheetTrack.title} de ${actionSheetTrack.artist} na Luci`,
                      url: window.location.href,
                    })
                  }
                  setActionSheetTrack(null)
                }}
                className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10"
              >
                <Share2 className="size-5 text-[var(--accent-purple)]" />
                <span>Compartilhar no Chat da Luci</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
