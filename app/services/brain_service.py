"""
Orquestrador Central de Inteligência da Luci AI (Cérebro Único Omnichannel).
Unifica o processamento de Texto, Voz e Intérprete Simultâneo em uma só memória,
integrando Gemini API (gemini-3.6-flash), Function Calling de 9 ferramentas e Síntese de Voz (Edge-TTS).
"""

import os
import json
import asyncio
import base64
import httpx
from typing import List, Dict, Any, Optional

from app.core.config import settings
from app.database.conversation_db import ConversationDatabase
from app.tools.registry import tool_registry

SYSTEM_PROMPT_LUCI = """Você é a Luci, a inteligência artificial pessoal de Lucas.
Você é extremamente inteligente, empática, perspicaz, carinhosa, divertida e 100% natural.

DIRETRIZES FUNDAMENTAIS:
1. Converse de forma calorosa, humana, viva e fluida em Português do Brasil.
2. NUNCA use respostas mecânicas ou clichês de robô como "Entendi sua mensagem" ou "Estou operando em modo local".
3. Quando receber dados de ferramentas em tempo real (como clima, cotações, feriados ou músicas), incorpore-os com naturalidade no diálogo como uma parceira inteligente.
4. Mantenha memória e continuidade absoluta entre texto, áudio e tradução.
5. Seja concisa, expressiva e acolhedora."""

class BrainService:
    def __init__(self):
        self.api_key = settings.gemini_api_key or os.getenv("GEMINI_API_KEY")

    async def _call_gemini(self, user_id: str, current_message: str) -> str:
        """Gera resposta da LLM Gemini considerando todo o histórico unificado da conversa."""
        context = ConversationDatabase.get_recent_context_for_llm(user_id, limit=12)
        
        lower_msg = current_message.lower()
        tool_result_snippet = ""

        if any(w in lower_msg for w in ["tempo", "clima", "temperatura", "chuva", "chover", "previsão"]):
            weather_data = await tool_registry.execute("get_weather_summary_text", {"location": "Sao Paulo"})
            if weather_data and weather_data.get("sucesso"):
                tool_result_snippet += f"\n[Dados de Clima em Tempo Real]: {weather_data.get('resumo')}\n"

        elif any(w in lower_msg for w in ["dolar", "dólar", "euro", "bitcoin", "btc", "moeda", "cotacao", "cotação"]):
            currency_data = await tool_registry.execute("get_currency_rates", {})
            if currency_data and currency_data.get("sucesso"):
                tool_result_snippet += f"\n[Dados de Cotações em Tempo Real]: {json.dumps(currency_data.get('cotacoes'), ensure_ascii=False)}\n"

        elif any(w in lower_msg for w in ["feriado", "dia util", "dias úteis"]):
            holiday_data = await tool_registry.execute("get_national_holidays", {"year": 2026})
            if holiday_data and holiday_data.get("sucesso"):
                tool_result_snippet += f"\n[Próximos Feriados]: {json.dumps(holiday_data.get('feriados', [])[:3], ensure_ascii=False)}\n"

        # Monta prompt estruturado
        history_lines = []
        for turn in context[:-1]:
            speaker = "Lucas" if turn["role"] == "user" else "Luci"
            history_lines.append(f"{speaker}: {turn['content']}")
        formatted_history = "\n".join(history_lines)

        full_prompt = f"{SYSTEM_PROMPT_LUCI}\n\nHistórico:\n{formatted_history}\n{tool_result_snippet}\nLucas: {current_message}\nLuci:"

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
                    print(f"[BrainService] Falha na chamada {model_name}: {e}")

        # Respostas naturais caso Gemini esteja inacessível
        if tool_result_snippet:
            return f"Aqui está o que consultei para você: {tool_result_snippet.strip()}"
        if any(w in lower_msg for w in ["obrigado", "valeu", "obrigada", "agradeço", "tks"]):
            return "De nada, Lucas! Sempre que precisar de uma força ou quiser ouvir um som, estou por aqui."
        if any(w in lower_msg for w in ["ola", "olá", "oi", "bom dia", "boa tarde", "boa noite"]):
            return "Oi, Lucas! Tudo bem por aí? Em que posso te ajudar hoje?"
        return "Estou te ouvindo perfeitamente, Lucas! Como posso te ajudar agora?"

    async def _synthesize_voice(self, text: str, voice: str = "pt-BR-ThalitaNeural") -> Optional[str]:
        """Sintetiza o texto em áudio MP3 via Edge TTS e retorna em base64."""
        try:
            import edge_tts
            import io
            communicate = edge_tts.Communicate(text, voice)
            audio_io = io.BytesIO()
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_io.write(chunk["data"])
            audio_io.seek(0)
            return base64.b64encode(audio_io.read()).decode("utf-8")
        except Exception as e:
            print(f"[BrainService] Erro TTS: {e}")
            return None

    async def process_chat(
        self,
        user_id: str,
        message: str,
        input_type: str = "text",
        generate_audio: bool = False,
        voice: str = "pt-BR-ThalitaNeural"
    ) -> Dict[str, Any]:
        """
        Processa uma mensagem de conversação vinda de Chat ou Voz,
        mantendo o cérebro único e alimentando o histórico de sessão compartilhado.
        """
        # 1. Salva a mensagem de entrada do usuário
        user_msg = ConversationDatabase.add_message(
            user_id=user_id,
            role="user",
            content=message,
            input_type=input_type
        )

        # 2. Gera resposta da IA com o contexto omnichannel
        ai_response_text = await self._call_gemini(user_id, message)

        # 3. Síntese de áudio opcional (para mensagens de voz)
        audio_b64 = None
        if generate_audio or input_type == "voice":
            audio_b64 = await self._synthesize_voice(ai_response_text, voice=voice)

        # 4. Salva a resposta da assistente na timeline única
        bot_msg = ConversationDatabase.add_message(
            user_id=user_id,
            role="assistant",
            content=ai_response_text,
            input_type=input_type
        )

        return {
            "reply": ai_response_text,
            "audio_base64": audio_b64,
            "user_message": user_msg,
            "assistant_message": bot_msg,
            "inputType": input_type
        }

    async def record_interpreter_turn(
        self,
        user_id: str,
        speaker: str,
        original_text: str,
        translated_text: str
    ):
        """Registra uma fala traduzida no Intérprete para alimentar o contexto geral da Luci."""
        content = f"[{speaker.upper()} - Intérprete]: \"{original_text}\" -> Tradução: \"{translated_text}\""
        ConversationDatabase.add_message(
            user_id=user_id,
            role="assistant" if speaker.lower() in ["luci", "bot"] else "user",
            content=content,
            input_type="interpreter"
        )

brain_service = BrainService()
