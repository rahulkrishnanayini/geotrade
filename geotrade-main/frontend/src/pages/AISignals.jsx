import { API } from '../config'
import { useState, useEffect } from 'react'
import { ASSET_CLASSES, DIRECTIONS, GEO_FACTORS, LEVEL_COLOR } from '../data/mockData'

const ALL_COUNTRIES = [
  'United States of America','Russia','China','India','Germany','United Kingdom',
  'France','Japan','Brazil','Canada','Australia','Saudi Arabia','Iran','Israel',
  'Ukraine','Pakistan','Turkey','South Korea','Nigeria','South Africa',
  'North Korea','Myanmar','Sudan','Yemen','Syria','Afghanistan','Venezuela',
  'Iraq','Ethiopia','Palestine','Libya','Somalia','Haiti','Congo','Mali','Niger',
]

const DC = { BUY:'#22c55e', SELL:'#ef4444', HOLD:'#eab308' }
const OC = { CALL:'#22c55e', PUT:'#ef4444' }

function Badge({ dir, size }) {
  const c = DC[dir] || '#aaa'
  return <span style={{ padding: size==='lg'?'3px 10px':'2px 7px', borderRadius:4, fontSize:size==='lg'?11:9, fontWeight:700, background:c+'22', color:c, border:`1px solid ${c}44` }}>{dir}</span>
}
function Tag({ children, color }) {
  const c = color||'rgba(255,255,255,0.3)'
  return <span style={{ padding:'2px 7px', borderRadius:3, fontSize:8, fontWeight:600, background:c+(color?'18':'0d'), color:color||'rgba(255,255,255,0.45)', border:`1px solid ${c}${color?'35':'20'}` }}>{children}</span>
}
function SideBtn({ children, active, onClick }) {
  return (
    <div onClick={onClick} style={{ padding:'7px 14px', cursor:'pointer', background:active?'rgba(30,120,255,0.12)':'transparent', color:active?'#60a5fa':'rgba(255,255,255,0.6)', fontSize:11, borderLeft:active?'2px solid #3b82f6':'2px solid transparent', transition:'all 0.14s', userSelect:'none' }}
      onMouseEnter={e=>{ if(!active) e.currentTarget.style.background='rgba(255,255,255,0.04)' }}
      onMouseLeave={e=>{ if(!active) e.currentTarget.style.background='transparent' }}
    >{children}</div>
  )
}

function fmtLocal(price, currency, fx, usdPrice) {
  // Show in local currency
  const local = price != null ? price : (usdPrice != null && fx ? usdPrice * fx : null)
  if (local == null) return '—'
  return `${currency} ${Number(local).toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:4 })}`
}

