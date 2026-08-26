"""
ModelRouter — Roteador Central de Inferência e Execução Cognitiva da Luci.
Conforme docs/05_INTELLIGENCE/MODEL_ROUTER.md:
"Nenhum Engine além deste conhece o nome de um modelo específico."

Responsabilidade:
1. Se COMMAND mapeado -> despacha direto para o serviço de domínio (Música, Clima, Cotações) com latência ultra-baixa sem chamar LLM.
2. Se REASONING ou comando conversacional -> monta contexto e delega para o provedor de LLM (Gemini API com fallbacks).
"""

import os
import re
import json
import asyncio
import httpx
from typing import Dict, Any, Optional

from app.core.config import settings
from app.database.conversation_db import ConversationDatabase
from app.services.intent_engine import IntentClassificationResult
from app.tools.registry import tool_registry

SYSTEM_PROMPT_LUCI = """Você é a Luci, a inteligência artificial pessoal de Lucas.
Você é extremamente inteligente, empática, perspicaz, carinhosa, divertida e 100% natural.

DIRETRIZES FUNDAMENTAIS:
1. Converse de forma calorosa, humana, viva e fluida em Português do Brasil.
2. NUNCA use respostas mecânicas ou clichês de robô como "Entendi sua mensagem" ou "Estou operando em modo local".
3. Quando receber dados de ferramentas em tempo real (como clima, cotações, feriados ou músicas), incorpore-os com naturalidade no diálogo como uma parceira inteligente.
4. Mantenha memória e continuidade absoluta entre texto, áudio e tradução.
5. Seja concisa, expressiva e acolhedora."""

