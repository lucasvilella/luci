"use client"

import { useState, useEffect } from "react"
import {
  Menu,
  Search,
  Library as LibraryIcon,
  Play,
  Pause,
  Loader2,
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
  const { goToSearch, goToLibrary, goToPlaylistDetail, goToAlbumDetail } = useMusicNavigation()

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

  // ─── Momentos do Dia (Banners Superiores Padronizados) ───
  const hour = new Date().getHours()
  let bannerTag = "SELEÇÃO MATINAL"
  let bannerTitle = "Café & Acústico"
  let bannerArtist = "Sons leves para começar o dia"
  let bannerImage = "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80"
  let bannerQuery = "Acústico Brasil MPB"

  if (hour >= 6 && hour < 12) {
    bannerTag = "SELEÇÃO MATINAL"
    bannerTitle = "Café & Acústico"
    bannerArtist = "Sons leves para começar o dia"
    bannerImage = "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80"
    bannerQuery = "Acústico Brasil MPB"
  } else if (hour >= 12 && hour < 17) {
    bannerTag = "FOCO & TRABALHO"
    bannerTitle = "Alta Performance"
    bannerArtist = "Concentração e produtividade"
    bannerImage = "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&q=80"
    bannerQuery = "Deep Focus Instrumental"
  } else if (hour >= 17 && hour < 21) {
    bannerTag = "ENERGIA & TREINO"
    bannerTitle = "Ritmo Intenso"
    bannerArtist = "Batidas aceleradas para treinar"
    bannerImage = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80"
    bannerQuery = "Workout Motivation Beats"
  } else if (hour >= 21 || hour < 0) {
    bannerTag = "DESACELERAR"
    bannerTitle = "Sons da Noite"
    bannerArtist = "Acústico & Sons Calmos"
    bannerImage = "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&q=80"
    bannerQuery = "Sertanejo Acustico Noite Relax"
  } else {
    bannerTag = "MADRUGADA"
    bannerTitle = "Sons da Madrugada"
    bannerArtist = "Seleção calma para relaxar"
    bannerImage = "https://images.unsplash.com/photo-1445985543470-41fba5c3144a?w=600&q=80"
    bannerQuery = "Voz e Violao Acustico Suave"
  }

  const [isBannerLoading, setIsBannerLoading] = useState(false)
  const [bannerTracks, setBannerTracks] = useState<LuciTrack[]>([])

  useEffect(() => {
    // Pré-carrega as músicas temáticas do momento assim que a home abre
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

  return (
    <div className="flex h-full flex-col bg-background text-foreground animate-view-in select-none">
      {/* ─── Header Minimalista com Botão de 3 Tracinhos na Esquerda e Ações na Direita ─── */}
      <header className="flex items-center justify-between px-5 pt-4 pb-3 bg-card/80 backdrop-blur-md border-b border-border/80 z-10">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Abrir Menu"
          className="size-10 flex items-center justify-center rounded-full bg-secondary text-foreground hover:bg-secondary/80 active:scale-95 transition-all shadow-sm"
        >
          <Menu className="size-5" />
        </button>

        <h1 className="text-sm font-extrabold tracking-tight text-foreground uppercase">Música</h1>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToSearch}
            className="size-10 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground active:scale-95 transition-transform"
            aria-label="Buscar"
          >
            <Search className="size-4.5" />
          </button>
          <button
            type="button"
            onClick={goToLibrary}
            className="size-10 flex items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground active:scale-95 transition-transform"
            aria-label="Biblioteca"
          >
            <LibraryIcon className="size-4.5" />
          </button>
        </div>
      </header>

      {/* ─── Conteúdo Rolável da Home ─── */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-7 pb-28 no-scrollbar">
        {/* ─── 1. Banner Editorial Premium (Figma Style: Fundo Pastel, Botão Play Superior, Capa Inclinada e Barra de Afinidade) ─── */}
        <section
          onClick={() => {
            goToPlaylistDetail({
              playlistId: `banner_${bannerTag.toLowerCase().replace(/\s+/g, "_")}`,
              title: `${bannerTag} • ${bannerTitle}`,
              thumbnail: bannerImage,
              initialTracks: bannerTracks,
            })
          }}
          className="relative w-full rounded-3xl p-5 shadow-sm cursor-pointer bg-gradient-to-br from-[#E9D5FF] via-[#DDD6FE] to-[#C4B5FD] text-zinc-900 overflow-hidden active:scale-[0.99] transition-transform border border-purple-200/60"
        >
          {/* Canto Superior Direito: Botão Play/Pause Circular Branco (Toca Imediatamente sem abrir a tela se clicar no botão) */}
          <div className="absolute right-4 top-4 z-20">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handlePlayBanner()
              }}
              className="size-9 rounded-full bg-white shadow-lg flex items-center justify-center text-zinc-900 hover:scale-110 active:scale-95 transition-transform"
              aria-label="Tocar agora"
            >
              {isBannerLoading ? (
                <Loader2 className="size-4 animate-spin text-zinc-900" />
              ) : isPlaying && currentTrack && bannerTracks.some((t) => t.id === currentTrack.id) ? (
                <Pause className="size-4 fill-zinc-900" />
              ) : (
                <Play className="size-4 fill-zinc-900 ml-0.5" />
              )}
            </button>
          </div>

          {/* Canto Inferior Direito: Capa Inclinada Estilizada */}
          <div className="absolute -right-2 -bottom-3 w-28 h-28 pointer-events-none">
            <img
              src={bannerImage}
              alt={bannerTitle}
              referrerPolicy="no-referrer"
              className="size-full rounded-2xl object-cover rotate-[15deg] shadow-xl border-2 border-white/40"
            />
          </div>

          {/* Conteúdo Textual do Banner no Lado Esquerdo */}
          <div className="max-w-[62%] space-y-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 block">
                {bannerTag}
              </span>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 leading-snug mt-0.5">
                {bannerTitle}
              </h2>
              <p className="text-xs text-zinc-600 font-medium line-clamp-1 mt-0.5">
                {bannerArtist}
              </p>
            </div>

            {/* Barra de Progresso / Afinidade com a Luci */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between items-center text-[10px] font-bold text-zinc-600">
                <span>Afinidade</span>
                <span>88%</span>
              </div>
              <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
                <div className="h-full bg-zinc-900 rounded-full w-[88%]" />
              </div>
            </div>
          </div>
        </section>

        {!feed ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
            <Loader2 className="size-8 animate-spin text-[#22C55E]" />
            <p className="text-xs">Carregando feed...</p>
          </div>
        ) : (
          <>
            {/* ─── 2. CONTINUAR OUVINDO (Apenas Playlists e Álbuns Recentes) ─── */}
            {((feed?.daily_mixes && feed.daily_mixes.length > 0) || (feed?.favorite_albums && feed.favorite_albums.length > 0)) && (
              <section className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 font-sans">
                  CONTINUAR OUVINDO
                </h3>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Combina Daily Mixes e Álbuns para formar os 8 cards de Playlists e Álbuns */}
                  {[
                    ...(feed?.daily_mixes || []).map((mix, i) => ({
                      type: "playlist" as const,
                      id: mix.id,
                      title: `Daily Mix ${i + 1}`,
                      subtitle: mix.subtitle,
                      thumbnail: mix.thumbnail,
                      tracks: mix.tracks,
                    })),
                    ...(feed?.favorite_albums || []).map((alb) => ({
                      type: "album" as const,
                      id: alb.id || alb.title,
                      title: alb.title,
                      subtitle: `Álbum • ${alb.artist}`,
                      thumbnail: alb.thumbnail,
                      tracks: [],
                    })),
                  ]
                    .slice(0, 8)
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (item.type === "album") {
                            goToAlbumDetail({
                              albumId: item.id,
                              title: item.title,
                              artist: (item as any).artist || item.subtitle.replace("Álbum • ", ""),
                              thumbnail: item.thumbnail,
                              initialTracks: item.tracks,
                            })
                          } else {
                            goToPlaylistDetail({
                              playlistId: item.id,
                              title: item.title,
                              thumbnail: item.thumbnail,
                              initialTracks: item.tracks,
                            })
                          }
                        }}
                        className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl bg-white border border-zinc-200/70 shadow-sm hover:border-zinc-300 transition-all cursor-pointer group active:scale-[0.98]"
                      >
                        <img
                          src={
                            item.thumbnail ||
                            "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80"
                          }
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="size-11 rounded-xl object-cover bg-zinc-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-zinc-900 truncate leading-tight">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            )}

            {/* ─── 3. DAILY MIX ─── */}
            {feed?.daily_mixes && feed.daily_mixes.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 font-sans">
                    DAILY MIX
                  </h3>
                </div>

                <div className="flex gap-3.5 overflow-x-auto pb-2 no-scrollbar">
                  {feed.daily_mixes.map((mix, idx) => {
                    const isMixPlaying = mix.tracks.some((t) => t.id === currentTrack?.id) && isPlaying
                    return (
                      <div
                        key={mix.id}
                        onClick={() => {
                          console.log("[LuciMusic] Abrindo Daily Mix:", mix.title, mix.tracks)
                          goToPlaylistDetail({
                            playlistId: mix.id,
                            title: `Daily Mix ${idx + 1}`,
                            thumbnail: mix.thumbnail,
                            initialTracks: mix.tracks,
                          })
                        }}
                        className="relative group shrink-0 w-44 rounded-3xl overflow-hidden flex flex-col justify-between h-56 text-white shadow-md cursor-pointer transition-all active:scale-[0.98] hover:shadow-xl bg-zinc-900"
                      >
                        {/* Imagem de Capa do Primeiro Artista / Faixa */}
                        {mix.thumbnail ? (
                          <img
                            src={mix.thumbnail}
                            alt={mix.title}
                            referrerPolicy="no-referrer"
                            className="absolute inset-0 size-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : null}

                        {/* Topo do Card com Botão de Play Flutuante Direto */}
                        <div className="relative z-10 flex justify-end items-start p-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (mix.tracks.length > 0) {
                                if (isMixPlaying) togglePlay()
                                else playTrack(mix.tracks[0], mix.tracks)
                              }
                            }}
                            className="size-9 rounded-full bg-white text-zinc-900 flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
                            aria-label="Tocar Mix"
                          >
                            {isMixPlaying ? (
                              <Pause className="size-4 fill-zinc-900" />
                            ) : (
                              <Play className="size-4 fill-zinc-900 ml-0.5" />
                            )}
                          </button>
                        </div>

                        {/* Faixa Inferior Escura com Transparência e Blur */}
                        <div className="relative z-10 bg-black/75 backdrop-blur-md p-3.5 border-t border-white/10 space-y-1">
                          <p className="text-sm font-black uppercase tracking-wider text-white leading-tight">
                            DAILY MIX {idx + 1}
                          </p>
                          <p className="text-xs text-zinc-300 font-medium line-clamp-2 leading-snug">
                            {mix.subtitle}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ─── 4. EM ALTA NO BRASIL ─── */}
            {feed?.trending_brasil && feed.trending_brasil.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 font-sans">
                  EM ALTA NO BRASIL
                </h3>

                <div className="flex gap-3.5 overflow-x-auto pb-2 no-scrollbar">
                  {feed.trending_brasil.map((track) => (
                    <div
                      key={track.id}
                      onClick={() => playTrack(track, feed.trending_brasil)}
                      className="group shrink-0 w-36 flex flex-col cursor-pointer active:scale-[0.98]"
                    >
                      <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-2 bg-zinc-100 shadow-sm border border-zinc-200/50">
                        <TrackImage
                          src={track.thumbnail}
                          trackId={track.id}
                          alt={track.title}
                          className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <p className="text-xs font-bold text-zinc-900 truncate">
                        {track.title}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                        {track.artist}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ─── 5. NOVOS LANÇAMENTOS ─── */}
            {feed?.new_releases && feed.new_releases.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 font-sans">
                    NOVOS LANÇAMENTOS
                  </h3>
                </div>

                <div className="flex gap-3.5 overflow-x-auto pb-2 no-scrollbar">
                  {feed.new_releases.map((track) => (
                    <div
                      key={track.id}
                      onClick={() => playTrack(track, feed.new_releases)}
                      className="group shrink-0 w-36 flex flex-col cursor-pointer active:scale-[0.98]"
                    >
                      <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-2 bg-zinc-100 shadow-sm border border-zinc-200/50">
                        <TrackImage
                          src={track.thumbnail}
                          trackId={track.id}
                          alt={track.title}
                          className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <p className="text-xs font-bold text-zinc-900 truncate">
                        {track.title}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                        {track.artist}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ─── 6. COM BASE NO QUE VOCÊ OUVIU (Abre a Tela de Playlist do Figma) ─── */}
            {feed?.based_on_listened && feed.based_on_listened.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 font-sans">
                  COM BASE NO QUE VOCÊ OUVIU
                </h3>

                <div className="flex gap-3.5 overflow-x-auto pb-2 no-scrollbar">
                  {feed.based_on_listened.map((playlist) => (
                    <div
                      key={playlist.id}
                      onClick={() =>
                        goToPlaylistDetail({
                          playlistId: playlist.id,
                          title: playlist.title,
                          thumbnail: playlist.thumbnail,
                          initialTracks: playlist.tracks,
                        })
                      }
                      className="group shrink-0 w-44 flex flex-col cursor-pointer active:scale-[0.98]"
                    >
                      <div
                        className={`relative aspect-square w-full rounded-3xl overflow-hidden mb-2 shadow-md bg-gradient-to-br ${playlist.gradient} text-white p-3.5 flex flex-col justify-between`}
                      >
                        {playlist.thumbnail ? (
                          <img
                            src={playlist.thumbnail}
                            alt={playlist.title}
                            referrerPolicy="no-referrer"
                            className="absolute inset-0 size-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-black/40" />

                        <div className="relative z-10 flex justify-end">
                          <div className="size-8 rounded-full bg-white text-zinc-900 flex items-center justify-center shadow-md">
                            <Play className="size-3.5 fill-zinc-900 ml-0.5" />
                          </div>
                        </div>

                        <div className="relative z-10">
                          <p className="text-xs font-black uppercase tracking-wide text-white leading-tight drop-shadow-sm">
                            {playlist.title}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-zinc-900 truncate">
                        {playlist.title}
                      </p>
                      <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                        {playlist.subtitle}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ─── 7. ÁLBUNS COM AS MÚSICAS QUE VOCÊ ADORA ─── */}
            {feed?.favorite_albums && feed.favorite_albums.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 font-sans">
                  ÁLBUNS COM AS MÚSICAS QUE VOCÊ ADORA
                </h3>

                <div className="flex gap-3.5 overflow-x-auto pb-2 no-scrollbar">
                  {feed.favorite_albums.map((album) => (
                    <div
                      key={album.id || album.title}
                      onClick={() => {
                        goToAlbumDetail({
                          albumId: album.id,
                          title: album.title,
                          artist: album.artist,
                          thumbnail: album.thumbnail,
                        })
                      }}
                      className="group shrink-0 w-36 flex flex-col cursor-pointer active:scale-[0.98]"
                    >
                      <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-2 bg-zinc-100 shadow-md border border-zinc-200/50">
                        <img
                          src={album.thumbnail || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80"}
                          alt={album.title}
                          referrerPolicy="no-referrer"
                          className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <p className="text-xs font-bold text-zinc-900 truncate">
                        {album.title}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                        Álbum • {album.artist}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