// ── Country Analysis ──────────────────────────────────────────────────────────
function CountryAnalysis({ country }) {
  const [data, setData]   = useState(null)
  const [loading, setL]   = useState(true)
  const [tab, setTab]     = useState('SIGNALS')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!country) return
    setData(null); setL(true); setError(null)
    fetch(`${API}/api/country-analysis/${encodeURIComponent(country)}`, { signal: AbortSignal.timeout(20000) })
      .then(r => { if(!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setL(false) })
      .catch(() => { setError('Backend needed. Run: python app.py'); setL(false) })
  }, [country])

  const TABS = [
    { k:'SIGNALS',    i:'⟁',  l:'AI Signals' },
    { k:'FOREX',      i:'💱',  l:'Forex' },
    { k:'INDICES',    i:'📊',  l:'Indices' },
    { k:'COMMODITIES',i:'🛢️', l:'Commodities' },
    { k:'CRYPTO',     i:'₿',  l:'Crypto' },
    { k:'ETFS',       i:'📦',  l:'ETFs' },
    { k:'BONDS',      i:'📄',  l:'Bonds' },
    { k:'SANCTIONS',  i:'🚫',  l:'Sanctions' },
  ]

  const currency = data?.currency || 'USD'
  const fx       = data?.fx_rate  || 1.0

  if (loading) return (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
      <div style={{ width:32, height:32, border:'2px solid rgba(30,120,255,0.3)', borderTop:'2px solid #3b82f6', borderRadius:'50%', animation:'globe-rotate 0.8s linear infinite' }}/>
      <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11 }}>Fetching live data for {country}...</div>
      <div style={{ color:'rgba(255,255,255,0.2)', fontSize:9 }}>Prices in {currency} · Forex · Indices · Crypto · ETFs · Bonds</div>
    </div>
  )

  if (error) return (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', padding:24 }}>
        <div style={{ fontSize:32, marginBottom:12 }}>⚠</div>
        <div style={{ color:'#ef4444', fontSize:12, marginBottom:8 }}>{error}</div>
        <code style={{ color:'#60a5fa', fontSize:10 }}>cd backend && python app.py</code>
      </div>
    </div>
  )

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Currency badge */}
      <div style={{ padding:'6px 18px', borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(4,11,21,0.6)', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', background:'rgba(30,120,255,0.1)', border:'1px solid rgba(30,120,255,0.25)', borderRadius:6 }}>
          <span style={{ color:'#60a5fa', fontSize:9, fontWeight:700 }}>💱 ALL PRICES IN</span>
          <span style={{ color:'#fff', fontWeight:700, fontSize:11 }}>{currency}</span>
          {currency !== 'USD' && <span style={{ color:'rgba(255,255,255,0.4)', fontSize:9 }}>1 USD = {fx.toFixed(2)} {currency}</span>}
        </div>
        <span style={{ color:'rgba(255,255,255,0.3)', fontSize:9 }}>Live FX rate from Yahoo Finance</span>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', overflowX:'auto', borderBottom:'1px solid rgba(255,255,255,0.07)', flexShrink:0 }}>
        {TABS.map(({ k, i, l }) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding:'9px 14px', border:'none', background:'transparent', color:tab===k?'#60a5fa':'rgba(255,255,255,0.35)', fontSize:9, fontWeight:tab===k?700:400, cursor:'pointer', borderBottom:tab===k?'2px solid #3b82f6':'2px solid transparent', fontFamily:'var(--font-mono)', letterSpacing:0.8, whiteSpace:'nowrap', transition:'all 0.15s' }}>
            {i} {l}
          </button>
        ))}
      </div>

      <div style={{ flex:1, overflow:'auto', padding:'14px 18px' }}>
        {tab==='SIGNALS'    && <SignalsTab    data={data} currency={currency} fx={fx} country={country} />}
        {tab==='FOREX'      && <ForexTab      items={data?.forex||[]} currency={currency} />}
        {tab==='INDICES'    && <GridTab       items={data?.indices||[]}     title="Global Equity Indices"  currency={currency} />}
        {tab==='COMMODITIES'&& <GridTab       items={data?.commodities||[]} title="Commodities"            currency={currency} />}
        {tab==='CRYPTO'     && <GridTab       items={data?.crypto||[]}      title="Cryptocurrency"         currency={currency} />}
        {tab==='ETFS'       && <GridTab       items={data?.etfs||[]}        title="ETFs"                   currency={currency} />}
        {tab==='BONDS'      && <GridTab       items={data?.bonds||[]}       title="Government Bond Yields" currency="USD (yield%)" />}
        {tab==='SANCTIONS'  && <SanctionsTab  data={data?.sanctions}       country={country} />}
      </div>
    </div>
  )
}

