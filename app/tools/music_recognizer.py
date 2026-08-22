"""
Acoustic Music Recognition Tool via ShazamIO (Assíncrono & Zero-Auth).
"""

import asyncio
from typing import Dict, Any, Optional

async def recognize_ambient_music(audio_bytes: bytes) -> Dict[str, Any]:
    """
    Identifica uma música tocando no ambiente a partir de um buffer de áudio (PCM / WAV / MP3) de 3 a 10 segundos.
    """
    if not audio_bytes or len(audio_bytes) < 1000:
        return {
            "sucesso": False,
            "mensagem": "Amostra de áudio muito curta ou vazia para reconhecimento.",
        }

    try:
        from shazamio import Shazam
        shazam = Shazam()
        out = await asyncio.wait_for(shazam.recognize(audio_bytes), timeout=6.0)
        track = out.get("track")
        if track:
            return {
                "sucesso": True,
                "titulo": track.get("title"),
                "artista": track.get("subtitle"),
                "genero": track.get("genres", {}).get("primary"),
                "capa_album": track.get("images", {}).get("coverart"),
                "link_shazam": track.get("url"),
                "letra_disponivel": bool(track.get("sections")),
            }
        return {
            "sucesso": False,
            "mensagem": "Nenhuma música correspondente foi identificada no áudio enviado.",
        }
    except ImportError:
        return {
            "sucesso": False,
            "mensagem": "Biblioteca shazamio não instalada no ambiente.",
        }
    except asyncio.TimeoutError:
        return {
            "sucesso": False,
            "mensagem": "Tempo limite esgotado ao consultar a base acústica.",
        }
    except Exception as e:
        return {
            "sucesso": False,
            "mensagem": f"Erro durante o reconhecimento acústico: {str(e)}",
        }
