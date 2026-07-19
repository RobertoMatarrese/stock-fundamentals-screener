import os

import requests
from dotenv import load_dotenv

load_dotenv()

FINNHUB_BASE_URL = "https://finnhub.io/api/v1"


class FinnhubError(Exception):
    """Raised when the Finnhub API can't be reached or is misconfigured."""


def get_basic_financials(symbol: str) -> dict:
    """Fetch the 'basic financials' payload for a single ticker symbol."""
    api_key = os.environ.get("FINNHUB_API_KEY")
    if not api_key:
        raise FinnhubError("FINNHUB_API_KEY environment variable is not set")

    response = requests.get(
        f"{FINNHUB_BASE_URL}/stock/metric",
        params={"symbol": symbol, "metric": "all", "token": api_key},
        timeout=10,
    )
    response.raise_for_status()
    return response.json()
