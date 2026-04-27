"""
Dynamic Country Tension Engine — FIXED
Key fix: score only sentences that CONTAIN the country name,
not the whole article. This prevents "US sends aid to war zone" 
from marking USA as CRITICAL.
"""

import urllib.request, urllib.parse, xml.etree.ElementTree as ET
import re, time, hashlib
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime

# Tiered keywords — ordered strictest first
CRITICAL_KW = [
    "civil war","ground invasion","military invasion","full-scale war",
    "airstrike","air strike","missile strike","rocket attack","drone strike",
    "bombing campaign","shelling","artillery","nuclear weapon","chemical weapon",
    "genocide","ethnic cleansing","war crime","massacre","siege","naval blockade",
    "coup d'état","military coup","regime collapse","occupation","front line",
]
HIGH_KW = [
    "mass shooting","mass killing","terror attack","suicide bomb","car bomb",
    "armed attack","gunmen killed","soldiers killed","civilians killed","fatalities",
    "insurgency","armed clash","sectarian violence","political assassination",
    "forced disappearance","ethnic violence","famine declared","refugee crisis",
    "military crackdown","paramilitary attack",
]
MEDIUM_KW = [
    "military tension","border tension","military buildup","troops deployed",
    "naval drill","military exercise","ceasefire violation","armed standoff",
    "political crisis","election violence","protest crackdown","coup attempt",
    "sanctions imposed","arms embargo","nuclear threat","military threat",
    "high alert","security alert","terror warning",
]
# These words in an article's TITLE strongly indicate the article IS about conflict
# in the mentioned country (not just referencing it)
TITLE_CRITICAL = ["war in","invasion of","bombing of","attack on","strikes on","war:","airstrikes","shelling in"]

COUNTRY_ALIASES = {
    "United States of America": {
        "names": ["united states","usa","u.s. ","america"],
        "NOT_if_context": ["aid to","support for","warns","condemns","sanctions","response to","reacts","accuses"],
    },
    "Canada": {
        "names": ["canada","canadian"],
        "NOT_if_context": ["aid to","support for","condemns","sanctions","response to"],
    },
    "Russia":      {"names":["russia","russian federation","moscow","kremlin"],"NOT_if_context":[]},
    "China":       {"names":["china","prc","beijing","chinese government"],"NOT_if_context":[]},
    "Iran":        {"names":["iran","iranian","tehran","irgc"],"NOT_if_context":[]},
    "Israel":      {"names":["israel","israeli","idf","tel aviv"],"NOT_if_context":[]},
    "Ukraine":     {"names":["ukraine","ukrainian","kyiv","zelensky"],"NOT_if_context":[]},
    "Palestine":   {"names":["palestine","palestinian","gaza","hamas","rafah","west bank"],"NOT_if_context":[]},
    "North Korea": {"names":["north korea","dprk","kim jong","pyongyang"],"NOT_if_context":[]},
    "Myanmar":     {"names":["myanmar","burma","tatmadaw"],"NOT_if_context":[]},
    "Sudan":       {"names":["sudan","khartoum","rsf","darfur"],"NOT_if_context":["south sudan"]},
    "Yemen":       {"names":["yemen","yemeni","houthi","sanaa"],"NOT_if_context":[]},
    "Syria":       {"names":["syria","syrian","damascus","idlib"],"NOT_if_context":[]},
    "Afghanistan": {"names":["afghanistan","afghan","taliban","kabul"],"NOT_if_context":[]},
    "Iraq":        {"names":["iraq","iraqi","baghdad","mosul"],"NOT_if_context":[]},
    "Ethiopia":    {"names":["ethiopia","ethiopian","tigray","addis ababa","amhara"],"NOT_if_context":[]},
    "Pakistan":    {"names":["pakistan","pakistani","islamabad"],"NOT_if_context":[]},
    "India":       {"names":["india","indian government","new delhi","modi"],"NOT_if_context":["aid to","condemns","response","accuses china","border with"]},
    "Saudi Arabia":{"names":["saudi arabia","saudi","riyadh","mbs"],"NOT_if_context":[]},
    "Germany":     {"names":["germany","german","berlin","bundeswehr"],"NOT_if_context":["aid to","condemns","sanctions"]},
    "France":      {"names":["france","french","paris","macron"],"NOT_if_context":["aid to","condemns","sanctions"]},
    "United Kingdom":{"names":["united kingdom","britain","british","london","uk government"],"NOT_if_context":["aid to","condemns","sanctions","support for"]},
    "Japan":       {"names":["japan","japanese","tokyo","kishida"],"NOT_if_context":["aid to","condemns"]},
    "South Korea": {"names":["south korea","seoul","korean government"],"NOT_if_context":[]},
    "Turkey":      {"names":["turkey","turkish","ankara","erdogan"],"NOT_if_context":[]},
    "Venezuela":   {"names":["venezuela","venezuelan","maduro","caracas"],"NOT_if_context":[]},
    "Brazil":      {"names":["brazil","brazilian","lula","brasilia"],"NOT_if_context":[]},
    "Australia":   {"names":["australia","australian","canberra","albanese"],"NOT_if_context":[]},
    "Nigeria":     {"names":["nigeria","nigerian","abuja","boko haram"],"NOT_if_context":[]},
    "South Africa":{"names":["south africa","pretoria","johannesburg"],"NOT_if_context":[]},
    "Libya":       {"names":["libya","libyan","tripoli"],"NOT_if_context":[]},
    "Somalia":     {"names":["somalia","somali","mogadishu","al-shabaab"],"NOT_if_context":[]},
    "Haiti":       {"names":["haiti","haitian","port-au-prince"],"NOT_if_context":[]},
    "Congo":       {"names":["congo","drc","kinshasa","m23"],"NOT_if_context":["republic of congo"]},
    "Mali":        {"names":["mali ","malian","bamako"],"NOT_if_context":[]},
    "Niger":       {"names":["niger ","nigerien","niamey"],"NOT_if_context":["nigeria"]},
}

