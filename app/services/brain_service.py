"""
Orquestrador Central de Inteligência da Luci AI (Cérebro Único Omnichannel).
Conforme docs/99_RULES/NON_NEGOTIABLES.md (Non-Negotiable 1: A Inteligência é Única):
Unifica o processamento de Texto, Voz e Intérprete Simultâneo em uma só memória e timeline,
delegando a classificação de intenção ao IntentEngine, o despacho ao ModelRouter
e a síntese de voz ao TTSService.
"""

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
        user_msg = ConversationDatabase.add_message(
            user_id=user_id,
            role="user",
            content=message,
            input_type=input_type
        )

        # 2. Classificação de Intenção (Fast-Path Heurístico + SmolLM Local)
        intent_result = await intent_engine.classify(message)

        # 3. Roteamento Inteligente e Execução Cognitiva (ModelRouter)
        ai_response_text = await model_router.route(
            intent=intent_result,
            user_id=user_id,
            message=message,
            attachment_path=attachment_path
        )

        # 4. Síntese de Voz Unificada (TTSService)
        audio_b64 = None
        if generate_audio or input_type == "voice":
            audio_b64 = await tts_service.synthesize(ai_response_text, voice=voice)

        # 5. Salva a resposta da assistente na timeline única
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
            "inputType": input_type,
            "intent": intent_result.to_dict()
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
