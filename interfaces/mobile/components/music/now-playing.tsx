"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  ArrowLeft,
  MoreHorizontal,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Play,
  Pause,
  Gauge,
  Timer,
  Cast,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  Sun,
  Moon,
  Heart,
  Maximize2,
  Shuffle,
} from "lucide-react"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { useTheme } from "@/hooks/use-theme"
import { MediaCard } from "@/components/ui/media-card"
import { SectionHeader } from "@/components/ui/section-header"
import { formatSeconds, fetchArtist, type LuciTrack } from "@/lib/lucimusic"
import { luciApiFetch } from "@/lib/api"

export function NowPlaying({ onSwitchToLuci }: { onSwitchToLuci?: () => void }) {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    seekTo,
    skipNext,
    skipPrevious,
    toggleLike,
    isLiked,
    lyrics,
    loadingLyrics,
    shuffle,
    repeat,
    toggleShuffle,
    toggleRepeat,
  } = useMusicPlayer()

  const { goBack, goToArtist, goToAlbumDetail, goToLyrics } = useMusicNavigation()
  const { theme, toggleTheme, mounted } = useTheme()

  const [showLyricsExpanded, setShowLyricsExpanded] = useState(false)
  const [isFollowingArtist, setIsFollowingArtist] = useState(false)
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.25 | 1.5 | 2>(1)
  const [showSpeedToast, setShowSpeedToast] = useState(false)

  // Dados da faixa ativa (com fallback para Starboy dos mockups)
  const track: LuciTrack = currentTrack || {
    id: "starboy_default",
    title: "Starboy",
    artist: "The Weeknd, Daft Punk",
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
    duration: 230,
  }

  // Extrai apenas o artista principal (ex: "Mc Livinho" de "Mc Livinho, Mc Pedrinho, Perera DJ")
  const primaryArtist = track.artist
    ? track.artist.split(/[,/|&]|\bfeat\.?\b|\bft\.?\b|\b e \b/i)[0].trim()
    : "Artista"

  // Estado dinâmico do perfil do artista e das faixas recomendadas
  const [artistDetails, setArtistDetails] = useState<any>(null)
  const [songInfo, setSongInfo] = useState<any>(null)
  const [loadingArtist, setLoadingArtist] = useState(false)
  const miniLyricsContainerRef = useRef<HTMLDivElement | null>(null)

  // Encontra a linha ativa na miniatura e rola suavemente o container
  const activeMiniLineIndex = lyrics?.lines?.findIndex((line: any, i: number) => {
    const nextLine = lyrics.lines[i + 1]
    const lineSec = Number((line as any).timeSeconds ?? (line as any).seconds ?? (line as any).time ?? ((line as any).time_ms ? (line as any).time_ms / 1000 : 0))
    const nextSec = nextLine ? Number((nextLine as any).timeSeconds ?? (nextLine as any).seconds ?? (nextLine as any).time ?? ((nextLine as any).time_ms ? (nextLine as any).time_ms / 1000 : 0)) : Infinity
    return currentTime >= lineSec && currentTime < nextSec
  }) ?? -1

  useEffect(() => {
    if (activeMiniLineIndex >= 0 && miniLyricsContainerRef.current) {
      const activeEl = miniLyricsContainerRef.current.children[activeMiniLineIndex] as HTMLElement
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }, [activeMiniLineIndex])

  useEffect(() => {
    let active = true
    async function loadArtistAndSongData() {
      if (!track?.id) return
      setLoadingArtist(true)

      // 1. Busca informações ricas da música atual (views, data, descrição, artist_id e canal)
      let resolvedArtistId = (track as any).artistId || ""
      let resolvedArtistQuery = primaryArtist

      try {
        const res = await luciApiFetch(`/api/v1/music/track/${track.id}`)
        if (res.ok) {
          const sData = await res.json()
          if (active) {
            setSongInfo(sData)
            if (sData.artist_id) resolvedArtistId = sData.artist_id
            if (sData.artist) resolvedArtistQuery = sData.artist
          }
        }
      } catch (err) {
        console.warn("[NowPlaying] Falha ao carregar informações da música:", err)
      }

      // 2. Busca perfil oficial do artista principal utilizando o browseId oficial ou nome resolvido
      try {
        const queryToUse = resolvedArtistId || resolvedArtistQuery || primaryArtist
        const artData = await fetchArtist(queryToUse)
        if (active && artData) {
          setArtistDetails(artData)
        }
      } catch (err) {
        console.warn("[NowPlaying] Falha ao carregar artista:", err)
      } finally {
        if (active) setLoadingArtist(false)
      }
    }

    loadArtistAndSongData()
    return () => {
      active = false
    }
  }, [track.id, primaryArtist])

  const effectiveDuration = duration > 0 ? duration : (track.duration || 230)
  const progressPercent = Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100))

  // Pular 10s para trás / frente
  const handleSeekDelta = (delta: number) => {
    seekTo(Math.min(effectiveDuration, Math.max(0, currentTime + delta)))
  }

  // Alternar velocidade de reprodução
  const cyclePlaybackSpeed = () => {
    const speeds: Array<1 | 1.25 | 1.5 | 2> = [1, 1.25, 1.5, 2]
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length
    setPlaybackSpeed(speeds[nextIdx])
    setShowSpeedToast(true)
    setTimeout(() => setShowSpeedToast(false), 1500)
  }

  return (
    <div className="relative flex h-full flex-col bg-[var(--bg-app)] text-[var(--text-primary)] select-none overflow-y-auto pb-32">
      {/* ─── HEADER DE NAVEGAÇÃO SUPERIOR COM VOLTAR E MAIS OPÇÕES ─── */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-5 pt-4 pb-2 bg-[var(--bg-app)]/90 backdrop-blur-xl">
        <button
          type="button"
          onClick={goBack}
          aria-label="Voltar"
          className="size-10 rounded-full bg-[var(--bg-surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-center transition-transform active:scale-90 shadow-sm"
        >
          <ArrowLeft className="size-5" />
        </button>

        <div className="flex items-center gap-2">
          {/* Mais Opções */}
          <button
            type="button"
            onClick={() => setIsActionMenuOpen(true)}
            aria-label="Mais opções"
            className="size-10 rounded-full bg-[var(--bg-surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-center transition-transform active:scale-90 shadow-sm"
          >
            <MoreHorizontal className="size-5" />
          </button>
        </div>
      </header>

      {/* ─── CORPO PRINCIPAL DO PLAYER ─── */}
      <div className="flex flex-col px-6 pt-2 space-y-5">
        {/* Capa Gigante 1:1 com Raio de 24px (~10% da altura de 320px) */}
        {!showLyricsExpanded && (
          <div className="relative mx-auto w-full max-w-[320px] aspect-square rounded-[24px] overflow-hidden bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] shadow-2xl transition-all duration-300">
            <img
              src={track.thumbnail || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800"}
              alt={track.title}
              className="size-full object-cover"
            />
          </div>
        )}

        {/* Título da Música & Artistas */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
            {track.title}
          </h1>
          <p
            onClick={() => goToArtist(track.artist)}
            className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:underline cursor-pointer transition-colors"
          >
            {track.artist}
          </p>
        </div>

        {/* ─── BARRA DE PROGRESSO & TIMERS ─── */}
        <div className="space-y-1.5 pt-1">
          {/* Slider Interativo na Cor da Marca Luci */}
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const pos = (e.clientX - rect.left) / rect.width
              seekTo(pos * effectiveDuration)
            }}
            className="relative h-2 w-full bg-[var(--bg-surface-2)] rounded-full cursor-pointer overflow-hidden border border-[var(--border-subtle)]"
          >
            <div
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#5c62ec] to-[#7c82ff] rounded-full transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Timestamps Atual / Total */}
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)] px-0.5">
            <span>{formatSeconds(currentTime)}</span>
            <span>{formatSeconds(effectiveDuration)}</span>
          </div>
        </div>

        {/* ─── CONTROLES DE REPRODUÇÃO PRINCIPAIS (Conforme Referência) ─── */}
        <div className="flex items-center justify-between px-6 pt-2 pb-1">
          {/* Botão Repetir (Repeat) */}
          <button
            type="button"
            onClick={toggleRepeat}
            aria-label="Repetir"
            className={`p-2 transition-transform active:scale-90 ${
              repeat !== "off" ? "text-[#22c55e]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <RotateCcw className="size-5 stroke-[2.2]" />
          </button>

          {/* Faixa Anterior (SkipBack preenchido) */}
          <button
            type="button"
            onClick={skipPrevious}
            aria-label="Faixa anterior"
            className="p-2 text-[var(--text-primary)] hover:text-[#22c55e] active:scale-90 transition-transform"
          >
            <SkipBack className="size-6 stroke-[2.2] fill-current" />
          </button>

          {/* Botão Play / Pause Gigante Circular Verde (#22c55e) */}
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pausar" : "Tocar"}
            className="size-16 rounded-full bg-[#22c55e] text-white flex items-center justify-center shadow-xl shadow-[#22c55e]/30 hover:scale-105 active:scale-95 transition-all"
          >
            {isPlaying ? (
              <Pause className="size-7 fill-white stroke-none" />
            ) : (
              <Play className="size-7 fill-white stroke-none translate-x-0.5" />
            )}
          </button>

          {/* Próxima Faixa (SkipForward preenchido) */}
          <button
            type="button"
            onClick={skipNext}
            aria-label="Próxima faixa"
            className="p-2 text-[var(--text-primary)] hover:text-[#22c55e] active:scale-90 transition-transform"
          >
            <SkipForward className="size-6 stroke-[2.2] fill-current" />
          </button>

          {/* Botão Aleatório (Shuffle) */}
          <button
            type="button"
            onClick={toggleShuffle}
            aria-label="Ordem aleatória"
            className={`p-2 transition-transform active:scale-90 ${
              shuffle ? "text-[#22c55e]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Shuffle className="size-5 stroke-[2.2]" />
          </button>
        </div>

        {/* ─── BARRA DE FERRAMENTAS SECUNDÁRIAS (VELOCIDADE, TIMER, CAST, OPÇÕES) ─── */}
        <div className="flex items-center justify-between px-3 pt-2 text-[var(--text-secondary)] border-b border-[var(--border-subtle)] pb-4">
          {/* Velocidade */}
          <button
            type="button"
            onClick={cyclePlaybackSpeed}
            aria-label="Velocidade"
            className="p-2 hover:text-[var(--text-primary)] active:scale-90 transition-transform relative"
          >
            <Gauge className="size-5 stroke-[1.8]" />
            {playbackSpeed !== 1 && (
              <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-[var(--accent-primary)] text-white px-1 rounded-full">
                {playbackSpeed}x
              </span>
            )}
          </button>

          {/* Sleep Timer */}
          <button
            type="button"
            aria-label="Temporizador"
            className="p-2 hover:text-[var(--text-primary)] active:scale-90 transition-transform"
          >
            <Timer className="size-5 stroke-[1.8]" />
          </button>

          {/* Cast / Transmitir */}
          <button
            type="button"
            aria-label="Transmitir áudio"
            className="p-2 hover:text-[var(--text-primary)] active:scale-90 transition-transform"
          >
            <Cast className="size-5 stroke-[1.8]" />
          </button>

          {/* Mais Opções */}
          <button
            type="button"
            onClick={() => setIsActionMenuOpen(true)}
            aria-label="Opções"
            className="p-2 hover:text-[var(--text-primary)] active:scale-90 transition-transform"
          >
            <MoreVertical className="size-5 stroke-[1.8]" />
          </button>
        </div>

        {/* ─── SEÇÃO DE LETRAS (Lyrics Dinâmicas com Botão Tela Cheia) ─── */}
        <div className="pt-1">
          <div className="flex items-center justify-between py-1">
            <h3 className="text-lg font-black text-[var(--text-primary)]">
              Letras
            </h3>
            {/* Botão de Tela Cheia para o Modo Karaoke Completo */}
            <button
              type="button"
              onClick={goToLyrics}
              title="Abrir letras em tela cheia"
              aria-label="Abrir letras em tela cheia"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-surface-2)] text-[var(--text-primary)] hover:bg-[var(--accent-primary)] hover:text-white transition-all active:scale-90 text-xs font-bold shadow-sm"
            >
              <Maximize2 className="size-3.5 stroke-[2.5]" />
              <span>Tela cheia</span>
            </button>
          </div>

          {/* Bloco de Letras com Rolagem Suave Automática e Destaque da Frase Cantada */}
          <div
            ref={miniLyricsContainerRef}
            onClick={goToLyrics}
            className="mt-2 cursor-pointer rounded-[16px] p-5 max-h-[200px] overflow-y-auto space-y-3 bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] shadow-inner transition-all hover:border-[var(--accent-primary)]/50 group scroll-smooth no-scrollbar"
          >
            {loadingLyrics ? (
              <p className="text-xs text-[var(--text-secondary)] italic animate-pulse">
                Carregando letra sincronizada...
              </p>
            ) : lyrics?.lines && lyrics.lines.length > 0 ? (
              lyrics.lines.map((line: any, idx: number) => {
                const nextLine = lyrics.lines[idx + 1]
                const lineSec = Number((line as any).timeSeconds ?? (line as any).seconds ?? (line as any).time ?? ((line as any).time_ms ? (line as any).time_ms / 1000 : 0))
                const nextSec = nextLine ? Number((nextLine as any).timeSeconds ?? (nextLine as any).seconds ?? (nextLine as any).time ?? ((nextLine as any).time_ms ? (nextLine as any).time_ms / 1000 : 0)) : Infinity
                const isCurrent = currentTime >= lineSec && currentTime < nextSec

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 transition-all duration-300 py-0.5 ${
                      isCurrent
                        ? "text-[var(--accent-primary)] scale-[1.03] origin-left font-black"
                        : "text-[var(--text-secondary)] opacity-60 font-semibold"
                    }`}
                  >
                    {isCurrent && (
                      <span className="size-2 rounded-full bg-[#10b981] shadow-sm animate-pulse shrink-0" />
                    )}
                    <p className={`text-base leading-relaxed ${isCurrent ? "text-[var(--accent-primary)] font-black drop-shadow-sm" : ""}`}>
                      {line.text}
                    </p>
                  </div>
                )
              })
            ) : lyrics?.plain ? (
              <p className="text-sm font-medium leading-relaxed whitespace-pre-line text-[var(--text-primary)]">
                {lyrics.plain}
              </p>
            ) : (
              <p className="text-xs text-[var(--text-secondary)] opacity-70">
                Toque para abrir a tela de letras completa.
              </p>
            )}
          </div>
        </div>

        {/* ─── SOBRE O ARTISTA (Foto Oficial do Artista Principal + Inscritos) ─── */}
        <div className="pt-4 space-y-3">
          <h3 className="text-base font-black text-[var(--text-primary)]">
            Sobre o artista
          </h3>

          <div
            onClick={() => goToArtist(primaryArtist)}
            className="rounded-[20px] overflow-hidden bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] shadow-md p-4 space-y-3 cursor-pointer group transition-all hover:border-[var(--accent-primary)]/40"
          >
            {/* Foto Retangular do Artista Oficial */}
            <div className="relative w-full h-48 rounded-[14px] overflow-hidden bg-[var(--bg-surface-2)]">
              <img
                src={
                  artistDetails?.thumbnail ||
                  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600"
                }
                alt={primaryArtist}
                className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[11px] font-extrabold uppercase tracking-wider">
                Artistas
              </div>
            </div>

            {/* Cabeçalho do Artista + Botão Seguir */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <h4 className="text-base font-extrabold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                  {artistDetails?.name || primaryArtist}
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {artistDetails?.subscribers || "Artista no radar da Luci"}
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsFollowingArtist(!isFollowingArtist)
                }}
                className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                  isFollowingArtist
                    ? "bg-[var(--bg-surface-2)] text-[var(--text-primary)] border border-[var(--border-subtle)]"
                    : "bg-[var(--accent-primary)] text-white shadow-md shadow-[#5c62ec]/30"
                }`}
              >
                {isFollowingArtist ? "Seguindo" : "Seguir"}
              </button>
            </div>
          </div>
        </div>

        {/* ─── INFORMAÇÕES DA MÚSICA (Data de Publicação, Visualizações, Descrição) ─── */}
        <div className="pt-2 space-y-3">
          <div className="rounded-[20px] bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] shadow-md p-5 space-y-3 text-[var(--text-primary)]">
            <p className="text-xs font-medium text-[var(--text-secondary)]">
              {songInfo?.publish_date
                ? `Publicado em ${songInfo.publish_date}`
                : "Lançamento oficial"}
            </p>

            <div>
              <h4 className="text-xl font-black text-[var(--text-primary)] leading-tight">
                {songInfo?.view_count
                  ? `${Number(songInfo.view_count).toLocaleString("pt-BR")} visualizações`
                  : "Música em destaque"}
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                {track.title}
              </p>
            </div>

            {/* Descrição / Créditos da Faixa */}
            <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                Descrição
              </span>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-4 whitespace-pre-line">
                {songInfo?.description ||
                  `Faixa oficial interpretada por ${track.artist}. Transmissão em alta fidelidade via Luci Music Engine.`}
              </p>
            </div>
          </div>
        </div>

        {/* ─── MAIS DE "[ARTISTA PRINCIPAL]" (Recomendações Reais) ─── */}
        <div className="pt-3 space-y-3">
          <SectionHeader
            title={`Mais de "${primaryArtist}"`}
            onSeeAll={() => goToArtist(primaryArtist)}
          />

          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
            {artistDetails?.top_tracks && artistDetails.top_tracks.length > 0 ? (
              artistDetails.top_tracks
                .filter((t: any) => t.id !== track.id)
                .slice(0, 6)
                .map((relTrack: any) => (
                  <MediaCard
                    key={relTrack.id}
                    id={relTrack.id}
                    title={relTrack.title}
                    subtitle={relTrack.artist || primaryArtist}
                    imageUrl={relTrack.thumbnail}
                    onClick={() =>
                      playTrack(
                        {
                          id: relTrack.id,
                          title: relTrack.title,
                          artist: relTrack.artist || primaryArtist,
                          thumbnail: relTrack.thumbnail,
                          duration: relTrack.duration || 200,
                        },
                        artistDetails.top_tracks
                      )
                    }
                  />
                ))
            ) : (
              <p className="text-xs text-[var(--text-secondary)] italic py-2">
                Carregando outras faixas de {primaryArtist}...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ─── MENU SUSPENSO DE AÇÕES FLUTUANTE (TrackActionMenu) ─── */}
      <TrackActionMenu
        isOpen={isActionMenuOpen}
        track={track}
        onClose={() => setIsActionMenuOpen(false)}
        onToggleLike={(t) => toggleLike(t)}
        onAddToPlaylist={() => {}}
        onViewArtist={(artist) => goToArtist(artist)}
        onGoToAlbum={() => {}}
        onShare={() => {}}
        isLiked={isLiked(track.id)}
      />
    </div>
  )
}
