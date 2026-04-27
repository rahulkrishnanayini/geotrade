"""
Country-specific AI signal engine
All prices in local currency. Forex shows local currency equivalents.
"""
import urllib.request, urllib.parse, json, time
from datetime import datetime, timezone

_cache = {}
CACHE_TTL = 90
HEADERS = {"User-Agent":"Mozilla/5.0","Accept":"application/json"}

def _yf(symbol):
    now = time.time()
    if symbol in _cache and now - _cache[symbol]["ts"] < CACHE_TTL:
        return _cache[symbol]["d"]
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(symbol)}?interval=1d&range=5d"
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=7) as r:
            data = json.loads(r.read())
        res = (data.get("chart",{}).get("result") or [None])[0]
        if not res: return None
        meta = res.get("meta",{})
        cur  = meta.get("regularMarketPrice",0) or 0
        prev = meta.get("chartPreviousClose",cur) or cur
        chg  = round(cur-prev,4)
        chgp = round((chg/prev)*100,2) if prev else 0
        q = {"symbol":symbol,"price":round(cur,4),"change":chg,"change_pct":chgp,
             "currency":meta.get("currency","USD"),
             "name":meta.get("longName") or meta.get("shortName") or symbol,
             "high":round(meta.get("regularMarketDayHigh",cur),4),
             "low":round(meta.get("regularMarketDayLow",cur),4)}
        _cache[symbol] = {"d":q,"ts":now}
        return q
    except Exception as e:
        print(f"[YF:{symbol}] {e}")
        return None

# FX symbols — how many local currency units = 1 USD
FX_TO_USD = {
    "USD":None, "EUR":"EURUSD=X","GBP":"GBPUSD=X","AUD":"AUDUSD=X",
    "CAD":"CADUSD=X","NZD":"NZDUSD=X",
    # These return units-per-USD directly:
    "JPY":"JPY=X","INR":"INR=X","CNY":"CNY=X","RUB":"RUB=X",
    "ILS":"ILS=X","SAR":"SAR=X","PKR":"PKR=X","KRW":"KRW=X",
    "TRY":"TRY=X","UAH":"UAH=X","IRR":"IRR=X","MMK":"MMK=X",
    "SDG":"SDG=X","YER":"YER=X","AFN":"AFN=X","SYP":"SYP=X",
    "IQD":"IQD=X","ETB":"ETB=X","VES":"VES=X","NGN":"NGN=X",
    "ZAR":"ZAR=X","THB":"THB=X","MYR":"MYR=X","IDR":"IDR=X",
    "BRL":"BRL=X","CHF":"CHF=X","HKD":"HKD=X","SGD":"SGD=X",
    "MXN":"MXN=X","SEK":"SEK=X","NOK":"NOK=X","DKK":"DKK=X",
    "KWD":"KWD=X","QAR":"QAR=X","AED":"AED=X","EGP":"EGP=X",
}
# Currencies quoted as "1 unit = X USD" (need to invert)
INVERT_FX = {"EUR","GBP","AUD","CAD","NZD"}

COUNTRY_CURRENCY = {
    "United States of America":"USD","Russia":"RUB","China":"CNY","Iran":"IRR",
    "Israel":"ILS","Ukraine":"UAH","Germany":"EUR","France":"EUR",
    "United Kingdom":"GBP","Japan":"JPY","India":"INR","Saudi Arabia":"SAR",
    "Pakistan":"PKR","North Korea":"KPW","South Korea":"KRW","Myanmar":"MMK",
    "Sudan":"SDG","Australia":"AUD","Brazil":"BRL","Canada":"CAD","Turkey":"TRY",
    "Venezuela":"VES","Yemen":"YER","Afghanistan":"AFN","Syria":"SYP","Ethiopia":"ETB",
    "Iraq":"IQD","Palestine":"ILS","Nigeria":"NGN","South Africa":"ZAR",
    "Libya":"LYD","Somalia":"SOS","Haiti":"HTG","Congo":"CDF","Mali":"XOF","Niger":"XOF",
}

