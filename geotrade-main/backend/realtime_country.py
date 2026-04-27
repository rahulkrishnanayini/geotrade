"""
Real-time Country Data Engine
- News: BBC + Reuters + Al Jazeera + CNN + NYT + Guardian + DW (newest first, 14 days max)
- Stocks: Yahoo Finance (live price in local currency)
- Commodities: Oil, Brent, Gold, Silver, Gas, Gasoline in local currency
"""
import urllib.request, urllib.parse, xml.etree.ElementTree as ET
import json, time, hashlib, re
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime

NEWS_TTL  = 240
STOCK_TTL = 60
_news_cache  = {}
_stock_cache = {}

COUNTRY_CONFIG = {
  "United States of America": {"flag":"🇺🇸","currency":"USD","indices":[{"s":"^GSPC","n":"S&P 500"},{"s":"^DJI","n":"Dow Jones"},{"s":"^IXIC","n":"NASDAQ"}],
    "queries":["United States economy politics war","site:cnn.com USA","site:nytimes.com United States"]},
  "Russia":    {"flag":"🇷🇺","currency":"RUB","indices":[{"s":"MOEX.ME","n":"MOEX"}],
    "queries":["Russia war Ukraine sanctions economy","site:reuters.com Russia","Russia military conflict"]},
  "China":     {"flag":"🇨🇳","currency":"CNY","indices":[{"s":"000001.SS","n":"Shanghai"},{"s":"^HSI","n":"Hang Seng"}],
    "queries":["China Taiwan economy trade war","site:reuters.com China","China military"]},
  "Iran":      {"flag":"🇮🇷","currency":"IRR","indices":[{"s":"IRR=X","n":"USD/IRR"}],
    "queries":["Iran nuclear sanctions Hormuz","Iran military Israel","site:aljazeera.com Iran"]},
  "Israel":    {"flag":"🇮🇱","currency":"ILS","indices":[{"s":"^TA125.TA","n":"Tel Aviv 125"}],
    "queries":["Israel Gaza war ceasefire","Israel Iran conflict","site:reuters.com Israel"]},
  "Ukraine":   {"flag":"🇺🇦","currency":"UAH","indices":[{"s":"UAH=X","n":"USD/UAH"}],
    "queries":["Ukraine war Russia front","Ukraine military aid","site:bbc.com Ukraine"]},
  "Germany":   {"flag":"🇩🇪","currency":"EUR","indices":[{"s":"^GDAXI","n":"DAX"}],
    "queries":["Germany economy recession energy","site:dw.com Germany","Germany DAX"]},
  "France":    {"flag":"🇫🇷","currency":"EUR","indices":[{"s":"^FCHI","n":"CAC 40"}],
    "queries":["France economy politics Macron","site:reuters.com France","France protests"]},
  "United Kingdom":{"flag":"🇬🇧","currency":"GBP","indices":[{"s":"^FTSE","n":"FTSE 100"}],
    "queries":["UK Britain economy FTSE","site:bbc.com UK","UK politics news"]},
  "Japan":     {"flag":"🇯🇵","currency":"JPY","indices":[{"s":"^N225","n":"Nikkei 225"}],
    "queries":["Japan economy Nikkei yen BOJ","Japan North Korea missile","site:reuters.com Japan"]},
  "India":     {"flag":"🇮🇳","currency":"INR","indices":[{"s":"^NSEI","n":"NIFTY 50"},{"s":"^BSESN","n":"BSE Sensex"}],
    "queries":["India economy Modi Nifty","India Pakistan conflict","site:reuters.com India"]},
  "Saudi Arabia":{"flag":"🇸🇦","currency":"SAR","indices":[{"s":"^TASI.SR","n":"Tadawul"}],
    "queries":["Saudi Arabia OPEC oil Vision2030","site:reuters.com Saudi","Saudi Arabia economy"]},
  "Pakistan":  {"flag":"🇵🇰","currency":"PKR","indices":[{"s":"^KSE100","n":"KSE-100"}],
    "queries":["Pakistan economy IMF Kashmir","Pakistan military politics","site:aljazeera.com Pakistan"]},
  "North Korea":{"flag":"🇰🇵","currency":"KPW","indices":[{"s":"^KS11","n":"KOSPI (proxy)"}],
    "queries":["North Korea Kim missile nuclear","DPRK weapons test","site:bbc.com North Korea"]},
  "South Korea":{"flag":"🇰🇷","currency":"KRW","indices":[{"s":"^KS11","n":"KOSPI"}],
    "queries":["South Korea KOSPI economy","South Korea politics","site:reuters.com South Korea"]},
  "Myanmar":   {"flag":"🇲🇲","currency":"MMK","indices":[{"s":"THB=X","n":"USD/THB proxy"}],
    "queries":["Myanmar military junta resistance","Myanmar civil war","site:aljazeera.com Myanmar"]},
  "Sudan":     {"flag":"🇸🇩","currency":"SDG","indices":[{"s":"GC=F","n":"Gold (proxy)"}],
    "queries":["Sudan civil war RSF famine","Sudan conflict Khartoum","site:bbc.com Sudan"]},
  "Australia": {"flag":"🇦🇺","currency":"AUD","indices":[{"s":"^AXJO","n":"ASX 200"}],
    "queries":["Australia economy ASX AUKUS","site:reuters.com Australia"]},
  "Brazil":    {"flag":"🇧🇷","currency":"BRL","indices":[{"s":"^BVSP","n":"Ibovespa"}],
    "queries":["Brazil economy Ibovespa Lula","Brazil politics","site:reuters.com Brazil"]},
  "Canada":    {"flag":"🇨🇦","currency":"CAD","indices":[{"s":"^GSPTSE","n":"TSX"}],
    "queries":["Canada economy TSX oil pipeline","site:reuters.com Canada"]},
  "Turkey":    {"flag":"🇹🇷","currency":"TRY","indices":[{"s":"^XU100.IS","n":"BIST 100"}],
    "queries":["Turkey economy inflation lira","Turkey politics Erdogan","site:reuters.com Turkey"]},
  "Venezuela": {"flag":"🇻🇪","currency":"VES","indices":[{"s":"CL=F","n":"WTI (proxy)"}],
    "queries":["Venezuela Maduro sanctions oil","Venezuela crisis","site:reuters.com Venezuela"]},
  "Yemen":     {"flag":"🇾🇪","currency":"YER","indices":[{"s":"CL=F","n":"WTI (proxy)"}],
    "queries":["Yemen Houthi Red Sea shipping attack","Yemen civil war","site:aljazeera.com Yemen"]},
  "Afghanistan":{"flag":"🇦🇫","currency":"AFN","indices":[{"s":"GC=F","n":"Gold (proxy)"}],
    "queries":["Afghanistan Taliban economy crisis","site:bbc.com Afghanistan"]},
  "Syria":     {"flag":"🇸🇾","currency":"SYP","indices":[{"s":"CL=F","n":"WTI (proxy)"}],
    "queries":["Syria conflict Assad war","site:aljazeera.com Syria","Syria news"]},
  "Ethiopia":  {"flag":"🇪🇹","currency":"ETB","indices":[{"s":"GC=F","n":"Gold (proxy)"}],
    "queries":["Ethiopia conflict Tigray Amhara","site:bbc.com Ethiopia"]},
  "Iraq":      {"flag":"🇮🇶","currency":"IQD","indices":[{"s":"CL=F","n":"WTI Oil"}],
    "queries":["Iraq oil conflict ISIS politics","site:reuters.com Iraq"]},
  "Palestine": {"flag":"🇵🇸","currency":"ILS","indices":[{"s":"^TA125.TA","n":"Tel Aviv (proxy)"}],
    "queries":["Palestine Gaza ceasefire aid war","site:aljazeera.com Palestine"]},
  "Nigeria":   {"flag":"🇳🇬","currency":"NGN","indices":[{"s":"^NGSEINDX","n":"NGX All Share"}],
    "queries":["Nigeria economy security Boko Haram","site:bbc.com Nigeria"]},
  "South Africa":{"flag":"🇿🇦","currency":"ZAR","indices":[{"s":"^J203.JO","n":"JSE All Share"}],
    "queries":["South Africa economy politics ANC","site:reuters.com South Africa"]},
}
DEFAULT_CFG={"flag":"🌍","currency":"USD","indices":[{"s":"^GSPC","n":"S&P 500"}],"queries":[]}

