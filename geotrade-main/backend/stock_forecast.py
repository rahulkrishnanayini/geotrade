"""
Stock Price Forecasting Engine
Uses compound growth modeling + geopolitical risk adjustment.
Returns BUY/SELL/HOLD + PUT/CALL recommendation with price targets.
"""
import math
from datetime import datetime, timezone

# Historical average annual returns by asset type
BASE_RETURNS = {
    "equity_developed": 0.10,   # 10% avg
    "equity_emerging":  0.08,
    "commodity_energy": 0.06,
    "commodity_metal":  0.05,
    "bond":             0.04,
    "crypto":           0.25,
    "forex":            0.02,
    "etf_broad":        0.09,
}

# Volatility (annualized std dev)
VOLATILITY = {
    "equity_developed": 0.18,
    "equity_emerging":  0.25,
    "commodity_energy": 0.35,
    "commodity_metal":  0.20,
    "bond":             0.08,
    "crypto":           0.80,
    "forex":            0.10,
    "etf_broad":        0.16,
}

# Map ticker/symbol patterns to asset type
def _classify(symbol: str) -> str:
    s = symbol.upper()
    if any(x in s for x in ["BTC","ETH","BNB","SOL","XRP","ADA","DOGE"]):
        return "crypto"
    if any(x in s for x in ["=F","CL","GC","SI","NG","BZ","ZW","ZC"]):
        return "commodity_energy" if "CL" in s or "BZ" in s or "NG" in s else "commodity_metal"
    if any(x in s for x in ["TNX","TYX","IRX","BOND","TLT"]):
        return "bond"
    if "=X" in s:
        return "forex"
    if any(x in s for x in ["SPY","QQQ","EEM","GLD","USO","TLT","VNQ","IAU","XLE","XLF","ARKK","VWO"]):
        return "etf_broad"
    if any(x in s for x in ["^N225","^HSI","000001","^KS11","^BVSP","MOEX","^KSE","^TASI","^NSEI","^BSESN","^AXJO"]):
        return "equity_emerging"
    return "equity_developed"

def _geo_adjustment(country: str) -> float:
    """Return annual return adjustment based on country geopolitical risk"""
    risk_adjustments = {
        "CRITICAL": -0.06,   # war zones: -6% annual drag
        "HIGH":     -0.03,
        "MEDIUM":   -0.01,
        "LOW":       0.01,
    }
    from dynamic_tension import get_country_tension
    tension = get_country_tension(country)
    return risk_adjustments.get(tension.get("level","LOW"), 0)

def forecast_price(symbol: str, current_price: float, years: int,
                   country: str = "", currency_rate: float = 1.0) -> dict:
    """
    Forecast price for a given number of years.
    Returns: base_case, bull_case, bear_case, recommendation, put_call
    """
    asset_type = _classify(symbol)
    base_return = BASE_RETURNS.get(asset_type, 0.09)
    vol         = VOLATILITY.get(asset_type, 0.20)
    geo_adj     = _geo_adjustment(country) if country else 0

    adj_return  = base_return + geo_adj

    # Compound growth for different scenarios
    def compound(r, n): return round(current_price * ((1 + r) ** n) * currency_rate, 2)

    base_price = compound(adj_return, years)
    bull_price = compound(adj_return + vol * 0.5, years)
    bear_price = compound(adj_return - vol * 0.5, years)

    # Upside vs downside
    upside   = ((base_price - current_price * currency_rate) / (current_price * currency_rate)) * 100
    downside = ((bear_price - current_price * currency_rate) / (current_price * currency_rate)) * 100

    # BUY/HOLD/SELL
    if upside > 15:
        rec = "BUY"
    elif upside > 0:
        rec = "HOLD"
    else:
        rec = "SELL"

    # PUT/CALL
    # CALL = bullish (expect price to rise) → buy call option
    # PUT  = bearish (expect price to fall) → buy put option
    option = "CALL" if rec in ("BUY","HOLD") else "PUT"

    # Confidence score
    conf = min(90, max(30, 50 + abs(upside) * 0.5 - vol * 20))

    reasons = []
    if geo_adj < 0:
        reasons.append(f"Geopolitical risk (-{abs(geo_adj)*100:.0f}% annual drag)")
    elif geo_adj > 0:
        reasons.append(f"Political stability (+{geo_adj*100:.0f}% bonus)")
    reasons.append(f"Historical {asset_type.replace('_',' ')} avg: {base_return*100:.0f}%/yr")
    reasons.append(f"Annualized volatility: {vol*100:.0f}%")
    if upside > 50:
        reasons.append("Strong long-term growth trajectory expected")
    elif upside < 0:
        reasons.append("Mean reversion and risk factors weigh on outlook")

    return {
        "symbol":        symbol,
        "current_usd":   current_price,
        "current_local": round(current_price * currency_rate, 2),
        "years":         years,
        "target_year":   datetime.now().year + years,
        "base_case":     base_price,
        "bull_case":     bull_price,
        "bear_case":     bear_price,
        "upside_pct":    round(upside, 1),
        "downside_pct":  round(downside, 1),
        "adj_return_pct":round(adj_return * 100, 1),
        "asset_type":    asset_type,
        "recommendation":rec,
        "option":        option,
        "confidence":    round(conf),
        "reasons":       reasons,
    }

def batch_forecast(symbols: list, country: str, currency_rate: float, years: int) -> list:
    """Forecast multiple symbols"""
    import urllib.request, urllib.parse, json, time
    results = []
    for sym_info in symbols:
        symbol = sym_info.get("symbol") or sym_info.get("s","")
        price  = sym_info.get("price") or sym_info.get("local_price") or 0
        name   = sym_info.get("display_name") or sym_info.get("name") or symbol
        if not price or price == 0:
            continue
        # Convert back to USD for forecast (remove local currency conversion)
        usd_price = price / currency_rate if currency_rate and currency_rate != 1.0 else price
        fc = forecast_price(symbol, usd_price, years, country, currency_rate)
        fc["name"] = name
        results.append(fc)
    return results
