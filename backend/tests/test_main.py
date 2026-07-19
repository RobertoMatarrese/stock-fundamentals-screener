from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.finnhub_client import FinnhubError
from app.main import _cache, app
from app.tickers import TICKERS

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_cache():
    _cache.clear()


def _fake_financials(symbol):
    return {
        "metric": {
            "peTTM": 20.0,
            "roeTTM": 15.0,
            "totalDebt/totalEquityQuarterly": 0.6,
            "netProfitMarginTTM": 10.0,
            "assetTurnoverTTM": 1.0,
        }
    }


def test_get_screener_returns_all_tickers():
    with patch("app.main.get_basic_financials", side_effect=_fake_financials):
        response = client.get("/api/screener")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == len(TICKERS)
    assert {row["symbol"] for row in data} == {t["symbol"] for t in TICKERS}

    first = data[0]
    assert first["pe_ratio"] == 20.0
    assert first["equity_multiplier"] == pytest.approx(15.0 / (10.0 * 1.0))


def test_get_screener_survives_single_ticker_failure():
    failing_symbol = TICKERS[0]["symbol"]
    healthy_symbol = TICKERS[1]["symbol"]

    def side_effect(symbol):
        if symbol == failing_symbol:
            raise FinnhubError("boom")
        return _fake_financials(symbol)

    with patch("app.main.get_basic_financials", side_effect=side_effect):
        response = client.get("/api/screener")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == len(TICKERS)

    failed_row = next(row for row in data if row["symbol"] == failing_symbol)
    assert failed_row["pe_ratio"] is None

    healthy_row = next(row for row in data if row["symbol"] == healthy_symbol)
    assert healthy_row["pe_ratio"] == 20.0


def test_get_screener_uses_cache_on_second_call():
    with patch("app.main.get_basic_financials", side_effect=_fake_financials) as mock_fetch:
        client.get("/api/screener")
        client.get("/api/screener")

    assert mock_fetch.call_count == len(TICKERS)