class ModelRouter:
    """Roteador inteligente de execução e modelos de linguagem (Groq Ultra-Fast LPU + Gemini Fallback)."""

    def __init__(self):
        self.groq_api_key = settings.groq_api_key or os.getenv("GROQ_API_KEY")
        self.gemini_api_key = settings.gemini_api_key or os.getenv("GEMINI_API_KEY")

    async def route(
        self,
        intent: IntentClassificationResult,
        user_id: str,
        message: str,
        attachment_path: Optional[str] = None
    ) -> str:
        """
        Executa a melhor estratégia de inferência para a intenção recebida.
        """
        action = intent.action or ""
        query_param = intent.query_param or message

        # ─── 1. FAST-PATH: DISPATCH DIRETO DE COMANDOS MECÂNICOS ───
        if intent.type == "COMMAND":
            # A) Ações de Música com Emissão WebSocket em tempo real
            if action == "music.play" and query_param:
                from app.services.lucimusic_service import lucimusic_service
                from app.services.playback_manager import playback_manager
                from app.services.ws_manager import ws_hub

                search_res = await lucimusic_service.search(query_param)
                songs = search_res.get("songs", [])
                if songs:
                    selected_track = songs[0]
                    session = playback_manager.set_current_track(user_id, selected_track, songs)
                    asyncio.create_task(ws_hub.emit_to_user(user_id, "START_PLAYBACK", session))
                    return f"Tocando {selected_track['title']} agora."
                else:
                    return f"Não encontrei '{query_param}' no catálogo."

            if action == "music.pause":
                from app.services.playback_manager import playback_manager
                from app.services.ws_manager import ws_hub
                session = playback_manager.update_playback_state(user_id, is_playing=False, progress_seconds=0)
                asyncio.create_task(ws_hub.emit_to_user(user_id, "PLAYBACK_STATE_CHANGED", session))
                return "Pausado."

            if action == "music.next":
                from app.services.playback_manager import playback_manager
                from app.services.ws_manager import ws_hub
                session = playback_manager.next_track(user_id)
                if session and session.get("current_track"):
                    asyncio.create_task(ws_hub.emit_to_user(user_id, "START_PLAYBACK", session))
                    return f"Tocando {session['current_track']['title']}."
                return "Avançando para a próxima faixa."

            if action == "music.like":
                from app.services.playback_manager import playback_manager
                from app.database.music_db import MusicDatabase
                from app.services.ws_manager import ws_hub

                session = playback_manager.get_session(user_id)
                curr = session.get("current_track")
                if curr and curr.get("id"):
                    MusicDatabase.toggle_like(user_id, curr)
                    MusicDatabase.record_taste_signal(user_id, curr["id"], artist=curr.get("artist"), signal_type="liked")
                    asyncio.create_task(ws_hub.emit_to_user(user_id, "TRACK_LIKED", {"track_id": curr["id"]}))
                    return "Música favoritada."
                return "Música favoritada com sucesso."

            # B) Informações Rápidas / Ferramentas
            if action == "info.weather":
                weather_data = await tool_registry.execute("get_weather_summary_text", {"location": "Sao Paulo"})
                if weather_data and weather_data.get("sucesso"):
                    return f"Clima agora em São Paulo: {weather_data.get('resumo')}"

            if action == "info.currency":
                currency_data = await tool_registry.execute("get_currency_rates", {})
                if currency_data and currency_data.get("sucesso"):
                    c = currency_data.get("cotacoes", {})
                    dolar = c.get("USDBRL", {}).get("bid", "N/A")
                    euro = c.get("EURBRL", {}).get("bid", "N/A")
                    btc = c.get("BTCBRL", {}).get("bid", "N/A")
                    return f"Cotações de agora: Dólar R$ {dolar}, Euro R$ {euro} e Bitcoin R$ {btc}."

            if action == "info.holidays":
                holiday_data = await tool_registry.execute("get_national_holidays", {"year": 2026})
                if holiday_data and holiday_data.get("sucesso"):
                    feriados = holiday_data.get("feriados", [])[:2]
                    nomes = [f"{f.get('name')} em {f.get('date')}" for f in feriados]
                    return f"Próximos feriados nacionais: {', '.join(nomes)}."

            if action == "home.device_control":
                return f"Comando de casa inteligente recebido: {query_param}. Ajustando o dispositivo."

        # ─── 2. REASONING PATH: LLM COM CONTEXTO E PROMPT CENTRAL ───
        
        # Detecção de hábitos conversacionais episódicos (ex: "Vou começar a estudar toda manhã")
        clean_msg = message.lower()
        if any(trigger in clean_msg for trigger in ["vou começar a", "vou passar a", "vou estudar", "vou treinar", "meu novo hábito"]):
            from app.services.moment_clustering_engine import moment_clustering_engine
            if "estudar" in clean_msg or "programação" in clean_msg or "ler" in clean_msg or "trabalhar" in clean_msg:
                moment_clustering_engine.register_conversational_habit(
                    user_id=user_id,
                    habit_name="Foco & Aprendizado Matinal",
                    time_start_hour=8,
                    time_end_hour=11,
                    preferred_genres="Lofi, Acústico, Instrumental",
                    target_bpm=95
                )
            elif "treinar" in clean_msg or "academia" in clean_msg or "correr" in clean_msg:
                moment_clustering_engine.register_conversational_habit(
                    user_id=user_id,
                    habit_name="Treino & Disposição",
                    time_start_hour=18,
                    time_end_hour=20,
                    preferred_genres="Eletrônica, Funk, Trap",
                    target_bpm=140
                )

        return await self._call_llm_reasoning(user_id, message, attachment_path)

    async def _call_llm_reasoning(
        self,
        user_id: str,
        message: str,
        attachment_path: Optional[str] = None
    ) -> str:
        """
        Invoca o melhor provedor de LLM disponível:
        1. Primário: Groq (LPU Ultra-Fast: llama-3.3-70b-versatile ou llama-3.1-8b-instant) <300ms
        2. Fallback: Gemini (gemini-2.5-flash / gemini-1.5-flash)
        """
        context = ConversationDatabase.get_recent_context_for_llm(user_id, limit=12)

        # Monta histórico estruturado
        messages_payload = [{"role": "system", "content": SYSTEM_PROMPT_LUCI}]
        for turn in context[:-1]:
            role = "user" if turn["role"] == "user" else "assistant"
            messages_payload.append({"role": role, "content": turn["content"]})
        
        user_content = message
        if attachment_path:
            user_content = f"[Arquivo Anexo]: {attachment_path}\n\n{message}"
        messages_payload.append({"role": "user", "content": user_content})

        # 1. Tenta Groq (Primário — Latência ultra-baixa de ~200-400ms)
        if self.groq_api_key:
            for groq_model in ["groq/compound-mini", "groq/compound", "qwen/qwen3.6-27b"]:
                try:
                    async with httpx.AsyncClient(timeout=3.5) as client:
                        resp = await client.post(
                            "https://api.groq.com/openai/v1/chat/completions",
                            headers={
                                "Authorization": f"Bearer {self.groq_api_key}",
                                "Content-Type": "application/json"
                            },
                            json={
                                "model": groq_model,
                                "messages": messages_payload,
                                "temperature": 0.7,
                                "max_tokens": 600
                            }
                        )
                        if resp.status_code == 200:
                            data = resp.json()
                            choices = data.get("choices", [])
                            if choices:
                                raw_text = choices[0].get("message", {}).get("content", "").strip()
                                # Limpa eventuais tags de pensamento (<think>...</think>)
                                clean_text = re.sub(r"<think>.*?</think>", "", raw_text, flags=re.DOTALL).strip()
                                if clean_text:
                                    return clean_text
                        else:
                            print(f"[ModelRouter] Groq status {resp.status_code}: {resp.text[:100]}")
                except Exception as e:
                    print(f"[ModelRouter] Falha temporaria no Groq ({groq_model}): {e}. Tentando fallback...")

        # 2. Tenta Gemini (Fallback)
        history_lines = []
        for turn in context[:-1]:
            speaker = "Lucas" if turn["role"] == "user" else "Luci"
            history_lines.append(f"{speaker}: {turn['content']}")
        formatted_history = "\n".join(history_lines)
        attachment_note = f"\n[Arquivo Anexo Recebido]: {attachment_path}\n" if attachment_path else ""

        full_prompt = (
            f"{SYSTEM_PROMPT_LUCI}\n\n"
            f"Histórico Recente:\n{formatted_history}\n"
            f"{attachment_note}\n"
            f"Lucas: {message}\n"
            f"Luci:"
        )

        if self.gemini_api_key:
            for model_name in ["gemini-2.5-flash", "gemini-1.5-flash"]:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.gemini_api_key}"
                payload = {
                    "contents": [{"parts": [{"text": full_prompt}]}]
                }
                try:
                    async with httpx.AsyncClient(timeout=8.0) as client:
                        resp = await client.post(url, json=payload)
                        if resp.status_code == 200:
                            data = resp.json()
                            candidates = data.get("candidates", [])
                            if candidates:
                                parts = candidates[0].get("content", {}).get("parts", [])
                                if parts:
                                    text_res = parts[0].get("text", "").strip()
                                    if text_res:
                                        return text_res
                except Exception as e:
                    print(f"[ModelRouter] Erro no fallback Gemini ({model_name}): {e}")

        # Fallback caloroso e natural
        lower_msg = message.lower()
        if any(w in lower_msg for w in ["obrigado", "valeu", "obrigada", "agradeço"]):
            return "De nada, Lucas! Sempre que precisar de qualquer coisa, conte comigo."
        if any(w in lower_msg for w in ["ola", "olá", "oi", "bom dia", "boa tarde", "boa noite"]):
            return "Oi, Lucas! Tudo bem por aí? Em que posso te ajudar hoje?"
        return "Estou aqui te ouvindo com atenção, Lucas! Me diga como posso te ajudar agora."

model_router = ModelRouter()