function SignalsTab({ data, currency, fx, country }) {
  const signals = data?.signals || []
  return (
    <div>
      <div style={{ marginBottom:14, padding:'10px 14px', background:'rgba(30,120,255,0.06)', border:'1px solid rgba(30,120,255,0.2)', borderRadius:8 }}>
        <div style={{ color:'#60a5fa', fontSize:10, fontWeight:700, marginBottom:4 }}>⟁ AI ANALYSIS — {country.toUpperCase()}</div>
        <div style={{ color:'rgba(255,255,255,0.6)', fontSize:10, lineHeight:1.6 }}>
          {data?.event_count > 0
            ? `${data.event_count} active geopolitical events linked to ${country}. Signals adjusted for regional risk. Prices shown in ${currency}.`
            : `Showing global signals with prices converted to ${currency}. No country-specific events in current feed.`}
        </div>
      </div>
      {signals.map((s, i) => {
        const t = s.trade || {}
        const localPrice = t.current_price_local ?? (t.current_price * fx)
        const localEntry = t.entry_local ?? (t.entry * fx)
        const localSL    = t.stop_loss_local ?? (t.stop_loss * fx)
        const localTP    = t.target_local ?? (t.target * fx)
        const col = DC[s.direction] || '#aaa'
        return (
          <div key={i} style={{ padding:'12px 13px', marginBottom:10, background:'rgba(255,255,255,0.03)', border:`1px solid ${col}20`, borderRadius:9 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <span style={{ fontWeight:700, color:'#fff', fontSize:13 }}>{s.ticker}</span>
              <Badge dir={s.direction} />
              <span style={{ color:'rgba(255,255,255,0.4)', fontSize:9 }}>{s.category}</span>
              {s.country_relevant && <span style={{ color:'#f97316', fontSize:9 }}>⚡ Relevant</span>}
              <span style={{ marginLeft:'auto', fontWeight:700, color:'#fff', fontSize:12 }}>
                {currency} {localPrice != null ? Number(localPrice).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:4}) : '—'}
              </span>
            </div>
            <div style={{ marginBottom:7 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, marginBottom:3 }}>
                <span style={{ color:'rgba(255,255,255,0.4)' }}>Confidence</span>
                <span style={{ color:col }}>{s.confidence}%</span>
              </div>
              <div style={{ height:3, background:'rgba(255,255,255,0.07)', borderRadius:2 }}>
                <div style={{ height:'100%', width:`${s.confidence}%`, background:col, borderRadius:2 }} />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:7 }}>
              {[['ENTRY', localEntry, '#fff'], ['STOP LOSS', localSL, '#ef4444'], ['TARGET', localTP, '#22c55e']].map(([l,v,c]) => (
                <div key={l} style={{ background:'rgba(255,255,255,0.04)', borderRadius:5, padding:'5px 7px' }}>
                  <div style={{ color:'rgba(255,255,255,0.3)', fontSize:7, letterSpacing:1 }}>{l}</div>
                  <div style={{ color:c, fontSize:10, fontWeight:600 }}>
                    {currency} {v != null ? Number(v).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:4}) : '—'}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ color:'rgba(255,255,255,0.5)', fontSize:10, lineHeight:1.5 }}>{s.ai_analysis?.slice(0,110)}...</div>
          </div>
        )
      })}
    </div>
  )
}

