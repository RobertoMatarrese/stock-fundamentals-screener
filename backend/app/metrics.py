def shape_metrics(symbol: str, name: str, sector: str, raw: dict) -> dict:
    """Map a raw Finnhub basic-financials payload onto the API contract shape.

    Missing or non-numeric fields are returned as None rather than raising,
    so one incomplete ticker never breaks the whole screener response.
    """
    metric = raw.get("metric") or {}

    pe_ratio = metric.get("peTTM")
    roe = metric.get("roeTTM")
    debt_to_equity = metric.get("totalDebt/totalEquityQuarterly")
    net_margin = metric.get("netProfitMarginTTM")
    asset_turnover = metric.get("assetTurnoverTTM")

    equity_multiplier = None
    if roe is not None and net_margin is not None and asset_turnover is not None:
        denominator = net_margin * asset_turnover
        if denominator != 0:
            equity_multiplier = roe / denominator

    return {
        "symbol": symbol,
        "name": name,
        "sector": sector,
        "pe_ratio": pe_ratio,
        "roe": roe,
        "debt_to_equity": debt_to_equity,
        "net_margin": net_margin,
        "asset_turnover": asset_turnover,
        "equity_multiplier": equity_multiplier,
    }
