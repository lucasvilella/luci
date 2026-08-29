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
import { QueueScreen } from "./queue-screen"
import { AddToPlaylistModal } from "./add-to-playlist-modal"

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

  // Modos e Modais
  const [isVideoMode, setIsVideoMode] = useState(false)
  const [showQueueModal, setShowQueueModal] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showPromptModal, setShowPromptModal] = useState(false)
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false)
  const [showActionSheet, setShowActionSheet] = useState(false)

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
      {/* ─── CAMADA 0 & 1: Dynamic Background Apple Music Mesh Glow ─── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Glow Blobs Mesh Dinâmicos */}
        <div className="absolute -top-24 -left-24 size-[420px] rounded-full bg-[#0033ff] opacity-40 blur-[100px] animate-liquid-glow" />
        <div className="absolute top-1/3 -right-20 size-[380px] rounded-full bg-[#977dff] opacity-35 blur-[90px] animate-liquid-glow [animation-delay:-4s]" />
        <div className="absolute -bottom-20 left-1/4 size-[440px] rounded-full bg-[#06003d] opacity-90 blur-[110px]" />
        <div className="absolute top-1/2 left-1/3 size-[280px] rounded-full bg-[#ffccf2] opacity-15 blur-[80px] animate-liquid-glow [animation-delay:-8s]" />

        {/* Overlay Escuro com Gradiente de Proteção de Contraste */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#00001f]/40 via-[#00001f]/75 to-[#00001f]/95" />
      </div>

      {/* ─── CONTEÚDO PRINCIPAL (Z-INDEX 10) ─── */}
      <div className="relative z-10 flex min-h-full flex-col justify-between p-6">
        {/* ─── A. Header do Player ─── */}
        <header className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={pop}
            aria-label="Recolher Player"
            className="size-10 flex items-center justify-center rounded-full bg-[var(--bg-surface-glass)] backdrop-blur-xl border border-[var(--border)] text-[var(--text-primary)] hover:text-white active:scale-90 transition-all shadow-md"
          >
            <ChevronDown className="size-6" />
          </button>

          <div className="flex flex-col items-center text-center max-w-[65%]">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
              Tocando Agora
            </span>
            <span className="text-xs font-bold text-[var(--text-primary)] truncate">
              {currentTrack.album || "Luci Stream"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowActionSheet(true)}
            aria-label="Opções"
            className="size-10 flex items-center justify-center rounded-full bg-[var(--bg-surface-glass)] backdrop-blur-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-white active:scale-90 transition-all shadow-md"
          >
            <MoreVertical className="size-5" />
          </button>
        </header>

        {/* ─── B. Carrossel Central de Mídia (Capa 1:1 vs. Vídeo Stream) ─── */}
        <div className="my-auto py-6 flex flex-col items-center">
          <div className="relative w-full max-w-[340px] aspect-square rounded-3xl overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.85)] border border-white/10 bg-zinc-950 group">
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
                  className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-black text-white border border-white/20"
                >
                  Modo Áudio
                </button>
              </div>
            ) : (
              <>
                <img
                  src={currentTrack.thumbnail || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600"}
                  alt={currentTrack.title}
                  className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Badge de Alternância para Vídeo */}
                <button
                  type="button"
                  onClick={() => setIsVideoMode(true)}
                  className="absolute top-3 right-3 flex items-center gap-1 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[10px] font-black text-[var(--accent-pink)] hover:bg-black/80 active:scale-95 transition-all"
                >
                  <Video className="size-3" />
                  <span>Ver Clipe</span>
                </button>

                {/* Indicador de Letras Sincronizadas Disponíveis */}
                {lyrics?.has_synced && (
                  <button
                    type="button"
                    onClick={handleScrollToLyrics}
                    className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-surface-glass)] backdrop-blur-md border border-[var(--accent-purple)]/40 text-[10px] font-black text-[var(--accent-pink)] shadow-md"
                  >
                    <Mic2 className="size-3 text-[var(--accent-pink)] animate-pulse" />
                    <span>Letra Sincronizada</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* ─── C. Informações da Faixa & Like ─── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-0.5">
              <h1 className="text-xl sm:text-2xl font-black text-white truncate leading-tight drop-shadow-md">
                {currentTrack.title}
              </h1>
              <p
                onClick={() => goToArtist(currentTrack.artistId || currentTrack.artist)}
                className="text-sm font-bold text-[var(--accent-purple)] hover:text-white truncate cursor-pointer transition-colors"
              >
                {currentTrack.artist}
              </p>
            </div>

            <button
              type="button"
              onClick={() => toggleLike(currentTrack)}
              aria-label="Favoritar"
              className="p-2 text-[var(--text-secondary)] hover:text-white active:scale-90 transition-transform"
            >
              <Heart
                className={`size-7 transition-colors ${
                  liked ? "fill-[var(--accent-purple)] text-[var(--accent-purple)] drop-shadow-[0_0_12px_rgba(151,125,255,0.6)]" : "text-white/70"
                }`}
              />
            </button>
          </div>

          {/* ─── D. Barra de Progresso (Seek Bar) ─── */}
          <div className="space-y-1.5">
            <div className="relative flex items-center group">
              <input
                type="range"
                min={0}
                max={totalSec}
                value={currentSec}
                onChange={handleSeekChange}
                onMouseDown={handleSeekStart}
                onTouchStart={handleSeekStart}
                onMouseUp={handleSeekEnd}
                onTouchEnd={handleSeekEnd}
                className="w-full h-1.5 rounded-full appearance-none bg-white/20 accent-[var(--accent-blue)] cursor-pointer focus:outline-none"
                style={{
                  background: `linear-gradient(to right, #0033ff 0%, #977dff ${progressPercent}%, rgba(242, 230, 238, 0.25) ${progressPercent}%)`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)]">
              <span>{formatTime(currentSec)}</span>
              <span>{formatTime(totalSec)}</span>
            </div>
          </div>

          {/* ─── E. Controles Principais de Reprodução ─── */}
          <div className="flex items-center justify-between pt-2">
            {/* Shuffle */}
            <button
              type="button"
              onClick={toggleShuffle}
              aria-label="Aleatório"
              className={`p-2 transition-all active:scale-90 ${
                shuffle ? "text-[var(--accent-pink)] drop-shadow-[0_0_8px_rgba(255,204,242,0.8)]" : "text-[var(--text-muted)] hover:text-white"
              }`}
            >
              <Shuffle className="size-5" />
            </button>

            {/* Anterior */}
            <button
              type="button"
              onClick={handlePrevButton}
              aria-label="Anterior"
              className="p-2 text-[var(--text-primary)] hover:text-white active:scale-90 transition-transform"
            >
              <SkipBack className="size-7 fill-current" />
            </button>

            {/* Play / Pause Principal */}
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pausar" : "Reproduzir"}
              className="size-16 rounded-full bg-white text-black flex items-center justify-center shadow-[0_8px_25px_rgba(255,255,255,0.3)] active:scale-90 transition-transform"
            >
              {isLoading ? (
                <Loader2 className="size-7 animate-spin text-black" />
              ) : isPlaying ? (
                <Pause className="size-7 fill-black text-black" />
              ) : (
                <Play className="size-7 fill-black text-black translate-x-0.5" />
              )}
            </button>

            {/* Próximo */}
            <button
              type="button"
              onClick={next}
              aria-label="Próximo"
              className="p-2 text-[var(--text-primary)] hover:text-white active:scale-90 transition-transform"
            >
              <SkipForward className="size-7 fill-current" />
            </button>

            {/* Repeat */}
            <button
              type="button"
              onClick={toggleRepeat}
              aria-label="Repetir"
              className={`p-2 transition-all active:scale-90 ${
                repeat !== "off" ? "text-[var(--accent-pink)] drop-shadow-[0_0_8px_rgba(255,204,242,0.8)]" : "text-[var(--text-muted)] hover:text-white"
              }`}
            >
              {repeat === "one" ? <Repeat1 className="size-5" /> : <Repeat className="size-5" />}
            </button>
          </div>

          {/* ─── BARRA DE AÇÕES RÁPIDAS (Compartilhar, + Playlist, Like) ─── */}
          <div className="flex items-center justify-around py-3 px-4 rounded-2xl bg-[var(--bg-surface-glass)] backdrop-blur-xl border border-[var(--border)] text-[var(--text-secondary)]">
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
              }}
              className="flex items-center gap-2 text-xs font-black hover:text-white active:scale-95 transition-all"
            >
              <Share2 className="size-4 text-[var(--accent-purple)]" />
              <span>Compartilhar</span>
            </button>

            <div className="w-[1px] h-4 bg-white/10" />

            <button
              type="button"
              onClick={() => setShowAddToPlaylistModal(true)}
              className="flex items-center gap-2 text-xs font-black text-white hover:text-[var(--accent-pink)] active:scale-95 transition-all"
            >
              <ListPlus className="size-4.5 text-[var(--accent-pink)] animate-pulse" />
              <span>＋ Playlist</span>
            </button>

            <div className="w-[1px] h-4 bg-white/10" />

            <button
              type="button"
              onClick={() => toggleLike(currentTrack)}
              className="flex items-center gap-2 text-xs font-black hover:text-white active:scale-95 transition-all"
            >
              <Heart className={`size-4 ${liked ? "fill-[var(--accent-purple)] text-[var(--accent-purple)]" : "text-white/70"}`} />
              <span>{liked ? "Curtida" : "Curtir"}</span>
            </button>
          </div>

          {/* ─── F. Barra de Ferramentas Secundária ─── */}
          <div className="flex items-center justify-around pt-3 border-t border-white/10 text-[var(--text-secondary)]">
            {/* Info / Créditos */}
            <button
              type="button"
              onClick={() => setShowInfoModal(true)}
              className="flex flex-col items-center gap-1 text-[10.5px] font-bold hover:text-white active:scale-90 transition-all"
            >
              <Info className="size-4.5" />
              <span>Info</span>
            </button>

            {/* Prompt Cognitivo Luci */}
            <button
              type="button"
              onClick={() => setShowPromptModal(true)}
              className="flex flex-col items-center gap-1 text-[10.5px] font-bold text-[var(--accent-pink)] hover:text-white active:scale-90 transition-all"
            >
              <Sparkles className="size-4.5 animate-pulse" />
              <span>Pedir à Luci</span>
            </button>

            {/* Letras */}
            <button
              type="button"
              onClick={handleScrollToLyrics}
              className="flex flex-col items-center gap-1 text-[10.5px] font-bold hover:text-white active:scale-90 transition-all"
            >
              <Mic2 className="size-4.5" />
              <span>Letras</span>
            </button>

            {/* Fila / Up Next */}
            <button
              type="button"
              onClick={() => setShowQueueModal(true)}
              className="flex flex-col items-center gap-1 text-[10.5px] font-bold hover:text-white active:scale-90 transition-all"
            >
              <ListMusic className="size-4.5" />
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
      <QueueScreen
        isOpen={showQueueModal}
        onClose={() => setShowQueueModal(false)}
      />

      {/* ─── MODAL 0: ADICIONAR À PLAYLIST ─── */}
      {currentTrack && (
        <AddToPlaylistModal
          track={currentTrack}
          isOpen={showAddToPlaylistModal}
          onClose={() => setShowAddToPlaylistModal(false)}
        />
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
    </div>
  )
}