# Base tension floors — countries that are never truly "green" due to standing threats
TENSION_FLOOR = {
    "United States of America": "LOW",
    "Canada":    "LOW", "Germany": "LOW", "France": "LOW",
    "United Kingdom": "LOW", "Japan": "LOW", "Australia": "LOW",
    "Brazil":    "LOW", "India":  "MEDIUM", "South Korea": "MEDIUM",
    "Turkey":    "MEDIUM", "Pakistan": "HIGH",
    "Russia":    "CRITICAL", "Ukraine": "CRITICAL",
    "Iran":      "CRITICAL", "Israel":  "CRITICAL",
    "Palestine": "CRITICAL", "Syria":   "HIGH",
    "Yemen":     "HIGH",     "Sudan":   "HIGH",
    "Myanmar":   "HIGH",     "Afghanistan": "HIGH",
    "North Korea":"HIGH",    "Iraq":    "MEDIUM",
    "Ethiopia":  "HIGH",     "Somalia": "HIGH",
    "Libya":     "HIGH",     "Haiti":   "HIGH",
    "Congo":     "HIGH",     "Mali":    "HIGH",
    "Niger":     "HIGH",
}

NEWS_SOURCES = [
    {"url":"https://feeds.bbci.co.uk/news/world/rss.xml",              "source":"BBC World"},
    {"url":"https://feeds.bbci.co.uk/news/world/middle_east/rss.xml",  "source":"BBC ME"},
    {"url":"https://feeds.bbci.co.uk/news/world/europe/rss.xml",       "source":"BBC Europe"},
    {"url":"https://feeds.bbci.co.uk/news/world/asia/rss.xml",         "source":"BBC Asia"},
    {"url":"https://feeds.bbci.co.uk/news/world/africa/rss.xml",       "source":"BBC Africa"},
    {"url":"https://news.google.com/rss/search?q=reuters+world+news+conflict&hl=en-US&gl=US&ceid=US:en","source":"Reuters/GN"},
    {"url":"https://www.aljazeera.com/xml/rss/all.xml",                "source":"Al Jazeera"},
    {"url":"https://www.theguardian.com/world/rss",                    "source":"Guardian"},
    {"url":"https://rss.dw.com/rdf/rss-en-world",                     "source":"DW"},
]

_articles_cache = {"data": [], "ts": 0}
_tension_cache  = {"data": {}, "ts": 0}
ARTICLES_TTL = 300
TENSION_TTL  = 300

def _fetch_rss(feed):
    arts = []
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    try:
        req = urllib.request.Request(feed["url"], headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0) Chrome/120",
            "Accept": "application/rss+xml,*/*",
        })
        with urllib.request.urlopen(req, timeout=6) as r:
            raw = r.read()
        root = ET.fromstring(raw)
        ch = root.find("channel") or root
        for item in (ch.findall("item") if ch is not None else []):
            title = (item.findtext("title") or "").strip()
            desc  = re.sub(r'<[^>]+>', '', item.findtext("description") or "").strip()
            link  = (item.findtext("link") or "").strip()
            pub   = (item.findtext("pubDate") or "").strip()
            dt = None
            try: dt = parsedate_to_datetime(pub)
            except: pass
            if dt and dt.astimezone(timezone.utc) < cutoff:
                continue
            # Clean title
            src = feed["source"]
            if " - " in title:
                parts = title.rsplit(" - ", 1)
                title = parts[0].strip()
                src   = parts[1].strip() if len(parts) > 1 else src
            if title:
                arts.append({
                    "title": title, "desc": desc[:300],
                    "source": src, "url": link,
                    "ts": dt.timestamp() if dt else 0,
                })
    except Exception as e:
        print(f"[RSS:{feed['source']}] {e}")
    return arts

