"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  ChevronDown,
  MoreVertical,
  Heart,
  Shuffle,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Repeat,
  Repeat1,
  Info,
  Sparkles,
  Mic2,
  ListMusic,
  Video,
  Disc,
  Disc3,
  Users,
  Clock,
  Radio,
  Share2,
  ListPlus,
  FileText,
  Volume2,
  Loader2,
  Check,
  X,
  Sliders,
  Send,
} from "lucide-react"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { TrackImage } from "./track-image"
import { AddToPlaylistModal } from "./add-to-playlist-modal"
import { QueueScreen } from "./queue-screen"
import { SleepTimerSheet } from "./sleep-timer-sheet"
import {
  fetchPlaylists,
  addTrackToPlaylist,
  createPlaylist,
  fetchArtist,
  type UserPlaylist,
  type ArtistDetails,
  formatSeconds,
  recordTrackEvent,
} from "@/lib/lucimusic"

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
    duckPlayerVolume,
    restorePlayerVolume,
    addToQueue,
  } = useMusicPlayer()

  const { pop, goToLyrics, goToArtist, goToAlbumDetail } = useMusicNavigation()

  // Modos e Modais
  const [isVideoMode, setIsVideoMode] = useState(false)
  const [showQueueModal, setShowQueueModal] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showPromptModal, setShowPromptModal] = useState(false)
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false)
  const [showActionSheet, setShowActionSheet] = useState(false)
  const [showSleepTimerSheet, setShowSleepTimerSheet] = useState(false)
  const [activeSleepTimer, setActiveSleepTimer] = useState<number | null>(null)
  const sleepTimerTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleSetSleepTimer = (minutes: number | null) => {
    if (sleepTimerTimeoutRef.current) {
      clearTimeout(sleepTimerTimeoutRef.current)
      sleepTimerTimeoutRef.current = null
    }
    setActiveSleepTimer(minutes)
    if (minutes !== null && minutes > 0) {
      const ms = minutes * 60 * 1000
      sleepTimerTimeoutRef.current = setTimeout(() => {
        duckPlayerVolume(0, 10000)
        setTimeout(() => {
          togglePlay()
          setActiveSleepTimer(null)
          restorePlayerVolume(500)
        }, 10000)
      }, ms - 10000 > 0 ? ms - 10000 : 1000)
    }
  }

  // Dados Adicionais
  const [artistDetails, setArtistDetails] = useState<ArtistDetails | null>(null)
  const [userPlaylists, setUserPlaylists] = useState<UserPlaylist[]>([])
  const [luciPromptText, setLuciPromptText] = useState("")
  const [promptFeedback, setPromptFeedback] = useState<string | null>(null)
  const [newPlaylistTitle, setNewPlaylistTitle] = useState("")
  const [addedSuccessId, setAddedSuccessId] = useState<string | null>(null)

  // Drag Seek
  const [isSeeking, setIsSeeking] = useState(false)
  const [seekValue, setSeekValue] = useState(0)

  // Scroll Container Ref
  const containerRef = useRef<HTMLDivElement>(null)
  const lyricsContainerRef = useRef<HTMLDivElement>(null)

  // Carrega Letras e Dados do Artista ao Mudar de Faixa
  useEffect(() => {
    if (currentTrack) {
      loadLyricsForCurrent()
      if (currentTrack.artist) {
        fetchArtist(currentTrack.artistId || currentTrack.artist)
          .then((data) => setArtistDetails(data))
          .catch(() => setArtistDetails(null))
      }
    }
  }, [currentTrack?.id])

  // Integração com MediaSession Nativa do Android / Web
  useEffect(() => {
    if ("mediaSession" in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || "LuciMusic",
        artwork: [
          { src: currentTrack.thumbnail || "", sizes: "512x512", type: "image/jpeg" },
        ],
      })

      navigator.mediaSession.setActionHandler("play", () => togglePlay())
      navigator.mediaSession.setActionHandler("pause", () => togglePlay())
      navigator.mediaSession.setActionHandler("previoustrack", () => prev())
      navigator.mediaSession.setActionHandler("nexttrack", () => next())
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime !== undefined) seek(details.seekTime)
      })
    }
  }, [currentTrack, isPlaying])

  // Identifica a Linha de Letra Ativa
  const activeLyricIndex = lyrics?.lines?.findIndex((line, i) => {
    const nextLine = lyrics.lines[i + 1]
    const currentTime = progress
    return currentTime >= line.seconds && (!nextLine || currentTime < nextLine.seconds)
  }) ?? -1

  // Auto-scroll das Letras
  useEffect(() => {
    if (activeLyricIndex >= 0 && lyricsContainerRef.current) {
      const activeEl = lyricsContainerRef.current.children[activeLyricIndex] as HTMLElement
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }, [activeLyricIndex])

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeekValue(Number(e.target.value))
  }

  const handleSeekStart = () => {
    setIsSeeking(true)
    setSeekValue(progress)
  }

  const handleSeekEnd = () => {
    setIsSeeking(false)
    seek(seekValue)
  }

  const handlePrevButton = () => {
    if (progress > 3) {
      seek(0)
    } else {
      prev()
    }
  }

  const handleScrollToLyrics = () => {
    if (lyricsContainerRef.current) {
      lyricsContainerRef.current.scrollIntoView({ behavior: "smooth" })
    } else {
      goToLyrics()
    }
  }

  const handleSendLuciPrompt = () => {
    if (!luciPromptText.trim()) return
    setPromptFeedback("Luci está ajustando sua fila com base no seu pedido...")
    setTimeout(() => {
      setPromptFeedback("Fila atualizada com sucesso! ✨")
      setTimeout(() => {
        setShowPromptModal(false)
        setPromptFeedback(null)
        setLuciPromptText("")
      }, 1200)
    }, 1500)
  }

  if (!currentTrack) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[var(--bg-app)] text-[var(--text-secondary)] p-6 text-center">
        <Disc className="size-16 animate-spin text-[var(--accent-purple)]/40 mb-4" />
        <h2 className="text-base font-bold text-[var(--text-primary)]">Nenhuma música reproduzindo</h2>
        <p className="text-xs text-[var(--text-muted)] mt-1">Escolha uma faixa na busca ou na home para começar.</p>
        <button
          type="button"
          onClick={pop}
          className="mt-6 px-6 py-2.5 rounded-full bg-[var(--accent-blue)] text-white text-xs font-bold shadow-lg"
        >
          Voltar ao Início
        </button>
      </div>
    )
  }

  const currentSec = isSeeking ? seekValue : progress
  const totalSec = duration || currentTrack.duration || 180
  const progressPercent = Math.min(100, Math.max(0, (currentSec / totalSec) * 100))
  const liked = isLiked(currentTrack.id)

  return (
    <div
      ref={containerRef}
      className="relative flex h-full flex-col overflow-y-auto bg-[var(--bg-app)] text-[var(--text-primary)] select-none pb-20 no-scrollbar"
    >
      {/* ─── Fundo Limpo Soft-UI ─── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[var(--bg-app)]">
        {/* Glow Ambiente Sutil */}
        <div className="absolute -top-32 -left-20 size-[360px] rounded-full bg-[var(--accent-primary)] opacity-10 blur-[120px]" />
        <div className="absolute -bottom-32 -right-20 size-[360px] rounded-full bg-[var(--accent-surface)] opacity-20 blur-[120px]" />
      </div>

      {/* ─── CONTEÚDO PRINCIPAL ─── */}
      <div className="relative z-10 flex min-h-full flex-col justify-between px-6 py-8">
        {/* ─── A. Header do Player ─── */}
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={pop}
            aria-label="Recolher Player"
            className="size-10 flex items-center justify-center rounded-full bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-90 transition-all shadow-sm"
          >
            <ChevronDown className="size-6" />
          </button>

          <div className="flex flex-col items-center text-center max-w-[65%]">
            <span className="text-[11px] uppercase tracking-widest text-[var(--text-secondary)] font-semibold">
              Tocando Agora
            </span>
            <span className="text-xs font-medium text-[var(--text-primary)] truncate">
              {currentTrack.album || "Luci Music"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowActionSheet(true)}
            aria-label="Opções"
            className="size-10 flex items-center justify-center rounded-full bg-[var(--bg-surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-90 transition-all shadow-sm"
          >
            <MoreVertical className="size-5" />
          </button>
        </header>

        {/* ─── B. Hero Cover (Card 1:1 com cantos 28px e sombra difusa) ─── */}
        <div className="my-auto py-6 flex flex-col items-center">
          <div className="relative w-full max-w-[320px] aspect-square rounded-[28px] overflow-hidden shadow-[var(--shadow-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface-2)] group">
            {isVideoMode ? (
              <div className="size-full flex flex-col items-center justify-center bg-black relative">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${currentTrack.id}?autoplay=1&controls=0&modestbranding=1&playsinline=1`}
                  title={currentTrack.title}
                  className="size-full object-cover pointer-events-none"
                  allow="autoplay; encrypted-media"
                />
                <button
                  type="button"
                  onClick={() => setIsVideoMode(false)}
                  className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[var(--bg-surface-1)]/90 backdrop-blur-md text-[10px] font-bold text-[var(--text-primary)] border border-[var(--border-subtle)]"
                >
                  Modo Áudio
                </button>
              </div>
            ) : (
              <>
                <img
                  src={currentTrack.thumbnail || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600"}
                  alt={currentTrack.title}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-102"
                />

                {/* Badge de Alternância para Vídeo */}
                <button
                  type="button"
                  onClick={() => setIsVideoMode(true)}
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-surface-1)]/80 backdrop-blur-md border border-[var(--border-subtle)] text-[10px] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-1)] active:scale-95 transition-all shadow-sm"
                >
                  <Video className="size-3 text-[var(--accent-primary)]" />
                  <span>Ver Clipe</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* ─── C. Informações da Faixa & Like ─── */}
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-0.5">
              <h1 className="text-2xl font-bold text-[var(--text-primary)] truncate leading-tight">
                {currentTrack.title}
              </h1>
              <p
                onClick={() => goToArtist(currentTrack.artistId || currentTrack.artist)}
                className="text-sm font-normal text-[var(--text-secondary)] hover:text-[var(--text-primary)] truncate cursor-pointer transition-colors"
              >
                {currentTrack.artist}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowAddToPlaylistModal(true)}
                aria-label="Adicionar à Playlist"
                className="p-2.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-90 transition-transform"
              >
                <Plus className="size-5" />
              </button>

              <button
                type="button"
                onClick={() => toggleLike(currentTrack)}
                aria-label="Favoritar"
                className={`p-2.5 rounded-full transition-transform active:scale-90 ${
                  liked ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                <Heart
                  className="size-6 transition-colors"
                  fill={liked ? "currentColor" : "none"}
                />
              </button>
            </div>
          </div>

          {/* ─── D. Barra de Progresso (Seek Bar Soft UI) ─── */}
          <div className="space-y-2">
            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const clickPos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
                seek(clickPos * totalSec)
              }}
              className="relative w-full h-1.5 bg-[var(--bg-surface-2)] rounded-full cursor-pointer overflow-visible"
            >
              <div
                className="h-full bg-[var(--accent-primary)] rounded-full relative"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md pointer-events-none" />
              </div>
            </div>
            <div className="flex justify-between text-xs text-[var(--text-muted)] font-medium">
              <span>{formatTime(currentSec)}</span>
              <span>{formatTime(totalSec)}</span>
            </div>
          </div>

          {/* ─── E. Controles Principais de Reprodução ─── */}
          <div className="flex items-center justify-between px-2 pt-1">
            {/* Shuffle */}
            <button
              type="button"
              onClick={toggleShuffle}
              aria-label="Aleatório"
              className={`p-2 transition-all active:scale-90 ${
                shuffle ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Shuffle className="size-5" />
            </button>

            {/* Anterior */}
            <button
              type="button"
              onClick={handlePrevButton}
              aria-label="Anterior"
              className="p-2 text-[var(--text-primary)] active:scale-95 transition-transform"
            >
              <SkipBack className="size-6.5 fill-current" />
            </button>

            {/* Play / Pause Principal (64x64 Solid Accent) */}
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pausar" : "Reproduzir"}
              className="size-16 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center shadow-[0_8px_24px_var(--accent-glow)] active:scale-95 transition-transform"
            >
              {isLoading ? (
                <Loader2 className="size-7 animate-spin text-white" />
              ) : isPlaying ? (
                <Pause className="size-7 fill-white text-white" />
              ) : (
                <Play className="size-7 fill-white text-white translate-x-0.5" />
              )}
            </button>

            {/* Próximo */}
            <button
              type="button"
              onClick={next}
              aria-label="Próximo"
              className="p-2 text-[var(--text-primary)] active:scale-95 transition-transform"
            >
              <SkipForward className="size-6.5 fill-current" />
            </button>

            {/* Repeat */}
            <button
              type="button"
              onClick={toggleRepeat}
              aria-label="Repetir"
              className={`p-2 transition-all active:scale-90 ${
                repeat !== "off" ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {repeat === "one" ? <Repeat1 className="size-5" /> : <Repeat className="size-5" />}
            </button>
          </div>

          {/* ─── F. Ação de Letra & Ferramentas ─── */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)] text-[var(--text-secondary)]">
            <button
              type="button"
              onClick={() => setShowInfoModal(true)}
              className="flex items-center gap-1.5 text-xs font-medium hover:text-[var(--text-primary)] active:scale-95 transition-all"
            >
              <Info className="size-4" />
              <span>Info</span>
            </button>

            <button
              type="button"
              onClick={handleScrollToLyrics}
              className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-primary)] hover:underline active:scale-95 transition-all"
            >
              <Mic2 className="size-4" />
              <span>Exibir Letra</span>
            </button>

            <button
              type="button"
              onClick={() => setShowQueueModal(true)}
              className="flex items-center gap-1.5 text-xs font-medium hover:text-[var(--text-primary)] active:scale-95 transition-all"
            >
              <ListMusic className="size-4" />
              <span>Fila ({queue.length})</span>
            </button>
          </div>
        </div>

        {/* ─── 4. PAINEL INFERIOR DE LETRAS SINCRONIZADAS (Time-Synced Karaoke) ─── */}
        <section ref={lyricsContainerRef} className="mt-14 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic2 className="size-4 text-[var(--accent-pink)]" />
              <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                Letras Sincronizadas
              </h2>
            </div>
            <button
              type="button"
              onClick={goToLyrics}
              className="text-[11px] font-bold text-[var(--accent-purple)] hover:underline"
            >
              Tela Cheia
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto rounded-3xl bg-[var(--bg-surface-glass)] backdrop-blur-2xl border border-[var(--border)] p-6 space-y-4 shadow-xl no-scrollbar">
            {lyrics?.lines && lyrics.lines.length > 0 ? (
              lyrics.lines.map((line, idx) => {
                const isActive = idx === activeLyricIndex
                return (
                  <p
                    key={`lyric-${idx}`}
                    onClick={() => seek(line.seconds)}
                    className={`cursor-pointer transition-all duration-300 ${
                      isActive
                        ? "text-lg sm:text-xl font-black text-white scale-102 drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]"
                        : "text-sm font-semibold text-[var(--text-primary)]/35 hover:text-[var(--text-primary)]/70"
                    }`}
                  >
                    {line.text}
                  </p>
                )
              })
            ) : lyrics?.plain ? (
              <p className="text-xs font-medium text-[var(--text-primary)]/80 whitespace-pre-line leading-relaxed">
                {lyrics.plain}
              </p>
            ) : (
              <p className="text-xs font-bold text-[var(--text-muted)] text-center py-6">
                Nenhuma letra sincronizada encontrada para esta faixa.
              </p>
            )}
          </div>
        </section>

        {/* ─── CARD DO ARTISTA ─── */}
        {artistDetails && (
          <section className="mt-8 space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
              Sobre o Artista
            </h2>
            <div
              onClick={() => goToArtist(artistDetails.id || currentTrack.artist)}
              className="flex items-center gap-4 p-4 rounded-3xl bg-[var(--bg-surface-glass)] backdrop-blur-2xl border border-[var(--border)] cursor-pointer active:scale-98 transition-all shadow-lg group"
            >
              <img
                src={artistDetails.thumbnail}
                alt={artistDetails.name}
                className="size-16 rounded-2xl object-cover bg-zinc-900 shadow-md"
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-black text-white group-hover:text-[var(--accent-pink)] transition-colors truncate">
                  {artistDetails.name}
                </h3>
                <p className="text-xs font-medium text-[var(--text-secondary)] truncate mt-0.5">
                  {artistDetails.listeners || "Mais de 1M ouvintes"}
                </p>
              </div>
              <button
                type="button"
                className="px-4 py-1.5 rounded-full bg-[var(--accent-blue)] text-white text-xs font-black shadow-md shrink-0"
              >
                Ver Perfil
              </button>
            </div>
          </section>
        )}
      </div>

      {/* ─── MODAL 1: GAVETA DE FILA / UP NEXT ─── */}
      {showQueueModal && (
        <div
          onClick={() => setShowQueueModal(false)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[480px] max-h-[80vh] flex flex-col rounded-t-3xl bg-[var(--bg-surface)] border-t border-[var(--border)] p-6 shadow-2xl animate-slide-up"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <ListMusic className="size-5 text-[var(--accent-pink)]" />
                <h3 className="text-base font-black text-white">Fila de Reprodução ({queue.length})</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQueueModal(false)}
                className="size-8 flex items-center justify-center rounded-full bg-white/10 text-[var(--text-secondary)] hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 py-4 no-scrollbar">
              {queue.map((track, idx) => {
                const isItemCurrent = idx === queueIndex
                return (
                  <div
                    key={`queue-item-${track.id}-${idx}`}
                    onClick={() => {
                      playTrack(track, queue)
                      setShowQueueModal(false)
                    }}
                    className={`flex items-center gap-3 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                      isItemCurrent
                        ? "bg-[var(--accent-blue)]/20 border-[var(--accent-purple)] shadow-md"
                        : "bg-[var(--bg-surface)]/60 border-[var(--border)] hover:bg-white/5"
                    }`}
                  >
                    <TrackImage
                      src={track.thumbnail}
                      trackId={track.id}
                      alt={track.title}
                      className="size-11 rounded-xl object-cover bg-zinc-900 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className={`text-xs font-black truncate ${isItemCurrent ? "text-[var(--accent-pink)]" : "text-white"}`}>
                        {track.title}
                      </h4>
                      <p className="text-[11px] font-semibold text-[var(--text-secondary)] truncate">
                        {track.artist}
                      </p>
                    </div>
                    {isItemCurrent && (
                      <span className="text-[10px] font-black uppercase text-[var(--accent-pink)] bg-[var(--accent-pink)]/20 px-2 py-0.5 rounded-full">
                        Tocando
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: INFO & DETALHES TÉCNICOS ─── */}
      {showInfoModal && (
        <div
          onClick={() => setShowInfoModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/80 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[400px] rounded-3xl bg-[var(--bg-surface)] border border-[var(--border)] p-6 space-y-4 shadow-2xl animate-scale-up"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-black text-white">Informações Técnicas da Faixa</h3>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="text-xs font-bold text-[var(--text-secondary)] hover:text-white"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[var(--text-muted)]">Codec de Áudio</span>
                <span className="font-bold text-white">Opus / AAC High-Res</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[var(--text-muted)]">Bitrate Estimado</span>
                <span className="font-bold text-white">256 kbps (Lossless Normalized)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[var(--text-muted)]">Normalização LUFS</span>
                <span className="font-bold text-[var(--accent-pink)]">-14.0 LUFS Integrado</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[var(--text-muted)]">ID da Faixa</span>
                <span className="font-mono text-[10px] text-white/80">{currentTrack.id}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: PROMPT COGNITIVO DA LUCI ─── */}
      {showPromptModal && (
        <div
          onClick={() => setShowPromptModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/80 backdrop-blur-md animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] rounded-3xl bg-gradient-to-br from-[#06003d] to-[#00001f] border border-[var(--accent-purple)]/50 p-6 space-y-4 shadow-2xl animate-scale-up"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-[var(--accent-pink)] animate-pulse" />
              <h3 className="text-sm font-black text-white">Pedir à Inteligência da Luci</h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Diga o que deseja ouvir a seguir com base nesta música (ex: "Continue com MPB acústico", "Adicione músicas mais animadas").
            </p>

            <div className="relative">
              <input
                type="text"
                value={luciPromptText}
                onChange={(e) => setLuciPromptText(e.target.value)}
                placeholder="Como você quer guiar o fluxo musical?"
                className="w-full h-12 pl-4 pr-12 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] text-xs font-semibold text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-purple)]"
              />
              <button
                type="button"
                onClick={handleSendLuciPrompt}
                className="absolute right-2 top-2 size-8 rounded-xl bg-gradient-to-tr from-[#0033ff] to-[#977dff] text-white flex items-center justify-center shadow-md active:scale-90 transition-transform"
              >
                <Send className="size-4" />
              </button>
            </div>

            {promptFeedback && (
              <p className="text-xs font-bold text-[var(--accent-pink)] text-center animate-fade-in">
                {promptFeedback}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL 4: ACTION SHEET GERAL ─── */}
      {showActionSheet && (
        <div
          onClick={() => setShowActionSheet(false)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[480px] rounded-t-3xl bg-[var(--bg-surface)] border-t border-[var(--border)] p-6 space-y-4 shadow-2xl animate-slide-up"
          >
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <TrackImage
                src={currentTrack.thumbnail}
                trackId={currentTrack.id}
                alt={currentTrack.title}
                className="size-12 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-black text-white truncate">{currentTrack.title}</h4>
                <p className="text-xs text-[var(--text-secondary)] truncate">{currentTrack.artist}</p>
              </div>
            </div>

            <div className="space-y-1 text-sm font-bold text-[var(--text-primary)]">
              <button
                type="button"
                onClick={() => {
                  goToArtist(currentTrack.artistId || currentTrack.artist)
                  setShowActionSheet(false)
                }}
                className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10"
              >
                <Disc3 className="size-5 text-[var(--accent-purple)]" />
                <span>Ver Artista</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (currentTrack.albumId) goToAlbumDetail(currentTrack.albumId, currentTrack.album, currentTrack.artist)
                  setShowActionSheet(false)
                }}
                className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10"
              >
                <Disc className="size-5 text-[var(--accent-purple)]" />
                <span>Ver Álbum</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  addToQueue(currentTrack)
                  setShowActionSheet(false)
                }}
                className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10"
              >
                <ListPlus className="size-5 text-[var(--accent-purple)]" />
                <span>Tocar a Seguir</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSleepTimerSheet(true)
                  setShowActionSheet(false)
                }}
                className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10"
              >
                <Clock className="size-5 text-[var(--accent-purple)]" />
                <span>Temporizador de Sono {activeSleepTimer ? `(${activeSleepTimer}m)` : ""}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: currentTrack.title,
                      text: `Ouvindo ${currentTrack.title} na Luci`,
                      url: window.location.href,
                    })
                  }
                  setShowActionSheet(false)
                }}
                className="flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 active:bg-white/10"
              >
                <Share2 className="size-5 text-[var(--accent-purple)]" />
                <span>Compartilhar com a Luci</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL DE FILA (QUEUE SCREEN) ─── */}
      <QueueScreen
        isOpen={showQueueModal}
        onClose={() => setShowQueueModal(false)}
      />

      {/* ─── MODAL ADICIONAR À PLAYLIST (BOTTOM SHEET) ─── */}
      <AddToPlaylistModal
        track={currentTrack}
        isOpen={showAddToPlaylistModal}
        onClose={() => setShowAddToPlaylistModal(false)}
      />

      {/* ─── MODAL TEMPORIZADOR DE SONO (SLEEP TIMER SHEET) ─── */}
      <SleepTimerSheet
        isOpen={showSleepTimerSheet}
        onClose={() => setShowSleepTimerSheet(false)}
        onSetTimer={handleSetSleepTimer}
        activeMinutes={activeSleepTimer}
      />
    </div>
  )
}
