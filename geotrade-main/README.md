# 🌍 GeoTrade — Geopolitical Trading Intelligence Platform

Convert real-time geopolitical news into actionable trading signals.
**Zero paid API calls.** Local NLP + ML engine. No subscriptions.

---

## 📁 Project Structure

```
geotrade/
├── backend/                   ← Python Flask API
│   ├── app.py                 ← REST API endpoints
│   ├── nlp_engine.py          ← Local NLP keyword scoring
│   ├── signal_generator.py    ← ML signal engine (BUY/SELL/HOLD)
│   ├── data_feeds.py          ← Free RSS feed aggregator
│   └── requirements.txt
│
└── frontend/                  ← React + Vite app
    ├── index.html
    ├── vite.config.js         ← Proxies /api → localhost:5000
    ├── package.json
    └── src/
        ├── App.jsx            ← Root component
        ├── index.css          ← Design system tokens
        ├── main.jsx
        ├── data/
        │   └── mockData.js    ← Fallback data (app works offline)
        ├── hooks/
        │   └── useGeoTrade.js ← Data fetching + auto-refresh
        ├── components/
        │   ├── Navbar.jsx
        │   ├── Globe.jsx      ← Animated 3D canvas globe
        │   ├── CandleChart.jsx
        │   ├── TickerBar.jsx
        │   └── WaitlistModal.jsx
        └── pages/
            ├── EarthPulse.jsx ← Rotating globe + live signals
            ├── GeoMap.jsx     ← Flat map + candlestick charts
            └── AISignals.jsx  ← Full signals dashboard
```

---

## ⚙️ Setup from Scratch

### Prerequisites
| Tool    | Version  | Download                      |
|---------|----------|-------------------------------|
| Node.js | 18+ LTS  | https://nodejs.org            |
| Python  | 3.11+    | https://python.org            |
| VS Code | any      | https://code.visualstudio.com |

---

### Step 1 — Get the code
Either download the files or create the folder:
```bash
mkdir geotrade && cd geotrade
# Then copy backend/ and frontend/ folders in
```

### Step 2 — Start the Backend
Open a terminal in VS Code (`Ctrl+`` ` or Terminal → New Terminal):

```bash
cd geotrade/backend

# Create virtual environment (recommended)
python -m venv venv

# Activate it:
# Mac/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python app.py
```
You should see: `🌍 GeoTrade Backend starting on http://localhost:5000`

### Step 3 — Start the Frontend
Open a **second terminal** in VS Code:

```bash
cd geotrade/frontend

# Install Node dependencies
npm install

# Start dev server
npm run dev
```
You should see: `Local: http://localhost:3000`

### Step 4 — Open the App
Visit **http://localhost:3000** in your browser.

> **Note:** The app works even without the backend! It uses built-in mock data
> as a fallback. The LIVE indicator turns green when the backend is running.

---

## 🧠 How It Works

```
Free RSS Feeds (BBC, Reuters, Al Jazeera)
        ↓  every 5 min
  data_feeds.py  →  raw news events
        ↓
  nlp_engine.py  →  severity score, region, asset impact
        ↓
signal_generator.py → BUY/SELL/HOLD + confidence + trade structure
        ↓
  Flask REST API  →  /api/signals, /api/gti, /api/events
        ↓
  React Frontend  →  Globe, GeoMap, AI Signals views
```

### NLP Engine (no API calls)
- Weighted keyword dictionary: `war=0.9`, `missile=0.95`, `peace=-0.4`
- Region multipliers: Middle East ×1.2, East Europe ×1.15, East Asia ×1.1
- Asset sensitivity matrix: XAU/USD bullish on war keywords, SPX bearish

### Signal Generation
- Computes bullish/bearish scores per asset from event severity
- Generates entry, stop-loss, target based on ATR%
- Risk/reward ratio from confidence × asset volatility profile

---

## 🔌 API Endpoints

| Endpoint                  | Description                        |
|---------------------------|------------------------------------|
| `GET /api/health`         | Server status                      |
| `GET /api/gti`            | Global Tension Index               |
| `GET /api/events`         | Latest scored geopolitical events  |
| `GET /api/signals`        | All trading signals                |
| `GET /api/signals/<ticker>` | Single signal detail             |
| `GET /api/country-tensions` | Per-country tension scores       |
| `POST /api/waitlist`      | Join waitlist (email)              |

---

## 🚀 Building for Production

### Frontend
```bash
cd frontend
npm run build
# Output in frontend/dist/
```

### Backend (deploy with gunicorn)
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

---

## 🛠 Recommended VS Code Extensions
- **ES7+ React/Redux snippets** — React shortcuts
- **Prettier** — Code formatting
- **Python** (Microsoft) — Python support
- **Thunder Client** — Test API endpoints

---

## 📈 Extending the App

| Feature                    | How                                              |
|----------------------------|--------------------------------------------------|
| Real-time price data       | Add free Twelve Data / Yahoo Finance API         |
| Better NLP                 | Swap keyword engine for local `transformers` model |
| Database                   | Add SQLite with `flask-sqlalchemy`               |
| User auth                  | Add `flask-login` + React auth context           |
| Mobile app                 | Wrap frontend in Capacitor.js                    |
| Deploy                     | Frontend → Vercel, Backend → Railway/Render      |

---

## ⚠️ Disclaimer
Educational purposes only. Not financial advice.
Always perform your own due diligence before trading.
