"""
MusicIntelligenceEngine — Núcleo Cognitivo de Curadoria e Recomendação Musical da Luci.
Em estrita conformidade com os princípios da Luci:
- Non-Negotiable 1: A Inteligência é única (Interfaces e Providers não decidem).
- Non-Negotiable 6: Providers nunca implementam lógica cognitiva.

Este Engine decide O QUÊ recomendar (gerando sementes estruturadas a partir de dados reais),
sem acoplamento direto a APIs de streaming externas (ytmusicapi / yt-dlp).
"""

from typing import List, Dict, Any, Optional
from app.database.music_db import MusicDatabase

class MusicIntelligenceEngine:
    """Motor de inteligência musical responsável por inferir gostos e gerar sementes de curadoria."""

    async def get_home_curation(self, user_id: str) -> Dict[str, Any]:
        """
        Analisa o histórico real, sinais ponderados de aprendizado e curtidas do usuário
        para sintetizar as sementes de recomendação da Home.
        """
        # 1. Obter dados reais de interação do usuário
        taste_profile = MusicDatabase.get_taste_profile(user_id, limit=10)
        history = MusicDatabase.get_history(user_id, limit=30)
        liked_songs = MusicDatabase.get_liked_songs(user_id, limit=20)
        history_top_artists = MusicDatabase.get_top_artists(user_id, limit=8)

        # 2. Sintetizar artistas de maior afinidade (ponderando sinais de aprendizado > likes > histórico)
        ranked_artists: List[str] = []
        
        # a) Artistas com sinais de aprendizado explícitos (liked, replayed, completed)
        for item in taste_profile.get("top_artists", []):
            art = item.get("artist", "").strip()
            if art and art not in ranked_artists:
                ranked_artists.append(art)

        # b) Artistas das músicas curtidas
        for song in liked_songs:
            art = song.get("artist", "").strip()
            if art and art not in ranked_artists:
                ranked_artists.append(art)

        # c) Artistas do histórico de reprodução
        for item in history_top_artists:
            art = item.get("artist", "").strip()
            if art and art not in ranked_artists:
                ranked_artists.append(art)

        is_cold_start = len(ranked_artists) == 0

        # 3. Gerar sementes dos Daily Mixes
        daily_mix_seeds: List[Dict[str, Any]] = []
        colors = [
            "from-emerald-700 to-teal-950",
            "from-amber-700 to-orange-950",
            "from-purple-700 to-indigo-950",
            "from-rose-700 to-red-950",
            "from-blue-700 to-slate-950",
        ]

        if not is_cold_start:
            for idx in range(min(5, max(1, len(ranked_artists)))):
                artist_seed = ranked_artists[idx % len(ranked_artists)]
                color = colors[idx % len(colors)]
                daily_mix_seeds.append({
                    "id": f"daily_mix_{idx + 1}",
                    "title": f"Daily Mix {idx + 1}",
                    "subtitle": f"{artist_seed} e artistas semelhantes",
                    "search_query": f"{artist_seed} musicas e semelhantes ao vivo",
                    "gradient": color,
                    "anchor_artist": artist_seed,
                    "is_fallback": False
                })
            # Se tiver menos de 5 artistas mas já tiver histórico, preenche os restantes com variações
            while len(daily_mix_seeds) < 5:
                idx = len(daily_mix_seeds)
                base_artist = ranked_artists[0]
                color = colors[idx % len(colors)]
                daily_mix_seeds.append({
                    "id": f"daily_mix_{idx + 1}",
                    "title": f"Daily Mix {idx + 1}",
                    "subtitle": f"Descobertas a partir de {base_artist}",
                    "search_query": f"{base_artist} sucessos e recomendados",
                    "gradient": color,
                    "anchor_artist": base_artist,
                    "is_fallback": False
                })
        else:
            # Cold Start Neutro — Descoberta Geral (explicitamente rotulado como fallback de exploração)
            neutral_seeds = [
                {"title": "Descoberta Diária 1", "subtitle": "Exploração de novos ritmos", "query": "Top Brasil sucessos mais tocados", "color": colors[0]},
                {"title": "Descoberta Diária 2", "subtitle": "Músicas em destaque no momento", "query": "Tendencias musicais do momento brasil", "color": colors[1]},
                {"title": "Descoberta Diária 3", "subtitle": "Relax e acústicos", "query": "Musica brasileira acustico calma", "color": colors[2]},
                {"title": "Descoberta Diária 4", "subtitle": "Batidas e energia", "query": "Brasil musicas animadas festa", "color": colors[3]},
                {"title": "Descoberta Diária 5", "subtitle": "Clássicos memoráveis", "query": "Grandes sucessos atemporais brasil", "color": colors[4]},
            ]
            for idx, nseed in enumerate(neutral_seeds):
                daily_mix_seeds.append({
                    "id": f"daily_mix_{idx + 1}",
                    "title": nseed["title"],
                    "subtitle": nseed["subtitle"],
                    "search_query": nseed["query"],
                    "gradient": nseed["color"],
                    "anchor_artist": "",
                    "is_fallback": True
                })

        # 4. Gerar sementes de "Playlists com base no que você ouviu"
        similarity_seeds: List[Dict[str, Any]] = []
        if not is_cold_start:
            for idx, artist in enumerate(ranked_artists[:4]):
                similarity_seeds.append({
                    "id": f"similar_{idx + 1}",
                    "title": f"Estilo {artist}",
                    "subtitle": f"Playlists com base no seu gosto por {artist}",
                    "search_query": f"{artist} playlist sucessos relacionados",
                    "gradient": colors[idx % len(colors)],
                    "is_fallback": False
                })
        else:
            similarity_seeds = [
                {
                    "id": "explore_trending",
                    "title": "Em Alta no Brasil",
                    "subtitle": "Playlists mais populares do momento",
                    "search_query": "Top 50 Brasil hits",
                    "gradient": "from-amber-600 to-yellow-900",
                    "is_fallback": True
                },
                {
                    "id": "explore_discover",
                    "title": "Novas Tendências",
                    "subtitle": "Artistas emergentes e novidades",
                    "search_query": "Novas tendencias lancamentos brasil",
                    "gradient": "from-teal-600 to-emerald-950",
                    "is_fallback": True
                }
            ]

        # 5. Gerar sementes de "Álbuns Favoritos"
        favorite_albums_seeds: List[Dict[str, Any]] = []
        if not is_cold_start:
            for artist in ranked_artists[:6]:
                favorite_albums_seeds.append({
                    "artist": artist,
                    "search_query": f"{artist} album",
                    "is_fallback": False
                })
        else:
            favorite_albums_seeds = [
                {"artist": "", "search_query": "Melhores albuns brasileiros populares", "is_fallback": True}
            ]

        return {
            "user_id": user_id,
            "is_cold_start": is_cold_start,
            "top_artists_count": len(ranked_artists),
            "daily_mix_seeds": daily_mix_seeds,
            "similarity_seeds": similarity_seeds,
            "favorite_albums_seeds": favorite_albums_seeds,
            "trending_query": "Top Brasil 2026 Hits",
            "new_releases_query": "Novos Lançamentos 2026 Hits"
        }

# Instância Singleton do Motor de Inteligência Musical
music_intelligence_engine = MusicIntelligenceEngine()
