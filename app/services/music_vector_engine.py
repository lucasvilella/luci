"""
Motor Matemático de Recomendação Musical & Álgebra Linear da Luci.
Mapeamento vetorial n-dimensional, Similaridade por Cosseno e Divisão Estocástica Multi-Armed Bandit (70/20/10).
"""

import math
import random
import re
from typing import List, Dict, Any, Tuple, Optional

# Dimensões do Vetor Acústico: [energia, acustica, dancabilidade, valencia, bpm_norm, pop, sertanejo, rock, mpb, eletronica, funk, hiphop]
DIMENSIONS = [
    "energy",
    "acousticness",
    "danceability",
    "valence",
    "bpm_normalized",
    "sub_pop",
    "sub_sertanejo",
    "sub_rock",
    "sub_mpb",
    "sub_electronic",
    "sub_funk",
    "sub_hiphop"
]
DIM_COUNT = len(DIMENSIONS)

# Pesos dinâmicos por tipo de interação comportamental
INTERACTION_WEIGHTS = {
    "completed": 1.0,         # Reprodução completa (100%)
    "liked": 3.0,             # Música favoritada (Like)
    "added_to_playlist": 3.0, # Adicionada à playlist
    "replayed": 2.0,          # Repetição consecutiva
    "direct_search": 2.5,     # Busca direta por nome
    "skipped_early": -1.5,    # Skip rápido (< 30 segundos)
    "skipped_artist": -2.5    # Skip repetido do mesmo artista
}

# Mapeamento de palavras-chave / gêneros para pesos conceituais de subgêneros
GENRE_KEYWORDS = {
    "sub_pop": ["pop", "dance", "hit", "radio", "dua lipa", "ed sheeran", "taylor", "ariana"],
    "sub_sertanejo": ["sertanejo", "modao", "sofrência", "gusttavo lima", "marilia", "jorge", "mateus", "luan santana", "agronejo"],
    "sub_rock": ["rock", "guitar", "metal", "queen", "nirvana", "arctic monkeys", "indie rock", "pink floyd"],
    "sub_mpb": ["mpb", "bossa", "samba", "caetano", "gilberto", "chico", "alceu", "gal costa", "veloso", "anavitória"],
    "sub_electronic": ["electronic", "eletronica", "edm", "alok", "vintage culture", "house", "techno", "remix", "beat"],
    "sub_funk": ["funk", "brega", "mc", "cabelinho", "ryan", "poze", "anitta", "l7nnon"],
    "sub_hiphop": ["rap", "hip hop", "trap", "matue", "emicida", "orochi", "racionais", "bk"]
}

# Pontes harmônicas e conceituais entre gêneros distantes (Grafos de Conexão)
GENRE_BRIDGES = {
    ("sub_mpb", "sub_rock"): ["Rock Rural", "Psicodelia Nordestina anos 70", "Secos & Molhados", "Novos Baianos", "Raulzito"],
    ("sub_mpb", "sub_sertanejo"): ["Sertanejo de Raiz Acústico", "Almir Sater", "Renato Teixeira", "MPB Caipira", "Chitãozinho Clássico"],
    ("sub_rock", "sub_electronic"): ["Synthwave", "Indie Dance", "New Wave", "Daft Punk", "Depeche Mode"],
    ("sub_sertanejo", "sub_funk"): ["Funknejo", "EletroFunk Sertanejo", "Dennis DJ Sertanejo", "Piseiro Pop"],
    ("sub_mpb", "sub_electronic"): ["Bossa Nova Lofi", "Brazilian Bass Acústico", "MPB Chill Beat", "Remix MPB Tropical"],
    ("sub_hiphop", "sub_rock"): ["Rap Rock", "Nu Metal", "Rage Against", "Planet Hemp", "Charlie Brown Jr"]
}

