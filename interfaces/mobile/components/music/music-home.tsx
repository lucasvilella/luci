"use client"

import { useState, useEffect, useMemo } from "react"
import {
  User,
  Bell,
  Play,
} from "lucide-react"
import {
  type LuciTrack,
  type DailyMix,
  type MusicHomeFeed,
  fetchMusicHome,
  searchMusic,
} from "@/lib/lucimusic"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { TrackImage } from "./track-image"

let clientHomeFeedCache: MusicHomeFeed | null = null

if (typeof window !== "undefined") {
  try {
    const local = localStorage.getItem("lucimusic_feed_v1")
    if (local) clientHomeFeedCache = JSON.parse(local)
  } catch {}
}

export function MusicHome({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const [feed, setFeed] = useState<MusicHomeFeed | null>(() => {
    if (clientHomeFeedCache) return clientHomeFeedCache
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("lucimusic_feed_v1")
        if (local) return JSON.parse(local)
      } catch {}
    }
    return null
  })

  const { playTrack, currentTrack, isPlaying, togglePlay } = useMusicPlayer()
  const { goToArtist, goToPlaylistDetail, goToAlbumDetail } = useMusicNavigation()

  useEffect(() => {
    const refreshFeed = () => {
      fetchMusicHome()
        .then((data) => {
          clientHomeFeedCache = data
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("lucimusic_feed_v1", JSON.stringify(data))
            } catch {}
          }
          setFeed(data)
        })
        .catch((err) => console.error("[LuciMusic] Erro feed:", err))
    }

    refreshFeed()
    const timer = setInterval(refreshFeed, 60000)
    return () => clearInterval(timer)
  }, [])

  const continueListening: LuciTrack[] = feed?.recently_played || []

  // ─── 1. Indicação da Luci (Banner Superior Dinâmico & Variável) ───
  const hour = new Date().getHours()
  const dayOfMonth = new Date().getDate()

  // Lista de 5 imagens da Seleção Matinal (rotaciona a cada 2 dias ou aleatório por dia)
  const matinalImages = [
    "/images/music/created-by-luci/selecao_matinal_01.png",
    "/images/music/created-by-luci/selecao_matinal_02.png",
    "/images/music/created-by-luci/selecao_matinal_03.png",
    "/images/music/created-by-luci/selecao_matinal_04.png",
    "/images/music/created-by-luci/selecao_matinal_05.png",
  ]
  const matinalImgIndex = (Math.floor(dayOfMonth / 2)) % matinalImages.length
  const currentMatinalImg = matinalImages[matinalImgIndex]

  let bannerTag = "MOMENTO DO DIA/GATILHO"
  let bannerTitle = "TEMA CENTRAL DA PLAYLIST"
  let bannerQuery = "Workout Motivation Hits"
  let bannerGradient = "from-[#282669] via-[#312B7C] to-[#25225E]" // Roxo/Azul padrão
  let bannerShadow = "shadow-indigo-950/20"
  let bannerImage = "/images/music/created-by-luci/playlist_gym.png"

  if (hour >= 6 && hour < 12) {
    // Manhã: Tom Calmo, Ensolarado & Relaxante (Âmbar/Laranja Dourado e Verde Claro Suave)
    bannerTag = "SELEÇÃO MATINAL • BOM DIA"
    bannerTitle = "ENERGIA & ACÚSTICO MATINAL"
    bannerQuery = "Acústico Brasil MPB"
    bannerGradient = "from-[#D97706] via-[#B45309] to-[#78350F]" // Tons quentes e acolhedores de café/manhã
    bannerShadow = "shadow-amber-950/25"
    bannerImage = currentMatinalImg
  } else if (hour >= 12 && hour < 18) {
    // Tarde: Tons Relaxantes e Foco (Azul Petróleo / Esmeralda Calmo)
    bannerTag = "FOCO & PERFORMANCE • TARDE"
    bannerTitle = "CONCENTRAÇÃO & FLOW"
    bannerQuery = "Deep Focus Instrumental"
    bannerGradient = "from-[#0D9488] via-[#0F766E] to-[#115E59]" // Tons relaxantes de foco
    bannerShadow = "shadow-teal-950/25"
    bannerImage = currentMatinalImg
  } else if (hour >= 18 && hour < 22) {
    // Noite: Academia / Ritmo Intenso (Tons Poderosos e Energéticos Roxo/Azul Intenso)
    bannerTag = "ENERGIA & TREINO • NOITE"
    bannerTitle = "RITMO INTENSO & FORÇA"
    bannerQuery = "Workout Motivation Beats"
    bannerGradient = "from-[#282669] via-[#312B7C] to-[#25225E]" // Poderoso
    bannerShadow = "shadow-indigo-950/25"
    bannerImage = "/images/music/created-by-luci/playlist_gym.png"
  } else {
    // Madrugada: Desacelerar / Sons Calmos (Azul Noite Profundo / Roxo Suave)
    bannerTag = "DESACELERAR • MADRUGADA"
    bannerTitle = "SONS TRANQUILOS PARA RELAXAR"
    bannerQuery = "Sertanejo Acustico Noite Relax"
    bannerGradient = "from-[#1E1B4B] via-[#2E1065] to-[#18181B]" // Noite calma
    bannerShadow = "shadow-purple-950/25"
    bannerImage = currentMatinalImg
  }

  const [isBannerLoading, setIsBannerLoading] = useState(false)
  const [bannerTracks, setBannerTracks] = useState<LuciTrack[]>([])

  useEffect(() => {
    searchMusic(bannerQuery, "songs")
      .then((res) => {
        if (res.songs && res.songs.length > 0) {
          setBannerTracks(res.songs)
        }
      })
      .catch(() => {})
  }, [bannerQuery])

  const handlePlayBanner = () => {
    if (bannerTracks.length > 0) {
      const isAlreadyPlayingThis = currentTrack && bannerTracks.some((t) => t.id === currentTrack.id)
      if (isAlreadyPlayingThis) {
        togglePlay()
      } else {
        playTrack(bannerTracks[0], bannerTracks)
      }
    } else {
      setIsBannerLoading(true)
      searchMusic(bannerQuery, "songs")
        .then((res) => {
          setIsBannerLoading(false)
          if (res.songs && res.songs.length > 0) {
            setBannerTracks(res.songs)
            playTrack(res.songs[0], res.songs)
          }
        })
        .catch(() => setIsBannerLoading(false))
    }
  }

  // ─── Seções Dinâmicas (Permutação Diária) ───
  // Indicação da Luci, Continuar Ouvindo e Daily Mix são FIXOS no topo.
  // As demais seções rotacionam.
  const dynamicSections = useMemo(() => {
    const daySeed = new Date().getDate()

    const sections = [
      { id: "new-releases", type: "new-releases" },
      { id: "featured-album-card", type: "featured-album-card" },
      { id: "artists", type: "artists" },
      { id: "trending-br", type: "trending-br" },
      { id: "based-on-history", type: "based-on-history" },
    ]

    const offset = daySeed % sections.length
    return [...sections.slice(offset), ...sections.slice(0, offset)]
  }, [])

  return (
    <div className="flex h-full flex-col bg-[#F6F6F6] text-zinc-900 select-none overflow-y-auto pb-6">
      {/* ─── Header Minimalista Exato do Figma (z-40 garante que nada passe por cima) ─── */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-5 pt-3 pb-2 bg-[#F6F6F6]/95 backdrop-blur-md">
        {/* Botão Circular Hambúrguer com Sombra (Figma) */}
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Abrir Menu de Módulos"
          className="size-11 flex flex-col justify-center items-center gap-1 rounded-full bg-white border border-zinc-200/60 shadow-md shadow-zinc-200/50 text-zinc-800 active:scale-90 transition-transform"
        >
          <div className="w-4 h-[2px] bg-zinc-800 rounded-full" />
          <div className="w-4 h-[2px] bg-zinc-800 rounded-full" />
          <div className="w-4 h-[2px] bg-zinc-800 rounded-full" />
        </button>

        {/* Ações da Direita: Perfil e Notificações com Badge Vermelho */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Perfil"
            className="p-1.5 text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            <User className="size-6 stroke-[1.8]" />
          </button>
          <button
            type="button"
            aria-label="Notificações"
            className="relative p-1.5 text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            <Bell className="size-6 stroke-[1.8]" />
            {/* Badge de Notificação Vermelho do Figma */}
            <span className="absolute top-1 right-1 size-2.5 rounded-full bg-[#EF4444] border-2 border-[#F6F6F6]" />
          </button>
        </div>
      </header>

      <div className="px-5 space-y-6 pt-2">
        {/* ─── 1. CARD INDICAÇÃO DA LUCI (COR E IMAGEM COMBINANDO COM O TEMA) ─── */}
        <section className="relative pt-6">
          <div
            onClick={handlePlayBanner}
            className={`relative rounded-[15px] bg-gradient-to-r ${bannerGradient} p-5 shadow-xl ${bannerShadow} text-white cursor-pointer active:scale-[0.99] transition-all min-h-[135px] flex items-center`}
          >
            {/* Linhas de fundo vetoriais sutis */}
            <div className="absolute inset-0 rounded-[15px] overflow-hidden pointer-events-none opacity-30">
              <svg className="w-full h-full" viewBox="0 0 300 120" fill="none">
                <path d="M180 0C220 40 260 80 300 120" stroke="white" strokeWidth="0.5" strokeOpacity="0.3" />
                <path d="M195 0C230 40 265 80 300 100" stroke="white" strokeWidth="0.5" strokeOpacity="0.3" />
                <path d="M210 0C240 40 270 80 300 80" stroke="white" strokeWidth="0.5" strokeOpacity="0.3" />
              </svg>
            </div>

            {/* Informações de Texto */}
            <div className="relative z-10 max-w-[58%]">
              <span className="inline-block text-[9px] font-black tracking-wider text-white/80 uppercase mb-1">
                {bannerTag}
              </span>
              <h2 className="text-[15px] font-black tracking-tight leading-snug text-white uppercase">
                {bannerTitle}
              </h2>
              <div className="mt-3">
                <div className="flex justify-between items-center text-[10px] text-white/80 font-semibold mb-1">
                  <span>Afinidade</span>
                  <span>88%</span>
                </div>
                {/* Barra de afinidade */}
                <div className="h-1.5 w-full rounded-full bg-white/25 overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: "88%" }} />
                </div>
              </div>
            </div>

            {/* Imagem do Tema Extravasando o Card para Cima (Figma) com z-10 */}
            <div className="absolute right-0 bottom-0 pointer-events-none z-10 flex items-end justify-end">
              <img
                src={bannerImage}
                alt="Tema da Playlist"
                className="h-[180px] w-auto max-w-none object-contain select-none drop-shadow-2xl translate-x-1"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            </div>
          </div>
        </section>

        {/* ─── 2. CONTINUAR OUVINDO (FIGMA: APENAS PLAYLISTS E ÁLBUNS OUVINDO, CARD BRANCO PURO SEM BORDA E SEM SOMBRA) ─── */}
        <section>
          <div className="inline-block relative mb-3">
            <h3 className="text-[13.5px] font-black uppercase tracking-wider text-zinc-900">
              CONTINUAR OUVINDO
            </h3>
            <div className="h-[3px] w-full bg-[#62CF5E] rounded-full mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {(() => {
              // Constrói lista exclusiva de Playlists e Álbuns baseados no histórico e coleções
              const rawHistory = feed?.recently_played || []
              const seenCollections = new Set<string>()
              const recentCollections: Array<{
                id: string
                title: string
                type: "album" | "playlist"
                thumbnail: string
                artist?: string
                trackRef?: LuciTrack
              }> = []

              for (const t of rawHistory) {
                if (t.album && t.album.trim() && !seenCollections.has(`album-${t.album.toLowerCase()}`)) {
                  seenCollections.add(`album-${t.album.toLowerCase()}`)
                  recentCollections.push({
                    id: t.album,
                    title: t.album,
                    type: "album",
                    thumbnail: t.thumbnail,
                    artist: t.artist,
                    trackRef: t
                  })
                }
              }

              // Se tiver menos de 6, complementa com Daily Mixes e Álbuns favoritos
              if (recentCollections.length < 6 && feed?.daily_mixes) {
                feed.daily_mixes.forEach((dm, idx) => {
                  if (recentCollections.length < 6 && !seenCollections.has(`dm-${dm.title.toLowerCase()}`)) {
                    seenCollections.add(`dm-${dm.title.toLowerCase()}`)
                    recentCollections.push({
                      id: `dm_${idx + 1}`,
                      title: dm.title,
                      type: "playlist",
                      thumbnail: dm.thumbnail || `/images/music/daily-mix/dailymix_${idx + 1}.png`,
                      artist: "Daily Mix",
                      trackRef: dm.tracks?.[0]
                    })
                  }
                })
              }

              if (recentCollections.length < 6 && feed?.favorite_albums) {
                feed.favorite_albums.forEach((alb) => {
                  if (recentCollections.length < 6 && !seenCollections.has(`alb-${alb.title.toLowerCase()}`)) {
                    seenCollections.add(`alb-${alb.title.toLowerCase()}`)
                    recentCollections.push({
                      id: alb.id || alb.title,
                      title: alb.title,
                      type: "album",
                      thumbnail: alb.thumbnail,
                      artist: alb.artist
                    })
                  }
                })
              }

              return (recentCollections.length > 0 ? recentCollections.slice(0, 6) : Array(6).fill(null)).map((item, i) => {
                if (!item) {
                  return (
                    <div
                      key={`skeleton-${i}`}
                      className="flex items-center gap-3 rounded-[15px] bg-white p-2.5 min-h-[58px]"
                    >
                      <div className="size-11 rounded-[10px] bg-zinc-100 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="h-4 w-20 bg-zinc-100 rounded" />
                      </div>
                    </div>
                  )
                }

                const isCurrent = currentTrack && (
                  currentTrack.album === item.title ||
                  (item.trackRef && currentTrack.id === item.trackRef.id)
                )

                const handleClick = () => {
                  if (item.type === "album") {
                    goToAlbumDetail(item.id, item.title, item.artist, item.thumbnail)
                  } else {
                    goToPlaylistDetail(item.id, item.title, item.thumbnail)
                  }
                }

                return (
                  <button
                    key={`continue-${item.id}-${i}`}
                    type="button"
                    onClick={handleClick}
                    className={`flex items-center gap-3 rounded-[15px] bg-white p-2.5 text-left transition-all active:scale-95 min-h-[58px] ${
                      isCurrent ? "ring-2 ring-[#62CF5E]" : ""
                    }`}
                  >
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="size-11 rounded-[10px] object-cover bg-zinc-100 shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = "/images/music/daily-mix/dailymix_1.png"
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-black text-zinc-900 leading-snug">
                        {item.title}
                      </p>
                    </div>
                  </button>
                )
              })
            })()}
          </div>
        </section>

        {/* ─── 3. DAILY MIX (TEXTOS +10% DE TAMANHO) ─── */}
        <section>
          <div className="inline-block relative mb-3">
            <h3 className="text-[13.5px] font-black uppercase tracking-wider text-zinc-900">
              DAILY MIX
            </h3>
            <div className="h-[3px] w-full bg-[#62CF5E] rounded-full mt-1" />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-5 px-5">
            {(feed?.daily_mixes && feed.daily_mixes.length > 0 ? feed.daily_mixes : [1, 2, 3, 4, 5]).map((mix, idx) => {
              const mixNum = idx + 1
              const mixObj = typeof mix === "object" ? (mix as DailyMix) : null
              const firstTrack = mixObj?.tracks?.[0]
              const title = mixObj?.title || `DAILY MIX ${mixNum}`
              const artistNames = mixObj?.tracks?.slice(0, 3).map((t) => t.artist).join(", ") || "Nome dos artistas, Nome dos artistas, Nome dos ..."
              const frameImg = `/images/music/daily-mix/dailymix_${mixNum}.png`

              return (
                <div
                  key={`dailymix-${idx}`}
                  onClick={() => {
                    if (mixObj && mixObj.tracks?.length) {
                      playTrack(mixObj.tracks[0], mixObj.tracks)
                    }
                  }}
                  className="w-[130px] shrink-0 cursor-pointer group active:scale-95 transition-transform"
                >
                  {/* Card com Foto do Artista Embaixo + Moldura PNG Sobreposta (Raio 15px) */}
                  <div className="relative aspect-[1050/1200] w-full rounded-[15px] overflow-hidden bg-zinc-200 shadow-md">
                    {/* Foto do 1º Artista preenchendo a largura e alinhada ao topo */}
                    {firstTrack?.thumbnail ? (
                      <img
                        src={firstTrack.thumbnail}
                        alt={title}
                        className="absolute inset-0 w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-b from-zinc-700 to-zinc-950" />
                    )}

                    {/* Moldura PNG Sobreposta */}
                    <img
                      src={frameImg}
                      alt={title}
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                      }}
                    />
                  </div>

                  {/* Legenda Abaixo */}
                  <h4 className="text-[13px] font-black text-zinc-900 mt-2 truncate">
                    {title}
                  </h4>
                  <p className="text-[11px] text-zinc-500 line-clamp-2 leading-tight mt-0.5 font-medium">
                    {artistNames}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ─── 4. SEÇÕES DINÂMICAS ─── */}
        {dynamicSections.map((sec) => {
          if (sec.type === "new-releases") {
            const releases = feed?.new_releases || feed?.trending_brasil || []
            return (
              <section key="section-new-releases">
                <div className="inline-block relative mb-3">
                  <h3 className="text-[13.5px] font-black uppercase tracking-wider text-zinc-900">
                    NOVOS LANÇAMENTOS
                  </h3>
                  <div className="h-[3px] w-full bg-[#62CF5E] rounded-full mt-1" />
                </div>
                {/* Carrossel de Capas Quadradas */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-5 px-5">
                  {releases.slice(0, 8).map((track, i) => (
                    <div
                      key={`rel-${track.id}-${i}`}
                      onClick={() => playTrack(track, releases)}
                      className="w-[130px] shrink-0 cursor-pointer active:scale-95 transition-transform"
                    >
                      <TrackImage
                        src={track.thumbnail}
                        trackId={track.id}
                        alt={track.title}
                        className="aspect-square w-full rounded-[15px] object-cover bg-zinc-100 shadow-md border border-zinc-200/50"
                      />
                      <h4 className="text-[13px] font-black text-zinc-900 mt-2 truncate uppercase">
                        {track.title}
                      </h4>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5 font-medium">
                        {track.artist}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )
          }

          {/* ─── Card de Destaque / Indicação de Álbum Novo (Seção Dinâmica com lado direito arredondado e linhas) ─── */}
          if (sec.type === "featured-album-card") {
            const featuredTrack = feed?.new_releases?.[0] || feed?.trending_brasil?.[0] || feed?.recently_played?.[0] || {
              id: "featured-default",
              title: "Hit em Destaque",
              artist: "Indicação especial para o seu dia",
              thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300",
              duration: 210,
            }

            return (
              <section key="section-featured-album-card">
                <div
                  onClick={() => playTrack(featuredTrack)}
                  className="relative overflow-hidden flex items-center justify-between p-3.5 rounded-l-[15px] rounded-r-[60px] bg-[#62CF5E] text-white shadow-xl shadow-green-600/25 cursor-pointer active:scale-[0.99] transition-transform min-h-[94px]"
                >
                  {/* Padrão de Linhas Vetoriais Arredondadas no Lado Direito (Figma) */}
                  <div className="absolute right-0 top-0 bottom-0 w-[42%] overflow-hidden pointer-events-none opacity-40">
                    <svg className="w-full h-full" viewBox="0 0 140 100" fill="none">
                      <path d="M20 0C60 0 140 30 140 100" stroke="white" strokeWidth="1.2" />
                      <path d="M40 0C75 0 140 40 140 100" stroke="white" strokeWidth="1.2" />
                      <path d="M60 0C90 0 140 50 140 100" stroke="white" strokeWidth="1.2" />
                      <path d="M80 0C105 0 140 60 140 100" stroke="white" strokeWidth="1.2" />
                      <path d="M100 0C118 0 140 70 140 100" stroke="white" strokeWidth="1.2" />
                    </svg>
                  </div>

                  {/* Informações da Faixa / Álbum (+10% nos textos) */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1 z-10">
                    <TrackImage
                      src={featuredTrack.thumbnail}
                      trackId={featuredTrack.id}
                      alt={featuredTrack.title}
                      className="size-14 rounded-[12px] object-cover border border-white/30 shrink-0 shadow-md"
                    />
                    <div className="min-w-0 flex-1 pr-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-green-100 block mb-0.5">
                        NOVO LANÇAMENTO
                      </span>
                      <h4 className="text-[13px] font-black truncate text-white leading-tight uppercase">
                        {featuredTrack.title}
                      </h4>
                      <p className="text-[11px] text-green-100 truncate mt-0.5 font-semibold">
                        {featuredTrack.artist}
                      </p>
                    </div>
                  </div>

                  {/* Botão Play Circular Branco (Figma) */}
                  <button
                    type="button"
                    aria-label="Tocar Lançamento"
                    className="size-12 flex items-center justify-center rounded-full bg-white text-[#18181B] shrink-0 shadow-lg active:scale-90 transition-transform mr-1 z-10"
                  >
                    <Play className="size-5 fill-[#18181B] ml-0.5" />
                  </button>
                </div>
              </section>
            )
          }

          {/* ─── Seção ARTISTAS (Figma: Fotos circulares limpas sem borda e sem sombra) ─── */}
          if (sec.type === "artists") {
            const artists = feed?.recommended_artists || [
              { id: "1", name: "Mariana Fagundes", thumbnail: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300" },
              { id: "2", name: "Ícaro e Gilmar", thumbnail: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300" },
              { id: "3", name: "Humberto e Ronaldo", thumbnail: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300" },
            ]

            return (
              <section key="section-artists">
                <div className="inline-block relative mb-3">
                  <h3 className="text-[13.5px] font-black uppercase tracking-wider text-zinc-900">
                    ARTISTAS
                  </h3>
                  <div className="h-[3px] w-full bg-[#62CF5E] rounded-full mt-1" />
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-5 px-5">
                  {artists.map((artist, i) => (
                    <div
                      key={`artist-${artist.id || i}-${i}`}
                      onClick={() => goToArtist(artist.name)}
                      className="w-[130px] shrink-0 text-center cursor-pointer active:scale-95 transition-transform"
                    >
                      <div className="size-[130px] rounded-full overflow-hidden mx-auto bg-zinc-200">
                        <img
                          src={artist.thumbnail}
                          alt={artist.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h4 className="text-[13px] font-black text-zinc-900 mt-2 truncate">
                        {artist.name}
                      </h4>
                    </div>
                  ))}
                </div>
              </section>
            )
          }

          if (sec.type === "trending-br") {
            const trending = feed?.trending_brasil || feed?.trending_br || []
            return (
              <section key="section-trending">
                <div className="inline-block relative mb-3">
                  <h3 className="text-[13.5px] font-black uppercase tracking-wider text-zinc-900">
                    EM ALTA NO BRASIL
                  </h3>
                  <div className="h-[3px] w-full bg-[#62CF5E] rounded-full mt-1" />
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-5 px-5">
                  {trending.slice(0, 8).map((track, i) => (
                    <div
                      key={`trend-${track.id}-${i}`}
                      onClick={() => playTrack(track, trending)}
                      className="w-[130px] shrink-0 cursor-pointer active:scale-95 transition-transform"
                    >
                      <TrackImage
                        src={track.thumbnail}
                        trackId={track.id}
                        alt={track.title}
                        className="aspect-square w-full rounded-[15px] object-cover bg-zinc-100 shadow-md border border-zinc-200/50"
                      />
                      <h4 className="text-[13px] font-black text-zinc-900 mt-2 truncate">
                        {track.title}
                      </h4>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5 font-medium">
                        {track.artist}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )
          }

          if (sec.type === "based-on-history") {
            // Se based_on_listened tiver playlists similares, extrai tracks ou usa trending como fallback
            const basedTracks: LuciTrack[] = []
            if (feed?.based_on_listened && feed.based_on_listened.length > 0) {
              for (const sim of feed.based_on_listened) {
                if (sim.tracks && sim.tracks.length > 0) {
                  basedTracks.push(...sim.tracks.slice(0, 2))
                }
              }
            }
            const displayTracks = basedTracks.length > 0 ? basedTracks : (feed?.trending_brasil || feed?.new_releases || [])

            return (
              <section key="section-based-history">
                <div className="inline-block relative mb-3">
                  <h3 className="text-[13.5px] font-black uppercase tracking-wider text-zinc-900">
                    COM BASE NO QUE VOCÊ OUVIU
                  </h3>
                  <div className="h-[3px] w-full bg-[#62CF5E] rounded-full mt-1" />
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-5 px-5">
                  {displayTracks.slice(0, 8).map((track, i) => (
                    <div
                      key={`based-${track.id}-${i}`}
                      onClick={() => playTrack(track, displayTracks)}
                      className="w-[130px] shrink-0 cursor-pointer active:scale-95 transition-transform"
                    >
                      <TrackImage
                        src={track.thumbnail}
                        trackId={track.id}
                        alt={track.title}
                        className="aspect-square w-full rounded-[15px] object-cover bg-zinc-100 shadow-md border border-zinc-200/50"
                      />
                      <h4 className="text-[13px] font-black text-zinc-900 mt-2 truncate uppercase">
                        {track.title}
                      </h4>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5 font-medium">
                        {track.artist}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )
          }

          return null
        })}
      </div>
    </div>
  )
}
