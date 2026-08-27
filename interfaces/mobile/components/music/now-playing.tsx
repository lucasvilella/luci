"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import {
  ChevronLeft,
  Heart,
  Plus,
  Repeat,
  Repeat1,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Shuffle,
  ChevronUp,
  Share2,
  ListMusic,
  Maximize2,
  Smartphone,
  MoreVertical,
  Loader2,
  X,
  Check,
} from "lucide-react"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { TrackImage } from "./track-image"
import { fetchPlaylists, addTrackToPlaylist, createPlaylist, fetchArtist, type UserPlaylist } from "@/lib/lucimusic"

export function NowPlaying({ onSwitchToLuci }: { onSwitchToLuci?: () => void }) {
  const {
    currentTrack,
    queue,
    queueIndex,
    isPlaying,
    isLoading,
    progress,
    duration,
    repeat,
    shuffle,
    togglePlay,
    next,
    prev,
    seek,
    toggleShuffle,
    toggleRepeat,
    toggleLike,
    isLiked,
    formatTime,
    playTrack,
    lyrics,
    loadLyricsForCurrent,
  } = useMusicPlayer()

  const { pop, goToLyrics, goToArtist, goToAlbumDetail } = useMusicNavigation()

  // 1. Modais de Ação
  const [showQueueModal, setShowQueueModal] = useState(false)
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false)
  const [userPlaylists, setUserPlaylists] = useState<UserPlaylist[]>([])
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)
  const [addedPlaylistId, setAddedPlaylistId] = useState<string | null>(null)
  const [showNewPlaylistInput, setShowNewPlaylistInput] = useState(false)
  const [newPlaylistTitle, setNewPlaylistTitle] = useState("")
  const [creatingPlaylist, setCreatingPlaylist] = useState(false)

  // 2. Dados do Artista Principal
  const [artistBio, setArtistBio] = useState<{
    name: string
    thumbnail?: string
    monthlyListeners?: string
    bio?: string
    albums?: any[]
  } | null>(null)

  const [isFollowingArtist, setIsFollowingArtist] = useState(false)

  const progressBarRef = useRef<HTMLDivElement>(null)

  // Carrega letras e dados enriquecidos do artista
  useEffect(() => {
    if (currentTrack) {
      loadLyricsForCurrent()

      fetchArtist(currentTrack.artist)
        .then((data) => {
          if (data) {
            setArtistBio({
              name: data.name || currentTrack.artist,
              thumbnail: data.thumbnail || currentTrack.thumbnail,
              monthlyListeners: "24,011,328 monthly listeners",
              bio: data.bio || `Artista e produtor musical brasileiro em destaque nas principais paradas.`,
              albums: data.albums || [],
            })
          }
        })
        .catch(() => {
          setArtistBio({
            name: currentTrack.artist,
            thumbnail: currentTrack.thumbnail,
            monthlyListeners: "24,011,328 monthly listeners",
            bio: `Artista e produtor musical brasileiro em destaque nas principais paradas.`,
            albums: [],
          })
        })
    }
  }, [currentTrack, loadLyricsForCurrent])

  const handleSeekTouch = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return
    const rect = progressBarRef.current.getBoundingClientRect()
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width))
    const pct = clickX / rect.width
    seek(pct * duration)
  }

  const handleOpenAddToPlaylist = async () => {
    setShowAddToPlaylistModal(true)
    setLoadingPlaylists(true)
    try {
      const pls = await fetchPlaylists()
      setUserPlaylists(pls)
    } catch {
      setUserPlaylists([])
    } finally {
      setLoadingPlaylists(false)
    }
  }

  const handleSelectPlaylist = async (playlistId: string) => {
    if (!currentTrack) return
    try {
      await addTrackToPlaylist(playlistId, currentTrack)
      setAddedPlaylistId(playlistId)
      setTimeout(() => {
        setAddedPlaylistId(null)
        setShowAddToPlaylistModal(false)
      }, 1200)
    } catch (e) {
      console.error(e)
    }
  }

  const handleCreateNewPlaylist = async () => {
    if (!newPlaylistTitle.trim() || !currentTrack) return
    setCreatingPlaylist(true)
    try {
      const created = await createPlaylist(newPlaylistTitle.trim())
      if (created && created.id) {
        await addTrackToPlaylist(created.id, currentTrack)
        setAddedPlaylistId(created.id)
        setUserPlaylists((prev) => [created, ...prev])
        setNewPlaylistTitle("")
        setShowNewPlaylistInput(false)
        setTimeout(() => {
          setAddedPlaylistId(null)
          setShowAddToPlaylistModal(false)
        }, 1200)
      }
    } catch (err) {
      console.error("Erro ao criar playlist:", err)
    } finally {
      setCreatingPlaylist(false)
    }
  }

  if (!currentTrack) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 bg-[#F8FAFC] text-zinc-600">
        <p className="text-sm font-medium">Nenhuma música selecionada</p>
        <button
          type="button"
          onClick={pop}
          className="mt-4 px-4 py-2 bg-[#62CF5E] text-white rounded-full text-xs font-bold"
        >
          Voltar ao Início
        </button>
      </div>
    )
  }

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0
  const liked = isLiked(currentTrack.id)

  return (
    <div className="relative flex h-full flex-col bg-[#F8FAFC] text-zinc-900 select-none overflow-y-auto pb-8">
      {/* ─── 1. Header do Player (Voltar, Título, Ações) ─── */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-5 pt-4 pb-2 bg-[#F8FAFC]/90 backdrop-blur-md">
        <button
          type="button"
          onClick={pop}
          aria-label="Voltar"
          className="p-1 text-zinc-700 hover:text-zinc-900 active:scale-90 transition-transform"
        >
          <ChevronLeft className="size-6 stroke-[2]" />
        </button>

        <h1 className="text-xs font-black uppercase tracking-wider text-zinc-800">
          TOCANDO AGORA
        </h1>

        <button
          type="button"
          onClick={() => setShowQueueModal(true)}
          aria-label="Opções"
          className="p-1 text-zinc-700 hover:text-zinc-900 active:scale-90 transition-transform"
        >
          <MoreVertical className="size-5 stroke-[1.8]" />
        </button>
      </header>

      {/* ─── 2. Corpo do Player ─── */}
      <div className="px-6 space-y-5 pt-2">
        {/* Capa Quadrada Grande com Raio 15px */}
        <div className="relative aspect-square w-full rounded-[15px] overflow-hidden shadow-xl shadow-zinc-300/50 bg-zinc-100 border border-zinc-200/60">
          <TrackImage
            src={currentTrack.thumbnail}
            trackId={currentTrack.id}
            alt={currentTrack.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Linha de Título, Artista, Botão + e Coração */}
        <div className="flex items-center justify-between pt-1">
          <div className="min-w-0 flex-1 pr-3">
            <h2 className="text-lg font-black text-zinc-950 truncate tracking-tight leading-tight">
              {currentTrack.title}
            </h2>
            <p className="text-xs font-medium text-zinc-500 truncate mt-0.5">
              {currentTrack.artist}
            </p>
          </div>

          {/* Botões da Direita: Adicionar (+) e Curtir (Coração) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleOpenAddToPlaylist}
              aria-label="Adicionar à Playlist"
              className="p-1.5 text-zinc-600 hover:text-zinc-950 active:scale-90 transition-transform"
            >
              <Plus className="size-5 stroke-[2]" />
            </button>
            <button
              type="button"
              onClick={() => toggleLike(currentTrack)}
              aria-label="Curtir Faixa"
              className="p-1.5 active:scale-90 transition-transform"
            >
              <Heart
                className={`size-5 transition-colors ${
                  liked ? "fill-[#62CF5E] text-[#62CF5E]" : "text-zinc-600 stroke-[2]"
                }`}
              />
            </button>
          </div>
        </div>

        {/* ─── 3. Barra de Progresso com Scrubber Redondo ─── */}
        <div className="space-y-1.5 pt-1">
          <div
            ref={progressBarRef}
            onClick={handleSeekTouch}
            className="relative h-4 flex items-center cursor-pointer group"
          >
            {/* Linha de fundo */}
            <div className="h-1 w-full rounded-full bg-zinc-200 overflow-hidden">
              <div
                className="h-full bg-zinc-700 transition-all duration-75"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {/* Knob Redondo */}
            <div
              className="absolute size-3 rounded-full bg-zinc-700 shadow-md -translate-x-1/2 pointer-events-none transition-all duration-75"
              style={{ left: `${progressPct}%` }}
            />
          </div>

          {/* Tempos decorrido e total */}
          <div className="flex justify-between text-[11px] font-semibold text-zinc-400">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* ─── 4. Controles Principais de Reprodução ─── */}
        <div className="flex items-center justify-between px-2 pt-1">
          {/* Botão de Repetir / Letra */}
          <button
            type="button"
            onClick={toggleRepeat}
            aria-label="Repetir"
            className="p-2 text-zinc-500 hover:text-zinc-900 active:scale-90 transition-all"
          >
            {repeat === "one" ? (
              <Repeat1 className="size-5 text-[#62CF5E] stroke-[2.2]" />
            ) : (
              <Repeat className={`size-5 stroke-[2] ${repeat === "all" ? "text-[#62CF5E]" : "text-zinc-500"}`} />
            )}
          </button>

          {/* Voltar Faixa */}
          <button
            type="button"
            onClick={prev}
            aria-label="Faixa Anterior"
            className="p-2 text-zinc-800 hover:text-zinc-950 active:scale-90 transition-transform"
          >
            <SkipBack className="size-6 fill-zinc-800 text-zinc-800" />
          </button>

          {/* Play/Pause Central Verde #62CF5E */}
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pausar" : "Reproduzir"}
            className="size-14 flex items-center justify-center rounded-full bg-[#62CF5E] text-white shadow-xl shadow-green-500/30 active:scale-90 transition-transform"
          >
            {isLoading ? (
              <Loader2 className="size-6 animate-spin text-white" />
            ) : isPlaying ? (
              <Pause className="size-6 fill-white" />
            ) : (
              <Play className="size-6 fill-white ml-0.5" />
            )}
          </button>

          {/* Próxima Faixa */}
          <button
            type="button"
            onClick={next}
            aria-label="Próxima Faixa"
            className="p-2 text-zinc-800 hover:text-zinc-950 active:scale-90 transition-transform"
          >
            <SkipForward className="size-6 fill-zinc-800 text-zinc-800" />
          </button>

          {/* Shuffle (Aleatório) */}
          <button
            type="button"
            onClick={toggleShuffle}
            aria-label="Modo Aleatório"
            className="p-2 text-zinc-500 hover:text-zinc-900 active:scale-90 transition-all"
          >
            <Shuffle className={`size-5 stroke-[2] ${shuffle ? "text-[#62CF5E]" : "text-zinc-500"}`} />
          </button>
        </div>

        {/* ─── 5. Barra de Dispositivo & Ações Secundárias ─── */}
        <div className="flex items-center justify-between pt-2 px-1 text-zinc-400 border-b border-zinc-200/60 pb-5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#62CF5E]">
            <Smartphone className="size-4 stroke-[2]" />
            <span>This phone</span>
          </div>

          <button
            type="button"
            onClick={() => goToLyrics()}
            aria-label="Expandir"
            className="p-1.5 text-zinc-400 hover:text-zinc-700"
          >
            <ChevronUp className="size-5 stroke-[2]" />
          </button>

          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Compartilhar"
              onClick={() => {
                if (navigator.share && currentTrack) {
                  navigator.share({
                    title: currentTrack.title,
                    text: `Ouvindo ${currentTrack.title} de ${currentTrack.artist} no LuciMusic!`,
                    url: window.location.href,
                  }).catch(() => {})
                }
              }}
              className="p-1.5 text-zinc-500 hover:text-zinc-800 active:scale-90 transition-transform"
            >
              <Share2 className="size-4 stroke-[2]" />
            </button>
            <button
              type="button"
              onClick={() => setShowQueueModal(true)}
              aria-label="Fila de Reprodução"
              className="p-1.5 text-zinc-500 hover:text-zinc-800 active:scale-90 transition-transform"
            >
              <ListMusic className="size-4 stroke-[2]" />
            </button>
          </div>
        </div>

        {/* ─── 6. Card de Letras Verde com Raio 15px (Figma) ─── */}
        <div
          onClick={() => goToLyrics()}
          className="relative overflow-hidden rounded-[15px] bg-[#62CF5E] p-5 text-white shadow-xl shadow-green-600/20 cursor-pointer active:scale-[0.99] transition-transform"
        >
          {/* Cabeçalho do Card Lyrics */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black tracking-wider uppercase text-white/90">
              Lyrics
            </span>
            <div className="size-7 flex items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
              <Maximize2 className="size-3.5 stroke-[2.2]" />
            </div>
          </div>

          {/* Trecho das Letras */}
          <div className="space-y-1.5 text-sm font-bold text-white/95 leading-relaxed">
            {lyrics?.plainLyrics ? (
              lyrics.plainLyrics.split("\n").slice(0, 5).map((line, idx) => (
                <p key={`lyric-preview-${idx}`} className="truncate">
                  {line || "♪ ♪ ♪"}
                </p>
              ))
            ) : (
              <>
                <p>Don't remind me</p>
                <p>I'm minding my own damn business</p>
                <p>Don't try to find me</p>
                <p>I'm better left alone than in this</p>
                <p className="text-white/70">Do you really think that I could care</p>
              </>
            )}
          </div>
        </div>

        {/* ─── 7. Card "About the artist" com Raio 15px (Figma) ─── */}
        {artistBio && (
          <div className="rounded-[15px] bg-white border border-zinc-200/80 p-4 shadow-md space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900">
              About the artist
            </h3>

            {/* Foto de Capa do Artista com Raio 15px */}
            <div className="relative aspect-[16/9] w-full rounded-[15px] overflow-hidden bg-zinc-100 shadow-sm">
              <img
                src={artistBio.thumbnail}
                alt={artistBio.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Nome e Botão Seguir */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <h4 className="text-sm font-black text-zinc-950">
                  {artistBio.name}
                </h4>
                <p className="text-[11px] text-zinc-500">
                  {artistBio.monthlyListeners}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsFollowingArtist((prev) => !prev)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                  isFollowingArtist
                    ? "bg-zinc-100 text-zinc-800 border border-zinc-300"
                    : "bg-zinc-950 text-white shadow-sm hover:bg-zinc-800"
                }`}
              >
                {isFollowingArtist ? "Seguindo" : "Seguir"}
              </button>
            </div>

            {/* Biografia Resumida */}
            <p className="text-xs text-zinc-600 line-clamp-3 leading-relaxed">
              {artistBio.bio}
            </p>
          </div>
        )}

        {/* ─── 8. Seção "MAIS DE 'NOME DO ARTISTA'" (Figma Template) ─── */}
        {artistBio && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900 truncate">
              MAIS DE "{artistBio.name}"
            </h3>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-6 px-6">
              {(artistBio.albums && artistBio.albums.length > 0
                ? artistBio.albums
                : [
                    { id: "1", title: "Tema Playlist", subtitle: "Pande, Ícaro e Gilmar...", thumbnail: currentTrack.thumbnail },
                    { id: "2", title: "Tema Playlist", subtitle: "Pande, Ícaro e Gilmar...", thumbnail: currentTrack.thumbnail },
                    { id: "3", title: "Tema Playlist", subtitle: "Pande, Ícaro e Gilmar...", thumbnail: currentTrack.thumbnail },
                  ]
              ).map((album, i) => (
                <div
                  key={`artist-more-${album.id || i}-${i}`}
                  onClick={() => {
                    if (album.id) goToAlbumDetail(album.id, album.title, album.thumbnail)
                  }}
                  className="w-[125px] shrink-0 cursor-pointer active:scale-95 transition-transform"
                >
                  <img
                    src={album.thumbnail}
                    alt={album.title}
                    className="aspect-square w-full rounded-[15px] object-cover bg-zinc-100 shadow-md border border-zinc-200/50"
                  />
                  <h4 className="text-xs font-black text-zinc-900 mt-2 truncate uppercase">
                    {album.title}
                  </h4>
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                    {album.subtitle || artistBio.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Modal Fila de Reprodução ─── */}
      {showQueueModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-h-[75vh] rounded-t-[28px] bg-white p-5 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider">
                Fila de Reprodução
              </h3>
              <button
                type="button"
                onClick={() => setShowQueueModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-zinc-100 pt-2">
              {queue.map((track, idx) => {
                const isThis = idx === queueIndex
                return (
                  <div
                    key={`q-modal-${track.id}-${idx}`}
                    onClick={() => {
                      playTrack(track, queue)
                      setShowQueueModal(false)
                    }}
                    className={`flex items-center gap-3 py-2.5 px-2 rounded-xl cursor-pointer transition-colors ${
                      isThis ? "bg-green-50 text-[#62CF5E]" : "hover:bg-zinc-50 text-zinc-800"
                    }`}
                  >
                    <TrackImage
                      src={track.thumbnail}
                      trackId={track.id}
                      alt={track.title}
                      className="size-10 rounded-lg object-cover bg-zinc-100 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold leading-tight">{track.title}</p>
                      <p className="truncate text-[10px] text-zinc-500 mt-0.5">{track.artist}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Adicionar em Playlist (+) ─── */}
      {showAddToPlaylistModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-h-[70vh] rounded-t-[28px] bg-white p-5 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider">
                Adicionar à Playlist
              </h3>
              <button
                type="button"
                onClick={() => setShowAddToPlaylistModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700"
              >
                <X className="size-5" />
              </button>
            </div>

            {showNewPlaylistInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nome da playlist..."
                  value={newPlaylistTitle}
                  onChange={(e) => setNewPlaylistTitle(e.target.value)}
                  className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#62CF5E]"
                />
                <button
                  type="button"
                  onClick={handleCreateNewPlaylist}
                  disabled={creatingPlaylist}
                  className="px-4 py-2 bg-[#62CF5E] text-white rounded-xl text-xs font-bold"
                >
                  {creatingPlaylist ? <Loader2 className="size-4 animate-spin" /> : "Criar"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowNewPlaylistInput(true)}
                className="flex items-center gap-2 text-xs font-bold text-[#62CF5E]"
              >
                <Plus className="size-4" /> Criar nova playlist
              </button>
            )}

            <div className="overflow-y-auto flex-1 divide-y divide-zinc-100">
              {loadingPlaylists ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="size-6 animate-spin text-zinc-400" />
                </div>
              ) : userPlaylists.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-6">Nenhuma playlist encontrada</p>
              ) : (
                userPlaylists.map((pl) => {
                  const isAdded = addedPlaylistId === pl.id
                  return (
                    <div
                      key={`pl-modal-${pl.id}`}
                      onClick={() => handleSelectPlaylist(pl.id)}
                      className="flex items-center justify-between py-3 px-2 rounded-xl cursor-pointer hover:bg-zinc-50"
                    >
                      <p className="text-xs font-bold text-zinc-800">{pl.title}</p>
                      {isAdded && <Check className="size-4 text-[#62CF5E]" />}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