class MusicVectorEngine:
    """Motor de álgebra linear vetorial para perfil musical e recomendação Multi-Armed Bandit."""

    @staticmethod
    def extract_track_vector(track: Dict[str, Any]) -> List[float]:
        """
        Mapeia uma música em um vetor n-dimensional [0.0, 1.0]^n a partir de metadados e tags.
        """
        title = (track.get("title") or "").lower()
        artist = (track.get("artist") or "").lower()
        album = (track.get("album") or "").lower()
        tags = [str(t).lower() for t in (track.get("tags") or [])]
        combined_text = f"{title} {artist} {album} {' '.join(tags)}"

        # Estimativas heurísticas normalizadas de características acústicas
        energy = 0.5
        acousticness = 0.3
        danceability = 0.5
        valence = 0.5
        bpm_normalized = 0.5 # ~120 BPM base

        # Heurísticas por palavras-chave acústicas
        if any(w in combined_text for w in ["acoustic", "acustico", "acústico", "unplugged", "piano", "violao", "violão", "calma", "chill", "lofi"]):
            acousticness = 0.85
            energy = 0.30
            bpm_normalized = 0.35

        if any(w in combined_text for w in ["live", "ao vivo", "festival", "rock", "metal", "heavy", "eletro", "remix", "bass"]):
            energy = 0.85
            acousticness = 0.15
            bpm_normalized = 0.70

        if any(w in combined_text for w in ["funk", "dance", "pop", "piseiro", "sertanejo", "trap", "beat"]):
            danceability = 0.85
            valence = 0.70

        # Subgêneros
        subgenre_weights = []
        for dim_name in DIMENSIONS[5:]:
            keywords = GENRE_KEYWORDS.get(dim_name, [])
            match_count = sum(1 for kw in keywords if kw in combined_text)
            subgenre_weights.append(min(1.0, match_count * 0.5))

        vec = [energy, acousticness, danceability, valence, bpm_normalized] + subgenre_weights
        return vec

    @staticmethod
    def cosine_similarity(u: List[float], v: List[float]) -> float:
        """
        Calcula a similaridade por cosseno entre o perfil do usuário u e a faixa v:
        Cosine(u, v) = (u . v) / (||u|| * ||v||)
        """
        if not u or not v or len(u) != len(v):
            return 0.0

        dot_product = sum(a * b for a, b in zip(u, v))
        norm_u = math.sqrt(sum(a * a for a in u))
        norm_v = math.sqrt(sum(b * b for b in v))

        if norm_u == 0.0 or norm_v == 0.0:
            return 0.0

        return max(-1.0, min(1.0, dot_product / (norm_u * norm_v)))

    @classmethod
    def calculate_user_profile_vector(cls, interaction_history: List[Dict[str, Any]]) -> List[float]:
        """
        Calcula o vetor de perfil médio ponderado do usuário u:
        u = sum(w_i * v_i) / sum(|w_i|)
        """
        if not interaction_history:
            # Perfil neutro balanceado padrão
            return [0.5] * DIM_COUNT

        weighted_sum = [0.0] * DIM_COUNT
        total_weight = 0.0

        for item in interaction_history:
            track = item.get("track") or item
            signal_type = item.get("signal_type", "completed")
            weight = INTERACTION_WEIGHTS.get(signal_type, 1.0)

            track_vec = cls.extract_track_vector(track)
            for i in range(DIM_COUNT):
                weighted_sum[i] += weight * track_vec[i]
            total_weight += abs(weight)

        if total_weight == 0.0:
            return [0.5] * DIM_COUNT

        profile_vector = [val / total_weight for val in weighted_sum]
        # Normalização nos limites [0.0, 1.0]
        return [max(0.0, min(1.0, val)) for val in profile_vector]

    @classmethod
    def rank_and_balance_recommendations(
        cls,
        user_vector: List[float],
        candidate_tracks: List[Dict[str, Any]],
        top_genres: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Aplica a divisão estocástica Multi-Armed Bandit (Exploration vs Exploitation):
        - 70% Consolidação (Cosine Similarity > 0.80)
        - 20% Pontes de Gênero (Vizinhança Conceitual / Grafos Harmônicos)
        - 10% Exploração Pura / Novos Lançamentos
        """
        if not candidate_tracks:
            return {"consolidation": [], "bridges": [], "exploration": [], "queue": []}

        scored_tracks: List[Tuple[float, Dict[str, Any]]] = []
        for track in candidate_tracks:
            vec = cls.extract_track_vector(track)
            sim = cls.cosine_similarity(user_vector, vec)
            scored_tracks.append((sim, track))

        # Ordena por similaridade decrescente
        scored_tracks.sort(key=lambda x: x[0], reverse=True)

        consolidation_pool = [t for sim, t in scored_tracks if sim >= 0.75]
        if not consolidation_pool and scored_tracks:
            consolidation_pool = [t for _, t in scored_tracks[:max(1, len(scored_tracks) // 2)]]

        # Identifica pontes conceituais com base nos gêneros mais fortes
        bridge_suggestions = []
        if top_genres and len(top_genres) >= 2:
            g1, g2 = top_genres[0], top_genres[1]
            key1 = (f"sub_{g1.lower()}", f"sub_{g2.lower()}")
            key2 = (f"sub_{g2.lower()}", f"sub_{g1.lower()}")
            bridge_terms = GENRE_BRIDGES.get(key1) or GENRE_BRIDGES.get(key2) or []
            bridge_suggestions = bridge_terms

        # 70% Consolidação, 20% Pontes, 10% Exploração
        total_slots = min(20, len(candidate_tracks))
        n_consolidation = max(1, int(total_slots * 0.70))
        n_bridges = max(1, int(total_slots * 0.20))
        n_exploration = max(1, total_slots - n_consolidation - n_bridges)

        selected_consolidation = consolidation_pool[:n_consolidation]
        
        # Seleciona candidatos restantes para exploração e pontes
        remaining = [t for _, t in scored_tracks if t not in selected_consolidation]
        random.shuffle(remaining)
        
        selected_bridges = remaining[:n_bridges]
        selected_exploration = remaining[n_bridges:n_bridges + n_exploration]

        final_queue = selected_consolidation + selected_bridges + selected_exploration

        return {
            "consolidation": selected_consolidation,
            "bridges": selected_bridges,
            "bridge_concepts": bridge_suggestions,
            "exploration": selected_exploration,
            "queue": final_queue
        }

music_vector_engine = MusicVectorEngine()