def fetch_all_articles():
    now = time.time()
    if now - _articles_cache["ts"] < ARTICLES_TTL and _articles_cache["data"]:
        return _articles_cache["data"]
    all_arts = []
    for feed in NEWS_SOURCES:
        all_arts.extend(_fetch_rss(feed))
    seen, unique = set(), []
    for a in all_arts:
        k = a["title"][:60]
        if k not in seen:
            seen.add(k); unique.append(a)
    unique.sort(key=lambda x: x["ts"], reverse=True)
    _articles_cache.update({"data": unique, "ts": now})
    return unique

def _score_text_for_country(title: str, desc: str, country_cfg: dict) -> tuple[str, float]:
    """
    FIXED: Only score sentences that directly contain the country name.
    Also applies NOT_if_context filter to avoid false positives.
    """
    text_lower = (title + " " + desc).lower()
    names = country_cfg["names"]
    not_ctx = country_cfg.get("NOT_if_context", [])

    # Does this article even mention the country?
    if not any(n in text_lower for n in names):
        return None, 0

    # Split into sentences for context-aware scoring
    sentences = re.split(r'[.!?;]', text_lower)
    relevant_sentences = [s for s in sentences if any(n in s for n in names)]

    if not relevant_sentences:
        return None, 0

    combined = " ".join(relevant_sentences)

    # Check NOT context — if the country is only mentioned as observer/responder
    # AND no strong conflict word appears in same sentence, skip
    is_only_observer = all(ctx in combined for ctx in not_ctx[:1]) if not_ctx else False

    crit_hits = sum(1 for k in CRITICAL_KW if k in combined)
    high_hits = sum(1 for k in HIGH_KW     if k in combined)
    med_hits  = sum(1 for k in MEDIUM_KW   if k in combined)

    # Also check TITLE specifically — title mentions are very strong signals
    title_lower = title.lower()
    title_crit  = sum(1 for k in CRITICAL_KW if k in title_lower and any(n in title_lower for n in names))
    title_high  = sum(1 for k in HIGH_KW     if k in title_lower and any(n in title_lower for n in names))

    if is_only_observer and (crit_hits + high_hits) == 0:
        return "LOW", 10

    score = (title_crit * 5 + crit_hits * 3 + title_high * 3 + high_hits * 1.5 + med_hits * 0.5)

    if title_crit >= 1 or crit_hits >= 2:    return "CRITICAL", min(100, 70 + score * 3)
    elif crit_hits >= 1 or high_hits >= 2:   return "HIGH",     min(100, 50 + score * 4)
    elif high_hits >= 1 or med_hits >= 3:    return "MEDIUM",   min(100, 35 + score * 5)
    elif med_hits >= 1:                      return "MEDIUM",   min(100, 25 + med_hits * 8)
    else:                                    return "LOW",      10

LEVEL_ORDER = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}

def compute_dynamic_tensions(articles=None):
    now = time.time()
    if now - _tension_cache["ts"] < TENSION_TTL and _tension_cache["data"]:
        return _tension_cache["data"]

    if articles is None:
        articles = fetch_all_articles()

    tensions = {}
    for country, cfg in COUNTRY_ALIASES.items():
        floor = TENSION_FLOOR.get(country, "LOW")
        levels_found = []
        top_headline = ""

        for art in articles:
            level, score = _score_text_for_country(art["title"], art["desc"], cfg)
            if level and score > 0:
                levels_found.append(level)
                if not top_headline:
                    top_headline = art["title"]

        # Take highest level found from news
        if levels_found:
            news_level = min(levels_found, key=lambda l: LEVEL_ORDER[l])
        else:
            news_level = "LOW"

        # Final level = max(news_level, floor) — never below floor
        final_level = min([news_level, floor], key=lambda l: LEVEL_ORDER[l])

        # GTI score
        level_gti = {"CRITICAL": 75, "HIGH": 55, "MEDIUM": 35, "LOW": 15}
        base_gti  = level_gti[final_level]
        gti = min(100, base_gti + len(levels_found) * 2)

        tensions[country] = {
            "level": final_level,
            "gti":   gti,
            "headline_count": len(levels_found),
            "top_headline":   top_headline,
        }

    _tension_cache.update({"data": tensions, "ts": now})
    return tensions

def get_country_tension(country: str) -> dict:
    tensions = compute_dynamic_tensions()
    for k, v in tensions.items():
        if k.lower() == country.lower() \
           or k.lower() in country.lower() \
           or country.lower() in k.lower():
            return {"country": k, **v}
    return {"country": country, "level": "LOW", "gti": 10, "headline_count": 0, "top_headline": ""}

def get_all_tensions_list() -> list:
    tensions = compute_dynamic_tensions()
    from signal_generator import COUNTRY_TENSIONS_BASE
    result = []
    for country, data in tensions.items():
        base = COUNTRY_TENSIONS_BASE.get(country, {"lat": 0, "lng": 0})
        result.append({
            "country": country,
            "level":   data["level"],
            "gti":     data["gti"],
            "lat":     base.get("lat", 0),
            "lng":     base.get("lng", 0),
            "headline_count": data["headline_count"],
            "top_headline":   data["top_headline"],
        })
    return result