def _get_fx_rate(currency: str) -> float:
    """Return: how many units of `currency` equal 1 USD"""
    if currency == "USD": return 1.0
    sym = FX_TO_USD.get(currency)
    if not sym: return 1.0
    q = _yf(sym)
    if not q or not q.get("price"): return 1.0
    p = q["price"]
    # EUR/GBP etc: 1 EUR = X USD → so 1 USD = 1/X EUR
    if currency in INVERT_FX:
        return round(1/p, 6) if p else 1.0
    # JPY=X etc: already units per USD
    return round(p, 4)

def _to_local(usd_price, fx, dp=2):
    if usd_price is None: return None
    return round(float(usd_price) * fx, dp)

# ── All major forex pairs ─────────────────────────────────────────────────────
ALL_FOREX = [
    ("EUR/USD","EURUSD=X"),("GBP/USD","GBPUSD=X"),("USD/JPY","JPY=X"),
    ("USD/INR","INR=X"),  ("USD/CNY","CNY=X"),  ("USD/RUB","RUB=X"),
    ("USD/BRL","BRL=X"),  ("AUD/USD","AUDUSD=X"),("USD/CAD","CAD=X"),
    ("USD/CHF","CHF=X"),  ("USD/MXN","MXN=X"),  ("USD/KRW","KRW=X"),
    ("USD/SAR","SAR=X"),  ("USD/TRY","TRY=X"),  ("USD/ZAR","ZAR=X"),
    ("USD/SEK","SEK=X"),  ("USD/NOK","NOK=X"),  ("USD/HKD","HKD=X"),
    ("USD/SGD","SGD=X"),  ("NZD/USD","NZDUSD=X"),("USD/PKR","PKR=X"),
    ("USD/ILS","ILS=X"),  ("USD/UAH","UAH=X"),  ("USD/IDR","IDR=X"),
    ("USD/MYR","MYR=X"),  ("USD/THB","THB=X"),  ("USD/NGN","NGN=X"),
    ("USD/EGP","EGP=X"),  ("USD/AED","AED=X"),  ("USD/QAR","QAR=X"),
    ("USD/KWD","KWD=X"),  ("USD/IRR","IRR=X"),  ("USD/DKK","DKK=X"),
]
CRYPTO      = [("BTC","BTC-USD"),("ETH","ETH-USD"),("BNB","BNB-USD"),("SOL","SOL-USD"),("XRP","XRP-USD"),("ADA","ADA-USD"),("DOGE","DOGE-USD")]
GLOBAL_IDX  = [("S&P 500","^GSPC"),("Dow Jones","^DJI"),("NASDAQ","^IXIC"),("FTSE 100","^FTSE"),("DAX","^GDAXI"),("CAC 40","^FCHI"),("Nikkei 225","^N225"),("Hang Seng","^HSI"),("Shanghai","000001.SS"),("NIFTY 50","^NSEI"),("KOSPI","^KS11"),("ASX 200","^AXJO"),("MOEX","MOEX.ME"),("Bovespa","^BVSP"),("TSX","^GSPTSE"),("Tadawul","^TASI.SR"),("KSE-100","^KSE100"),("Tel Aviv","^TA125.TA"),("BIST 100","^XU100.IS")]
ETFS        = [("SPY","SPY"),("QQQ","QQQ"),("EEM","EEM"),("GLD","GLD"),("USO","USO"),("TLT","TLT"),("XLE","XLE"),("XLF","XLF"),("ARKK","ARKK"),("VWO","VWO")]
BONDS       = [("US 10Y","^TNX"),("US 2Y","^IRX"),("US 30Y","^TYX")]
COMMODITIES = [("Gold","GC=F"),("Silver","SI=F"),("WTI Crude","CL=F"),("Brent Oil","BZ=F"),("Natural Gas","NG=F"),("Copper","HG=F"),("Platinum","PL=F"),("Wheat","ZW=F"),("Corn","ZC=F"),("Soybeans","ZS=F")]

