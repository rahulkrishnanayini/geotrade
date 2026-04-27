// Static fallback data — used when backend is offline

export const MOCK_GTI = {
  value: 71.4,
  change: +2.1,
  level: "ELEVATED",
  trend: [65,66,67,68,67,69,70,69,71,72,71,70,71,72,73,72,71,72,73,71.4],
};

export const MOCK_EVENTS = [
  { id:"e1", title:"Strait of Hormuz Naval Drill Escalates", body:"Iran conducts large-scale naval exercises near Strait of Hormuz. US Navy monitoring closely.", source:"Reuters", region:"Middle East", level:"CRITICAL", severity:80, published_at:"08:05 PM" },
  { id:"e2", title:"ECB Emergency Statement", body:"ECB issues emergency statement on European energy crisis and geopolitical risk impact.", source:"BBC", region:"Europe", level:"HIGH", severity:65, published_at:"07:05 PM" },
  { id:"e3", title:"Taiwan Strait Tensions Rise", body:"China conducts large-scale military drills near Taiwan. US carrier group repositioned.", source:"Reuters", region:"East Asia", level:"HIGH", severity:62, published_at:"06:30 PM" },
  { id:"e4", title:"India-Pakistan Border Incident", body:"Forces exchange fire along Line of Control in Kashmir. Both governments issue statements.", source:"Al Jazeera", region:"South Asia", level:"MEDIUM", severity:45, published_at:"05:15 PM" },
  { id:"e5", title:"Russia Troop Buildup Near Border", body:"Satellite imagery confirms large Russian military movement near Ukrainian border.", source:"BBC", region:"East Europe", level:"CRITICAL", severity:79, published_at:"04:00 PM" },
  { id:"e6", title:"North Korea Missile Launch", body:"NK fires IRBM over Japan. Tokyo activates J-Alert. Emergency UN session called.", source:"Reuters", region:"East Asia", level:"CRITICAL", severity:82, published_at:"03:20 PM" },
];

export const MOCK_SIGNALS = [
  {
    id:1, ticker:"XAU/USD", label:"Gold", category:"Commodities", description:"Safe-haven precious metal",
    direction:"BUY", confidence:88, uncertainty:12, bullish:74, bearish:8,
    volatility:"MEDIUM", term:"short-term", tags:["metals","global"],
    trigger:"Iran-Israel Escalation — Missile Exchanges",
    ai_analysis:"Safe haven demand accelerating as Middle East and East Europe tensions escalate. Institutional flows into gold increasing significantly. Historical correlation with geopolitical risk index shows 87% accuracy over 6-month lookback.",
    risk_factors:["Sudden de-escalation","Strong USD data","Profit-taking at resistance"],
    sector_exposure:{ Energy:20, Defense:10 },
    trade:{ current_price:2314.50, entry:2341.0, stop_loss:2298.0, target:2427.0, change_pct:1.2, risk_reward:2.0, atr_daily_pct:1.84, max_position_pct:3.2, risk_amount:43000, reward_amount:85000 },
  },
  {
    id:2, ticker:"WTI", label:"WTI Crude Oil", category:"Commodities", description:"Global oil benchmark",
    direction:"BUY", confidence:82, uncertainty:14, bullish:70, bearish:8,
    volatility:"HIGH", term:"short-term", tags:["energy","middle-east"],
    trigger:"Strait of Hormuz Naval Escalation",
    ai_analysis:"Supply disruption risk premium expanding. Strait of Hormuz closure probability at elevated levels. OPEC compliance above 95% adding upward pressure.",
    risk_factors:["OPEC production increase","Demand slowdown data"],
    sector_exposure:{ Energy:80, Defense:20 },
    trade:{ current_price:83.0, entry:83.0, stop_loss:80.5, target:88.0, change_pct:1.21, risk_reward:2.1, atr_daily_pct:2.1, max_position_pct:2.8, risk_amount:35000, reward_amount:73500 },
  },
  {
    id:3, ticker:"LMT", label:"Lockheed Martin", category:"Stocks", description:"US defense contractor",
    direction:"BUY", confidence:85, uncertainty:8, bullish:72, bearish:5,
    volatility:"MEDIUM", term:"medium-term", tags:["defense","global"],
    trigger:"Iran-Israel Escalation — NATO Defense Posture",
    ai_analysis:"Defense procurement cycles accelerating. NATO spending commitments rising across member states. Backlog visibility improving with multi-year contracts anticipated.",
    risk_factors:["Peace negotiations","Budget constraints"],
    sector_exposure:{ Defense:85, Aerospace:15 },
    trade:{ current_price:480.20, entry:480.2, stop_loss:461.0, target:520.0, change_pct:2.3, risk_reward:2.0, atr_daily_pct:1.5, max_position_pct:2.5, risk_amount:28000, reward_amount:56000 },
  },
  {
    id:4, ticker:"SPX", label:"S&P 500", category:"Equity Indices", description:"US equity benchmark",
    direction:"SELL", confidence:68, uncertainty:18, bullish:5, bearish:55,
    volatility:"HIGH", term:"short-term", tags:["equities","global"],
    trigger:"Iran-Israel Escalation — Risk-Off Sentiment",
    ai_analysis:"Broad risk-off sentiment dominating. Institutional hedging activity elevated. VIX term structure pricing in continued volatility. Safe haven rotation underway.",
    risk_factors:["Fed put activation","Short squeeze potential","Positive earnings surprise"],
    sector_exposure:{ Technology:28, Financials:13, Healthcare:12 },
    trade:{ current_price:5120.30, entry:5120.3, stop_loss:5200.0, target:4950.0, change_pct:-1.5, risk_reward:1.8, atr_daily_pct:2.3, max_position_pct:2.0, risk_amount:50000, reward_amount:90000 },
  },
  {
    id:5, ticker:"EUR/USD", label:"EUR/USD", category:"Forex", description:"Euro vs US Dollar",
    direction:"SELL", confidence:72, uncertainty:15, bullish:8, bearish:61,
    volatility:"MEDIUM", term:"medium-term", tags:["forex","europe"],
    trigger:"Russia-NATO — EU Energy Disruption",
    ai_analysis:"European energy dependency vulnerability resurfacing. ECB policy constrained by growth risks. USD strength acting as safe haven alternative.",
    risk_factors:["ECB hawkish surprise","Energy deal breakthrough"],
    sector_exposure:{ Energy:30, Defense:15 },
    trade:{ current_price:1.0821, entry:1.0821, stop_loss:1.0920, target:1.0650, change_pct:-0.4, risk_reward:1.9, atr_daily_pct:0.8, max_position_pct:3.0, risk_amount:32000, reward_amount:60800 },
  },
  {
    id:6, ticker:"BTC/USD", label:"Bitcoin", category:"Crypto", description:"Digital store of value",
    direction:"BUY", confidence:58, uncertainty:25, bullish:52, bearish:28,
    volatility:"HIGH", term:"short-term", tags:["crypto","global"],
    trigger:"Sanctions Evasion Demand Rising",
    ai_analysis:"Geopolitical sanctions driving alternative settlement demand. Instability historically correlates with BTC adoption spikes. Regulatory headwinds remain key risk.",
    risk_factors:["Exchange hack / FUD","Mt. Gox distribution"],
    sector_exposure:{ Energy:5, Defense:0 },
    trade:{ current_price:67400.0, entry:67400, stop_loss:63000, target:78000, change_pct:0.9, risk_reward:2.5, atr_daily_pct:4.2, max_position_pct:1.5, risk_amount:25000, reward_amount:62500 },
  },
  {
    id:7, ticker:"RTX", label:"Raytheon Technologies", category:"Stocks", description:"Defense & aerospace",
    direction:"BUY", confidence:80, uncertainty:10, bullish:68, bearish:6,
    volatility:"MEDIUM", term:"medium-term", tags:["defense","global"],
    trigger:"Global Military Escalation Wave",
    ai_analysis:"Missile defense systems demand surging. Multiple active conflict zones driving procurement urgency. European defense budgets at multi-decade highs.",
    risk_factors:["Export license revocation","Conflict de-escalation"],
    sector_exposure:{ Defense:90, Aerospace:10 },
    trade:{ current_price:102.4, entry:102.4, stop_loss:97.5, target:113.0, change_pct:1.8, risk_reward:2.2, atr_daily_pct:1.6, max_position_pct:2.4, risk_amount:22000, reward_amount:48400 },
  },
  {
    id:8, ticker:"USO", label:"Oil ETF", category:"ETFs", description:"Tracks WTI crude oil",
    direction:"BUY", confidence:75, uncertainty:14, bullish:65, bearish:12,
    volatility:"LOW", term:"medium-term", tags:["energy","etf"],
    trigger:"Supply Disruption Risk Premium",
    ai_analysis:"ETF provides diversified oil exposure with lower volatility than futures. Current supply risk premium underpriced relative to geopolitical threat level.",
    risk_factors:["Contango drag","Demand destruction"],
    sector_exposure:{ Energy:95, Defense:5 },
    trade:{ current_price:73.2, entry:73.2, stop_loss:70.0, target:80.5, change_pct:0.95, risk_reward:2.3, atr_daily_pct:1.3, max_position_pct:3.5, risk_amount:18000, reward_amount:41400 },
  },
];

