"""
Orquestrador Central de Inteligência da Luci AI (Cérebro Único Omnichannel).
Conforme docs/99_RULES/NON_NEGOTIABLES.md (Non-Negotiable 1: A Inteligência é Única):
Unifica o processamento de Texto, Voz e Intérprete Simultâneo em uma só memória e timeline,
delegando a classificação de intenção ao IntentEngine, o despacho ao ModelRouter
e a síntese de voz ao TTSService.
"""

import time
from typing import Dict, Any, Optional
from app.database.conversation_db import ConversationDatabase
from app.services.intent_engine import intent_engine
from app.services.model_router import model_router
from app.services.tts_service import tts_service

class BrainService:
    """Serviço de orquestração do cérebro centralizado da Luci."""

    async def process_chat(
        self,
        user_id: str,
        message: str,
        input_type: str = "text",
        generate_audio: bool = False,
        voice: str = "pt-BR-ThalitaNeural",
        attachment_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Processa uma interação conversacional vinda de qualquer interface (Texto, Voz ou Anexo),
        preservando a linha temporal única e a cognição desacoplada.
        """
        # 1. Salva a mensagem de entrada do usuário no histórico unificado
        t_start = time.perf_counter()
        user_msg = ConversationDatabase.add_message(
            user_id=user_id,
            role="user",
            content=message,
            input_type=input_type
        )

        # 2. Classificação de Intenção (Fast-Path Heurístico + SmolLM Local)
        t_intent_start = time.perf_counter()
        intent_result = await intent_engine.classify(message)
        t_intent_ms = (time.perf_counter() - t_intent_start) * 1000

        # 3. Roteamento Inteligente e Execução Cognitiva (ModelRouter / Groq / Gemini)
        t_llm_start = time.perf_counter()
        ai_response_text = await model_router.route(
            intent=intent_result,
            user_id=user_id,
            message=message,
            attachment_path=attachment_path
        )
        t_llm_ms = (time.perf_counter() - t_llm_start) * 1000

        # 4. Síntese de Voz Unificada (TTSService)
        audio_b64 = None
        t_tts_ms = 0.0
        if generate_audio or input_type == "voice":
            t_tts_start = time.perf_counter()
            audio_b64 = await tts_service.synthesize(ai_response_text, voice=voice)
            t_tts_ms = (time.perf_counter() - t_tts_start) * 1000

        # 5. Salva a resposta da assistente na timeline única
        bot_msg = ConversationDatabase.add_message(
            user_id=user_id,
            role="assistant",
            content=ai_response_text,
            input_type=input_type
        )

        t_total_ms = (time.perf_counter() - t_start) * 1000

        # Log estruturado de alta visibilidade no terminal
        print(
            f"[Brain Profiler] Msg: '{message[:30]}...' | "
            f"Intent: {t_intent_ms:.1f}ms ({intent_result.type}) | "
            f"LLM/Ação: {t_llm_ms:.1f}ms | "
            f"TTS: {t_tts_ms:.1f}ms | "
            f"TOTAL BACKEND: {t_total_ms:.1f}ms"
        )

        return {
            "reply": ai_response_text,
            "audio_base64": audio_b64,
            "user_message": user_msg,
            "assistant_message": bot_msg,
            "inputType": input_type,
            "intent": intent_result.to_dict(),
            "timings_ms": {
                "intent": round(t_intent_ms, 1),
                "llm": round(t_llm_ms, 1),
                "tts": round(t_tts_ms, 1),
                "total": round(t_total_ms, 1)
            }
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
