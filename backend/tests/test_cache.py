from app.cache import TTLCache


def test_cache_miss_returns_none():
    cache = TTLCache(ttl_seconds=60)

    assert cache.get("missing") is None


def test_cache_set_and_get():
    cache = TTLCache(ttl_seconds=60)
    cache.set("AAPL", {"pe_ratio": 20})

    assert cache.get("AAPL") == {"pe_ratio": 20}


def test_cache_entry_expires_after_ttl(monkeypatch):
    current_time = [1000.0]
    monkeypatch.setattr("app.cache.time.monotonic", lambda: current_time[0])

    cache = TTLCache(ttl_seconds=10)
    cache.set("AAPL", {"pe_ratio": 20})

    current_time[0] += 11

    assert cache.get("AAPL") is None


def test_cache_clear_removes_all_entries():
    cache = TTLCache(ttl_seconds=60)
    cache.set("AAPL", {"pe_ratio": 20})

    cache.clear()

    assert cache.get("AAPL") is None
