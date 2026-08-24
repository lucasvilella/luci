"""
ModelRouter — Roteador Central de Inferência e Execução Cognitiva da Luci.
Conforme docs/05_INTELLIGENCE/MODEL_ROUTER.md:
"Nenhum Engine além deste conhece o nome de um modelo específico."

Responsabilidade:
1. Se COMMAND mapeado -> despacha direto para o serviço de domínio (Música, Clima, Cotações) com latência ultra-baixa sem chamar LLM.
2. Se REASONING ou comando conversacional -> monta contexto e delega para o provedor de LLM (Gemini API com fallbacks).
"""

import os
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
    """Roteador inteligente de execução e modelos de linguagem."""

    def __init__(self):
        self.api_key = settings.gemini_api_key or os.getenv("GEMINI_API_KEY")

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
            # A) Ações de Música
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
                    return f"Tocando {selected_track['title']} de {selected_track['artist']} agora no LuciMusic!"
                else:
                    return f"Procurei por '{query_param}', mas não encontrei nenhuma música correspondente no momento."

            if action == "music.pause":
                from app.services.playback_manager import playback_manager
                from app.services.ws_manager import ws_hub
                session = playback_manager.update_playback_state(user_id, is_playing=False, progress_seconds=0)
                asyncio.create_task(ws_hub.emit_to_user(user_id, "PLAYBACK_STATE_CHANGED", session))
                return "Música pausada."

            if action == "music.next":
                from app.services.playback_manager import playback_manager
                from app.services.ws_manager import ws_hub
                session = playback_manager.next_track(user_id)
                if session and session.get("current_track"):
                    asyncio.create_task(ws_hub.emit_to_user(user_id, "START_PLAYBACK", session))
                    return f"Avançando para {session['current_track']['title']}."
                return "Avançando para a próxima faixa da fila."

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
        return await self._call_llm_reasoning(user_id, message, attachment_path)

    async def _call_llm_reasoning(
        self,
        user_id: str,
        message: str,
        attachment_path: Optional[str] = None
    ) -> str:
        """Invoca o provedor de LLM na nuvem (Gemini) com histórico unificado e personalidade."""
        context = ConversationDatabase.get_recent_context_for_llm(user_id, limit=12)

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

        if self.api_key:
            for model_name in ["gemini-3.6-flash", "gemini-1.5-flash"]:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.api_key}"
                payload = {
                    "contents": [{"parts": [{"text": full_prompt}]}]
                }
                try:
                    async with httpx.AsyncClient(timeout=10.0) as client:
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
                    print(f"[ModelRouter] Erro no modelo {model_name}: {e}")

        # Fallback caloroso e natural
        lower_msg = message.lower()
        if any(w in lower_msg for w in ["obrigado", "valeu", "obrigada", "agradeço"]):
            return "De nada, Lucas! Sempre que precisar de qualquer coisa, conte comigo."
        if any(w in lower_msg for w in ["ola", "olá", "oi", "bom dia", "boa tarde", "boa noite"]):
            return "Oi, Lucas! Tudo bem por aí? Em que posso te ajudar hoje?"
        return "Estou aqui te ouvindo com atenção, Lucas! Me diga como posso te ajudar agora."

model_router = ModelRouter()