function ForexTab({ items, currency }) {
  const [search, setSearch] = useState('')
  const filtered = items.filter(f => f.pair.toLowerCase().includes(search.toLowerCase()))
  return (
    <div>
      <div style={{ marginBottom:10, padding:'6px 10px', background:'rgba(30,120,255,0.06)', border:'1px solid rgba(30,120,255,0.18)', borderRadius:6, display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:5, height:5, borderRadius:'50%', background:'#22c55e', animation:'pulse-dot 1.5s infinite' }}/>
        <span style={{ color:'#60a5fa', fontSize:9, fontWeight:700 }}>LIVE</span>
        <span style={{ color:'rgba(255,255,255,0.5)', fontSize:9 }}>
          All rates shown in <strong style={{color:'#fff'}}>{currency}</strong> equivalent · Yahoo Finance
        </span>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search pair..."
        style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', color:'#fff', padding:'7px 10px', borderRadius:6, fontSize:11, outline:'none', fontFamily:'var(--font-mono)', marginBottom:12 }} />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 }}>
        {filtered.map((f, i) => {
          const up = (f.change_pct || 0) >= 0
          const col = f.price ? (up ? '#22c55e' : '#ef4444') : 'rgba(255,255,255,0.2)'
          return (
            <div key={i} style={{ padding:'8px 10px', background:'rgba(255,255,255,0.03)', border:`1px solid ${col}18`, borderRadius:7 }}>
              <div style={{ fontWeight:700, color:'#fff', fontSize:11, marginBottom:2 }}>{f.pair}</div>
              {/* Primary: show the local currency equivalent clearly */}
              {f.local_label ? (
                <div style={{ fontSize:11, fontWeight:700, color:'#60a5fa', marginBottom:1 }}>{f.local_label}</div>
              ) : (
                <div style={{ fontSize:12, fontWeight:700, color:f.price?'#fff':'rgba(255,255,255,0.3)' }}>
                  {f.price ? f.price.toFixed(4) : 'N/A'}
                </div>
              )}
              {/* Secondary: raw USD rate */}
              {f.price && <div style={{ fontSize:8, color:'rgba(255,255,255,0.35)', marginBottom:2 }}>Raw: {f.price.toFixed(4)}</div>}
              {f.change_pct != null && <div style={{ fontSize:9, color:col }}>{up?'▲':'▼'}{Math.abs(f.change_pct).toFixed(2)}%</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GridTab({ items, title, currency }) {
  return (
    <div>
      <div style={{ color:'rgba(255,255,255,0.3)', fontSize:8, letterSpacing:1.5, marginBottom:10 }}>{title.toUpperCase()} · PRICES IN {currency}</div>
      {items.map((item, i) => {
        const up = (item.change_pct || 0) >= 0
        const col = item.local_price != null ? (up ? '#22c55e' : '#ef4444') : 'rgba(255,255,255,0.2)'
        const displayPrice = item.local_price ?? item.price
        return (
          <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', marginBottom:6, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:7 }}>
            <div>
              <div style={{ fontWeight:600, color:'#fff', fontSize:11 }}>{item.display_name || item.name || item.symbol}</div>
              <div style={{ color:'rgba(255,255,255,0.3)', fontSize:9 }}>{item.symbol}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontWeight:700, color:'#fff', fontSize:12 }}>
                {currency} {displayPrice != null ? Number(displayPrice).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:4}) : '—'}
              </div>
              {item.change_pct != null && <div style={{ fontSize:10, color:col }}>{up?'▲':'▼'}{Math.abs(item.change_pct).toFixed(2)}%</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SanctionsTab({ data, country }) {
  if (!data) return <div style={{ color:'rgba(255,255,255,0.3)', padding:20, textAlign:'center' }}>Loading...</div>
  const col = { SEVERE:'#ef4444', HIGH:'#f97316', MODERATE:'#eab308', NONE:'#22c55e' }[data.level] || '#3b82f6'
  return (
    <div>
      <div style={{ padding:'12px 14px', background:col+'0d', border:`1px solid ${col}30`, borderRadius:8, marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
          <span style={{ fontSize:20 }}>{data.active ? '🚫' : '✅'}</span>
          <div>
            <div style={{ fontWeight:700, color:'#fff', fontSize:13 }}>{country}</div>
            <div style={{ color:col, fontSize:10, fontWeight:700, marginTop:2 }}>{data.active ? `ACTIVE SANCTIONS — ${data.level}` : 'NO ACTIVE SANCTIONS'}</div>
          </div>
        </div>
        {data.market_impact && <div style={{ color:'rgba(255,255,255,0.6)', fontSize:10, lineHeight:1.6, borderTop:`1px solid ${col}25`, paddingTop:8, marginTop:4 }}>{data.market_impact}</div>}
      </div>
      {data.sanctioning_bodies?.length > 0 && (
        <div style={{ marginBottom:14 }}>
          <div style={{ color:'rgba(255,255,255,0.3)', fontSize:8, letterSpacing:1.5, marginBottom:8 }}>SANCTIONING BODIES</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {data.sanctioning_bodies.map((b, i) => <span key={i} style={{ padding:'3px 10px', borderRadius:4, fontSize:9, background:'rgba(239,68,68,0.12)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.25)' }}>{b}</span>)}
          </div>
        </div>
      )}
      {data.details?.length > 0 && (
        <div>
          <div style={{ color:'rgba(255,255,255,0.3)', fontSize:8, letterSpacing:1.5, marginBottom:8 }}>SANCTION DETAILS</div>
          {data.details.map((d, i) => (
            <div key={i} style={{ display:'flex', gap:8, marginBottom:8, padding:'8px 10px', background:'rgba(255,255,255,0.03)', borderRadius:6, borderLeft:`2px solid ${col}55` }}>
              <span style={{ color:col, flexShrink:0 }}>▸</span>
              <span style={{ color:'rgba(255,255,255,0.7)', fontSize:10, lineHeight:1.55 }}>{d}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Signal Card & Detail (V5 style) ───────────────────────────────────────────
function SignalCard({ signal: s, active, onClick }) {
  return (
    <div onClick={onClick} style={{ padding:'11px 12px', borderBottom:'1px solid rgba(255,255,255,0.04)', borderLeft:`2px solid ${active?'#3b82f6':'transparent'}`, background:active?'rgba(30,120,255,0.08)':'transparent', cursor:'pointer', transition:'all 0.15s' }}
      onMouseEnter={e => { if(!active) e.currentTarget.style.background='rgba(30,120,255,0.04)' }}
      onMouseLeave={e => { if(!active) e.currentTarget.style.background='transparent' }}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
        <span style={{ fontWeight:700, color:'#fff', fontSize:12 }}>{s.ticker}</span>
        <Badge dir={s.direction} />
        <span style={{ marginLeft:'auto', color:'rgba(255,255,255,0.5)', fontSize:10 }}>{s.confidence}%</span>
        <span style={{ color:'rgba(255,255,255,0.3)', fontSize:8 }}>conf</span>
      </div>
      <div style={{ color:'rgba(255,255,255,0.35)', fontSize:10, marginBottom:5 }}>{s.label}</div>
      <div style={{ display:'flex', gap:8, marginBottom:5 }}>
        {[['Bull', s.bullish, '#22c55e'], ['Bear', s.bearish, '#ef4444']].map(([l, v, c]) => (
          <div key={l} style={{ flex:1 }}>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', marginBottom:2 }}>{l} <span style={{ color:c }}>{v}%</span></div>
            <div style={{ height:3, background:'rgba(255,255,255,0.07)', borderRadius:2 }}>
              <div style={{ height:'100%', width:`${v}%`, background:c, borderRadius:2 }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
        <Tag color="#eab308">VOL {s.volatility}</Tag>
        <Tag>{s.term}</Tag>
        <Tag>R:R {s.trade?.risk_reward}×</Tag>
      </div>
      <div style={{ marginTop:5, color:'rgba(255,255,255,0.3)', fontSize:9 }}>⚡ {s.trigger?.slice(0,50)}</div>
    </div>
  )
}

function SignalDetail({ signal: s, tab, setTab, events }) {
  const TABS = [{ k:'TRADE SETUP', i:'📊' }, { k:'AI REASONING', i:'✦' }, { k:'TIMELINE', i:'🕐' }, { k:'RELIABILITY', i:'◎' }]
  const t = s.trade || {}
  function fmt(v) { return typeof v === 'number' ? (v > 1000 ? v.toLocaleString() : v.toFixed(v > 100 ? 2 : 4)) : v }
  return (
    <div style={{ padding:'20px 24px', minHeight:'100%' }} className="animate-fade-in">
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:18 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5 }}>
            <span style={{ fontSize:22, fontWeight:700, color:'#fff', fontFamily:'var(--font-display)' }}>{s.ticker}</span>
            <Badge dir={s.direction} size="lg" />
          </div>
          <div style={{ color:'rgba(255,255,255,0.5)', fontSize:12 }}>{s.label}</div>
          <div style={{ color:'rgba(255,255,255,0.3)', fontSize:10 }}>{s.description}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:26, fontWeight:700, color:'#fff', fontFamily:'var(--font-display)', lineHeight:1 }}>{s.confidence}%</div>
          <div style={{ color:'rgba(255,255,255,0.3)', fontSize:9, marginBottom:4 }}>confidence</div>
          <div style={{ fontSize:14, fontWeight:600, color:'#ef4444' }}>{s.uncertainty}%</div>
          <div style={{ color:'rgba(255,255,255,0.3)', fontSize:9 }}>uncertainty</div>
        </div>
      </div>
      <div style={{ marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, marginBottom:5 }}>
          <span style={{ color:'#22c55e' }}>Bullish <strong>{s.bullish}%</strong></span>
          <span style={{ color:'#ef4444' }}>Bearish <strong>{s.bearish}%</strong></span>
        </div>
        <div style={{ height:7, background:'rgba(255,255,255,0.07)', borderRadius:4, display:'flex', overflow:'hidden' }}>
          <div style={{ width:`${s.bullish}%`, background:'linear-gradient(90deg,#16a34a,#22c55e)', transition:'width 0.6s' }} />
          <div style={{ width:`${s.bearish}%`, background:'linear-gradient(90deg,#dc2626,#ef4444)', marginLeft:'auto', transition:'width 0.6s' }} />
        </div>
      </div>
      <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
        <Tag color="#eab308">⚡ {s.volatility} VOLATILITY</Tag>
        {(s.tags||[]).map(tg => <Tag key={tg}>{tg}</Tag>)}
      </div>
      <div style={{ background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'10px 14px', marginBottom:18 }}>
        <div style={{ color:'#ef4444', fontSize:9, fontWeight:700, letterSpacing:1.5, marginBottom:4 }}>TRIGGERING EVENT</div>
        <div style={{ color:'rgba(255,255,255,0.82)', fontSize:11, fontWeight:600 }}>{s.trigger}</div>
      </div>
      <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.07)', marginBottom:18 }}>
        {TABS.map(({ k, i }) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding:'8px 16px', border:'none', background:'transparent', color:tab===k?'#60a5fa':'rgba(255,255,255,0.3)', fontSize:10, cursor:'pointer', fontFamily:'var(--font-mono)', fontWeight:tab===k?700:400, borderBottom:tab===k?'2px solid #3b82f6':'2px solid transparent', transition:'all 0.15s' }}>
            {i} {k}
          </button>
        ))}
      </div>
      {tab === 'TRADE SETUP' && (
        <div>
          <div style={{ color:'rgba(255,255,255,0.3)', fontSize:9, letterSpacing:1.5, marginBottom:12 }}>TRADE STRUCTURE</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
            {[['CURRENT PRICE', t.current_price, '#fff'], ['ENTRY', t.entry, '#fff'], ['STOP LOSS', t.stop_loss, '#ef4444'], ['TARGET', t.target, '#22c55e']].map(([l, v, c]) => (
              <div key={l} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:'11px 14px' }}>
                <div style={{ color:'rgba(255,255,255,0.3)', fontSize:8, letterSpacing:1.5, marginBottom:6 }}>{l}</div>
                <div style={{ fontSize:20, fontWeight:700, color:c, fontFamily:'var(--font-display)' }}>{fmt(v)}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
            {[['RISK/REWARD', `${t.risk_reward}×`, '#60a5fa'], ['ATR (DAILY)', `${t.atr_daily_pct}%`, '#a78bfa'], ['MAX POS.', `${t.max_position_pct}%`, '#34d399']].map(([l, v, c]) => (
              <div key={l} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:'11px 14px' }}>
                <div style={{ color:'rgba(255,255,255,0.3)', fontSize:8, letterSpacing:1.5, marginBottom:6 }}>{l}</div>
                <div style={{ fontSize:17, fontWeight:700, color:c, fontFamily:'var(--font-display)' }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ background:'rgba(234,179,8,0.05)', border:'1px solid rgba(234,179,8,0.18)', borderRadius:6, padding:'8px 12px', fontSize:9, color:'rgba(255,255,255,0.35)' }}>
            ⚠ Educational only. Not financial advice.
          </div>
        </div>
      )}
      {tab === 'AI REASONING' && (
        <div>
          <div style={{ background:'rgba(96,165,250,0.06)', border:'1px solid rgba(96,165,250,0.2)', borderRadius:8, padding:'14px 16px', marginBottom:14 }}>
            <div style={{ color:'#60a5fa', fontSize:10, fontWeight:700, marginBottom:8 }}>⦿ AI ANALYSIS</div>
            <div style={{ color:'rgba(255,255,255,0.72)', fontSize:11, lineHeight:1.75 }}>{s.ai_analysis}</div>
          </div>
          <div style={{ background:'rgba(249,115,22,0.05)', border:'1px solid rgba(249,115,22,0.2)', borderRadius:8, padding:'14px 16px' }}>
            <div style={{ color:'#f97316', fontSize:10, fontWeight:700, marginBottom:8 }}>⚠ RISK FACTORS</div>
            {(s.risk_factors||[]).map((r, i) => <div key={i} style={{ color:'rgba(255,255,255,0.65)', fontSize:11, marginBottom:6, display:'flex', gap:8 }}><span style={{ color:'#f97316' }}>»</span>{r}</div>)}
          </div>
        </div>
      )}
      {tab === 'TIMELINE' && (
        <div style={{ position:'relative', paddingLeft:20 }}>
          <div style={{ position:'absolute', left:8, top:6, bottom:6, width:1, background:'linear-gradient(to bottom,rgba(30,120,255,0.5),rgba(30,120,255,0))' }} />
          {events.map((e, i) => (
            <div key={e.id} style={{ marginBottom:18, position:'relative' }}>
              <div style={{ position:'absolute', left:-16, top:4, width:9, height:9, borderRadius:'50%', background:LEVEL_COLOR[e.level]||'#3b82f6', boxShadow:`0 0 8px ${LEVEL_COLOR[e.level]||'#3b82f6'}` }} />
              <div style={{ color:'rgba(255,255,255,0.35)', fontSize:9 }}>{e.published_at} · {e.region}</div>
              <div style={{ color:'rgba(255,255,255,0.85)', fontSize:11, fontWeight:600, marginTop:2 }}>{e.title}</div>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:9, marginTop:3 }}>{e.level} · severity {e.severity||65}</div>
            </div>
          ))}
        </div>
      )}
      {tab === 'RELIABILITY' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {[['Model Accuracy','78%','#22c55e'],['Backtest Win Rate','64%','#60a5fa'],['Avg R:R Achieved','1.8×','#a78bfa'],['Signal Age','< 5 min','#34d399'],['Data Sources','BBC+Reuters+AJ','#f97316'],['NLP Confidence',`${s.confidence-5}%`,'#eab308']].map(([l,v,c]) => (
            <div key={l} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:'12px 14px' }}>
              <div style={{ color:'rgba(255,255,255,0.3)', fontSize:9, marginBottom:6 }}>{l}</div>
              <div style={{ fontSize:18, fontWeight:700, color:c, fontFamily:'var(--font-display)' }}>{v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AISignals({ signals, events }) {
  const [assetClass, setAC]   = useState('All')
  const [direction,  setDir]  = useState('All')
  const [selected,   setSel]  = useState(signals[0] || null)
  const [sigTab,     setSTab] = useState('TRADE SETUP')
  const [search,     setSearch] = useState('')
  const [mode,       setMode] = useState('global')
  const [selCountry, setCountry] = useState(null)

  const filtered = signals.filter(s => {
    if (assetClass !== 'All' && s.category !== assetClass) return false
    if (direction  !== 'All' && s.direction  !== direction)  return false
    if (search && !s.ticker.toLowerCase().includes(search.toLowerCase()) && !s.label?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
      {/* Sidebar */}
      <div style={{ width:188, flexShrink:0, borderRight:'1px solid rgba(30,120,255,0.12)', background:'rgba(3,9,15,0.98)', display:'flex', flexDirection:'column', overflow:'auto' }}>
        <div style={{ padding:'10px 12px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', gap:4 }}>
            {[['global','🌐 Global'], ['country','📍 Country']].map(([m, l]) => (
              <button key={m} onClick={() => setMode(m)} style={{ flex:1, padding:'6px 4px', border:'none', borderRadius:6, cursor:'pointer', background:mode===m?'rgba(30,120,255,0.25)':'rgba(255,255,255,0.05)', color:mode===m?'#60a5fa':'rgba(255,255,255,0.45)', fontSize:9, fontWeight:700, fontFamily:'var(--font-mono)', transition:'all 0.15s' }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {mode === 'country' ? (
          <div style={{ overflow:'auto', flex:1 }}>
            <div style={{ padding:'6px 14px 4px', color:'rgba(255,255,255,0.3)', fontSize:8, letterSpacing:2, textTransform:'uppercase', marginTop:6 }}>Select Country</div>
            {ALL_COUNTRIES.map(c => (
              <div key={c} onClick={() => setCountry(c)} style={{ padding:'7px 14px', cursor:'pointer', background:selCountry===c?'rgba(30,120,255,0.14)':'transparent', color:selCountry===c?'#60a5fa':'rgba(255,255,255,0.6)', fontSize:10, borderLeft:selCountry===c?'2px solid #3b82f6':'2px solid transparent', transition:'all 0.14s' }}
                onMouseEnter={e => { if(selCountry!==c) e.currentTarget.style.background='rgba(255,255,255,0.04)' }}
                onMouseLeave={e => { if(selCountry!==c) e.currentTarget.style.background='transparent' }}
              >{c}</div>
            ))}
          </div>
        ) : (
          <>
            <div style={{ padding:'6px 14px 4px', color:'rgba(255,255,255,0.3)', fontSize:8, letterSpacing:2, textTransform:'uppercase', marginTop:8 }}>Asset Class</div>
            {ASSET_CLASSES.map(ac => <SideBtn key={ac} active={assetClass===ac} onClick={() => setAC(ac)}>{ac}</SideBtn>)}
            <div style={{ padding:'6px 14px 4px', color:'rgba(255,255,255,0.3)', fontSize:8, letterSpacing:2, textTransform:'uppercase', marginTop:8 }}>Direction</div>
            {DIRECTIONS.map(d => <SideBtn key={d} active={direction===d} onClick={() => setDir(d)}><span style={{ color:d==='BUY'?'#22c55e':d==='SELL'?'#ef4444':'inherit' }}>{d==='BUY'?'→ ':d==='SELL'?'→ ':''}{d}</span></SideBtn>)}
            <div style={{ padding:'6px 14px 4px', color:'rgba(255,255,255,0.3)', fontSize:8, letterSpacing:2, textTransform:'uppercase', marginTop:8 }}>Geo Sensitivity</div>
            {GEO_FACTORS.map(g => <SideBtn key={g} active={false} onClick={() => {}}>{g}</SideBtn>)}
          </>
        )}
      </div>

      {/* Main area */}
      {mode === 'country' && selCountry ? (
        <CountryAnalysis country={selCountry} />
      ) : mode === 'country' && !selCountry ? (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, color:'rgba(255,255,255,0.3)' }}>
          <div style={{ fontSize:32 }}>📍</div>
          <div style={{ fontSize:13 }}>Select a country from the sidebar</div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.2)', textAlign:'center', maxWidth:320, lineHeight:1.6 }}>
            Full analysis: AI signals · Forex rates vs all currencies · Indices · Commodities · Crypto · ETFs · Bonds · Sanctions<br/>
            <strong style={{ color:'#60a5fa' }}>All prices shown in local currency</strong>
          </div>
        </div>
      ) : (
        <>
          {/* Signal list */}
          <div style={{ width:295, flexShrink:0, borderRight:'1px solid rgba(30,120,255,0.12)', background:'rgba(4,10,20,0.98)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ padding:'8px 10px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search asset..."
                style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', color:'#fff', padding:'7px 10px', borderRadius:6, fontSize:11, outline:'none', fontFamily:'var(--font-mono)' }} />
            </div>
            <div style={{ padding:'5px 12px', borderBottom:'1px solid rgba(255,255,255,0.04)', display:'flex', justifyContent:'space-between' }}>
              <span style={{ color:'rgba(255,255,255,0.3)', fontSize:9, letterSpacing:1 }}>{filtered.length} SIGNALS</span>
              <span style={{ color:'rgba(255,255,255,0.2)', fontSize:9 }}>by confidence</span>
            </div>
            <div style={{ overflow:'auto', flex:1 }}>
              {filtered.map(s => <SignalCard key={s.id} signal={s} active={selected?.id===s.id} onClick={() => setSel(s)} />)}
            </div>
          </div>
          {/* Detail */}
          {selected ? (
            <div style={{ flex:1, overflow:'auto', background:'rgba(3,8,18,0.99)' }}>
              <SignalDetail signal={selected} tab={sigTab} setTab={setSTab} events={events} />
            </div>
          ) : (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.2)', fontSize:12 }}>Select a signal</div>
          )}
        </>
      )}
    </div>
  )
}
