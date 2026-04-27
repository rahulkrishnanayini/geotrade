import { API } from '../config'
import { useState, useEffect, useRef } from 'react'

const LC = { CRITICAL:'#ef4444', HIGH:'#f97316', MEDIUM:'#eab308', LOW:'#22c55e' }
const GTI_MAP = {
  'Russia':{level:'CRITICAL',gti:82},'Ukraine':{level:'CRITICAL',gti:79},
  'Iran':{level:'CRITICAL',gti:78},'Israel':{level:'CRITICAL',gti:76},
  'Palestine':{level:'CRITICAL',gti:75},'North Korea':{level:'HIGH',gti:70},
  'Myanmar':{level:'HIGH',gti:61},'Sudan':{level:'HIGH',gti:58},
  'Ethiopia':{level:'HIGH',gti:56},'Yemen':{level:'HIGH',gti:62},
  'Syria':{level:'HIGH',gti:60},'China':{level:'MEDIUM',gti:55},
  'Pakistan':{level:'MEDIUM',gti:48},'India':{level:'MEDIUM',gti:44},
  'Saudi Arabia':{level:'MEDIUM',gti:52},'Iraq':{level:'MEDIUM',gti:50},
  'Afghanistan':{level:'MEDIUM',gti:55},'Venezuela':{level:'MEDIUM',gti:42},
  'United States of America':{level:'LOW',gti:35},'Germany':{level:'LOW',gti:30},
  'France':{level:'LOW',gti:28},'United Kingdom':{level:'LOW',gti:28},
  'Japan':{level:'LOW',gti:32},'Australia':{level:'LOW',gti:22},
  'Brazil':{level:'LOW',gti:30},'Canada':{level:'LOW',gti:20},
}
function getTension(name) {
  if (!name) return { level:'LOW', gti:35 }
  for (const [k,v] of Object.entries(GTI_MAP))
    if (k.toLowerCase()===name.toLowerCase()||k.toLowerCase().includes(name.toLowerCase())||name.toLowerCase().includes(k.toLowerCase()))
      return v
  return { level:'LOW', gti:35 }
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ data=[], color='#22c55e', h=32, w=100 }) {
  if (!data || data.length < 2) return null
  const min=Math.min(...data), max=Math.max(...data), range=max-min||1
  const pts = data.map((v,i) => `${(i/(data.length-1))*w},${h-((v-min)/range)*(h-2)+1}`).join(' ')
  const area = `${pts} ${w},${h} 0,${h}`
  const id = `sk${color.replace(/[^a-z0-9]/gi,'')}`
  return (
    <svg width={w} height={h} style={{ display:'block' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25}/>
          <stop offset="100%" stopColor={color} stopOpacity={0}/>
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function fmtNum(v, dp=2) {
  if (v == null) return '—'
  return Number(v).toLocaleString(undefined, { minimumFractionDigits:dp, maximumFractionDigits:dp })
}

// ── News Card ─────────────────────────────────────────────────────────────────
function NewsCard({ article, accentColor }) {
  return (
    <a href={article.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none', display:'block' }}>
      <div style={{
        padding:'8px 10px', marginBottom:6,
        background:'rgba(255,255,255,0.03)',
        border:'1px solid rgba(255,255,255,0.05)',
        borderLeft:`2px solid ${accentColor}55`,
        borderRadius:6, cursor:'pointer',
        transition:'background 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}
        onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
      >
        <div style={{ color:'rgba(255,255,255,0.85)', fontSize:10, lineHeight:1.5, marginBottom:4 }}>{article.title}</div>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:8 }}>
          <span style={{ color:'#60a5fa', fontWeight:600 }}>{article.source}</span>
          <span style={{ color:'rgba(255,255,255,0.2)' }}>·</span>
          <span style={{ color:'rgba(255,255,255,0.3)' }}>{article.time}</span>
          <span style={{ marginLeft:'auto', color:'rgba(255,255,255,0.2)' }}>↗</span>
        </div>
      </div>
    </a>
  )
}

// ── Stock Card ────────────────────────────────────────────────────────────────
function StockCard({ stock, currency }) {
  if (!stock) return null
  const up = (stock.change_pct || 0) >= 0
  const col = stock.error ? 'rgba(255,255,255,0.2)' : up ? '#22c55e' : '#ef4444'
  const price = stock.local_price ?? stock.price
  const curr = currency || stock.display_currency || stock.currency || 'USD'
  const isOpen = stock.market_state === 'REGULAR'
  return (
    <div style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${col}20`, borderRadius:8, padding:'10px 12px', marginBottom:8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
        <div>
          <div style={{ fontWeight:700, color:'#fff', fontSize:12 }}>{stock.display_name || stock.symbol}</div>
          <div style={{ fontSize:8, color:'rgba(255,255,255,0.3)', marginTop:2, display:'flex', gap:5, alignItems:'center' }}>
            {stock.symbol}
            <span style={{ padding:'1px 4px', borderRadius:3, background:isOpen?'rgba(34,197,94,0.15)':'rgba(255,255,255,0.05)', color:isOpen?'#22c55e':'rgba(255,255,255,0.25)', fontSize:7 }}>{isOpen?'OPEN':'CLOSED'}</span>
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{curr} {fmtNum(price)}</div>
          {!stock.error && stock.change_pct != null && (
            <div style={{ fontSize:10, color:col }}>{up?'▲':'▼'} {Math.abs(stock.change_pct).toFixed(2)}%</div>
          )}
          {stock.error && <div style={{ fontSize:8, color:'rgba(255,255,255,0.25)' }}>Unavailable</div>}
        </div>
      </div>
      {stock.sparkline?.length > 1 && (
        <Sparkline data={stock.sparkline} color={col} h={32} w={240} />
      )}
      {!stock.error && stock.high && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:3, marginTop:6 }}>
          {[['H', stock.high], ['L', stock.low], ['PREV', stock.prev_close]].map(([l,v]) => (
            <div key={l} style={{ background:'rgba(255,255,255,0.04)', borderRadius:3, padding:'3px 5px' }}>
              <div style={{ color:'rgba(255,255,255,0.3)', fontSize:7 }}>{l}</div>
              <div style={{ color:'rgba(255,255,255,0.7)', fontSize:9, fontWeight:600 }}>{fmtNum(v)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Commodity Row ─────────────────────────────────────────────────────────────
function CommodityRow({ item, currency }) {
  if (!item) return null
  const up = (item.change_pct || 0) >= 0
  const col = item.error ? 'rgba(255,255,255,0.2)' : up ? '#22c55e' : '#ef4444'
  const price = item.local_price ?? item.price
  const curr = currency || item.display_currency || 'USD'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 8px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.04)', borderRadius:6, marginBottom:5 }}>
      <span style={{ fontSize:16, flexShrink:0 }}>{item.icon || '📦'}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:600, color:'#fff', fontSize:10, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.display_name}</div>
        <div style={{ color:'rgba(255,255,255,0.3)', fontSize:8 }}>{item.unit}</div>
      </div>
      {item.sparkline?.length > 1 && <Sparkline data={item.sparkline} color={col} h={20} w={55}/>}
      <div style={{ textAlign:'right', flexShrink:0 }}>
        <div style={{ fontWeight:700, color:'#fff', fontSize:11 }}>{curr} {fmtNum(price)}</div>
        {!item.error && item.change_pct != null && (
          <div style={{ fontSize:9, color:col }}>{up?'▲':'▼'}{Math.abs(item.change_pct).toFixed(2)}%</div>
        )}
        {item.error && <div style={{ fontSize:8, color:'rgba(255,255,255,0.25)' }}>N/A</div>}
      </div>
    </div>
  )
}

// ── Forecast View ─────────────────────────────────────────────────────────────
function ForecastView({ country, currency, stocks }) {
  const [years, setYears] = useState(10)
  const [data, setData]   = useState(null)
  const [loading, setL]   = useState(false)
  const [error, setErr]   = useState(null)

  async function run() {
    setL(true); setErr(null)
    try {
      const r = await fetch(`${API}/api/forecast/${encodeURIComponent(country)}?years=${years}`, { signal: AbortSignal.timeout(15000) })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      setData(await r.json())
    } catch(e) { setErr('Backend needed: python app.py') }
    setL(false)
  }

  const DC = { BUY:'#22c55e', SELL:'#ef4444', HOLD:'#eab308' }
  const OC = { CALL:'#22c55e', PUT:'#ef4444' }
  const curr = currency || 'USD'

  return (
    <div>
      <div style={{ display:'flex', gap:5, marginBottom:10, alignItems:'center', flexWrap:'wrap' }}>
        <span style={{ color:'rgba(255,255,255,0.4)', fontSize:8, letterSpacing:1 }}>HORIZON:</span>
        {[5,10,15,20].map(y => (
          <button key={y} onClick={() => setYears(y)} style={{ padding:'4px 8px', borderRadius:5, border:'none', cursor:'pointer', background:years===y?'rgba(30,120,255,0.3)':'rgba(255,255,255,0.06)', color:years===y?'#60a5fa':'rgba(255,255,255,0.5)', fontSize:9, fontWeight:years===y?700:400, fontFamily:'var(--font-mono)', border:years===y?'1px solid rgba(30,120,255,0.4)':'1px solid rgba(255,255,255,0.08)' }}>{y}Y</button>
        ))}
        <button onClick={run} disabled={loading} style={{ marginLeft:'auto', padding:'5px 10px', borderRadius:6, border:'none', cursor:'pointer', background:'linear-gradient(135deg,#1e78ff,#06b6d4)', color:'#fff', fontSize:9, fontWeight:700, fontFamily:'var(--font-mono)', opacity:loading?0.6:1 }}>
          {loading ? '...' : 'RUN ▶'}
        </button>
      </div>

      {error && <div style={{ color:'#ef4444', fontSize:9, padding:'6px 8px', background:'rgba(239,68,68,0.08)', borderRadius:5, marginBottom:8 }}>{error}</div>}

      {data?.forecasts?.map((fc, i) => {
        const rc = DC[fc.recommendation] || '#aaa'
        const oc = OC[fc.option] || '#aaa'
        return (
          <div key={i} style={{ marginBottom:10, padding:'10px', background:'rgba(255,255,255,0.03)', border:`1px solid ${rc}22`, borderRadius:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
              <span style={{ fontWeight:700, color:'#fff', fontSize:11 }}>{fc.name || fc.symbol}</span>
              <span style={{ padding:'2px 6px', borderRadius:3, fontSize:8, fontWeight:700, background:rc+'22', color:rc, border:`1px solid ${rc}44` }}>{fc.recommendation}</span>
              <span style={{ padding:'2px 6px', borderRadius:3, fontSize:8, fontWeight:700, background:oc+'18', color:oc, border:`1px solid ${oc}35` }}>{fc.option}</span>
              <span style={{ marginLeft:'auto', color:'rgba(255,255,255,0.3)', fontSize:8 }}>{fc.target_year}</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:4, marginBottom:7 }}>
              {[['NOW', fc.current_local, 'rgba(255,255,255,0.5)'], ['BEAR', fc.bear_case, '#ef4444'], ['BASE', fc.base_case, '#60a5fa'], ['BULL', fc.bull_case, '#22c55e']].map(([l,v,c]) => (
                <div key={l} style={{ background:'rgba(255,255,255,0.04)', borderRadius:4, padding:'5px 4px', textAlign:'center' }}>
                  <div style={{ color:'rgba(255,255,255,0.3)', fontSize:7, marginBottom:2 }}>{l}</div>
                  <div style={{ fontWeight:700, color:c, fontSize:9 }}>{v != null ? Number(v).toLocaleString(undefined,{maximumFractionDigits:0}) : '—'}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:4 }}>
              <div style={{ flex:1, padding:'4px 5px', background:'rgba(34,197,94,0.08)', borderRadius:4, textAlign:'center' }}>
                <div style={{ color:'rgba(255,255,255,0.3)', fontSize:7 }}>UPSIDE</div>
                <div style={{ color:'#22c55e', fontWeight:700, fontSize:10 }}>{fc.upside_pct > 0 ? '+' : ''}{fc.upside_pct}%</div>
              </div>
              <div style={{ flex:1, padding:'4px 5px', background:'rgba(239,68,68,0.08)', borderRadius:4, textAlign:'center' }}>
                <div style={{ color:'rgba(255,255,255,0.3)', fontSize:7 }}>BEAR CASE</div>
                <div style={{ color:'#ef4444', fontWeight:700, fontSize:10 }}>{fc.downside_pct}%</div>
              </div>
              <div style={{ flex:1, padding:'4px 5px', background:'rgba(96,165,250,0.08)', borderRadius:4, textAlign:'center' }}>
                <div style={{ color:'rgba(255,255,255,0.3)', fontSize:7 }}>CONF</div>
                <div style={{ color:'#60a5fa', fontWeight:700, fontSize:10 }}>{fc.confidence}%</div>
              </div>
            </div>
            {fc.reasons?.length > 0 && (
              <div style={{ marginTop:6, borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:5 }}>
                {fc.reasons.map((r,j) => <div key={j} style={{ fontSize:8, color:'rgba(255,255,255,0.4)', marginBottom:2 }}>▸ {r}</div>)}
              </div>
            )}
          </div>
        )
      })}

      {!data && !loading && (
        <div style={{ padding:16, textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:10 }}>
          Select horizon → click RUN<br/>
          <span style={{ fontSize:8, color:'rgba(255,255,255,0.2)' }}>Uses compound growth + geopolitical risk model</span>
        </div>
      )}
      <div style={{ padding:'6px 8px', background:'rgba(234,179,8,0.05)', border:'1px solid rgba(234,179,8,0.15)', borderRadius:5, fontSize:7, color:'rgba(255,255,255,0.3)', marginTop:6 }}>
        ⚠ Forecasts are educational estimates only. Not financial advice.
      </div>
    </div>
  )
}

// ── Loading Skeleton ──────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ padding:'4px 0' }}>
      <div style={{ height:24, borderRadius:5, background:'rgba(255,255,255,0.05)', marginBottom:10 }}/>
      {[85,70,90,60,75].map((w,i) => (
        <div key={i} style={{ marginBottom:7, padding:'8px 10px', background:'rgba(255,255,255,0.03)', borderRadius:6, borderLeft:'2px solid rgba(255,255,255,0.05)' }}>
          <div style={{ height:10, borderRadius:3, background:'rgba(255,255,255,0.06)', marginBottom:6, width:`${w}%` }}/>
          <div style={{ height:8, borderRadius:3, background:'rgba(255,255,255,0.04)', width:'40%' }}/>
        </div>
      ))}
    </div>
  )
}

// ── Main CountryPanel Component ───────────────────────────────────────────────
export default function CountryPanel({ country, onClose, inline = false }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [tab, setTab]         = useState('NEWS')
  const [spinning, setSpinning] = useState(false)
  const timerRef = useRef(null)

  const t = getTension(country)
  const accentCol = LC[t.level] || '#3b82f6'

  async function loadData(isRefresh = false) {
    if (isRefresh) setSpinning(true)
    else { setLoading(true); setError(null) }
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)
      const res = await fetch(`${API}/api/country/${encodeURIComponent(country)}`, { signal: controller.signal })
      clearTimeout(timeout)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (e) {
      console.error('CountryPanel fetch error:', e)
      if (!data) setError(e.name === 'AbortError' ? 'Request timed out. Is backend running?' : `Backend error: ${e.message}`)
    } finally {
      setLoading(false)
      setSpinning(false)
    }
  }

  useEffect(() => {
    if (!country) return
    setData(null)
    setTab('NEWS')
    loadData()
    timerRef.current = setInterval(() => loadData(true), 60000)
    return () => clearInterval(timerRef.current)
  }, [country])

  const currency = data?.currency || 'USD'

  // When inline=true (inside EarthPulse right panel), render compact without absolute positioning
  const containerStyle = inline ? {
    display:'flex', flexDirection:'column', height:'100%', overflow:'hidden',
  } : {
    position:'absolute', top:0, right:0, bottom:0, width:390, zIndex:50,
    background:'rgba(3,8,18,0.98)',
    borderLeft:'1px solid rgba(30,120,255,0.2)',
    display:'flex', flexDirection:'column',
    boxShadow:'-12px 0 48px rgba(0,0,0,0.6)',
    animation:'slide-in-right 0.28s ease',
  }

  return (
    <div style={containerStyle}>

      {/* Header */}
      <div style={{ padding:'10px 13px 8px', borderBottom:'1px solid rgba(255,255,255,0.06)', background:accentCol+'0d', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:20 }}>{data?.flag || '🌍'}</span>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#fff', fontFamily:'var(--font-display)', lineHeight:1.2 }}>{country}</div>
              <div style={{ fontSize:8, color:'rgba(255,255,255,0.35)', marginTop:1 }}>{data?.currency && `${data.currency} · `}BBC · Yahoo Finance · Live</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:5 }}>
            <button onClick={() => loadData(true)} title="Refresh" style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.5)', width:24, height:24, borderRadius:5, cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', transform:spinning?'rotate(180deg)':'none', transition:'transform 0.5s' }}>⟳</button>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.5)', width:24, height:24, borderRadius:5, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
          </div>
        </div>
        {/* GTI bar */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:8, marginBottom:3 }}>
            <span style={{ color:'rgba(255,255,255,0.35)', letterSpacing:1 }}>GEOPOLITICAL TENSION INDEX</span>
            <span style={{ color:accentCol, fontWeight:700 }}>{t.gti}/100 · <span style={{ color:accentCol }}>{t.level}</span></span>
          </div>
          <div style={{ height:4, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${t.gti}%`, borderRadius:2, background:`linear-gradient(90deg,${accentCol}88,${accentCol})`, transition:'width 1s ease' }}/>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
        {[{k:'NEWS',i:'📰',l:'NEWS'},{k:'MARKET',i:'📈',l:'STOCKS'},{k:'COMMODITIES',i:'🛢️',l:'COMM.'},{k:'FORECAST',i:'🔮',l:'FORECAST'}].map(({k,i,l}) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex:1, padding:'7px 2px', border:'none', background:'transparent', color:tab===k?'#60a5fa':'rgba(255,255,255,0.35)', fontSize:8, fontWeight:tab===k?700:400, cursor:'pointer', borderBottom:tab===k?'2px solid #3b82f6':'2px solid transparent', fontFamily:'var(--font-mono)', letterSpacing:0.5, transition:'all 0.15s' }}>
            {i} {l}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex:1, overflow:'auto', padding:'10px 12px' }}>

        {loading && <Skeleton />}

        {!loading && error && (
          <div style={{ padding:16, textAlign:'center', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, marginTop:8 }}>
            <div style={{ fontSize:20, marginBottom:8 }}>⚠</div>
            <div style={{ color:'#ef4444', fontSize:10, marginBottom:6 }}>{error}</div>
            <div style={{ color:'rgba(255,255,255,0.4)', fontSize:9, lineHeight:1.6 }}>
              Make sure the backend is running:<br/>
              <code style={{ color:'#60a5fa' }}>cd backend</code><br/>
              <code style={{ color:'#60a5fa' }}>python app.py</code>
            </div>
            <button onClick={() => loadData()} style={{ marginTop:10, padding:'6px 14px', background:'rgba(30,120,255,0.2)', border:'1px solid rgba(30,120,255,0.4)', color:'#60a5fa', borderRadius:6, cursor:'pointer', fontSize:9, fontFamily:'var(--font-mono)' }}>Retry</button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {tab === 'NEWS' && (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10, padding:'5px 8px', background:'rgba(30,120,255,0.07)', border:'1px solid rgba(30,120,255,0.2)', borderRadius:5 }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:'#22c55e', animation:'pulse-dot 1.5s infinite' }}/>
                  <span style={{ color:'#60a5fa', fontSize:8, fontWeight:700 }}>LIVE</span>
                  <span style={{ color:'rgba(255,255,255,0.4)', fontSize:8 }}>BBC · Reuters · AJ · Guardian · {data.news?.length || 0} articles · newest first</span>
                </div>
                {!data.news?.length && (
                  <div style={{ padding:20, textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:10 }}>
                    No recent news found for {country}.<br/>
                    <span style={{ fontSize:8 }}>Check internet connection.</span>
                  </div>
                )}
                {(data.news || []).map((a, i) => <NewsCard key={i} article={a} accentColor={accentCol} />)}
              </div>
            )}

            {tab === 'MARKET' && (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10, padding:'5px 8px', background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:5 }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:'#22c55e', animation:'pulse-dot 1.5s infinite' }}/>
                  <span style={{ color:'#22c55e', fontSize:8, fontWeight:700 }}>LIVE</span>
                  <span style={{ color:'rgba(255,255,255,0.4)', fontSize:8 }}>Yahoo Finance · Prices in <strong style={{color:'#fff'}}>{currency}</strong></span>
                </div>
                {!data.stocks?.length && <div style={{ padding:16, textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:10 }}>No market data available.</div>}
                {(data.stocks || []).map((s, i) => <StockCard key={i} stock={s} currency={currency} />)}
                <div style={{ padding:'5px 8px', background:'rgba(234,179,8,0.05)', border:'1px solid rgba(234,179,8,0.15)', borderRadius:5, fontSize:7, color:'rgba(255,255,255,0.3)', marginTop:6 }}>
                  ⚠ Yahoo Finance. May be delayed 15–20 min. Not financial advice.
                </div>
              </div>
            )}

            {tab === 'COMMODITIES' && (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10, padding:'5px 8px', background:'rgba(249,115,22,0.06)', border:'1px solid rgba(249,115,22,0.2)', borderRadius:5 }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:'#f97316', animation:'pulse-dot 1.5s infinite' }}/>
                  <span style={{ color:'#f97316', fontSize:8, fontWeight:700 }}>LIVE</span>
                  <span style={{ color:'rgba(255,255,255,0.4)', fontSize:8 }}>Yahoo Finance · Prices in <strong style={{color:'#fff'}}>{currency}</strong></span>
                </div>
                {!data.commodities?.length && <div style={{ padding:16, textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:10 }}>No commodity data available.</div>}
                {(data.commodities || []).map((c, i) => <CommodityRow key={i} item={c} currency={currency} />)}
              </div>
            )}

            {tab === 'FORECAST' && (
              <ForecastView country={country} currency={currency} stocks={data.stocks || []} />
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding:'4px 12px', flexShrink:0, borderTop:'1px solid rgba(255,255,255,0.04)', display:'flex', justifyContent:'space-between' }}>
        <span style={{ fontSize:7, color:'rgba(255,255,255,0.2)' }}>{data?.fetched_at ? `Updated ${new Date(data.fetched_at).toLocaleTimeString()}` : 'Loading...'}</span>
        <span style={{ fontSize:7, color:'rgba(255,255,255,0.15)' }}>Auto-refresh 60s</span>
      </div>
    </div>
  )
}

// Named export for forecast standalone use
export { ForecastView }