SANCTIONS_DB = {
    "Russia":{"active":True,"level":"SEVERE","sanctioning_bodies":["USA (OFAC)","EU","UK","G7","Australia","Japan","Canada"],"details":["SWIFT banking access blocked","Central Bank reserves frozen (~$300B)","Export controls on semiconductors/aerospace/defense","EU oil price cap $60/bbl","500+ oligarchs on SDN list"],"market_impact":"Severe — commodity exports via shadow fleet. Ruble stabilized via capital controls."},
    "Iran":{"active":True,"level":"SEVERE","sanctioning_bodies":["USA (OFAC)","EU","UN Security Council"],"details":["Comprehensive US sanctions since 1979","Oil exports blocked — selling via China","SWIFT access blocked","IRGC designated Foreign Terrorist Organization","Frozen assets ~$100B+"],"market_impact":"Severe — oil market risk premium for Strait of Hormuz closure."},
    "North Korea":{"active":True,"level":"SEVERE","sanctioning_bodies":["UN Security Council","USA","EU","South Korea","Japan"],"details":["UN arms embargo","Coal/iron/seafood exports banned","Oil imports capped","Financial transactions prohibited"],"market_impact":"Minimal direct impact. Regional security risk premium."},
    "Venezuela":{"active":True,"level":"HIGH","sanctioning_bodies":["USA (OFAC)","EU","Canada"],"details":["US sanctions on PDVSA","Maduro officials on SDN list","Gold sector sanctions","Partial Chevron relief granted"],"market_impact":"Moderate — sanctions relief allowing partial production recovery."},
    "Myanmar":{"active":True,"level":"MODERATE","sanctioning_bodies":["USA","EU","UK","Canada","Australia"],"details":["Military junta leaders on SDN list","Defense equipment embargo","MOGE oil company sanctioned"],"market_impact":"Limited direct global market impact."},
    "Syria":{"active":True,"level":"SEVERE","sanctioning_bodies":["USA (OFAC)","EU"],"details":["Caesar Syria Civilian Protection Act","Oil sector fully sanctioned","Central Bank of Syria blocked"],"market_impact":"Limited due to minimal trade integration."},
    "Russia_extra":{"active":True,"level":"SEVERE","sanctioning_bodies":["G7"],"details":["Price cap on Russian oil at $60/barrel"],"market_impact":"Oil market structural shift ongoing."},
}
NO_SANCTIONS = {"active":False,"level":"NONE","sanctioning_bodies":[],"details":["No significant international sanctions currently active."],"market_impact":"No sanctions-related market impact."}

def _sanctions(country):
    for k,v in SANCTIONS_DB.items():
        if k.lower().replace("_extra","") in country.lower() or country.lower() in k.lower().replace("_extra",""):
            return {"country":k.replace("_extra",""),**v}
    return {"country":country,**NO_SANCTIONS}

def _get_currency(country_name):
    for k,v in COUNTRY_CURRENCY.items():
        if k.lower() == country_name.lower() or k.lower() in country_name.lower() or country_name.lower() in k.lower():
            return v
    return "USD"

