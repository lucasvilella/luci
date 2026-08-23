"use client"

import { useEffect, useState } from "react"
import {
  ChevronLeft,
  Share2,
  Plus,
  Check,
  Shuffle,
  Play,
  Pause,
  MoreVertical,
  Loader2,
} from "lucide-react"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { TrackImage } from "./track-image"
import { searchMusic, type LuciTrack } from "@/lib/lucimusic"

interface PlaylistDetailProps {
  playlistId?: string | number
  title?: string
  curator?: string
  thumbnail?: string
  initialTracks?: LuciTrack[]
}

export function PlaylistDetailView({
  playlistId = "curated_flow",
  title = "Playlist",
  curator = "Luci Música",
  thumbnail = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80",
  initialTracks = [],
}: PlaylistDetailProps) {
  const { pop } = useMusicNavigation()
  const { playTrack, currentTrack, isPlaying, togglePlay } = useMusicPlayer()
  const [tracks, setTracks] = useState<LuciTrack[]>(initialTracks)
  const [loading, setLoading] = useState(initialTracks.length === 0)

  // 1. Estado de salvar playlist
  const [isSaved, setIsSaved] = useState(false)
  const [showSavedToast, setShowSavedToast] = useState(false)

  // 2. Estado do botão Shuffle (Ativo / Desativado)
  const [isShuffleActive, setIsShuffleActive] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedPlaylists = JSON.parse(
          localStorage.getItem("lucimusic_saved_playlists") || "[]"
        )
        if (
          savedPlaylists.some(
            (p: any) => p.title === title || p.id === playlistId
          )
        ) {
          setIsSaved(true)
        }
      } catch {}
    }
  }, [title, playlistId])

  useEffect(() => {
    if (initialTracks && initialTracks.length > 0) {
      setTracks(initialTracks)
      setLoading(false)
      return
    }

    setLoading(true)
    // Limpa caracteres de tags ou emojis do título para melhorar a precisão da busca
    const cleanQuery = title
      .replace(/[•\-\&]/g, " ")
      .replace(/SELEÇÃO MATINAL|FOCO & TRABALHO|ENERGIA & TREINO|DESACELERAR|MADRUGADA/gi, "")
      .trim() || title

    searchMusic(cleanQuery, "songs")
      .then((res) => {
        if (res.songs && res.songs.length > 0) {
          setTracks(res.songs)
        } else {
          // Fallback para termos populares sertanejo/brasil se a query for muito restrita
          searchMusic("Sertanejo Acustico Brasil", "songs").then((fallback) => {
            if (fallback.songs) setTracks(fallback.songs)
          })
        }
      })
      .catch((err) => {
        console.error("[PlaylistDetail] Erro busca:", err)
      })
      .finally(() => setLoading(false))
  }, [title, initialTracks])

  // Ação de Salvar Playlist
  const handleToggleSavePlaylist = () => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("lucimusic_saved_playlists") || "[]"
      )
      if (isSaved) {
        const filtered = saved.filter(
          (p: any) => p.title !== title && p.id !== playlistId
        )
        localStorage.setItem(
          "lucimusic_saved_playlists",
          JSON.stringify(filtered)
        )
        setIsSaved(false)
      } else {
        const newPlaylist = {
          id: playlistId || `pl_${Date.now()}`,
          title,
          thumbnail,
          curator,
          tracks_count: tracks.length,
          tracks,
          created_at: new Date().toISOString(),
        }
        saved.push(newPlaylist)
        localStorage.setItem(
          "lucimusic_saved_playlists",
          JSON.stringify(saved)
        )
        setIsSaved(true)
        setShowSavedToast(true)
        setTimeout(() => setShowSavedToast(false), 2500)
      }
    } catch (e) {
      console.error("Erro ao salvar playlist:", e)
    }
  }

  // Ação do Botão Shuffle
  const handleToggleShuffle = () => {
    const nextState = !isShuffleActive
    setIsShuffleActive(nextState)

    if (tracks.length > 0) {
      if (nextState) {
        const shuffled = [...tracks].sort(() => Math.random() - 0.5)
        playTrack(shuffled[0], shuffled)
      } else {
        playTrack(tracks[0], tracks)
      }
    }
  }

  // Ação do Botão de Play Principal (Inicia da primeira)
  const handlePlayFromStart = () => {
    if (tracks.length > 0) {
      const isPlaylistPlaying =
        tracks.some((t) => t.id === currentTrack?.id) && isPlaying

      if (isPlaylistPlaying) {
        togglePlay()
      } else {
        setIsShuffleActive(false)
        playTrack(tracks[0], tracks)
      }
    }
  }

  const isPlaylistPlaying =
    tracks.length > 0 &&
    tracks.some((t) => t.id === currentTrack?.id) &&
    isPlaying

  // Calcula tempo total exato somando a duração de todas as faixas
  const totalSeconds = tracks.reduce((acc, t) => acc + (t.duration || 180), 0)
  const formatTotalTime = (sec: number) => {
    const hrs = Math.floor(sec / 3600)
    const mins = Math.floor((sec % 3600) / 60)
    if (hrs > 0) {
      return `${hrs}h ${mins > 0 ? `${mins} min` : ""}`.trim()
    }
    return `${mins} min`
  }

  const formatTrackDuration = (sec?: number) => {
    if (!sec || isNaN(sec)) return "3:30"
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s < 10 ? "0" : ""}${s}`
  }

  return (
    <div className="flex h-full flex-col bg-[#F8FAFC] text-zinc-900 select-none animate-view-in">
      {/* ─── 1. Header Fiel ao Tema Light do App (Apenas Voltar) ─── */}
      <header className="flex items-center justify-between px-6 pt-5 pb-3 bg-white border-b border-zinc-200/60 shrink-0">
        <button
          type="button"
          onClick={pop}
          className="size-11 flex items-center justify-center rounded-full bg-zinc-100/90 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_4px_rgba(0,0,0,0.06)] border border-zinc-200/80 text-zinc-700 active:scale-95 transition-all"
          aria-label="Voltar"
        >
          <ChevronLeft className="size-5.5 stroke-[2.2]" />
        </button>
      </header>

      {/* Toast Informativo de confirmação */}
      {showSavedToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#6366F1] text-white text-xs font-bold shadow-lg animate-bounce">
          ✓ Playlist salva na sua biblioteca!
        </div>
      )}

      {/* ─── 2. Conteúdo Rolável da Playlist ─── */}
      <div className="flex-1 overflow-y-auto px-6 space-y-6 pt-4 pb-28 no-scrollbar">
        {/* Capa Centralizada com Cantos Arredondados e Sombra do App Light */}
        <div className="flex flex-col items-center pt-2">
          <div className="relative size-60 rounded-3xl overflow-hidden shadow-lg border border-zinc-200/80 bg-zinc-100">
            <img
              src={thumbnail}
              alt={title}
              referrerPolicy="no-referrer"
              className="size-full object-cover"
            />
          </div>
        </div>

        {/* Título da Playlist, Contagem e Botões de Ação (+ Salvar + Shuffle 2 Estágios + Play Circular Azul/Roxo) */}
        <div className="flex items-center justify-between pt-2">
          <div className="space-y-1 max-w-[50%]">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 leading-tight font-sans truncate">
              {title}
            </h1>
            <p className="text-xs font-medium text-zinc-500">
              {tracks.length > 0
                ? `${tracks.length} faixas • ${formatTotalTime(totalSeconds)}`
                : curator}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Botão de Salvar Playlist (+) ao lado do aleatório */}
            <button
              type="button"
              onClick={handleToggleSavePlaylist}
              className={`size-11 flex items-center justify-center rounded-full transition-transform active:scale-95 ${
                isSaved
                  ? "bg-[#6366F1] text-white shadow-md shadow-[#6366F1]/30"
                  : "bg-zinc-100 shadow-sm border border-zinc-200/80 text-zinc-700 hover:text-black"
              }`}
              aria-label={isSaved ? "Playlist Salva" : "Salvar Playlist"}
              title={isSaved ? "Salva na Biblioteca" : "Salvar Playlist"}
            >
              {isSaved ? (
                <Check className="size-5 stroke-[2.5]" />
              ) : (
                <Plus className="size-5.5 stroke-[2.2]" />
              )}
            </button>

            {/* Botão Shuffle Circular com Dois Estágios */}
            <button
              type="button"
              onClick={handleToggleShuffle}
              className={`size-11 flex items-center justify-center rounded-full transition-all active:scale-95 ${
                isShuffleActive
                  ? "bg-[#6366F1] text-white shadow-md shadow-[#6366F1]/30 ring-2 ring-[#6366F1]/20"
                  : "bg-zinc-100 shadow-sm border border-zinc-200/80 text-zinc-700 hover:text-black"
              }`}
              aria-label={
                isShuffleActive
                  ? "Aleatório Ativado"
                  : "Aleatório Desativado"
              }
              title={
                isShuffleActive
                  ? "Modo aleatório ativo"
                  : "Ativar aleatório"
              }
            >
              <Shuffle className="size-5" />
            </button>

            {/* Botão Play Principal Azul/Roxo */}
            <button
              type="button"
              onClick={handlePlayFromStart}
              className="size-13 flex items-center justify-center rounded-full bg-gradient-to-tr from-[#4F46E5] to-[#6366F1] text-white shadow-lg shadow-[#6366F1]/30 active:scale-95 transition-transform"
              aria-label={isPlaylistPlaying ? "Pausar" : "Tocar a partir do início"}
              title="Tocar a partir do início"
            >
              {isPlaylistPlaying ? (
                <Pause className="size-6 fill-white" />
              ) : (
                <Play className="size-6 fill-white ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* ─── 3. Lista de Músicas da Playlist (Estrutura Figma adaptada para o Tema Light) ─── */}
        <div className="space-y-2 pt-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-400">
              <Loader2 className="size-8 animate-spin text-[#6366F1]" />
              <p className="text-xs">Carregando músicas da playlist...</p>
            </div>
          ) : tracks.length > 0 ? (
            tracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id && isPlaying
              return (
                <div
                  key={`${track.id}-${idx}`}
                  onClick={() => playTrack(track, tracks)}
                  className={`flex items-center gap-3.5 p-2 rounded-2xl bg-white border transition-all cursor-pointer group active:scale-[0.99] ${
                    isCurrent
                      ? "border-[#6366F1]/50 shadow-sm ring-1 ring-[#6366F1]/20 bg-indigo-50/30"
                      : "border-zinc-200/60 shadow-sm hover:border-zinc-300"
                  }`}
                >
                  {/* Capa com Cantos Redondos */}
                  <div className="relative size-12 rounded-xl overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200/40">
                    <TrackImage
                      src={track.thumbnail}
                      trackId={track.id}
                      alt={track.title}
                      className="size-full object-cover"
                    />
                    {isCurrent && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="flex items-end gap-0.5 h-3">
                          <span className="w-0.5 bg-white animate-pulse h-3" />
                          <span className="w-0.5 bg-white animate-pulse delay-75 h-2" />
                          <span className="w-0.5 bg-white animate-pulse delay-150 h-3" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Informações da Faixa (Título, Artista • Duração) */}
                  <div className="flex-1 min-w-0 pr-2">
                    <p
                      className={`text-xs font-bold truncate ${
                        isCurrent ? "text-[#6366F1]" : "text-zinc-900"
                      }`}
                    >
                      {track.title}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {track.artist} • {formatTrackDuration(track.duration)}
                    </p>
                  </div>

                  {/* Botão de Mais Opções (...) */}
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 text-zinc-400 hover:text-zinc-700 rounded-full transition-colors"
                    aria-label="Mais opções"
                  >
                    <MoreVertical className="size-4" />
                  </button>
                </div>
              )
            })
          ) : (
            <p className="text-center text-xs text-zinc-400 py-10">
              Nenhuma música encontrada para esta playlist.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
