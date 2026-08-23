"use client"

import { useEffect, useState } from "react"
import {
  ChevronLeft,
  Plus,
  Check,
  Shuffle,
  Play,
  Pause,
  MoreVertical,
  Loader2,
  Calendar,
  Sparkles,
} from "lucide-react"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { TrackImage } from "./track-image"
import { fetchAlbumDetails, type LuciTrack, type AlbumDetails } from "@/lib/lucimusic"

interface AlbumDetailProps {
  albumId?: string | number
  title?: string
  artist?: string
  thumbnail?: string
  initialTracks?: LuciTrack[]
}

export function AlbumDetailView({
  albumId = "album_detail",
  title = "Álbum",
  artist = "Artista",
  thumbnail = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
  initialTracks = [],
}: AlbumDetailProps) {
  const { pop, goToArtist, goToAlbumDetail } = useMusicNavigation()
  const { playTrack, currentTrack, isPlaying, togglePlay } = useMusicPlayer()

  const [albumData, setAlbumData] = useState<AlbumDetails | null>(null)
  const [tracks, setTracks] = useState<LuciTrack[]>(initialTracks)
  const [loading, setLoading] = useState(true)

  // 1. Estado de salvar álbum (+ / check)
  const [isSaved, setIsSaved] = useState(false)
  const [showSavedToast, setShowSavedToast] = useState(false)

  // 2. Estado do botão Shuffle (Ativo / Desativado)
  const [isShuffleActive, setIsShuffleActive] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedAlbums = JSON.parse(
          localStorage.getItem("lucimusic_saved_albums") || "[]"
        )
        if (
          savedAlbums.some((a: any) => a.title === title || a.id === albumId)
        ) {
          setIsSaved(true)
        }
      } catch {}
    }
  }, [title, albumId])

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    console.log("[AlbumDetailView] Carregando álbum:", { albumId, title, artist })

    fetchAlbumDetails(String(albumId), title, artist)
      .then((data) => {
        if (isMounted && data) {
          console.log("[AlbumDetailView] Dados recebidos com sucesso:", data.title, "Faixas:", data.tracks?.length)
          setAlbumData(data)
          if (Array.isArray(data.tracks) && data.tracks.length > 0) {
            setTracks(data.tracks)
          } else if (initialTracks && initialTracks.length > 0) {
            setTracks(initialTracks)
          }
        }
      })
      .catch((err) => {
        console.error("[AlbumDetailView] Erro ao carregar dados do álbum:", err)
        if (initialTracks && initialTracks.length > 0) {
          setTracks(initialTracks)
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [albumId, title, artist])

  // Ação de Salvar Álbum na Biblioteca
  const handleToggleSaveAlbum = () => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("lucimusic_saved_albums") || "[]"
      )
      if (isSaved) {
        const filtered = saved.filter(
          (a: any) => a.title !== title && a.id !== albumId
        )
        localStorage.setItem("lucimusic_saved_albums", JSON.stringify(filtered))
        setIsSaved(false)
      } else {
        const newAlbum = {
          id: albumId || `alb_${Date.now()}`,
          title,
          artist,
          thumbnail: albumData?.thumbnail || thumbnail,
          tracks_count: tracks.length,
          tracks,
          created_at: new Date().toISOString(),
        }
        saved.push(newAlbum)
        localStorage.setItem("lucimusic_saved_albums", JSON.stringify(saved))
        setIsSaved(true)
        setShowSavedToast(true)
        setTimeout(() => setShowSavedToast(false), 2500)
      }
    } catch (e) {
      console.error("Erro ao salvar álbum:", e)
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

  // Ação do Botão de Play Principal
  const handlePlayFromStart = () => {
    if (tracks.length > 0) {
      const isAlbumPlaying =
        tracks.some((t) => t.id === currentTrack?.id) && isPlaying

      if (isAlbumPlaying) {
        togglePlay()
      } else {
        setIsShuffleActive(false)
        playTrack(tracks[0], tracks)
      }
    }
  }

  const isAlbumPlaying =
    tracks.length > 0 &&
    tracks.some((t) => t.id === currentTrack?.id) &&
    isPlaying

  // Calcula tempo total somando a duração das faixas
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

  const effectiveArtist = albumData?.artist || artist
  const effectiveThumb = albumData?.thumbnail || thumbnail
  const effectiveYear = albumData?.year || "2024"
  const artistAvatar =
    albumData?.artist_thumbnail ||
    effectiveThumb ||
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=120&q=80"

  return (
    <div className="flex h-full flex-col bg-[#F8FAFC] text-zinc-900 select-none animate-view-in">
      {/* ─── 1. Header Minimalista Apenas com Voltar ─── */}
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
          ✓ Álbum salvo na sua biblioteca!
        </div>
      )}

      {/* ─── 2. Conteúdo Rolável do Álbum ─── */}
      <div className="flex-1 overflow-y-auto px-6 space-y-6 pt-4 pb-28 no-scrollbar">
        {/* Capa Centralizada com Cantos Arredondados e Sombra Suave */}
        <div className="flex flex-col items-center pt-2">
          <div className="relative size-60 rounded-3xl overflow-hidden shadow-lg border border-zinc-200/80 bg-zinc-100">
            <img
              src={effectiveThumb}
              alt={title}
              referrerPolicy="no-referrer"
              className="size-full object-cover"
            />
          </div>
        </div>

        {/* Informações do Álbum: Nome, Cantor com Foto Redonda e Data de Lançamento */}
        <div className="flex items-center justify-between pt-2">
          <div className="space-y-1.5 max-w-[50%]">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 leading-tight font-sans truncate">
              {title}
            </h1>

            {/* Foto pequena do Cantor + Nome Clicável para Página do Artista */}
            <div
              onClick={() => goToArtist(effectiveArtist)}
              className="flex items-center gap-2 cursor-pointer group active:opacity-75 transition-opacity"
              title="Ver página do artista"
            >
              <div className="size-6 rounded-full overflow-hidden shrink-0 border border-zinc-200 bg-zinc-100 shadow-sm">
                <img
                  src={artistAvatar}
                  alt={effectiveArtist}
                  referrerPolicy="no-referrer"
                  className="size-full object-cover"
                />
              </div>
              <span className="text-sm font-semibold text-[#6366F1] group-hover:underline truncate">
                {effectiveArtist}
              </span>
            </div>

            {/* Quantidade de Músicas, Tempo de Duração e Ano/Mês de Lançamento */}
            <p className="text-xs font-medium text-zinc-500 flex items-center gap-1.5 truncate">
              <span>{tracks.length} faixas</span>
              <span>•</span>
              <span>{formatTotalTime(totalSeconds)}</span>
              {effectiveYear && (
                <>
                  <span>•</span>
                  <span className="font-semibold text-zinc-700">
                    {effectiveYear.includes("-") || effectiveYear.length === 4
                      ? effectiveYear
                      : `${effectiveYear}`}
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Botão de Salvar Álbum (+) */}
            <button
              type="button"
              onClick={handleToggleSaveAlbum}
              className={`size-11 flex items-center justify-center rounded-full transition-transform active:scale-95 ${
                isSaved
                  ? "bg-[#6366F1] text-white shadow-md shadow-[#6366F1]/30"
                  : "bg-zinc-100 shadow-sm border border-zinc-200/80 text-zinc-700 hover:text-black"
              }`}
              aria-label={isSaved ? "Álbum Salvo" : "Salvar Álbum"}
              title={isSaved ? "Salvo na Biblioteca" : "Salvar Álbum"}
            >
              {isSaved ? (
                <Check className="size-5 stroke-[2.5]" />
              ) : (
                <Plus className="size-5.5 stroke-[2.2]" />
              )}
            </button>

            {/* Botão Shuffle Circular */}
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
              aria-label={isAlbumPlaying ? "Pausar" : "Tocar a partir do início"}
              title="Tocar a partir do início"
            >
              {isAlbumPlaying ? (
                <Pause className="size-6 fill-white" />
              ) : (
                <Play className="size-6 fill-white ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* ─── 3. Lista de Músicas do Álbum ─── */}
        <div className="space-y-2 pt-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-400">
              <Loader2 className="size-8 animate-spin text-[#6366F1]" />
              <p className="text-xs">Carregando músicas do álbum...</p>
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
                      src={track.thumbnail || effectiveThumb}
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

                  {/* Informações da Faixa */}
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
              Nenhuma música encontrada para este álbum.
            </p>
          )}
        </div>

        {/* ─── 4. Seção: MAIS DE [NOME DO ARTISTA] ─── */}
        {albumData?.more_from_artist && albumData.more_from_artist.length > 0 && (
          <section className="space-y-3 pt-6 border-t border-zinc-200/70">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 font-sans">
              MAIS DE {effectiveArtist.toUpperCase()}
            </h3>

            <div className="flex gap-3.5 overflow-x-auto pb-2 no-scrollbar">
              {albumData.more_from_artist.map((item) => (
                <div
                  key={item.id}
                  onClick={() =>
                    goToAlbumDetail({
                      albumId: item.id,
                      title: item.title,
                      artist: item.artist,
                      thumbnail: item.thumbnail,
                    })
                  }
                  className="group shrink-0 w-36 flex flex-col cursor-pointer active:scale-[0.98]"
                >
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-2 bg-zinc-100 shadow-sm border border-zinc-200/50">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-xs font-bold text-zinc-900 truncate">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                    {item.year || "Álbum"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── 5. Seção: VOCÊ TAMBÉM PODE GOSTAR ─── */}
        {albumData?.you_might_like && albumData.you_might_like.length > 0 && (
          <section className="space-y-3 pt-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 font-sans">
              VOCÊ TAMBÉM PODE GOSTAR
            </h3>

            <div className="flex gap-3.5 overflow-x-auto pb-2 no-scrollbar">
              {albumData.you_might_like.map((item) => (
                <div
                  key={item.id}
                  onClick={() =>
                    goToAlbumDetail({
                      albumId: item.id,
                      title: item.title,
                      artist: item.artist,
                      thumbnail: item.thumbnail,
                    })
                  }
                  className="group shrink-0 w-36 flex flex-col cursor-pointer active:scale-[0.98]"
                >
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-2 bg-zinc-100 shadow-sm border border-zinc-200/50">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-xs font-bold text-zinc-900 truncate">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                    {item.artist}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