FX_PAIRS={"EUR":"EURUSD=X","GBP":"GBPUSD=X","JPY":"JPY=X","INR":"INR=X","CNY":"CNY=X",
  "RUB":"RUB=X","ILS":"ILS=X","SAR":"SAR=X","PKR":"PKR=X","AUD":"AUDUSD=X",
  "BRL":"BRL=X","CAD":"CADUSD=X","KRW":"KRW=X","TRY":"TRY=X","UAH":"UAH=X",
  "IRR":"IRR=X","MMK":"MMK=X","SDG":"SDG=X","YER":"YER=X","AFN":"AFN=X",
  "SYP":"SYP=X","IQD":"IQD=X","ETB":"ETB=X","VES":"VES=X","NGN":"NGN=X",
  "ZAR":"ZAR=X","THB":"THB=X","MYR":"MYR=X","IDR":"IDR=X","PHP":"PHP=X",}

COMMODITIES=[
  {"s":"CL=F","n":"Crude Oil (WTI)","unit":"per barrel","icon":"🛢️"},
  {"s":"BZ=F","n":"Brent Oil","unit":"per barrel","icon":"🛢️"},
  {"s":"GC=F","n":"Gold","unit":"per oz","icon":"🥇"},
  {"s":"SI=F","n":"Silver","unit":"per oz","icon":"🥈"},
  {"s":"NG=F","n":"Natural Gas","unit":"per MMBtu","icon":"🔥"},
  {"s":"RB=F","n":"Gasoline (RBOB)","unit":"per gallon","icon":"⛽"},
  {"s":"HO=F","n":"Heating Oil/Diesel","unit":"per gallon","icon":"🔥"},
  {"s":"PL=F","n":"Platinum","unit":"per oz","icon":"💎"},
]

