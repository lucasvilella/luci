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
      {/* ─── A. Barra de Busca Inteligente (Sticky Top Bar Soft UI) ─── */}
      <header className="sticky top-0 z-20 px-5 pt-6 pb-3 bg-[var(--bg-deck)] backdrop-blur-xl border-b border-[var(--border-subtle)]">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            executeSearch(query)
          }}
          className="relative flex items-center w-full"
        >
          <div className="flex items-center w-full h-13 bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] rounded-2xl px-4 shadow-[var(--shadow-card)]">
            <Search className="text-[var(--text-muted)] mr-3 shrink-0" size={20} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                if (hasSearched) setHasSearched(false)
              }}
              onFocus={() => setIsFocused(true)}
              placeholder="Artistas, músicas, álbuns..."
              className="w-full bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm font-medium focus:outline-none"
            />
            {query.length > 0 ? (
              <button
                type="button"
                onClick={handleClearQuery}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X size={18} />
              </button>
            ) : (
              <button
                type="button"
                className="p-1.5 rounded-full bg-[var(--accent-surface)] text-[var(--accent-primary)]"
              >
                <Mic size={16} />
              </button>
            )}
          </div>
        </form>
      </header>

      {/* ─── ESTADO 1: INICIAL / DESCOBERTA (Input Vazio) ─── */}
      {isInitialState && (
        <div className="space-y-6 px-5 pt-4">
          {/* Histórico Recente */}
          {historyItems.length > 0 && (
            <section className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Buscas Recentes
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    clearSearchHistory().then(() => setHistoryItems([]))
                  }}
                  className="flex items-center gap-1 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
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
                    className="flex items-center justify-between px-3.5 py-3 rounded-xl bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/40 cursor-pointer active:scale-95 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Clock className="size-4 text-[var(--text-muted)] shrink-0" />
                      <span className="text-xs font-medium text-[var(--text-primary)] truncate">
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
                      className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Grade de Categorias Clean Soft-UI */}
          <section className="space-y-3">
            <h2 className="text-base font-bold text-[var(--text-primary)]">Explorar Categorias</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Sertanejo", color: "#5c62ec", query: "Sertanejo Sucessos" },
                { label: "Rock Clássico", color: "#3a3e98", query: "Rock Classico Anos 70 80" },
                { label: "MPB & Acústico", color: "#2b2e59", query: "MPB Acustico Clássicos" },
                { label: "Foco & Instrumental", color: "#4e53db", query: "Lofi Beats Foco Estudo" },
                { label: "Alta Energia / Treino", color: "#6c7084", query: "Eletronica Treino Academia" },
                { label: "Lançamentos 2026", color: "#23252e", query: "Lançamentos Musicais 2026" }
              ].map((cat, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setQuery(cat.label)
                    executeSearch(cat.query)
                  }}
                  className="h-24 p-4 rounded-2xl bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] flex flex-col justify-between cursor-pointer active:scale-95 transition-transform"
                >
                  <span className="font-bold text-sm text-[var(--text-primary)]">{cat.label}</span>
                  <div className="w-4 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ─── ESTADO 2: AUTOCOMPLETE / TYPING ─── */}
      {isTypingState && (
        <div className="space-y-4 px-5 pt-3">
          {loadingSuggestions ? (
            <div className="flex items-center justify-center py-16 gap-2 text-[var(--text-secondary)]">
              <Loader2 className="size-5 animate-spin text-[var(--accent-primary)]" />
              <span className="text-xs font-medium">Buscando sugestões...</span>
            </div>
          ) : (
            <>
              {/* Entidades Diretas (Artistas / Álbuns) */}
              {suggestions.entities && suggestions.entities.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
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
                        className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/40 cursor-pointer active:scale-95 transition-all shadow-sm"
                      >
                        <img
                          src={entity.avatar || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200"}
                          alt={entity.name}
                          className={`size-11 object-cover bg-[var(--bg-surface-2)] ${
                            entity.type === "artist" ? "rounded-full" : "rounded-xl"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                            {entity.name}
                          </h4>
                          <span className="text-xs text-[var(--text-secondary)]">
                            {entity.subtitle}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Lista de Termos Sugeridos com seta ↗ */}
              {suggestions.queries && suggestions.queries.length > 0 && (
                <section className="space-y-1">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                    Sugestões
                  </h3>
                  {suggestions.queries.map((qText, idx) => (
                    <div
                      key={`sug-${idx}`}
                      onClick={() => executeSearch(qText)}
                      className="flex items-center justify-between p-3.5 rounded-xl hover:bg-[var(--bg-surface-1)] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <Search className="text-[var(--text-muted)] shrink-0" size={16} />
                        <span className="text-sm font-medium text-[var(--text-primary)] truncate">{qText}</span>
                      </div>
                      <ArrowUpRight className="text-[var(--text-muted)] shrink-0" size={16} />
                    </div>
                  ))}
                </section>
              )}
            </>
          )}
        </div>
      )}

      {/* ─── ESTADO 3: RESULTADOS ESTRUTURADOS ─── */}
      {isResultsState && (
        <div className="space-y-6 px-5 pt-3">
          {/* Pílulas de Filtro */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {SEARCH_TABS.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                    isActive
                      ? "bg-[var(--accent-primary)] text-white shadow-sm font-bold"
                      : "bg-[var(--bg-surface-1)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]"
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
                  <span className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-bold mb-3 block">
                    Melhor Resultado
                  </span>
                  <div
                    onClick={() => {
                      if (results.top_result?.id) goToArtist(results.top_result.id)
                    }}
                    className="p-4 rounded-2xl bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform"
                  >
                    <div className="flex items-center space-x-4 min-w-0 pr-2">
                      <img
                        src={results.top_result.avatar}
                        alt={results.top_result.name}
                        className="size-16 rounded-full object-cover shadow-md bg-[var(--bg-surface-2)] shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-[var(--text-primary)] truncate">{results.top_result.name}</h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">{results.top_result.followers}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        const firstSong = results.tracks[0] || results.songs[0]
                        if (firstSong) handlePlaySingle(firstSong, results.tracks)
                      }}
                      className="size-11 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center shadow-[0_4px_14px_var(--accent-glow)] shrink-0 active:scale-90 transition-transform"
                    >
                      <Play fill="currentColor" size={18} className="translate-x-0.5" />
                    </button>
                  </div>
                </section>
              )}

              {/* Seção de Músicas (Lista Vertical) */}
              {results.tracks && results.tracks.length > 0 && (
                <section className="space-y-3">
                  <span className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-bold mb-2 block">
                    Músicas
                  </span>
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
                          className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all duration-200 ${
                            isCurrent
                              ? "bg-[var(--accent-surface)] border border-[var(--border-subtle)] shadow-sm"
                              : "hover:bg-[var(--bg-surface-1)] active:scale-[0.99]"
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0 pr-2">
                            <TrackImage
                              src={track.thumbnail}
                              trackId={track.id}
                              alt={track.title}
                              className="size-11 rounded-xl object-cover bg-[var(--bg-surface-2)] shrink-0"
                            />
                            <div className="truncate">
                              <p
                                className={`text-sm font-semibold truncate ${
                                  isCurrent ? "text-[var(--accent-primary)]" : "text-[var(--text-primary)]"
                                }`}
                              >
                                {track.title}
                              </p>
                              <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">{track.artist}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleLike(track)
                              }}
                              className={`p-2 rounded-full transition-colors ${
                                liked ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                              }`}
                            >
                              <Heart fill={liked ? "currentColor" : "none"} size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setActionSheetTrack(track)
                              }}
                              className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                            >
                              <MoreVertical size={16} />
                            </button>
                          </div>
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
