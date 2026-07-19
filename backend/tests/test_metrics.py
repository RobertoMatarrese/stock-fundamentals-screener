import pytest

from app.metrics import shape_metrics


def test_shape_metrics_full_data():
    raw = {
        "metric": {
            "peTTM": 39.9899,
            "roeTTM": 146.69,
            "totalDebt/totalEquityQuarterly": 0.7955,
            "netProfitMarginTTM": 27.15,
            "assetTurnoverTTM": 1.253,
        }
    }

    result = shape_metrics("AAPL", "Apple Inc.", "Technology", raw)

    assert result["symbol"] == "AAPL"
    assert result["name"] == "Apple Inc."
    assert result["sector"] == "Technology"
    assert result["pe_ratio"] == 39.9899
    assert result["roe"] == 146.69
    assert result["debt_to_equity"] == 0.7955
    assert result["net_margin"] == 27.15
    assert result["asset_turnover"] == 1.253
    assert result["equity_multiplier"] == pytest.approx(146.69 / (27.15 * 1.253))


def test_shape_metrics_missing_pe_ratio():
    raw = {
        "metric": {
            "roeTTM": 10.0,
            "totalDebt/totalEquityQuarterly": 0.5,
            "netProfitMarginTTM": 5.0,
            "assetTurnoverTTM": 1.0,
        }
    }

    result = shape_metrics("XYZ", "Example Corp.", "Industrials", raw)

    assert result["pe_ratio"] is None
    assert result["roe"] == 10.0


def test_shape_metrics_missing_dupont_inputs_skips_equity_multiplier():
    raw = {
        "metric": {
            "peTTM": 15.0,
            "roeTTM": 10.0,
            "totalDebt/totalEquityQuarterly": 0.5,
            # netProfitMarginTTM and assetTurnoverTTM absent
        }
    }

    result = shape_metrics("XYZ", "Example Corp.", "Industrials", raw)

    assert result["net_margin"] is None
    assert result["asset_turnover"] is None
    assert result["equity_multiplier"] is None


def test_shape_metrics_zero_denominator_skips_equity_multiplier():
    raw = {
        "metric": {
            "peTTM": 15.0,
            "roeTTM": 10.0,
            "totalDebt/totalEquityQuarterly": 0.5,
            "netProfitMarginTTM": 0,
            "assetTurnoverTTM": 1.0,
        }
    }

    result = shape_metrics("XYZ", "Example Corp.", "Industrials", raw)

    assert result["equity_multiplier"] is None


def test_shape_metrics_empty_metric_dict():
    raw = {"metric": {}}

    result = shape_metrics("XYZ", "Example Corp.", "Industrials", raw)

    assert result["symbol"] == "XYZ"
    assert result["pe_ratio"] is None
    assert result["roe"] is None
    assert result["debt_to_equity"] is None
    assert result["net_margin"] is None
    assert result["asset_turnover"] is None
    assert result["equity_multiplier"] is None


def test_shape_metrics_missing_metric_key_entirely():
    raw = {}

    result = shape_metrics("XYZ", "Example Corp.", "Industrials", raw)

    assert result["symbol"] == "XYZ"
    assert result["pe_ratio"] is None
