"""
In-Memory Async TTL Cache for External API tools.
Guarantees sub-millisecond response for repeated queries and respects custom TTLs.
"""

import time
from typing import Any, Optional, Dict

class AsyncTTLCache:
    def __init__(self):
        # Key -> {"val": Any, "expires_at": float}
        self._cache: Dict[str, Dict[str, Any]] = {}

    def get(self, key: str) -> Optional[Any]:
        entry = self._cache.get(key)
        if not entry:
            return None
        if time.time() > entry["expires_at"]:
            del self._cache[key]
            return None
        return entry["val"]

    def set(self, key: str, value: Any, ttl_seconds: int = 300) -> None:
        self._cache[key] = {
            "val": value,
            "expires_at": time.time() + ttl_seconds,
        }

    def clear(self) -> None:
        self._cache.clear()

# Global singleton cache instance for Luci tools
global_ttl_cache = AsyncTTLCache()
