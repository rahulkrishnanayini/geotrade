"""
Data Feed Aggregator — Pulls from free RSS/XML feeds. Zero API keys required.
Sources: Reuters, BBC, Al Jazeera, AP News (public RSS)
"""

import urllib.request
import xml.etree.ElementTree as ET
import json
import time
import hashlib
from datetime import datetime, timezone
from typing import Optional

# Free public RSS feeds — no API key needed
RSS_FEEDS = [
    {
        "url": "https://feeds.bbci.co.uk/news/world/rss.xml",
        "source": "BBC World",
        "region_hint": None,
    },
    {
        "url": "https://www.aljazeera.com/xml/rss/all.xml",
        "source": "Al Jazeera",
        "region_hint": "Middle East",
    },
    {
        "url": "https://feeds.reuters.com/reuters/worldNews",
        "source": "Reuters",
        "region_hint": None,
    },
    {
        "url": "https://rss.app/feeds/tvqWNxYERtXdDMk2.xml",
        "source": "AP World",
        "region_hint": None,
    },
]

# Fallback mock events (used when network unavailable in dev)
MOCK_EVENTS = [
    {
        "id": "mock_001",
        "title": "Strait of Hormuz Naval Drill Escalates Tensions",
        "body": "Iran conducts large-scale naval military exercises near the Strait of Hormuz, raising concerns about oil supply disruption. US Navy maintains presence in the region.",
        "source": "Reuters",
        "region": "Middle East",
        "published_at": "2024-03-09T20:05:00Z",
        "url": "https://reuters.com",
    },
    {
        "id": "mock_002",
        "title": "ECB Emergency Statement on European Energy Crisis",
        "body": "European Central Bank issues emergency statement regarding escalating energy prices and geopolitical risk impact on eurozone stability. Emergency rate decision may follow.",
        "source": "BBC World",
        "region": "Europe",
        "published_at": "2024-03-09T19:05:00Z",
        "url": "https://bbc.co.uk",
    },
    {
        "id": "mock_003",
        "title": "Russia Deploys Additional Troops Near Ukrainian Border",
        "body": "Satellite imagery confirms significant Russian military buildup near Ukraine border. NATO forces placed on heightened alert. Emergency UN Security Council session called.",
        "source": "Al Jazeera",
        "region": "East Europe",
        "published_at": "2024-03-09T18:30:00Z",
        "url": "https://aljazeera.com",
    },
    {
        "id": "mock_004",
        "title": "Taiwan Strait Tensions Rise Amid Chinese Exercises",
        "body": "China conducts largest military exercises near Taiwan in two years. US carrier group deployed to South China Sea. Markets pricing in elevated geopolitical risk premium.",
        "source": "Reuters",
        "region": "East Asia",
        "published_at": "2024-03-09T17:15:00Z",
        "url": "https://reuters.com",
    },
    {
        "id": "mock_005",
        "title": "India-Pakistan Border Skirmish Reported",
        "body": "Indian and Pakistani forces exchange fire along Line of Control in Kashmir. Both governments issue statements. Regional markets showing volatility.",
        "source": "BBC World",
        "region": "South Asia",
        "published_at": "2024-03-09T16:45:00Z",
        "url": "https://bbc.co.uk",
    },
    {
        "id": "mock_006",
        "title": "North Korea Launches Ballistic Missile Over Japan",
        "body": "North Korea fires intermediate-range ballistic missile that flew over Japanese territory. Japan activates J-Alert warning system. Emergency Security Council meeting called.",
        "source": "Reuters",
        "region": "East Asia",
        "published_at": "2024-03-09T15:20:00Z",
        "url": "https://reuters.com",
    },
    {
        "id": "mock_007",
        "title": "Sudan Civil War — Humanitarian Corridor Closed",
        "body": "RSF forces close last humanitarian corridor in Khartoum. International aid agencies warn of catastrophic shortages. UN Security Council debates intervention options.",
        "source": "Al Jazeera",
        "region": "Africa",
        "published_at": "2024-03-09T14:00:00Z",
        "url": "https://aljazeera.com",
    },
    {
        "id": "mock_008",
        "title": "Myanmar Military Launches Air Strikes on Resistance",
        "body": "Myanmar junta conducts airstrikes on opposition-held territory in Sagaing region. Human rights groups report civilian casualties. ASEAN emergency talks proposed.",
        "source": "BBC World",
        "region": "Southeast Asia",
        "published_at": "2024-03-09T13:10:00Z",
        "url": "https://bbc.co.uk",
    },
]

_cache: dict = {"events": [], "last_fetched": 0}
CACHE_TTL = 300  # 5 minutes


class DataFeedAggregator:
    def __init__(self):
        self.feeds = RSS_FEEDS
        self.mock_events = MOCK_EVENTS

    def _fetch_rss(self, feed: dict) -> list:
        """Fetch and parse an RSS feed"""
        events = []
        try:
            req = urllib.request.Request(
                feed["url"],
                headers={"User-Agent": "GeoTrade/2.0 (research aggregator)"},
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                raw = resp.read()
            root = ET.fromstring(raw)
            channel = root.find("channel") or root
            items = channel.findall("item") or root.findall(".//{http://www.w3.org/2005/Atom}entry")
            for item in items[:10]:
                title = (item.findtext("title") or "").strip()
                desc = (item.findtext("description") or item.findtext("summary") or "").strip()
                link = (item.findtext("link") or "").strip()
                pub = (item.findtext("pubDate") or item.findtext("published") or "").strip()
                if not title:
                    continue
                uid = hashlib.md5(title.encode()).hexdigest()[:12]
                events.append({
                    "id": uid,
                    "title": title,
                    "body": desc[:500],
                    "source": feed["source"],
                    "region": feed.get("region_hint"),
                    "published_at": pub,
                    "url": link,
                })
        except Exception as e:
            print(f"Feed error ({feed['source']}): {e}")
        return events

    def get_latest_events(self) -> list:
        """Return events, using cache to avoid hammering feeds"""
        global _cache
        now = time.time()
        if now - _cache["last_fetched"] < CACHE_TTL and _cache["events"]:
            return _cache["events"]

        all_events = []
        for feed in self.feeds:
            all_events.extend(self._fetch_rss(feed))

        if not all_events:
            print("Using mock events (network unavailable)")
            all_events = self.mock_events

        # Deduplicate by id
        seen = set()
        unique = []
        for e in all_events:
            if e["id"] not in seen:
                seen.add(e["id"])
                unique.append(e)

        _cache["events"] = unique[:20]
        _cache["last_fetched"] = now
        return _cache["events"]
