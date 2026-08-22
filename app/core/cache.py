"""
Cache em Memória com Time-To-Live (TTL) para ferramentas e APIs públicas.
Thread-safe e compatível com corrotinas assíncronas do FastAPI.
"""

import time
from typing import Any, Optional, Dict

class AsyncTTLCache:
    def __init__(self, default_ttl_seconds: int = 180):
        self.default_ttl = default_ttl_seconds
        self._store: Dict[str, Dict[str, Any]] = {}

    def get(self, key: str) -> Optional[Any]:
        entry = self._store.get(key)
        if not entry:
            return None
        if time.time() > entry["expires_at"]:
            self._store.pop(key, None)
            return None
        return entry["value"]

    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl
        self._store[key] = {
            "value": value,
            "expires_at": time.time() + ttl,
        }

    def clear(self) -> None:
        self._store.clear()

global_cache = AsyncTTLCache()
