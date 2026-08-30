"use client"

import React, { useState, useEffect } from "react"
import { AppHeader } from "@/components/ui/app-header"
import { SectionHeader } from "@/components/ui/section-header"
import { MediaCard } from "@/components/ui/media-card"
import { DailyMixCard } from "@/components/ui/daily-mix-card"
import { CreatedByLuciCard } from "@/components/ui/created-by-luci-card"
import { ContinuePillCard } from "@/components/ui/continue-pill-card"
import { PlaylistMosaicCard } from "@/components/ui/playlist-mosaic-card"
import { ArtistCircle } from "@/components/ui/artist-circle"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useMusicNavigation } from "@/hooks/use-music-navigation"
import { useAppNavigationStore } from "@/stores/useAppNavigationStore"
import { fetchMusicHome, type LuciTrack } from "@/lib/lucimusic"
import { luciApiFetch } from "@/lib/api"

export function MusicHome({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const { playTrack, currentTrack, isPlaying, togglePlay } = useMusicPlayer()
  const {
    goToArtist,
    goToPlaylistDetail,
    goToAlbumDetail,
    goToHistory,
    goToNotifications,
    goToSearch,
  } = useMusicNavigation()
  const { setActiveTab } = useAppNavigationStore()

  const [homeData, setHomeData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Busca os dados dinâmicos reais dos motores da Luci
  useEffect(() => {
    let mounted = true
    async function loadRealFeed() {
      try {
        const res = await luciApiFetch("/api/v1/music/home?mood=all")
        if (res.ok) {
          const data = await res.json()
          if (mounted) {
            setHomeData(data)
            setLoading(false)
            return
          }
        }
      } catch (err) {
        console.warn("[MusicHome] Erro ao buscar feed dinâmico:", err)
      }

      try {
        const fallback = await fetchMusicHome("all")
        if (mounted) {
          setHomeData(fallback)
          setLoading(false)
        }
      } catch {
        if (mounted) setLoading(false)
      }
    }

    loadRealFeed()
    return () => {
      mounted = false
    }
  }, [])

  // Extrai dados reais vindos da API
  const continueListening = homeData?.continue_listening || []
  const dailyMixes = homeData?.daily_mixes || []
  const favoriteArtists = homeData?.favorite_artists || homeData?.recommended_artists || []
  const trendingBrasil = homeData?.trending_brasil || []
  const newReleases = homeData?.new_releases || []
  const customWorkout = homeData?.custom_workout?.tracks || []
  const customFocus = homeData?.custom_focus?.tracks || []

  // 6 itens reais para o grid de 2 colunas do "Continuar Ouvindo" no topo
  const continuePills = (continueListening.length > 0 ? continueListening : trendingBrasil).slice(0, 6).map((item: any, idx: number) => ({
    id: item.id || `cont_${idx}`,
    title: item.title || "Música",
    coverUrl: item.thumbnail || item.cover_url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300",
    artist: item.artist || item.subtitle || "",
    type: item.type || "track"
  }))

  const popularPlaylists = homeData?.popular_playlists || []
  const weekSelection = homeData?.week_selection || []

  const handlePlayDirectTrack = (track: any, trackList: any[]) => {
    const trackObj: LuciTrack = {
      id: track.id,
      title: track.title,
      artist: track.artist || "Artista",
      thumbnail: track.thumbnail || track.cover_url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
      duration: track.duration || 210,
    }
    playTrack(
      trackObj,
      trackList.map((t) => ({
        id: t.id,
        title: t.title,
        artist: t.artist || "Artista",
        thumbnail: t.thumbnail || t.cover_url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400",
        duration: t.duration || 210,
      }))
    )
  }

  return (
    <div className="relative flex h-full flex-col bg-[var(--bg-app)] text-[var(--text-primary)] select-none overflow-y-auto pb-32">
      {/* ─── APP HEADER COM IDENTIDADE LUCI E NOTIFICAÇÕES ─── */}
      <AppHeader
        userName="Lucas"
        notificationCount={3}
        onSearchClick={() => setActiveTab("search")}
        onNotificationClick={goToNotifications}
      />

      <div className="px-5 pt-2 space-y-6">
        {/* ─── 00. CARD SUPERIOR DE INDICAÇÃO INTELIGENTE DA LUCI (Momento / Rotina / Humor) ─── */}
        <section className="pt-0">
          <CreatedByLuciCard
            momentTag="MOMENTO DO DIA/GATILHO"
            title={"TEMA CENTRAL\nDA PLAYLIST"}
            affinityPercent={88}
            athleteImageUrl="/images/music/created-by-luci/playlist_gym.png"
            onClick={() => goToPlaylistDetail("pump_luci", "TEMA CENTRAL DA PLAYLIST", "/images/music/created-by-luci/playlist_gym.png")}
          />
        </section>

        {/* ─── 01. CONTINUAR OUVIDO (Grid 2 colunas com Pílulas no Topo) ─── */}
        {continuePills.length > 0 && (
          <section className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-[var(--text-primary)] relative pb-1">
                Continuar Ouvindo
                <span className="absolute bottom-0 left-0 w-8 h-[2.5px] rounded-full bg-[var(--accent-primary)]" />
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {continuePills.map((pill) => (
                <ContinuePillCard
                  key={pill.id}
                  id={pill.id}
                  title={pill.title}
                  coverUrl={pill.coverUrl}
                  onClick={() => {
                    if (pill.type === "track") {
                      handlePlayDirectTrack(
                        {
                          id: pill.id,
                          title: pill.title,
                          artist: pill.artist,
                          thumbnail: pill.coverUrl,
                        },
                        continuePills.filter((p) => p.type === "track").map((p) => ({
                          id: p.id,
                          title: p.title,
                          artist: p.artist,
                          thumbnail: p.coverUrl,
                        }))
                      )
                    } else if (pill.type === "album") {
                      goToAlbumDetail(pill.id, pill.title, pill.coverUrl)
                    } else {
                      goToPlaylistDetail(pill.id, pill.title, pill.coverUrl)
                    }
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* ─── 02. DAILY MIX (Motor do MusicIntelligenceEngine com Molduras Oficiais) ─── */}
        {dailyMixes.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-[var(--text-primary)] relative pb-1">
                Daily Mix
                <span className="absolute bottom-0 left-0 w-8 h-[2.5px] rounded-full bg-[var(--accent-primary)]" />
              </h2>
            </div>

            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
              {dailyMixes.map((mix: any, idx: number) => {
                const mixNumber = mix.mix_id || idx + 1
                const artistThumb =
                  mix.tracks && mix.tracks[0]
                    ? mix.tracks[0].thumbnail || mix.tracks[0].cover_url
                    : mix.cover_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"

                return (
                  <DailyMixCard
                    key={mix.mix_id || mix.title}
                    mixId={mixNumber}
                    title={mix.title || `Daily Mix ${mixNumber}`}
                    subtitle={mix.subtitle}
                    artistImageUrl={artistThumb}
                    onClick={() => {
                      if (mix.tracks && mix.tracks.length > 0) {
                        handlePlayDirectTrack(mix.tracks[0], mix.tracks)
                      } else {
                        goToPlaylistDetail(mixNumber, mix.title, artistThumb)
                      }
                    }}
                  />
                )
              })}
            </div>
          </section>
        )}

        {/* ─── 03. COM BASE NAS SUAS REPRODUÇÕES RECENTES / EM ALTA ─── */}
        {trendingBrasil.length > 0 && (
          <section>
            <SectionHeader
              title="Com base nas suas reproduções recentes"
              seeAllText="Ver tudo"
              onSeeAll={goToHistory}
            />
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
              {trendingBrasil.map((item: any) => (
                <MediaCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  subtitle={item.artist}
                  imageUrl={item.thumbnail || item.cover_url}
                  onClick={() => handlePlayDirectTrack(item, trendingBrasil)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ─── 04. SELEÇÃO DA SEMANA (Playlists com Montagem Mosaico 2x2 Dinâmicas) ─── */}
        {weekSelection.length > 0 && (
          <section className="animate-fade-in">
            <SectionHeader
              title="Seleção da semana"
              seeAllText="Ver tudo"
              onSeeAll={() => goToSearch()}
            />
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
              {weekSelection.map((pl: any) => (
                <PlaylistMosaicCard
                  key={pl.id}
                  id={pl.id}
                  title={pl.title}
                  subtitle={pl.subtitle}
                  covers={pl.covers && pl.covers.length > 0 ? pl.covers : trendingBrasil.slice(0, 4).map((t: any) => t.thumbnail || t.cover_url)}
                  onClick={() => goToPlaylistDetail(pl.id, pl.title)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ─── 05. PLAYLISTS POPULARES (Playlists com Montagem Mosaico 2x2 Dinâmicas) ─── */}
        {popularPlaylists.length > 0 && (
          <section className="animate-fade-in">
            <SectionHeader
              title="Playlists Populares"
              seeAllText="Ver tudo"
              onSeeAll={() => goToSearch()}
            />
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
              {popularPlaylists.map((pl: any) => (
                <PlaylistMosaicCard
                  key={pl.id}
                  id={pl.id}
                  title={pl.title}
                  subtitle={pl.subtitle}
                  covers={pl.covers && pl.covers.length > 0 ? pl.covers : trendingBrasil.slice(2, 6).map((t: any) => t.thumbnail || t.cover_url)}
                  onClick={() => goToPlaylistDetail(pl.id, pl.title)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ─── 06. ÚLTIMOS LANÇAMENTOS PARA VOCÊ ─── */}
        {newReleases.length > 0 && (
          <section>
            <SectionHeader
              title="Últimos lançamentos para você"
              seeAllText="Ver tudo"
              onSeeAll={() => goToSearch()}
            />
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
              {newReleases.map((item: any) => (
                <MediaCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  subtitle={item.artist}
                  imageUrl={item.thumbnail || item.cover_url}
                  onClick={() => handlePlayDirectTrack(item, newReleases)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ─── 07. ÁLBUNS PARA VOCÊ ─── */}
        {customFocus.length > 0 && (
          <section>
            <SectionHeader
              title="Álbuns para você"
              seeAllText="Ver tudo"
              onSeeAll={() => goToSearch()}
            />
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
              {customFocus.map((item: any) => (
                <MediaCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  subtitle={item.artist}
                  imageUrl={item.thumbnail || item.cover_url}
                  onClick={() => handlePlayDirectTrack(item, customFocus)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ─── 08. TRENDING ARTISTAS ─── */}
        {favoriteArtists.length > 0 && (
          <section>
            <SectionHeader
              title="Trending Artistas"
              seeAllText="Ver tudo"
              onSeeAll={() => goToSearch()}
            />
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
              {favoriteArtists.map((artist: any) => (
                <ArtistCircle
                  key={artist.id || artist.name}
                  id={artist.id || artist.name}
                  name={artist.name}
                  avatarUrl={artist.thumbnail || artist.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300"}
                  onClick={() => goToArtist(artist.name)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
