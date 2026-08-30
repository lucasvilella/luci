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
import { TrackActionMenu } from "@/components/ui/track-action-menu"
import { formatSeconds, type LuciTrack } from "@/lib/lucimusic"

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
      {/* ─── HEADER DE NAVEGAÇÃO SUPERIOR COM VOLTAR, TEMA E MAIS OPÇÕES ─── */}
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
          {/* Seletor Provisório de Tema */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
            aria-label="Alternar tema"
            className="size-10 rounded-full bg-[var(--bg-surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-center transition-transform active:scale-90"
          >
            {mounted && theme === "dark" ? (
              <Sun className="size-4.5 text-amber-400" />
            ) : (
              <Moon className="size-4.5 text-indigo-600" />
            )}
          </button>

          {/* Mais Opções */}
          <button
            type="button"
            onClick={() => setIsActionMenuOpen(true)}
            aria-label="Mais opções da música"
            className="size-10 rounded-full bg-[var(--bg-surface-1)] text-[var(--text-primary)] border border-[var(--border-subtle)] flex items-center justify-center transition-transform active:scale-90"
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

          {/* Bloco de Letras com Rolagem Suave e Destaque da Frase Cantada */}
          <div
            onClick={goToLyrics}
            className="mt-2 cursor-pointer rounded-[16px] p-5 max-h-[220px] overflow-y-auto space-y-3 bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] shadow-inner transition-all hover:border-[var(--accent-primary)]/50 group"
          >
            {loadingLyrics ? (
              <p className="text-xs text-[var(--text-secondary)] italic animate-pulse">
                Carregando letra sincronizada...
              </p>
            ) : lyrics?.lines && lyrics.lines.length > 0 ? (
              lyrics.lines.map((line, idx) => {
                const nextLineTime = lyrics.lines[idx + 1]?.time || 9999
                const isCurrent = currentTime >= line.time && currentTime < nextLineTime
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 transition-all duration-300 ${
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

        {/* ─── SOBRE O ARTISTA (Dinâmico com dados reais da faixa) ─── */}
        <div className="pt-4 space-y-3">
          <h3 className="text-base font-black text-[var(--text-primary)]">
            Sobre o artista
          </h3>

          <div className="rounded-[20px] overflow-hidden bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] shadow-md p-4 space-y-3">
            {/* Foto Retangular Grande do Artista */}
            <div className="relative w-full h-48 rounded-[14px] overflow-hidden bg-[var(--bg-surface-2)]">
              <img
                src={track.thumbnail || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600"}
                alt={track.artist}
                className="size-full object-cover"
              />
            </div>

            {/* Cabeçalho do Artista + Botão Seguir */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-extrabold text-[var(--text-primary)]">
                  {track.artist}
                </h4>
                <p className="text-xs text-[var(--text-secondary)]">
                  Artista no radar da Luci
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsFollowingArtist(!isFollowingArtist)}
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

        {/* ─── MAIS DE "NOME DO ARTISTA" ─── */}
        <div className="pt-3 space-y-3">
          <SectionHeader
            title={`Mais de "${track.artist.split(",")[0]}"`}
            seeAllText="Ver tudo"
            onSeeAll={() => goToArtist(track.artist)}
          />

          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
            <MediaCard
              id="rel_1"
              title="Peão Tatuado"
              subtitle="Panda, Ícaro e Gilmar"
              imageUrl="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400"
              onClick={() => {}}
            />
            <MediaCard
              id="rel_2"
              title="A Pista Tá Salgada"
              subtitle="Panda, Ícaro e Gilmar"
              imageUrl="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400"
              onClick={() => {}}
            />
            <MediaCard
              id="rel_3"
              title="Tema Playlist"
              subtitle="Panda"
              imageUrl="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400"
              onClick={() => {}}
            />
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
