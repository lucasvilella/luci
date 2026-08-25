"""
Interfaces Base para Provedores de Música Plugáveis (Metadata e Audio Source).
Inspirado na arquitetura modular do Spotube e no Non-Negotiable 2 (Orientado a Capabilities).
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class MetadataProvider(ABC):
    """Contrato abstrato para provedores de catálogo e metadados musicais."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Identificador legível do provedor."""
        pass

    @abstractmethod
    async def search(self, query: str, limit: int = 20, filter_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Retorna faixas, artistas e álbuns estruturados.
        Formato de retorno padrão:
        {
            "songs": [
                {
                    "id": str,
                    "title": str,
                    "artist": str,
                    "artistId": str,
                    "album": str,
                    "thumbnail": str,
                    "duration": int,
                    "durationFormatted": str,
                    "provider": str,
                    "external_ids": dict
                }
            ],
            "artists": [...],
            "albums": [...],
            "playlists": [...]
        }
        """
        pass

    @abstractmethod
    async def get_track_metadata(self, track_id: str) -> Optional[Dict[str, Any]]:
        """Retorna detalhes e enriquecimento de uma faixa específica."""
        pass

class AudioSourceProvider(ABC):
    """Contrato abstrato para provedores de fonte de áudio e stream."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Identificador legível do provedor de áudio."""
        pass

    @abstractmethod
    async def resolve_stream(self, track_id: str, title: Optional[str] = None, artist: Optional[str] = None) -> Dict[str, Any]:
        """
        Resolve a URL/stream técnico de reprodução.
        Formato de retorno:
        {
            "stream_url": str,
            "format": str,
            "ext": str,
            "mime_type": str,
            "bitrate_kbps": int | None,
            "title": str,
            "artist": str,
            "duration": int | None,
            "provider": str
        }
        """
        pass
