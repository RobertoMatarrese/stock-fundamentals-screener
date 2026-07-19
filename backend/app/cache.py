import time


class TTLCache:
    """Minimal in-memory cache where each entry expires after ttl_seconds."""

    def __init__(self, ttl_seconds: int):
        self._ttl_seconds = ttl_seconds
        self._store: dict[str, tuple[float, object]] = {}

    def get(self, key: str):
        entry = self._store.get(key)
        if entry is None:
            return None

        expires_at, value = entry
        if time.monotonic() >= expires_at:
            del self._store[key]
            return None

        return value

    def set(self, key: str, value) -> None:
        self._store[key] = (time.monotonic() + self._ttl_seconds, value)

    def clear(self) -> None:
        self._store.clear()
