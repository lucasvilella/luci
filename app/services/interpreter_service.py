"""
Luci Universal Interpreter Service — Gemini Multimodal Live API (Bidirectional Audio-to-Audio)
With Automatic Speaker Gender Detection (Male <-> Female) and Dynamic Voice Pairing.

Pipeline:
- Falante Masculino (PT-BR)  -> Tradução falada em Mandarim/Inglês/etc com Voz Masculina ('Puck' / 'Fenrir')
- Falante Feminina (Estrangeiro) -> Tradução falada em Português com Voz Feminina ('Aoede' / 'Kore')
"""

import os
import json
import asyncio
import base64
import websockets
from typing import AsyncGenerator, Optional, Dict, Any

GEMINI_API_HOST = "generativelanguage.googleapis.com"
GEMINI_LIVE_PATH = "/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent"

SYSTEM_INSTRUCTION_DYNAMIC_INTERPRETER = """
Você é a Luci no Modo Intérprete Simultâneo Universal de Alta Fidelidade e Baixa Latência.
Qualquer intervenção ou assistência além da tradução pura deve herdar a personalidade viva, inteligente e acolhedora do PERSONALITY_CORE da Luci.

DIRETRIZES DE TRADUÇÃO E IDENTIDADE VOCAL:
1. Fala em Português falada por HOMEM:
   - Identifique o idioma do interlocutor estrangeiro da conversa (Mandarim, Inglês, Espanhol, Alemão, etc.).
   - Traduza a fala imediatamente para o idioma do interlocutor estrangeiro e reproduza com tom e voz MASCULINA.
2. Fala em idioma estrangeiro falada por MULHER:
   - Traduza imediatamente para o Português Brasileiro e reproduza com tom e voz FEMININA.
3. Variação de gêneros dos falantes:
   - Adapte a voz de saída para coincidir sempre com o gênero da pessoa que acabou de falar (Homem -> Voz Masculina, Mulher -> Voz Feminina).
4. Fidelidade Técnica & Regras Restritas:
   - Mantenha total fidelidade a termos técnicos de indústria, moldes de injeção plástica, maquinário, comércio exterior B2B, prazos, preços (FOB/CIF) e negociações.
   - Tradução direta, instantânea e precisa. Sem introduções, sem preâmbulos, sem saudações ou comentários adicionais.
"""

class UniversalInterpreterSession:
    """
    Gerencia a sessão WebSocket Full-Duplex com Gemini Live API com suporte
    a presets dinâmicos de voz para alternância natural de locutores em reuniões.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "models/gemini-2.0-flash-exp",
        male_voice: str = "Puck",     # Voz masculina: Puck, Fenrir, Charon
        female_voice: str = "Aoede",  # Voz feminina: Aoede, Kore
        system_instruction: str = SYSTEM_INSTRUCTION_DYNAMIC_INTERPRETER,
    ):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY não configurada no ambiente (.env).")

        self.model = model
        self.male_voice = male_voice
        self.female_voice = female_voice
        self.system_instruction = system_instruction
        self.ws: Optional[websockets.WebSocketClientProtocol] = None
        self._is_active = False

    async def connect(self, initial_voice: str = "Aoede"):
        """Estabelece a conexão WebSocket Live com a configuração multimodal."""
        url = f"wss://{GEMINI_API_HOST}{GEMINI_LIVE_PATH}?key={self.api_key}"

        self.ws = await websockets.connect(
            url,
            extra_headers={"Content-Type": "application/json"},
            ping_interval=20,
            ping_timeout=10,
        )
        self._is_active = True

        setup_payload = {
            "setup": {
                "model": self.model,
                "generationConfig": {
                    "responseModalities": ["AUDIO"],
                    "speechConfig": {
                        "voiceConfig": {
                            "prebuiltVoiceConfig": {
                                "voiceName": initial_voice
                            }
                        }
                    }
                },
                "systemInstruction": {
                    "parts": [
                        {"text": self.system_instruction}
                    ]
                }
            }
        }
        await self.ws.send(json.dumps(setup_payload))

        init_response = await self.ws.recv()
        data = json.loads(init_response)
        if "setupComplete" not in data:
            print("[UniversalInterpreter] Warning setup:", data)
        else:
            print("[UniversalInterpreter] 🎙️ Sessão Live com Detecção de Locutor e Gênero iniciada.")

    async def send_audio_chunk(self, pcm_data: bytes, mime_type: str = "audio/pcm;rate=16000"):
        """Envia um chunk de áudio bruto (PCM) do microfone para o Gemini Live."""
        if not self.ws or not self._is_active:
            return

        b64_audio = base64.b64encode(pcm_data).decode("utf-8")
        payload = {
            "realtimeInput": {
                "mediaChunks": [
                    {
                        "mimeType": mime_type,
                        "data": b64_audio,
                    }
                ]
            }
        }
        await self.ws.send(json.dumps(payload))

    async def receive_stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        """Escuta a resposta em tempo real do Gemini e gera chunks de áudio e transcrições."""
        while self._is_active and self.ws:
            try:
                raw_msg = await self.ws.recv()
                data = json.loads(raw_msg)

                server_content = data.get("serverContent", {})

                # Chunks do Modelo
                model_turn = server_content.get("modelTurn", {})
                parts = model_turn.get("parts", [])
                for part in parts:
                    # 1. Áudio retornado
                    inline_data = part.get("inlineData", {})
                    if inline_data.get("mimeType", "").startswith("audio/"):
                        audio_bytes = base64.b64decode(inline_data["data"])
                        yield {"type": "audio", "data": audio_bytes, "mime": inline_data["mimeType"]}

                    # 2. Texto/Transcrição
                    if "text" in part:
                        yield {"type": "text", "text": part["text"]}

                # Evento de Interrupção (Barge-in do usuário)
                if server_content.get("interrupted"):
                    yield {"type": "interrupted"}

                # Turno Concluído
                if server_content.get("turnComplete"):
                    yield {"type": "turnComplete"}

            except websockets.exceptions.ConnectionClosed:
                self._is_active = False
                break
            except Exception as e:
                print(f"[UniversalInterpreter] Erro receive_stream: {e}")
                break

    async def close(self):
        self._is_active = False
        if self.ws:
            await self.ws.close()
            self.ws = None
