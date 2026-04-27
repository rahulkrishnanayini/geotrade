"""
NLP Engine — Local keyword-based geopolitical event scoring.
No external API calls. Uses rule-based NLP + weighted dictionaries.
"""

import re
import math
from datetime import datetime, timezone

# ── Geopolitical keyword dictionaries ──────────────────────────────────────────

SEVERITY_KEYWORDS = {
    # Tier 1 — Critical (weight 1.0)
    "nuclear": 1.0, "missile": 0.95, "airstrike": 0.95, "invasion": 0.95,
    "war": 0.9, "blockade": 0.88, "naval": 0.85, "troops": 0.8,
    "sanctions": 0.75, "ceasefire": 0.7, "coup": 0.92, "assassination": 0.93,
    "explosion": 0.88, "attack": 0.82, "hostage": 0.87,
    # Tier 2 — High (weight 0.6)
    "escalation": 0.65, "tension": 0.6, "protest": 0.55, "strike": 0.58,
    "embargo": 0.62, "military": 0.6, "conflict": 0.65, "threat": 0.6,
    "border": 0.55, "shutdown": 0.52, "emergency": 0.65,
    # Tier 3 — Medium (weight 0.35)
    "talks": 0.3, "meeting": 0.25, "statement": 0.28, "warning": 0.38,
    "election": 0.35, "rally": 0.3, "demonstration": 0.32,
    # De-escalation (negative)
    "peace": -0.4, "agreement": -0.35, "deal": -0.3, "ceasefire": -0.2,
    "withdrawal": -0.25, "calm": -0.3, "resolved": -0.35,
}

REGION_WEIGHTS = {
    "Middle East": 1.2, "East Europe": 1.15, "East Asia": 1.1,
    "South Asia": 1.05, "Central Asia": 1.0, "Africa": 0.95,
    "Latin America": 0.9, "North America": 1.05, "Europe": 1.0,
    "Southeast Asia": 1.0,
}

ASSET_SENSITIVITY = {
    # asset: {keyword: direction_multiplier}
    "XAU/USD": {
        "war": 0.9, "nuclear": 1.0, "invasion": 0.85, "missile": 0.8,
        "peace": -0.5, "deal": -0.4, "usd": -0.3, "inflation": 0.6,
        "sanctions": 0.7, "coup": 0.75,
    },
    "WTI": {
        "naval": 1.0, "strait": 1.0, "pipeline": 0.9, "opec": 0.8,
        "blockade": 0.95, "embargo": 0.85, "sanctions": 0.7,
        "peace": -0.4, "agreement": -0.35,
    },
    "SPX": {
        "war": -0.8, "recession": -0.7, "sanctions": -0.6, "tariff": -0.55,
        "deal": 0.5, "peace": 0.4, "rate": -0.4,
    },
    "LMT": {
        "war": 0.9, "military": 0.85, "nato": 0.8, "defense": 0.9,
        "invasion": 0.85, "missile": 0.75, "peace": -0.6,
    },
    "EUR/USD": {
        "russia": -0.7, "energy": -0.6, "nato": -0.4, "ukraine": -0.75,
        "ecb": 0.5, "deal": 0.3,
    },
    "BTC/USD": {
        "sanctions": 0.7, "cbdc": -0.3, "regulation": -0.5,
        "ban": -0.6, "adoption": 0.5,
    },
}

COUNTRY_REGION_MAP = {
    "iran": "Middle East", "israel": "Middle East", "saudi": "Middle East",
    "iraq": "Middle East", "syria": "Middle East", "yemen": "Middle East",
    "russia": "East Europe", "ukraine": "East Europe", "belarus": "East Europe",
    "china": "East Asia", "taiwan": "East Asia", "japan": "East Asia",
    "korea": "East Asia", "north korea": "East Asia",
    "india": "South Asia", "pakistan": "South Asia",
    "myanmar": "Southeast Asia", "thailand": "Southeast Asia",
    "usa": "North America", "united states": "North America",
    "germany": "Europe", "france": "Europe", "uk": "Europe",
    "nigeria": "Africa", "sudan": "Africa", "ethiopia": "Africa",
}


class NLPEngine:
    def __init__(self):
        self.severity_dict = SEVERITY_KEYWORDS
        self.region_weights = REGION_WEIGHTS
        self.asset_sensitivity = ASSET_SENSITIVITY

    def tokenize(self, text: str) -> list[str]:
        return re.findall(r'\b[a-z]+\b', text.lower())

    def detect_region(self, text: str) -> str:
        text_lower = text.lower()
        for country, region in COUNTRY_REGION_MAP.items():
            if country in text_lower:
                return region
        return "Global"

    def compute_severity(self, text: str) -> float:
        """Score 0–100 based on keyword presence and weights"""
        tokens = self.tokenize(text)
        score = 0.0
        hits = 0
        for token in tokens:
            if token in self.severity_dict:
                score += self.severity_dict[token]
                hits += 1
        if hits == 0:
            return 30.0
        # Normalize: more unique hits = higher confidence
        raw = score / max(hits, 1)
        normalized = max(0, min(100, (raw + 0.5) * 70))
        return round(normalized, 1)

    def classify_level(self, severity: float) -> str:
        if severity >= 75: return "CRITICAL"
        if severity >= 55: return "HIGH"
        if severity >= 35: return "MEDIUM"
        return "LOW"

    def score_asset_impact(self, text: str, asset: str) -> dict:
        """Determine bullish/bearish direction for a specific asset"""
        tokens = self.tokenize(text)
        sensitivity = self.asset_sensitivity.get(asset, {})
        bull_score = 0.0
        bear_score = 0.0
        for token in tokens:
            if token in sensitivity:
                w = sensitivity[token]
                if w > 0:
                    bull_score += w
                else:
                    bear_score += abs(w)
        total = bull_score + bear_score
        if total == 0:
            return {"bullish": 50, "bearish": 50, "direction": "HOLD"}
        bull_pct = round(bull_score / total * 100)
        bear_pct = 100 - bull_pct
        direction = "BUY" if bull_pct > 55 else "SELL" if bear_pct > 55 else "HOLD"
        return {"bullish": bull_pct, "bearish": bear_pct, "direction": direction}

    def score_event(self, event: dict) -> dict:
        """Full NLP scoring of a raw event"""
        text = f"{event.get('title', '')} {event.get('body', '')}"
        severity = self.compute_severity(text)
        region = event.get("region") or self.detect_region(text)
        level = self.classify_level(severity)
        region_mult = self.region_weights.get(region, 1.0)
        adjusted_severity = min(100, severity * region_mult)
        return {
            **event,
            "severity": round(adjusted_severity, 1),
            "level": level,
            "region": region,
            "sentiment": "bearish" if severity > 50 else "bullish",
            "scored_at": datetime.now(timezone.utc).isoformat(),
        }

    def extract_triggers(self, events: list[dict]) -> list[str]:
        """Extract primary trigger phrases from events"""
        triggers = []
        for e in events:
            title = e.get("title", "")
            if e.get("level") in ("CRITICAL", "HIGH"):
                triggers.append(title)
        return triggers[:3]
