from unittest.mock import Mock, patch

import pytest
import requests

from app.finnhub_client import FinnhubError, get_basic_financials


def test_get_basic_financials_success(monkeypatch):
    monkeypatch.setenv("FINNHUB_API_KEY", "test-key")
    fake_response = Mock()
    fake_response.json.return_value = {"metric": {"peTTM": 30.5}}
    fake_response.raise_for_status.return_value = None

    with patch("app.finnhub_client.requests.get", return_value=fake_response) as mock_get:
        result = get_basic_financials("AAPL")

    assert result == {"metric": {"peTTM": 30.5}}
    mock_get.assert_called_once_with(
        "https://finnhub.io/api/v1/stock/metric",
        params={"symbol": "AAPL", "metric": "all", "token": "test-key"},
        timeout=10,
    )


def test_get_basic_financials_missing_api_key(monkeypatch):
    monkeypatch.delenv("FINNHUB_API_KEY", raising=False)

    with pytest.raises(FinnhubError):
        get_basic_financials("AAPL")


def test_get_basic_financials_http_error(monkeypatch):
    monkeypatch.setenv("FINNHUB_API_KEY", "test-key")
    fake_response = Mock()
    fake_response.raise_for_status.side_effect = requests.HTTPError("500 Server Error")

    with patch("app.finnhub_client.requests.get", return_value=fake_response):
        with pytest.raises(requests.HTTPError):
            get_basic_financials("AAPL")
