"""
MusicSemanticEngine — Motor de Busca Semântica & Contextual da Luci (Luci Cognitiva).
Conforme a especificação:
1. Busca Determinística (Exata): < 150ms sem gastar tokens se for comando direto ('Toque Bohemian Rhapsody').
2. Busca Semântica & Contextual: LLM traduz intenções conceituais ('músicas instrumentais para programar')
   em parâmetros acústicos (BPM, Energy, Acousticness, Tags) e consulta o banco vetorial / YouTube Music InnerTube.
"""

import re
import json
import logging
from typing import Dict, Any, Optional, List
from app.services.intent_engine import intent_engine
from app.services.model_router import model_router
from app.services.lucimusic_service import lucimusic_service
from app.services.music_vector_engine import music_vector_engine

logger = logging.getLogger("LuciMusic.SemanticEngine")

class MusicSemanticEngine:
    """Motor de busca híbrida: Determinística (<150ms) + Semântica Cognitiva (LLM + Vetores)."""

    # Padrões que indicam buscas contextuais/conceituais em vez de nomes diretos
    SEMANTIC_KEYWORDS = [
        "vibe", "clima", "estilo", "para focar", "pra focar", "programar", "estudar", "dormir",
        "treinar", "treino", "relaxar", "triste", "animada", "animado", "calmo", "melancolica",
        "melancólica", "instrumental", "sem voz", "acustica", "acústico", "semelhante a", "parecida com",
        "igual a", "tipo", "na pegada de", "com a mesma energia", "para acordar", "motivação"
    ]

    def is_conceptual_query(self, query: str) -> bool:
        """Determina se a query é uma busca conceitual/semântica ou determinística direta."""
        q_lower = query.lower().strip()
        if len(q_lower.split()) > 4:
            return True
        for kw in self.SEMANTIC_KEYWORDS:
            if kw in q_lower:
                return True
        return False

    async def hybrid_search(self, user_id: str, query: str, limit: int = 20) -> Dict[str, Any]:
        """
        Executa busca inteligente:
        - Se for determinística: vai direto ao YTMusic (<150ms).
        - Se for semântica: aciona a LLM da Luci para extrair parâmetros acústicos, busca sementes
          e aplica ranking vetorial / balanceamento.
        """
        clean_q = query.strip()
        # Remove prefixos como "toque", "tocar", "ouvir", "coloca"
        direct_clean = re.sub(r'^(toque|tocar|ouvir|coloca|coloque|play)\s+', '', clean_q, flags=re.IGNORECASE).strip()

        # 1. Se não for conceitual, segue Fast-Path Determinístico
        if not self.is_conceptual_query(direct_clean):
            results = await lucimusic_service.search(direct_clean, limit=limit)
            return {
                "type": "deterministic",
                "query": direct_clean,
                "reasoning": None,
                "songs": results.get("songs", []),
                "artists": results.get("artists", []),
                "albums": results.get("albums", []),
                "playlists": results.get("playlists", [])
            }

        # 2. Busca Semântica / Cognitiva via LLM
        prompt = (
            f"O usuário fez a seguinte busca musical conceitual: '{clean_q}'.\n"
            "Analise a intenção e retorne EXCLUSIVAMENTE um JSON no seguinte formato:\n"
            "{\n"
            '  "reasoning": "<breve justificativa explicativa da curadoria>",\n'
            '  "target_bpm": "<faixa de BPM, ex: 110-130 ou 80-100>",\n'
            '  "energy": "<baixa, media ou alta>",\n'
            '  "acousticness": "<baixa, media ou alta>",\n'
            '  "tags": ["tag1", "tag2", "tag3"],\n'
            '  "search_queries": ["query exata de busca 1", "query exata de busca 2", "query exata de busca 3"]\n'
            "}"
        )

        try:
            from app.services.intent_engine import IntentClassificationResult
            mock_intent = IntentClassificationResult(intent_type="COMMAND", confidence=90.0, action="music_semantic_search")
            llm_res = await model_router.route(
                intent=mock_intent,
                user_id=user_id,
                message=prompt
            )

            # Extrai o JSON da resposta
            json_match = re.search(r'\{.*\}', llm_res, flags=re.DOTALL)
            parsed_params = json.loads(json_match.group(0)) if json_match else {}
            search_queries = parsed_params.get("search_queries", [clean_q])
            reasoning = parsed_params.get("reasoning", f"Músicas selecionadas para a vibe: {clean_q}")

            # Busca faixas de todas as queries sugeridas
            all_songs: List[Dict[str, Any]] = []
            seen_ids = set()

            for sq in search_queries[:3]:
                sub_res = await lucimusic_service.search(sq, limit=8, filter_type="songs")
                for song in sub_res.get("songs", []):
                    if song["id"] not in seen_ids:
                        seen_ids.add(song["id"])
                        all_songs.append(song)

            return {
                "type": "semantic",
                "query": clean_q,
                "reasoning": reasoning,
                "params": {
                    "bpm": parsed_params.get("target_bpm"),
                    "energy": parsed_params.get("energy"),
                    "tags": parsed_params.get("tags", [])
                },
                "songs": all_songs[:limit],
                "artists": [],
                "albums": [],
                "playlists": []
            }
        except Exception as e:
            logger.warning(f"[MusicSemanticEngine] Falha no raciocínio semântico ({e}), caindo para busca direta...")
            res = await lucimusic_service.search(direct_clean, limit=limit)
            return {
                "type": "fallback_deterministic",
                "query": direct_clean,
                "reasoning": None,
                "songs": res.get("songs", []),
                "artists": res.get("artists", []),
                "albums": res.get("albums", []),
                "playlists": res.get("playlists", [])
            }

# Singleton do motor semântico
music_semantic_engine = MusicSemanticEngine()