def get_country_full_analysis(country_name: str) -> dict:
    now = time.time()
    ckey = f"full_{country_name}"
    if ckey in _cache and now - _cache[ckey]["ts"] < CACHE_TTL:
        return _cache[ckey]["d"]

    currency = _get_currency(country_name)
    fx       = _get_fx_rate(currency)

    print(f"[Analysis] {country_name} → {currency} (1 USD = {fx} {currency})")

    # ── Forex: show rate AND what it equals in local currency ──────────────────
    forex = []
    for label, sym in ALL_FOREX:
        q = _yf(sym)
        if q:
            rate_usd = q["price"]  # the raw rate (e.g. USD/JPY = 150)
            # Restate in local currency:
            # e.g. for India (INR): EUR/USD=1.08 → 1 EUR = 1.08 USD = 1.08 * 84 INR = 90.7 INR
            # For Japan (JPY): EUR/USD=1.08 → 1 EUR = 1.08 * 150 JPY
            # "EURUSD=X" means 1 EUR = rate USD
            # "JPY=X" means 1 USD = rate JPY
            pair_parts = label.split("/")
            base, quote = pair_parts[0], pair_parts[1] if len(pair_parts) > 1 else "USD"

            if quote == "USD":
                # e.g. EUR/USD: 1 EUR = rate USD = rate * fx LOCAL
                local_rate = round(rate_usd * fx, 4)
                local_label = f"1 {base} = {currency} {local_rate}"
            elif base == "USD":
                # e.g. USD/JPY: 1 USD = rate JPY
                # In local currency: 1 USD = fx LOCAL, so 1 JPY = fx/rate LOCAL
                if fx != 1.0 and rate_usd:
                    local_rate = round(fx / rate_usd, 6)
                    local_label = f"1 {quote} = {currency} {local_rate}"
                else:
                    local_rate = rate_usd
                    local_label = f"1 USD = {quote} {rate_usd}"
            else:
                local_rate = rate_usd
                local_label = ""

            forex.append({
                "pair": label, "symbol": sym,
                "price": rate_usd,
                "change": q["change"], "change_pct": q["change_pct"],
                "local_equiv": local_rate,
                "local_label": local_label,
                "display_currency": currency,
            })
        else:
            forex.append({"pair":label,"symbol":sym,"price":None,"error":"N/A"})

    # ── Crypto in local currency ───────────────────────────────────────────────
    crypto = []
    for label, sym in CRYPTO:
        q = _yf(sym)
        if q:
            lp = _to_local(q["price"], fx)
            crypto.append({**q, "display_name":label,
                "local_price":lp, "display_currency":currency})

    # ── Global indices in local currency ──────────────────────────────────────
    indices = []
    for label, sym in GLOBAL_IDX:
        q = _yf(sym)
        if q:
            # Convert only if index is USD-priced
            lp = _to_local(q["price"], fx) if (q.get("currency","USD")=="USD" and currency!="USD") else q["price"]
            indices.append({**q, "display_name":label,
                "local_price":lp, "display_currency":currency})

    # ── ETFs in local currency ────────────────────────────────────────────────
    etfs = []
    for label, sym in ETFS:
        q = _yf(sym)
        if q:
            lp = _to_local(q["price"], fx) if currency!="USD" else q["price"]
            etfs.append({**q, "display_name":label,
                "local_price":lp, "display_currency":currency})

    # ── Bonds (yield %, keep as-is but note currency) ─────────────────────────
    bonds = []
    for label, sym in BONDS:
        q = _yf(sym)
        if q:
            bonds.append({**q, "display_name":label,
                "local_price":q["price"], "display_currency":"Yield %"})

    # ── Commodities in local currency ─────────────────────────────────────────
    commodities = []
    for label, sym in COMMODITIES:
        q = _yf(sym)
        if q:
            lp = _to_local(q["price"], fx) if currency!="USD" else q["price"]
            commodities.append({**q, "display_name":label,
                "local_price":lp, "display_currency":currency})

    # ── Sanctions ─────────────────────────────────────────────────────────────
    sanctions = _sanctions(country_name)

    # ── AI Signals converted to local currency ────────────────────────────────
    try:
        from nlp_engine import NLPEngine
        from data_feeds import DataFeedAggregator
        from signal_generator import SignalGenerator
        nlp=NLPEngine(); feeds=DataFeedAggregator(); sg=SignalGenerator()
        events = feeds.get_latest_events()
        scored = [nlp.score_event(e) for e in events]
        country_events = [e for e in scored
            if country_name.lower() in (e.get("title","") + e.get("body","")).lower()]
        signals = sg.generate_signals(scored)
        for s in signals:
            if s.get("trade") and currency != "USD":
                t = s["trade"]
                for field in ["current_price","entry","stop_loss","target"]:
                    if t.get(field):
                        t[f"{field}_local"] = _to_local(t[field], fx)
                s["display_currency"] = currency
                s["fx_rate"] = fx
            s["country_relevant"] = bool(country_events)
    except Exception as e:
        print(f"[Signals error] {e}")
        signals = []
        country_events = []

    result = {
        "country":country_name, "currency":currency, "fx_rate":fx,
        "signals":signals, "forex":forex, "crypto":crypto,
        "indices":indices, "etfs":etfs, "bonds":bonds,
        "commodities":commodities, "sanctions":sanctions,
        "event_count":len(country_events),
        "generated_at":datetime.now(timezone.utc).isoformat(),
    }
    _cache[ckey] = {"d":result, "ts":now}
    return result