def _cfg(name):
  n=(name or "").strip()
  if n in COUNTRY_CONFIG: return n,COUNTRY_CONFIG[n]
  for k,v in COUNTRY_CONFIG.items():
    if k.lower() in n.lower() or n.lower() in k.lower(): return k,v
  return n,{**DEFAULT_CFG,"queries":[n+" news"]}

def _get(url,timeout=7):
  req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (Windows NT 10.0) Chrome/120","Accept":"*/*"})
  with urllib.request.urlopen(req,timeout=timeout) as r: return r.read()

def _parse_dt(s):
  if not s: return None
  try: return parsedate_to_datetime(s)
  except:
    try: return datetime.fromisoformat(s.replace("Z","+00:00"))
    except: return None

def _age(dt):
  if not dt: return "recent"
  try:
    diff=datetime.now(timezone.utc)-dt.astimezone(timezone.utc)
    m=int(diff.total_seconds()/60)
    if m<60: return f"{m}m ago"
    if m<1440: return f"{m//60}h ago"
    return f"{m//1440}d ago"
  except: return "recent"

# Multi-source news feeds per country
BBC_FEEDS={
  "world":"https://feeds.bbci.co.uk/news/world/rss.xml",
  "europe":"https://feeds.bbci.co.uk/news/world/europe/rss.xml",
  "asia":"https://feeds.bbci.co.uk/news/world/asia/rss.xml",
  "south_asia":"https://feeds.bbci.co.uk/news/world/south_asia/rss.xml",
  "middle_east":"https://feeds.bbci.co.uk/news/world/middle_east/rss.xml",
  "africa":"https://feeds.bbci.co.uk/news/world/africa/rss.xml",
  "latin_america":"https://feeds.bbci.co.uk/news/world/latin_america/rss.xml",
  "us_and_canada":"https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml",
}
REGION_BBC={
  "United States of America":"us_and_canada","Canada":"us_and_canada",
  "Russia":"europe","Ukraine":"europe","Germany":"europe","France":"europe",
  "United Kingdom":"europe","Turkey":"europe",
  "Japan":"asia","China":"asia","South Korea":"asia","North Korea":"asia",
  "Australia":"asia","Myanmar":"asia",
  "India":"south_asia","Pakistan":"south_asia","Afghanistan":"south_asia",
  "Iran":"middle_east","Israel":"middle_east","Saudi Arabia":"middle_east",
  "Iraq":"middle_east","Yemen":"middle_east","Syria":"middle_east","Palestine":"middle_east",
  "Nigeria":"africa","Sudan":"africa","Ethiopia":"africa","South Africa":"africa",
  "Brazil":"latin_america","Venezuela":"latin_america",
}
OTHER_FEEDS=[
  {"url":"https://www.aljazeera.com/xml/rss/all.xml","source":"Al Jazeera"},
  {"url":"https://www.theguardian.com/world/rss","source":"Guardian"},
  {"url":"https://rss.dw.com/rdf/rss-en-world","source":"DW"},
  {"url":"https://feeds.bbci.co.uk/news/world/rss.xml","source":"BBC"},
  {"url":"https://feeds.bbci.co.uk/news/world/middle_east/rss.xml","source":"BBC ME"},
  {"url":"https://feeds.bbci.co.uk/news/world/europe/rss.xml","source":"BBC Europe"},
  {"url":"https://feeds.bbci.co.uk/news/world/asia/rss.xml","source":"BBC Asia"},
  {"url":"https://feeds.bbci.co.uk/news/world/africa/rss.xml","source":"BBC Africa"},
  {"url":"https://news.google.com/rss/search?q=reuters+world+news&hl=en-US&gl=US&ceid=US:en","source":"Reuters/GNews"},
]

def _parse_feed(raw,default_source):
  arts=[]
  cutoff=datetime.now(timezone.utc)-timedelta(days=14)
  try:
    root=ET.fromstring(raw)
    ch=root.find("channel") or root
    for item in (ch.findall("item") if ch is not None else []):
      title=(item.findtext("title") or "").strip()
      desc =re.sub(r'<[^>]+>','',(item.findtext("description") or "")).strip()
      link =(item.findtext("link") or "").strip()
      pub  =(item.findtext("pubDate") or "").strip()
      dt   =_parse_dt(pub)
      if dt and dt.astimezone(timezone.utc)<cutoff: continue
      src=default_source
      se=item.find("source")
      if se is not None and se.text: src=se.text.strip()
      if " - " in title:
        p=title.rsplit(" - ",1); title=p[0].strip()
        if len(p)>1: src=p[1].strip()
      if title:
        arts.append({"title":title,"desc":desc[:200],"source":src,"url":link,"time":_age(dt),"ts":dt.timestamp() if dt else 0})
  except: pass
  return arts

def fetch_country_news(country_name:str)->list:
  matched,cfg=_cfg(country_name)
  ckey=hashlib.md5(matched.encode()).hexdigest()
  now=time.time()
  if ckey in _news_cache and now-_news_cache[ckey]["ts"]<NEWS_TTL:
    return _news_cache[ckey]["data"]

  all_arts=[]
  # 1. BBC regional
  bbc_topic=REGION_BBC.get(matched,"world")
  try:
    raw=_get(BBC_FEEDS[bbc_topic])
    all_arts.extend(_parse_feed(raw,"BBC"))
  except: pass

  # 2. Other feeds
  for feed in OTHER_FEEDS:
    try:
      raw=_get(feed["url"])
      arts=_parse_feed(raw,feed["source"])
      all_arts.extend(arts)
    except: pass

  # 3. Google News queries for this country
  for q in (cfg.get("queries",[]) or [])[:2]:
    try:
      after=(datetime.now()-timedelta(days=14)).strftime("%Y-%m-%d")
      enc=urllib.parse.quote(q+f" after:{after}")
      url=f"https://news.google.com/rss/search?q={enc}&hl=en-US&gl=US&ceid=US:en"
      raw=_get(url)
      all_arts.extend(_parse_feed(raw,"Google News"))
    except: pass

  # Filter to country-relevant articles — self-contained, no external imports
  # Build alias list from COUNTRY_CONFIG or fall back to country name
  cfg_aliases = cfg.get("queries", [])
  # Extract key terms from the country name and config
  name_lower = matched.lower()
  name_words = [w for w in name_lower.split() if len(w) > 3]
  # Also use first word of each query as alias
  query_terms = []
  for q in cfg_aliases:
    first = q.split()[0].lower() if q else ""
    if len(first) > 3:
      query_terms.append(first)
  aliases = list(set([name_lower] + name_words + query_terms))[:8]
  relevant=[a for a in all_arts if any(al in (a["title"]+a["desc"]).lower() for al in aliases)]
  if len(relevant)<5: relevant=all_arts   # fallback to all if too few

  # Dedup + sort newest first
  seen,unique=set(),[]
  for a in relevant:
    k=a["title"][:60]
    if k not in seen: seen.add(k); unique.append(a)
  unique.sort(key=lambda x:x["ts"],reverse=True)
  result=unique[:15]
  _news_cache[ckey]={"data":result,"ts":now}
  return result

def _yf(sym):
  now=time.time()
  if sym in _stock_cache and now-_stock_cache[sym]["ts"]<STOCK_TTL:
    return _stock_cache[sym]["d"]
  url=f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(sym)}?interval=5m&range=1d"
  try:
    raw=json.loads(_get(url))
    res=(raw.get("chart",{}).get("result") or [None])[0]
    if not res: return None
    meta=res.get("meta",{})
    q=res.get("indicators",{}).get("quote",[{}])[0]
    closes=q.get("close",[])
    tss=res.get("timestamp",[])
    valid=[(t,c) for t,c in zip(tss,closes) if c is not None]
    cur=meta.get("regularMarketPrice",0) or 0
    prev=meta.get("chartPreviousClose",cur) or cur
    chg=round(cur-prev,4); chgp=round((chg/prev)*100,2) if prev else 0
    spark=[c for _,c in valid[-40:]]
    d={"symbol":sym,"name":meta.get("longName") or meta.get("shortName") or sym,
       "price":round(cur,4),"change":chg,"change_pct":chgp,"prev_close":round(prev,4),
       "currency":meta.get("currency","USD"),"market_state":meta.get("marketState","CLOSED"),
       "high":round(meta.get("regularMarketDayHigh",cur),4),
       "low":round(meta.get("regularMarketDayLow",cur),4),
       "volume":meta.get("regularMarketVolume",0),"sparkline":spark}
    _stock_cache[sym]={"d":d,"ts":now}; return d
  except Exception as e:
    print(f"[YF:{sym}] {e}"); return None

def _fx_rate(currency):
  if currency=="USD": return 1.0
  sym=FX_PAIRS.get(currency)
  if not sym: return 1.0
  q=_yf(sym)
  if not q or not q.get("price"): return 1.0
  p=q["price"]
  if sym.endswith("USD=X") or sym in("EURUSD=X","GBPUSD=X","AUDUSD=X","CADUSD=X"):
    return round(1/p,6) if p else 1.0
  return round(p,4)

def fetch_country_stocks(country_name:str)->list:
  matched,cfg=_cfg(country_name)
  currency=cfg.get("currency","USD")
  fx=_fx_rate(currency)
  results=[]
  for idx in cfg.get("indices",[]):
    q=_yf(idx["s"])
    if q:
      lp=round(q["price"]*fx,2) if q["currency"]=="USD" and currency!="USD" else q["price"]
      lch=round(q["change"]*fx,2) if q["currency"]=="USD" and currency!="USD" else q["change"]
      dc=currency if (q["currency"]=="USD" and currency!="USD") else q["currency"]
      results.append({**q,"display_name":idx["n"],"local_price":lp,"local_change":lch,"display_currency":dc,"fx_rate":fx})
    else:
      results.append({"symbol":idx["s"],"display_name":idx["n"],"error":"Unavailable","sparkline":[],"local_price":None})
  return results

def fetch_commodities(currency:str="USD")->list:
  fx=_fx_rate(currency)
  out=[]
  for c in COMMODITIES:
    q=_yf(c["s"])
    if q:
      lp=round(q["price"]*fx,2) if currency!="USD" else q["price"]
      lch=round(q["change"]*fx,4) if currency!="USD" else q["change"]
      out.append({**q,"display_name":c["n"],"unit":c["unit"],"icon":c["icon"],"local_price":lp,"local_change":lch,"display_currency":currency})
    else:
      out.append({"symbol":c["s"],"display_name":c["n"],"unit":c["unit"],"icon":c["icon"],"error":"Unavailable","sparkline":[]})
  return out

def get_country_realtime(country_name:str)->dict:
  matched,cfg=_cfg(country_name)
  currency=cfg.get("currency","USD")
  news=fetch_country_news(country_name)
  stocks=fetch_country_stocks(country_name)
  commodities=fetch_commodities(currency)
  # Get fx rate for forecast use
  fx=_fx_rate(currency)
  return {
    "country":matched,"flag":cfg.get("flag","🌍"),"currency":currency,
    "news":news,"stocks":stocks,"commodities":commodities,"fx_rate":fx,
    "fetched_at":datetime.now(timezone.utc).isoformat(),
  }
