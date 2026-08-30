"""
IntentEngine — Motor de Compreensão e Classificação de Intenção da Luci.
Conforme docs/03_COGNITIVE_ENGINES/INTENT_ENGINE.md e docs/99_RULES/NON_NEGOTIABLES.md:
1. Fast-Path Heurístico (<1ms) para saudações e comandos de ação direta.
2. SmolLM2 Local Classifier (Ollama) para entradas ambíguas.
Este módulo apenas compreende e classifica (não executa ações).
"""

import time
import re
import json
import httpx
from typing import Dict, Any, Optional, Literal

IntentType = Literal["COMMAND", "REASONING"]

class IntentClassificationResult:
    def __init__(
        self,
        intent_type: IntentType,
        confidence: float,
        action: Optional[str] = None,
        query_param: Optional[str] = None,
        latency_ms: float = 0.0
    ):
        self.type = intent_type
        self.confidence = confidence
        self.action = action
        self.query_param = query_param
        self.latency_ms = latency_ms

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "confidence": self.confidence,
            "action": self.action,
            "query_param": self.query_param,
            "latency_ms": self.latency_ms
        }

class IntentEngine:
    """Classificador de intenções em dois estágios: Heurística ultra-rápida + SmolLM Local."""

    def __init__(self, ollama_url: str = "http://localhost:11434", model_name: str = "smollm2:135m"):
        self.ollama_url = ollama_url
        self.model_name = model_name
        self.system_prompt = (
            "You are the intent router for Luci, a cognitive OS.\n"
            "Your ONLY job is to classify the user's input.\n"
            "You must output ONLY valid JSON without Markdown blocks.\n\n"
            "Format:\n"
            "{\n"
            '  "type": "COMMAND" or "REASONING",\n'
            '  "confidence": <0-100>,\n'
            '  "action": "<short verb-noun if COMMAND, null if REASONING>"\n'
            "}"
        )

    @staticmethod
    def _levenshtein_distance(s1: str, s2: str) -> int:
        """Calcula a distância de edição de Levenshtein para tolerância a pequenos erros."""
        if len(s1) < len(s2):
            return IntentEngine._levenshtein_distance(s2, s1)
        if len(s2) == 0:
            return len(s1)

        previous_row = range(len(s2) + 1)
        for i, c1 in enumerate(s1):
            current_row = [i + 1]
            for j, c2 in enumerate(s2):
                insertions = previous_row[j + 1] + 1
                deletions = current_row[j] + 1
                substitutions = previous_row[j] + (c1 != c2)
                current_row.append(min(insertions, deletions, substitutions))
            previous_row = current_row
        return previous_row[-1]

    async def classify(self, user_input: str) -> IntentClassificationResult:
        start_time = time.perf_counter()
        clean_input = user_input.strip().lower()

        if not clean_input:
            latency = (time.perf_counter() - start_time) * 1000
            return IntentClassificationResult("REASONING", 100, latency_ms=latency)

        # ─── 1. FAST-PATH HEURISTICS (<3ms) COM REGEX E LEVENSHTEIN TOLERANT ───
        
        # A) Saudações e conversa geral -> REASONING (Fast-path < 1ms)
        is_greeting_or_chat = bool(re.search(
            r"\b(oi|ol[aá]|ei|tudo bem|como vai|como voc[eê] est[aá]|bom dia|boa tarde|boa noite|quem [eé] voc[eê]|ajuda|help|obrigad[oa]|valeu)\b",
            clean_input
        ))
        if is_greeting_or_chat and not any(w in clean_input for w in ["toca", "toque", "tocar", "pausar", "pause", "pr[oó]xima", "proxima", "pular", "curtir", "curte", "favorita", "acenda", "apague", "ligue", "desligue"]):
            latency = (time.perf_counter() - start_time) * 1000
            return IntentClassificationResult("REASONING", 100, action=None, latency_ms=latency)

        # B) Parser Híbrido Local de Comandos Musicais (Slot Filling + Levenshtein)
        
        # Intenção: TOCAR (PLAY)
        play_pattern = re.match(
            r"^(?:luci,?\s*)?(?:toca|toque|coloque|reproduza|ouvir|ouça|bota|tocar)\s+(?:a\s+m[uú]sica\s+|o\s+[aá]lbum\s+|a\s+faixa\s+)?(?P<query>.+)",
            clean_input
        )
        if play_pattern:
            raw_query = play_pattern.group("query").strip()
            # Limpeza de prefixos residuais
            for prefix in ["uma musica de", "uma música de", "de ", "do ", "da "]:
                if raw_query.startswith(prefix):
                    raw_query = raw_query[len(prefix):].strip()
                    break
            latency = (time.perf_counter() - start_time) * 1000
            return IntentClassificationResult(
                "COMMAND",
                99,
                action="music.play",
                query_param=raw_query or clean_input,
                latency_ms=latency
            )

        # Intenção: PULAR / PRÓXIMA (NEXT)
        if re.match(r"^(?:luci,?\s*)?(?:pule|pula|avan[cç]a|pr[oó]xima|proxima|troca|passa|next|pular)\s*(?:essa|a\s+m[uú]sica|a\s+faixa|o\s+som)?\b", clean_input):
            latency = (time.perf_counter() - start_time) * 1000
            return IntentClassificationResult("COMMAND", 99, action="music.next", latency_ms=latency)

        # Intenção: PAUSAR / MUTAR (PAUSE)
        if re.match(r"^(?:luci,?\s*)?(?:pausa|pause|para|parar|sil[eê]ncio|silencio|mutar|mute|stop)\s*(?:a\s+m[uú]sica|a\s+faixa|o\s+som)?\b", clean_input):
            latency = (time.perf_counter() - start_time) * 1000
            return IntentClassificationResult("COMMAND", 99, action="music.pause", latency_ms=latency)

        # Intenção: FAVORITAR / CURTIR (LIKE)
        if re.match(r"^(?:luci,?\s*)?(?:curte|curtir|favorita|salva|gostei|adorei|love|like)\s*(?:dessa|essa|esta|m[uú]sica|faixa)?\b", clean_input):
            latency = (time.perf_counter() - start_time) * 1000
            return IntentClassificationResult("COMMAND", 98, action="music.like", latency_ms=latency)

        # Tolerância a pequenos erros de digitação (Levenshtein Distance <= 1 em comandos curtos)
        first_word = clean_input.split()[0] if clean_input.split() else ""
        if len(first_word) >= 4:
            if self._levenshtein_distance(first_word, "pausar") <= 1 or self._levenshtein_distance(first_word, "pause") <= 1:
                latency = (time.perf_counter() - start_time) * 1000
                return IntentClassificationResult("COMMAND", 95, action="music.pause", latency_ms=latency)
            if self._levenshtein_distance(first_word, "proxima") <= 1 or self._levenshtein_distance(first_word, "pular") <= 1:
                latency = (time.perf_counter() - start_time) * 1000
                return IntentClassificationResult("COMMAND", 95, action="music.next", latency_ms=latency)
            if self._levenshtein_distance(first_word, "curtir") <= 1 or self._levenshtein_distance(first_word, "curte") <= 1:
                latency = (time.perf_counter() - start_time) * 1000
                return IntentClassificationResult("COMMAND", 95, action="music.like", latency_ms=latency)

        # C) Comandos de Informação Rápida / Ferramentas
        if re.search(r"\b(tempo|clima|temperatura|vai\s*chover|chuva|chover|previs[aã]o)\b", clean_input):
            latency = (time.perf_counter() - start_time) * 1000
            return IntentClassificationResult("COMMAND", 95, action="info.weather", latency_ms=latency)

        if re.search(r"\b(d[oó]lar|euro|bitcoin|btc|cota[cç][aã]o|moeda)\b", clean_input):
            latency = (time.perf_counter() - start_time) * 1000
            return IntentClassificationResult("COMMAND", 95, action="info.currency", latency_ms=latency)

        if re.search(r"\b(feriado|feriados|dias\s*[uú]teis|dia\s*[uú]til)\b", clean_input):
            latency = (time.perf_counter() - start_time) * 1000
            return IntentClassificationResult("COMMAND", 95, action="info.holidays", latency_ms=latency)

        # D) Comandos de Navegação e Troca de Módulos no App
        nav_match = re.search(
            r"\b(?:vamos\s+para|vai\s+para|ir\s+para|navegar\s+para|abre|abrir|mostrar|mostra|acessar|acessa)\s+(?:o\s+|a\s+)?(?:m[oó]dulo\s+de\s+|tela\s+de\s+|aba\s+de\s+|se[cç][aã]o\s+de\s+)?(?P<target>automa[cç][aã]o|casa|home\s*assistant|dispositivos|m[uú]sica|music|player|chat|conversa|chatting|configura[cç][oõ]es|ajustes|settings|orb|voz|assistente)\b",
            clean_input
        )
        if nav_match:
            target = nav_match.group("target").lower()
            resolved_module = "home-assistant"
            if any(k in target for k in ["música", "musica", "music", "player"]):
                resolved_module = "music"
            elif any(k in target for k in ["chat", "conversa", "chatting"]):
                resolved_module = "chat"
            elif any(k in target for k in ["configurações", "configuracoes", "ajustes", "settings"]):
                resolved_module = "settings"
            elif any(k in target for k in ["orb", "voz", "assistente"]):
                resolved_module = "orb"
            elif any(k in target for k in ["automação", "automacao", "casa", "home assistant", "dispositivos"]):
                resolved_module = "home-assistant"

            latency = (time.perf_counter() - start_time) * 1000
            return IntentClassificationResult(
                "COMMAND",
                99,
                action="app.navigate",
                query_param=resolved_module,
                latency_ms=latency
            )

        # E) Comandos de Automação Residencial
        if re.match(r"^(acenda|apague|ligue|desligue|abra|feche)\s*(.*)", clean_input):
            latency = (time.perf_counter() - start_time) * 1000
            return IntentClassificationResult("COMMAND", 90, action="home.device_control", query_param=clean_input, latency_ms=latency)

        # ─── 2. SMOL-LM2 / OLLAMA LOCAL PARA CASOS AMBÍGUOS ───
        try:
            async with httpx.AsyncClient(timeout=1.2) as client:
                res = await client.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        "model": self.model_name,
                        "prompt": f'User input: "{user_input}"',
                        "system": self.system_prompt,
                        "stream": False,
                        "options": {"temperature": 0.0}
                    }
                )
                if res.status_code == 200:
                    raw_text = res.json().get("response", "")
                    cleaned = re.sub(r"```json|```", "", raw_text).strip()
                    parsed = json.loads(cleaned)
                    if isinstance(parsed, dict) and "type" in parsed:
                        latency = (time.perf_counter() - start_time) * 1000
                        return IntentClassificationResult(
                            intent_type="COMMAND" if parsed.get("type") == "COMMAND" else "REASONING",
                            confidence=float(parsed.get("confidence", 75)),
                            action=parsed.get("action"),
                            query_param=user_input,
                            latency_ms=latency
                        )
        except Exception:
            # Fallback silencioso e seguro para REASONING
            pass

        # Fallback padrão
        latency = (time.perf_counter() - start_time) * 1000
        return IntentClassificationResult("REASONING", 60, latency_ms=latency)

# Instância Singleton
intent_engine = IntentEngine()