export const MOCK_COUNTRY_TENSIONS = [
  { country:"Russia",  gti:82, level:"CRITICAL", lat:60,  lng:90   },
  { country:"Ukraine", gti:79, level:"CRITICAL", lat:49,  lng:31   },
  { country:"Iran",    gti:78, level:"CRITICAL", lat:32,  lng:53   },
  { country:"Israel",  gti:76, level:"CRITICAL", lat:31,  lng:35   },
  { country:"NK",      gti:70, level:"HIGH",     lat:40,  lng:127  },
  { country:"Myanmar", gti:61, level:"HIGH",     lat:18,  lng:96   },
  { country:"Sudan",   gti:58, level:"HIGH",     lat:15,  lng:32   },
  { country:"China",   gti:55, level:"MEDIUM",   lat:35,  lng:105  },
  { country:"Saudi",   gti:52, level:"MEDIUM",   lat:23,  lng:45   },
  { country:"India",   gti:44, level:"MEDIUM",   lat:20,  lng:78   },
  { country:"Pakistan",gti:48, level:"MEDIUM",   lat:30,  lng:70   },
  { country:"USA",     gti:35, level:"LOW",      lat:40,  lng:-100 },
  { country:"Germany", gti:30, level:"LOW",      lat:51,  lng:10   },
];

export const LEVEL_COLOR  = { CRITICAL:"#ef4444", HIGH:"#f97316", MEDIUM:"#eab308", LOW:"#3b82f6" };
export const LEVEL_BG     = { CRITICAL:"rgba(239,68,68,0.12)", HIGH:"rgba(249,115,22,0.10)", MEDIUM:"rgba(234,179,8,0.10)", LOW:"rgba(59,130,246,0.10)" };
export const ASSET_CLASSES = ["All","Commodities","Equity Indices","Forex","Crypto","Stocks","ETFs","Bonds"];
export const DIRECTIONS    = ["All","BUY","SELL","HOLD"];
export const GEO_FACTORS   = ["military escalation","energy supply disruption","trade restrictions","sanctions","political instability"];
