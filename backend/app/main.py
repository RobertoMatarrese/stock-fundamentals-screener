import requests
from fastapi import FastAPI

from app.cache import TTLCache
from app.finnhub_client import FinnhubError, get_basic_financials
from app.metrics import shape_metrics
from app.tickers import TICKERS

CACHE_TTL_SECONDS = 300

app = FastAPI()
_cache = TTLCache(ttl_seconds=CACHE_TTL_SECONDS)


@app.get("/api/screener")
def get_screener():
    results = []
    for ticker in TICKERS:
        symbol = ticker["symbol"]
        cached = _cache.get(symbol)
        if cached is not None:
            results.append(cached)
            continue

        try:
            raw = get_basic_financials(symbol)
        except (FinnhubError, requests.RequestException):
            raw = {}

        shaped = shape_metrics(symbol, ticker["name"], ticker["sector"], raw)
        _cache.set(symbol, shaped)
        results.append(shaped)

    return results
