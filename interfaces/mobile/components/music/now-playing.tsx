"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import {
  ChevronLeft,
  Heart,
  Plus,
  ListMusic,
  Mic,
  Repeat,
  Repeat1,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Shuffle,
  ChevronUp,
  Loader2,
  X,
  Check,
} from "lucide-react"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { TrackImage } from "./track-image"
import { fetchPlaylists, addTrackToPlaylist, createPlaylist, type UserPlaylist } from "@/lib/lucimusic"

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
    setVolume,
  } = useMusicPlayer()

  const { pop, goToLyrics, goToArtist, goToAlbumDetail } = useMusicNavigation()

  // 1. Estado da gaveta de Fila de Reprodução (Sequência de músicas tocando a partir da atual)
  const [showQueueModal, setShowQueueModal] = useState(false)

  // 2. Estado do pop-up inferior de Adicionar em Playlist (+)
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false)
  const [userPlaylists, setUserPlaylists] = useState<UserPlaylist[]>([])
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)
  const [addedPlaylistId, setAddedPlaylistId] = useState<string | null>(null)
  const [showNewPlaylistInput, setShowNewPlaylistInput] = useState(false)
  const [newPlaylistTitle, setNewPlaylistTitle] = useState("")
  const [creatingPlaylist, setCreatingPlaylist] = useState(false)

  // 3. Estado do pop-up inferior de Artistas e Álbum da Música
  const [showArtistAlbumModal, setShowArtistAlbumModal] = useState(false)
  const [artistThumbnails, setArtistThumbnails] = useState<Record<string, string>>({})

  // 4. Estado da Luci IA com Volume Ducking (15%)
  const [isLuciListening, setIsLuciListening] = useState(false)
  const [luciSpeechText, setLuciSpeechText] = useState("")
  const [luciStatusText, setLuciStatusText] = useState("")

  const progressBarRef = useRef<HTMLDivElement>(null)

  // Lista os artistas de forma inteligente preservando duplas sertanejas (ex: Ícaro e Gilmar, Humberto & Ronaldo)
  const artistList = currentTrack?.artist
    ? currentTrack.artist
        .split(/[,/]| feat\. | ft\. | Feat\. | Ft\. | with | part\. | Part\. /)
        .map((a) => a.trim())
        .filter((a) => a.length > 0 && !/^(records|gravadora|som livre|sony music|universal music)/i.test(a))
    : []

  // Quando abre o modal de créditos, busca as fotos oficiais de cada artista de fundo
  useEffect(() => {
    if (showArtistAlbumModal && artistList.length > 0) {
      artistList.forEach((artistName) => {
        if (!artistThumbnails[artistName]) {
          fetchArtist(artistName)
            .then((data) => {
              if (data?.thumbnail) {
                setArtistThumbnails((prev) => ({ ...prev, [artistName]: data.thumbnail }))
              }
            })
            .catch(() => {})
        }
      })
    }
  }, [showArtistAlbumModal, artistList, artistThumbnails])

  // Carrega playlists do usuário quando abre o pop-up (+)
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

  const recognitionRef = useRef<any>(null)

  // Função para criar nova playlist e adicionar a música atual automaticamente
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

  // Handler para falar com a Luci na tela de música com Volume Ducking (15%) e controle manual
  const handleTriggerLuciVoice = useCallback(() => {
    // Se já estiver gravando, o usuário clica novamente para parar e processar
    if (isLuciListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {}
      }
      setIsLuciListening(false)
      setVolume(1.0)
      return
    }

    setIsLuciListening(true)
    setLuciStatusText("Ouvindo... Fale agora e toque no Mic para enviar.")
    setLuciSpeechText("")

    // Reduz o volume da música para 15%
    setVolume(0.15)

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.lang = "pt-BR"
      recognition.continuous = true
      recognition.interimResults = true
      recognitionRef.current = recognition

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join("")
        setLuciSpeechText(transcript)
      }

      recognition.onerror = (e: any) => {
        console.warn("Speech error:", e)
      }

      recognition.onend = () => {
        // Quando encerra, se houver texto, processa
        if (luciSpeechText.trim()) {
          setLuciStatusText("Luci processando...")
          setTimeout(() => {
            setLuciStatusText("Luci: 'Entendido! Executando com base nesta música.'")
            setTimeout(() => {
              setIsLuciListening(false)
              setVolume(1.0)
              setLuciStatusText("")
              setLuciSpeechText("")
            }, 3000)
          }, 800)
        } else {
          setIsLuciListening(false)
          setVolume(1.0)
          setLuciStatusText("")
        }
      }

      try {
        recognition.start()
      } catch (err) {
        console.warn("Recognition start failed:", err)
      }
    } else {
      setLuciStatusText("Microfone ativado. Fale o comando.")
    }
  }, [isLuciListening, luciSpeechText, setVolume])

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      const bar = progressBarRef.current
      if (!bar || !duration) return
      const rect = bar.getBoundingClientRect()
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      seek(pct * duration)
    },
    [duration, seek]
  )

  if (!currentTrack) return null

  const liked = isLiked(currentTrack.id)
  const progressPct = duration > 0 ? Math.min(100, Math.max(0, (progress / duration) * 100)) : 0

  // Músicas a seguir na fila (começando da música atual no topo, sem mostrar as anteriores)
  const upcomingQueue = queue.slice(queueIndex)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F8FAFC] text-zinc-900 select-none animate-view-in overflow-hidden">
      {/* ─── 1. Header Oficial do Figma: Voltar (ChevronLeft Circular), "Now playing" Centralizado (Sem botões extras no topo) ─── */}
      <header className="flex items-center justify-between px-6 pt-5 pb-2 shrink-0 relative z-20">
        <button
          type="button"
          onClick={pop}
          className="size-11 flex items-center justify-center rounded-full bg-zinc-100/90 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_4px_rgba(0,0,0,0.06)] border border-zinc-200/80 text-zinc-700 active:scale-95 transition-all"
          aria-label="Voltar"
        >
          <ChevronLeft className="size-5.5 stroke-[2.2]" />
        </button>

        <h2 className="text-base font-extrabold tracking-tight text-zinc-900 font-sans">
          Tocando agora
        </h2>

        {/* Espaçador invisível para manter o título perfeitamente centralizado */}
        <div className="size-11" />
      </header>

      {/* ─── 2. Corpo Principal do Player (Figma Style) ─── */}
      <div className="flex-1 flex flex-col justify-between px-6 pt-1 pb-4 max-w-sm mx-auto w-full relative z-10">
        {/* Capa Principal com Bordas Arredondadas Figma (32px) */}
        <div className="relative aspect-square w-full rounded-[32px] overflow-hidden shadow-2xl shadow-zinc-900/10 border border-zinc-200/80 bg-zinc-100 mt-0.5">
          <TrackImage
            src={currentTrack.thumbnail}
            trackId={currentTrack.id}
            alt={currentTrack.title}
            className="size-full object-cover"
          />
        </div>

        {/* ─── Informações e Ações em Duas Linhas com Espaçamento Perfeito ─── */}
        <div className="pt-4 pb-0.5 space-y-3.5">
          {/* Linha 1: 4 Botões de Ação Padronizados Centralizados [Coração, (+), Playlist, Luci] */}
          <div className="flex items-center justify-center gap-3">
            {/* 1. Botão Coração (Curtir) */}
            <button
              type="button"
              onClick={() => toggleLike(currentTrack)}
              className="size-11 flex items-center justify-center rounded-full bg-zinc-100/90 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_4px_rgba(0,0,0,0.06)] border border-zinc-200/80 text-zinc-700 active:scale-90 transition-all hover:text-black"
              aria-label="Curtir música"
              title="Curtir"
            >
              <Heart
                className={`size-5 transition-colors ${
                  liked ? "fill-[#EC4899] text-[#EC4899]" : "text-zinc-600"
                }`}
              />
            </button>

            {/* 2. Botão (+) Adicionar em Playlist */}
            <button
              type="button"
              onClick={handleOpenAddToPlaylist}
              className="size-11 flex items-center justify-center rounded-full bg-zinc-100/90 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_4px_rgba(0,0,0,0.06)] border border-zinc-200/80 text-zinc-700 active:scale-90 transition-all hover:text-black"
              aria-label="Adicionar à Playlist"
              title="Adicionar à Playlist"
            >
              <Plus className="size-5.5 stroke-[2.2]" />
            </button>

            {/* 3. Botão Playlist (Fila de Músicas a Seguir) */}
            <button
              type="button"
              onClick={() => setShowQueueModal(true)}
              className={`size-11 flex items-center justify-center rounded-full transition-all active:scale-90 ${
                showQueueModal
                  ? "bg-[#22C55E] text-white shadow-md shadow-[#22C55E]/30"
                  : "bg-zinc-100/90 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_4px_rgba(0,0,0,0.06)] border border-zinc-200/80 text-zinc-700 hover:text-black"
              }`}
              aria-label="Fila de Reprodução"
              title="Fila de Reprodução"
            >
              <ListMusic className="size-5 stroke-[2.2]" />
            </button>

            {/* 4. Botão da Luci IA (Microfone com Fade 15%) */}
            <button
              type="button"
              onClick={handleTriggerLuciVoice}
              className={`size-11 flex items-center justify-center rounded-full transition-all active:scale-90 ${
                isLuciListening
                  ? "bg-[#6366F1] text-white shadow-lg shadow-indigo-500/50 animate-pulse ring-4 ring-indigo-300"
                  : "bg-[#6366F1] text-white shadow-md shadow-indigo-500/25 hover:scale-105"
              }`}
              title="Falar com a Luci (Volume 15%)"
              aria-label="Luci Assistente de Voz"
            >
              <Mic className="size-5 stroke-[2.4]" />
            </button>
          </div>

          {/* Linha 2: Título da Música e Artista com Rolagem Horizontal Suave (Marquee) se for longo */}
          <div className="text-left px-1 overflow-hidden">
            {/* Título com Marquee se for longo */}
            <div className="overflow-hidden whitespace-nowrap">
              {currentTrack.title.length > 25 ? (
                <div className="animate-marquee-text gap-8">
                  <h1 className="text-2xl font-black tracking-tight text-zinc-900 leading-tight font-sans shrink-0">
                    {currentTrack.title}
                  </h1>
                  <h1 className="text-2xl font-black tracking-tight text-zinc-900 leading-tight font-sans shrink-0">
                    {currentTrack.title}
                  </h1>
                </div>
              ) : (
                <h1 className="text-2xl font-black tracking-tight text-zinc-900 leading-tight font-sans truncate">
                  {currentTrack.title}
                </h1>
              )}
            </div>

            {/* Artista Clicável com Marquee que abre Pop-up de Artistas e Álbum */}
            <div
              onClick={() => setShowArtistAlbumModal(true)}
              className="overflow-hidden whitespace-nowrap mt-1 cursor-pointer group active:opacity-75 transition-opacity"
              title="Ver Artistas e Álbum"
            >
              {currentTrack.artist.length > 30 ? (
                <div className="animate-marquee-text gap-8">
                  <p className="text-base font-medium text-zinc-500 group-hover:text-zinc-900 group-hover:underline transition-colors shrink-0">
                    {currentTrack.artist}
                  </p>
                  <p className="text-base font-medium text-zinc-500 group-hover:text-zinc-900 group-hover:underline transition-colors shrink-0">
                    {currentTrack.artist}
                  </p>
                </div>
              ) : (
                <p className="text-base font-medium text-zinc-500 group-hover:text-zinc-900 group-hover:underline transition-colors truncate">
                  {currentTrack.artist}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Banner de Feedback Interativo da Luci IA */}
        {isLuciListening && (
          <div className="mx-1 px-4 py-2.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold shadow-sm animate-fade-in flex items-center gap-2.5">
            <div className="size-2 rounded-full bg-[#6366F1] animate-ping" />
            <div className="flex-1 truncate">
              <p className="font-extrabold text-[#4F46E5]">{luciStatusText || "Luci ouvindo você..."}</p>
              {luciSpeechText && <p className="text-zinc-700 font-normal italic truncate">"{luciSpeechText}"</p>}
            </div>
            <span className="text-[10px] uppercase font-bold text-indigo-400">15% Vol</span>
          </div>
        )}

        {/* ─── 3. Barra de Progresso Oficial do Figma (Linha Cinza + Thumb Redondo) ─── */}
        <div className="space-y-2 pt-2">
          <div
            ref={progressBarRef}
            onClick={handleSeek}
            className="group relative h-1.5 w-full cursor-pointer rounded-full bg-zinc-200 overflow-visible"
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-zinc-600"
              style={{ width: `${progressPct}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 size-3.5 rounded-full bg-zinc-600 shadow-md border-2 border-white transition-transform group-hover:scale-125"
              style={{ left: `calc(${progressPct}% - 7px)` }}
            />
          </div>

          <div className="flex justify-between text-xs font-semibold text-zinc-500">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* ─── 4. Controles Principais de Reprodução (Repeat, Prev, Botão Play Verde Gigante, Next, Shuffle) ─── */}
        <div className="flex items-center justify-between px-2 pt-1 pb-2">
          <button
            type="button"
            onClick={toggleRepeat}
            className={`p-2.5 rounded-full transition-all active:scale-90 ${
              repeat !== "off" ? "text-[#22C55E]" : "text-zinc-500 hover:text-zinc-800"
            }`}
            aria-label="Repetir"
          >
            {repeat === "one" ? <Repeat1 className="size-5.5" /> : <Repeat className="size-5.5" />}
          </button>

          <button
            type="button"
            onClick={prev}
            className="p-2.5 text-zinc-800 hover:text-black active:scale-90 transition-transform"
            aria-label="Anterior"
          >
            <SkipBack className="size-6 fill-zinc-800" />
          </button>

          {/* Botão Play/Pause Verde Redondo do Figma (#22C55E) */}
          <button
            type="button"
            onClick={togglePlay}
            disabled={isLoading}
            className="size-17 flex items-center justify-center rounded-full bg-[#22C55E] text-white shadow-xl shadow-green-500/30 active:scale-95 hover:scale-105 transition-transform"
            aria-label={isPlaying ? "Pausar" : "Tocar"}
          >
            {isLoading ? (
              <Loader2 className="size-7 animate-spin text-white" />
            ) : isPlaying ? (
              <Pause className="size-7 fill-white stroke-[0]" />
            ) : (
              <Play className="size-7 fill-white stroke-[0] ml-1" />
            )}
          </button>

          <button
            type="button"
            onClick={next}
            className="p-2.5 text-zinc-800 hover:text-black active:scale-90 transition-transform"
            aria-label="Próxima"
          >
            <SkipForward className="size-6 fill-zinc-800" />
          </button>

          <button
            type="button"
            onClick={toggleShuffle}
            className={`p-2.5 rounded-full transition-all active:scale-90 ${
              shuffle ? "text-[#22C55E]" : "text-zinc-500 hover:text-zinc-800"
            }`}
            aria-label="Aleatório"
          >
            <Shuffle className="size-5.5" />
          </button>
        </div>

        {/* ─── 5. Botão de Letras Inferior (^ Lyrics) ─── */}
        <div className="flex flex-col items-center justify-center pt-1">
          <button
            type="button"
            onClick={goToLyrics}
            className="flex flex-col items-center justify-center gap-0.5 text-zinc-600 hover:text-zinc-900 group active:scale-95 transition-all"
            aria-label="Abrir Letras"
          >
            <ChevronUp className="size-5 text-zinc-500 group-hover:-translate-y-0.5 transition-transform" />
            <span className="text-xs font-bold tracking-tight">Lyrics</span>
          </button>
        </div>
      </div>

      {/* ─── MODAL 1: Pop-up Inferior para Adicionar em Playlist (+) ─── */}
      {showAddToPlaylistModal && (
        <div
          onClick={() => setShowAddToPlaylistModal(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col justify-end animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-[32px] px-6 pt-5 pb-8 max-h-[70vh] flex flex-col space-y-4 shadow-2xl animate-slide-up"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900">Adicionar à Playlist</h3>
                <p className="text-xs text-zinc-500 truncate max-w-[260px]">{currentTrack.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddToPlaylistModal(false)}
                className="size-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar py-1">
              {/* Botão de Criar Nova Playlist */}
              {showNewPlaylistInput ? (
                <div className="p-3 rounded-2xl bg-zinc-50 border border-indigo-300 shadow-sm space-y-2">
                  <p className="text-xs font-bold text-zinc-700">Nome da nova playlist:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Ex: Minhas Favoritas, Treino..."
                      value={newPlaylistTitle}
                      onChange={(e) => setNewPlaylistTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateNewPlaylist()}
                      className="flex-1 px-3 py-2 text-sm bg-white rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                    />
                    <button
                      type="button"
                      onClick={handleCreateNewPlaylist}
                      disabled={creatingPlaylist || !newPlaylistTitle.trim()}
                      className="px-4 py-2 bg-[#22C55E] text-white text-xs font-bold rounded-xl active:scale-95 disabled:opacity-50 flex items-center gap-1 shadow-sm"
                    >
                      {creatingPlaylist ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewPlaylistInput(false)}
                      className="p-2 text-zinc-400 hover:text-zinc-700 rounded-xl"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowNewPlaylistInput(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-zinc-300 text-zinc-700 font-bold text-xs hover:border-[#22C55E] hover:text-[#16A34A] hover:bg-green-50/50 transition-all active:scale-98"
                >
                  <Plus className="size-4.5 stroke-[2.5]" />
                  Criar Nova Playlist
                </button>
              )}

              {loadingPlaylists ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-zinc-400">
                  <Loader2 className="size-6 animate-spin text-[#22C55E]" />
                  <p className="text-xs">Carregando playlists...</p>
                </div>
              ) : userPlaylists.length === 0 && !showNewPlaylistInput ? (
                <div className="py-6 text-center text-xs text-zinc-400">
                  Nenhuma playlist existente. Crie a primeira acima!
                </div>
              ) : (
                userPlaylists.map((pl) => {
                  const isAdded = addedPlaylistId === pl.id
                  return (
                    <div
                      key={pl.id}
                      onClick={() => handleSelectPlaylist(pl.id)}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                        isAdded
                          ? "bg-green-50 border-green-300 text-[#16A34A]"
                          : "bg-zinc-50/70 border-zinc-200/70 hover:bg-zinc-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                          {pl.title.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{pl.title}</p>
                          <p className="text-[11px] text-zinc-500">{pl.itemCount || 0} músicas</p>
                        </div>
                      </div>
                      {isAdded ? (
                        <div className="size-6 rounded-full bg-[#22C55E] text-white flex items-center justify-center">
                          <Check className="size-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <Plus className="size-5 text-zinc-400" />
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: Pop-up Inferior de Sequência de Músicas (A Seguir, tocando no topo) ─── */}
      {showQueueModal && (
        <div
          onClick={() => setShowQueueModal(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col justify-end animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-[32px] px-6 pt-5 pb-8 max-h-[75vh] flex flex-col space-y-4 shadow-2xl animate-slide-up"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900">Sequência de Reprodução</h3>
                <p className="text-xs text-zinc-500">Tocando agora e a seguir ({upcomingQueue.length})</p>
              </div>
              <button
                type="button"
                onClick={() => setShowQueueModal(false)}
                className="size-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar py-1">
              {upcomingQueue.map((track, i) => {
                const isCurrent = i === 0
                return (
                  <div
                    key={`${track.id}-${i}`}
                    onClick={() => {
                      playTrack(track, queue)
                      setShowQueueModal(false)
                    }}
                    className={`flex items-center gap-3.5 p-2.5 rounded-2xl transition-all cursor-pointer ${
                      isCurrent
                        ? "bg-green-50 border border-green-200 text-[#16A34A] shadow-sm"
                        : "bg-zinc-50/60 border border-zinc-200/60 hover:border-zinc-300"
                    }`}
                  >
                    <TrackImage
                      src={track.thumbnail}
                      trackId={track.id}
                      alt={track.title}
                      className="size-11 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {isCurrent && (
                          <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md bg-[#22C55E] text-white">
                            Tocando
                          </span>
                        )}
                        <p className={`text-sm font-bold truncate ${isCurrent ? "text-[#16A34A]" : "text-zinc-900"}`}>
                          {track.title}
                        </p>
                      </div>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">
                        {track.artist}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
      {/* ─── MODAL 3: Pop-up Inferior de Artistas e Álbum da Música ─── */}
      {showArtistAlbumModal && (
        <div
          onClick={() => setShowArtistAlbumModal(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col justify-end animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-[32px] px-6 pt-5 pb-8 max-h-[75vh] flex flex-col space-y-4 shadow-2xl animate-slide-up"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900">Créditos e Álbum</h3>
                <p className="text-xs text-zinc-500 truncate max-w-[260px]">{currentTrack.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowArtistAlbumModal(false)}
                className="size-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar py-1">
              {/* Seção 1: Artistas Participantes */}
              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-wider text-zinc-400">
                  Artistas ({artistList.length})
                </p>
                <div className="space-y-1.5">
                  {artistList.map((artistName, idx) => (
                    <div
                      key={`${artistName}-${idx}`}
                      onClick={() => {
                        setShowArtistAlbumModal(false)
                        goToArtist(artistName)
                      }}
                      className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-200/70 hover:border-zinc-300 hover:bg-zinc-100 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-11 rounded-full overflow-hidden border border-zinc-200 shadow-sm shrink-0 bg-zinc-100">
                          <TrackImage
                            src={artistThumbnails[artistName] || currentTrack.thumbnail}
                            trackId={`artist-thumb-${artistName}`}
                            alt={artistName}
                            className="size-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900 group-hover:text-[#4F46E5] transition-colors">
                            {artistName}
                          </p>
                          <p className="text-[11px] text-zinc-500">Ver perfil completo</p>
                        </div>
                      </div>
                      <ChevronLeft className="size-4 text-zinc-400 rotate-180 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Seção 2: Álbum da Música */}
              <div className="space-y-2 pt-1 border-t border-zinc-100">
                <p className="text-xs font-black uppercase tracking-wider text-zinc-400">
                  Álbum
                </p>
                <div
                  onClick={() => {
                    setShowArtistAlbumModal(false)
                    goToAlbumDetail({
                      albumId: currentTrack.album || currentTrack.title,
                      title: currentTrack.album || currentTrack.title,
                      artist: currentTrack.artist,
                      thumbnail: currentTrack.thumbnail,
                    })
                  }}
                  className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-200/70 hover:border-zinc-300 hover:bg-zinc-100 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <TrackImage
                      src={currentTrack.thumbnail}
                      trackId={currentTrack.id}
                      alt={currentTrack.title}
                      className="size-11 rounded-xl object-cover shadow-sm shrink-0"
                    />
                    <div>
                      <p className="text-sm font-bold text-zinc-900 group-hover:text-[#4F46E5] transition-colors">
                        {currentTrack.album || currentTrack.title}
                      </p>
                      <p className="text-[11px] text-zinc-500">{currentTrack.artist}</p>
                    </div>
                  </div>
                  <ChevronLeft className="size-4 text-zinc-400 rotate-180 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
