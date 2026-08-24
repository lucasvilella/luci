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

    async def classify(self, user_input: str) -> IntentClassificationResult:
        start_time = time.perf_counter()
        clean_input = user_input.strip().lower()

        if not clean_input:
            latency = (time.perf_counter() - start_time) * 1000
            return IntentClassificationResult("REASONING", 100, latency_ms=latency)

        # ─── 1. FAST-PATH HEURISTICS (<1ms) ───
        
        # A) Saudações e conversa geral -> REASONING
        is_greeting_or_chat = bool(re.match(
            r"^(oi|ol[aá]|ei|tudo bem|como vai|bom dia|boa tarde|boa noite|quem [eé] voc[eê]|ajuda|help|obrigad[oa]|valeu)[.!?\s]*$",
            clean_input
        ))
        if is_greeting_or_chat:
            latency = (time.perf_counter() - start_time) * 1000
            return IntentClassificationResult("REASONING", 100, action=None, latency_ms=latency)

        # B) Comandos mecânicos diretos de Música
        # "toca ...", "toque ...", "tocar ...", "ouvir ..."
        music_play_match = re.match(r"^(toca|toque|tocar|ouvir|coloque a m[uú]sica|tocar a m[uú]sica|bota)\s*(.*)", clean_input)
        if music_play_match:
            song_query = music_play_match.group(2).strip()
            # Remove preposições comuns: "uma musica de", "a musica", "de"
            for prefix in ["uma musica de", "uma música de", "a musica de", "a música de", "a musica", "a música", "musica de", "música de", "de "]:
                if song_query.startswith(prefix):
                    song_query = song_query[len(prefix):].strip()
                    break
            latency = (time.perf_counter() - start_time) * 1000
            return IntentClassificationResult(
                "COMMAND",
                98,
                action="music.play",
                query_param=song_query or clean_input,
                latency_ms=latency
            )

        if any(clean_input.startswith(w) for w in ["pausar", "pause", "parar musica", "parar música", "mute"]):
            latency = (time.perf_counter() - start_time) * 1000
            return IntentClassificationResult("COMMAND", 99, action="music.pause", latency_ms=latency)

        if any(clean_input.startswith(w) for w in ["pr[oó]xima", "proxima", "pular musica", "pular música", "next"]):
            latency = (time.perf_counter() - start_time) * 1000
            return IntentClassificationResult("COMMAND", 99, action="music.next", latency_ms=latency)

        # C) Comandos de Informação Rápida / Ferramentas
        if any(w in clean_input for w in ["tempo", "clima", "temperatura", "vai chover", "previs[aã]o"]):
            latency = (time.perf_counter() - start_time) * 1000
            return IntentClassificationResult("COMMAND", 95, action="info.weather", latency_ms=latency)

        if any(w in clean_input for w in ["dolar", "dólar", "euro", "bitcoin", "btc", "cota[cç][aã]o"]):
            latency = (time.perf_counter() - start_time) * 1000
            return IntentClassificationResult("COMMAND", 95, action="info.currency", latency_ms=latency)

        if any(w in clean_input for w in ["feriado", "feriados", "dias [uú]teis", "dia [uú]til"]):
            latency = (time.perf_counter() - start_time) * 1000
            return IntentClassificationResult("COMMAND", 95, action="info.holidays", latency_ms=latency)

        # D) Comandos de Automação Residencial
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
