# ⚠️ CRITICAL — Replace These Exact Files

You have been running BROKEN stripped-down versions of some files.
Replace ALL of these from this zip. Do NOT keep your old versions.

## Backend — replace ALL of these:
| File | Why |
|------|-----|
| backend/app.py | Full API with CORS + debug logging |
| backend/realtime_country.py | Full 30-country config + Yahoo Finance + real news |
| backend/dynamic_tension.py | Full NLP with context-aware scoring |
| backend/country_signals.py | Local currency forex/indices/commodities |
| backend/stock_forecast.py | Price forecast engine |
| backend/signal_generator.py | Signal generation engine |
| backend/nlp_engine.py | NLP scoring |
| backend/data_feeds.py | RSS feed aggregator |

## Frontend — replace ALL of these:
| File | Why |
|------|-----|
| frontend/src/pages/AISignals.jsx | Forex shows local currency |
| frontend/src/pages/EarthPulse.jsx | Right panel inline country panel |
| frontend/src/pages/GeoMap.jsx | Same country panel as EarthPulse |
| frontend/src/components/CountryPanel.jsx | Full news+stocks+commodities+forecast |

## How to replace:
1. Stop both servers (Ctrl+C in both terminals)
2. Copy ALL backend/*.py files from this zip → your geotrade/backend/ folder
3. Copy ALL frontend/src/**/*.jsx files from this zip → matching paths
4. Restart backend: cd backend && python app.py
5. Restart frontend: cd frontend && npm run dev

## Verify it's working:
Open http://localhost:5000/api/health in browser
Should see: {"status":"ok","ts":"..."}

Open http://localhost:5000/api/country/India
Should see: {"country":"India","currency":"INR","news":[...],"stocks":[...],"commodities":[...]}
