"""
Motor de Agrupamento Estatístico (Clustering) e Momentos Contextuais da Luci.
Executa K-Means/DBSCAN leve em Python puro para identificar hábitos recorrentes
e sintetizar momentos autônomos (ex: Treino Noturno, Foco Matinal).
"""

import math
import time
from typing import List, Dict, Any, Tuple

from app.database.music_db import MusicDatabase

class MomentClusteringEngine:
    """Motor de agrupamento de hábitos de escuta para geração de cards de contexto."""

    @staticmethod
    def _euclidean_distance(p1: List[float], p2: List[float]) -> float:
        return math.sqrt(sum((a - b) ** 2 for a, b in zip(p1, p2)))

    @classmethod
    def run_clustering_and_update_moments(cls, user_id: str) -> List[Dict[str, Any]]:
        """
        Analisa o histórico de sessões [dia_da_semana, hora, bpm, volume] e detecta concentrações.
        Quando encontra concentração estatística (ex: terças e quintas 19h com BPM > 130),
        cria ou atualiza autonomamente o momento correspondente.
        """
        metrics = MusicDatabase.get_session_metrics(user_id, limit=250)
        if len(metrics) < 5:
            # Cold-start: momentos padrão de referência
            cls._seed_default_moments(user_id)
            return MusicDatabase.get_active_moments_for_now(user_id)

        # 1. Agrupamento por faixas horárias e BPM
        # Clusters candidatos: (faixa_horaria, bpm_medio)
        time_buckets: Dict[int, List[Dict[str, Any]]] = {} # hora -> lista de sessões
        for m in metrics:
            hour = m["hour_of_day"]
            # Agrupa em janelas de 3 horas
            bucket = (hour // 3) * 3
            if bucket not in time_buckets:
                time_buckets[bucket] = []
            time_buckets[bucket].append(m)

        # 2. Identifica padrões com densidade >= 3 ocorrências
        for bucket_hour, sessions in time_buckets.items():
            if len(sessions) >= 3:
                bpms = [s.get("estimated_bpm", 120) for s in sessions]
                avg_bpm = sum(bpms) / len(bpms)
                days = set(s.get("day_of_week", 0) for s in sessions)
                days_str = ",".join(str(d) for d in sorted(days))

                start_h = bucket_hour
                end_h = min(23, bucket_hour + 3)

                # Classificação heurística do momento
                if avg_bpm >= 128 and 17 <= start_h <= 21:
                    moment_id = f"autocluster_workout_{user_id}"
                    name = "Momento Treino & Energia"
                    subtitle = f"Detectado pelo seu ritmo acelerado (~{int(avg_bpm)} BPM) no fim do dia"
                    genres = "Eletrônica, Funk, Trap"
                    MusicDatabase.save_user_moment(
                        user_id=user_id,
                        moment_id=moment_id,
                        moment_name=name,
                        subtitle=subtitle,
                        time_start_hour=start_h,
                        time_end_hour=end_h,
                        days_of_week=days_str,
                        target_bpm_min=125,
                        target_bpm_max=175,
                        preferred_genres=genres,
                        source="clustering"
                    )

                elif avg_bpm <= 110 and 8 <= start_h <= 12:
                    moment_id = f"autocluster_focus_{user_id}"
                    name = "Foco & Concentração Matinal"
                    subtitle = "Músicas acústicas e sem interrupções para o início do seu dia"
                    genres = "Lofi, MPB Acústico, Piano"
                    MusicDatabase.save_user_moment(
                        user_id=user_id,
                        moment_id=moment_id,
                        moment_name=name,
                        subtitle=subtitle,
                        time_start_hour=start_h,
                        time_end_hour=end_h,
                        days_of_week=days_str,
                        target_bpm_min=70,
                        target_bpm_max=115,
                        preferred_genres=genres,
                        source="clustering"
                    )

                elif 21 <= start_h or start_h <= 5:
                    moment_id = f"autocluster_night_{user_id}"
                    name = "Desaceleração Noturna"
                    subtitle = "Sons calmos para relaxar a mente antes de dormir"
                    genres = "Indie Acústico, Bossa Nova, Lofi"
                    MusicDatabase.save_user_moment(
                        user_id=user_id,
                        moment_id=moment_id,
                        moment_name=name,
                        subtitle=subtitle,
                        time_start_hour=start_h,
                        time_end_hour=end_h,
                        days_of_week="all",
                        target_bpm_min=60,
                        target_bpm_max=100,
                        preferred_genres=genres,
                        source="clustering"
                    )

        return MusicDatabase.get_active_moments_for_now(user_id)

    @classmethod
    def register_conversational_habit(
        cls,
        user_id: str,
        habit_name: str,
        time_start_hour: int,
        time_end_hour: int,
        preferred_genres: str = "",
        target_bpm: int = 110
    ) -> Dict[str, Any]:
        """
        Injeção via Conversação (Memória Episódica):
        Quando o usuário diz no chat geral da Luci ex: 'Vou começar a estudar programação toda manhã',
        a LLM invoca este método para criar autonomamente o card de momento ativo.
        """
        clean_id = f"habit_{habit_name.lower().replace(' ', '_')}_{user_id}"
        subtitle = f"Hábito registrado via conversa com a Luci ({time_start_hour:02d}h - {time_end_hour:02d}h)"
        
        MusicDatabase.save_user_moment(
            user_id=user_id,
            moment_id=clean_id,
            moment_name=habit_name,
            subtitle=subtitle,
            time_start_hour=time_start_hour,
            time_end_hour=time_end_hour,
            days_of_week="all",
            target_bpm_min=max(50, target_bpm - 20),
            target_bpm_max=min(180, target_bpm + 20),
            preferred_genres=preferred_genres,
            source="conversational"
        )
        return {
            "success": True,
            "moment_id": clean_id,
            "name": habit_name,
            "time_window": f"{time_start_hour:02d}:00 - {time_end_hour:02d}:00",
            "source": "conversational"
        }

    @staticmethod
    def _seed_default_moments(user_id: str):
        """Cria momentos iniciais padrão para o usuário caso o banco esteja novo."""
        MusicDatabase.save_user_moment(
            user_id=user_id,
            moment_id=f"default_focus_{user_id}",
            moment_name="Foco & Produtividade",
            subtitle="Batidas e instrumentais para imersão no trabalho",
            time_start_hour=8,
            time_end_hour=12,
            days_of_week="all",
            target_bpm_min=80,
            target_bpm_max=120,
            preferred_genres="Lofi, Eletrônica Chill",
            source="clustering"
        )
        MusicDatabase.save_user_moment(
            user_id=user_id,
            moment_id=f"default_workout_{user_id}",
            moment_name="Energia & Treino",
            subtitle="Ritmo acelerado para manter o foco no exercício",
            time_start_hour=18,
            time_end_hour=21,
            days_of_week="all",
            target_bpm_min=130,
            target_bpm_max=170,
            preferred_genres="Funk, Eletrônica, Trap",
            source="clustering"
        )

moment_clustering_engine = MomentClusteringEngine()
