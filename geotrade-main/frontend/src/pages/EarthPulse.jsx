import { useState, useCallback } from 'react'
import Globe from '../components/Globe'
import CountryPanel from '../components/CountryPanel'
import { LEVEL_COLOR } from '../data/mockData'

export default function EarthPulse({ gti, events, signals, tensions, onSelectSignal, onViewAI }) {
  const [selectedCountry, setSelectedCountry] = useState(null)
  const topSignals = signals.slice(0, 2)

  const handleCountryClick = useCallback((name) => {
    setSelectedCountry(name)
  }, [])

  return (
    <div style={{ display:'flex', flex:1, overflow:'hidden', position:'relative' }}>

      {/* Sub-header */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, zIndex:10,
        padding:'5px 16px',
        borderBottom:'1px solid rgba(255,255,255,0.04)',
        background:'rgba(3,9,15,0.7)', backdropFilter:'blur(8px)',
        display:'flex', alignItems:'center', gap:14, fontSize:10, color:'rgba(255,255,255,0.4)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', animation:'pulse-dot 1.5s infinite' }} />
          <span style={{ color:'#22c55e', fontWeight:700 }}>LIVE</span>
        </div>
        <span>🌐 Global GTI <span style={{ color:'#f97316', fontWeight:700 }}>{gti.value}</span></span>
        <span>· {events.length} active events</span>
        <button style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.5)', padding:'2px 10px', borderRadius:4, fontSize:9, cursor:'pointer', fontFamily:'var(--font-mono)' }}>≡ FILTERS</button>
        {selectedCountry && <span style={{ color:'#60a5fa', fontSize:10 }}>📍 Viewing: <strong>{selectedCountry}</strong></span>}
      </div>

      {/* Globe — always full width minus right panel */}
      <div style={{ flex:1, position:'relative', paddingTop:28 }}>
        <Globe tensions={tensions} onCountryClick={handleCountryClick} />

        {/* Risk legend bottom-left */}
        <div style={{
          position:'absolute', bottom:52, left:16,
          background:'rgba(3,9,15,0.88)', backdropFilter:'blur(8px)',
          border:'1px solid rgba(255,255,255,0.07)', borderRadius:8,
          padding:'10px 14px',
        }}>
          <div style={{ color:'rgba(255,255,255,0.3)', fontSize:8, letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Risk Level</div>
          {[['CRITICAL','War/Civil War','#ef4444'],['HIGH','Mass Violence','#f97316'],['MEDIUM','Conflict Risk','#eab308'],['LOW','Stable','#22c55e']].map(([l,d,c]) => (
            <div key={l} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, fontSize:10 }}>
              <div style={{ width:22, height:3, background:c, borderRadius:2 }} />
              <span style={{ color:c, fontWeight:600 }}>{l}</span>
              <span style={{ color:'rgba(255,255,255,0.3)', fontSize:9 }}>{d}</span>
            </div>
          ))}
        </div>

        {/* Click hint */}
        <div style={{
          position:'absolute', bottom:14, left:'50%', transform:'translateX(-50%)',
          color:'rgba(255,255,255,0.3)', fontSize:10,
          background:'rgba(0,0,0,0.5)', padding:'4px 14px', borderRadius:20,
          backdropFilter:'blur(6px)', whiteSpace:'nowrap', pointerEvents:'none',
        }}>
          ⟳ Drag to rotate &nbsp;·&nbsp; <span style={{ color:'#60a5fa' }}>Click any country</span> for market analysis
        </div>
      </div>

      {/* RIGHT PANEL — always visible, shows signals by default, country data on click */}
      <div style={{
        width:300, flexShrink:0,
        borderLeft:'1px solid rgba(30,120,255,0.18)',
        background:'rgba(4,11,21,0.97)',
        display:'flex', flexDirection:'column',
        overflow:'hidden', position:'relative',
      }}>
        {selectedCountry ? (
          /* Country panel fills the right panel */
          <CountryPanel
            country={selectedCountry}
            onClose={() => setSelectedCountry(null)}
            inline={true}
          />
        ) : (
          /* Default: signals panel */
          <>
            <div style={{ padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', animation:'pulse-dot 1.5s infinite' }} />
              <span style={{ color:'#60a5fa', fontSize:10, fontWeight:700, letterSpacing:1.5 }}>SIGNALS</span>
            </div>

            {/* Top signal expanded */}
            {topSignals[0] && (
              <div style={{ padding:'12px 14px', borderBottom:'1px solid rgba(255,255,255,0.05)', background:'rgba(30,120,255,0.04)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                  <span style={{ fontWeight:700, color:'#fff', fontSize:13 }}>{topSignals[0].ticker}</span>
                  <DirBadge dir={topSignals[0].direction} />
                  <span style={{ marginLeft:'auto', color:topSignals[0].trade?.change_pct > 0 ? '#22c55e' : '#ef4444', fontWeight:700, fontSize:12 }}>
                    ${topSignals[0].trade?.current_price?.toLocaleString()}
                  </span>
                </div>
                <div style={{ color:'rgba(255,255,255,0.4)', fontSize:10, marginBottom:8 }}>
                  {topSignals[0].category} ·{' '}
                  <span style={{ color:topSignals[0].trade?.change_pct > 0 ? '#22c55e' : '#ef4444' }}>
                    {topSignals[0].trade?.change_pct > 0 ? '+' : ''}{topSignals[0].trade?.change_pct}%
                  </span>
                </div>
                <ConfBar label="Confidence" value={topSignals[0].confidence} color="#22c55e" />
                <ConfBar label="Uncertainty" value={topSignals[0].uncertainty} color="#ef4444" />
                <div style={{ color:'#60a5fa', fontSize:9, fontWeight:700, marginBottom:3, marginTop:8 }}>⦿ AI ANALYSIS</div>
                <div style={{ color:'rgba(255,255,255,0.6)', fontSize:10, lineHeight:1.55, marginBottom:8 }}>
                  {topSignals[0].ai_analysis?.slice(0, 120)}...
                </div>
                <div style={{ color:'#f97316', fontSize:9, fontWeight:700, marginBottom:3 }}>⚠ RISK FACTORS</div>
                {topSignals[0].risk_factors?.slice(0, 2).map(r => (
                  <div key={r} style={{ color:'rgba(255,255,255,0.45)', fontSize:10 }}>» {r}</div>
                ))}
              </div>
            )}

            <div style={{ padding:'6px 14px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', justifyContent:'space-between' }}>
              <span style={{ color:'rgba(255,255,255,0.3)', fontSize:9, letterSpacing:1 }}>ALL SIGNALS ({signals.length})</span>
              <button onClick={onViewAI} style={{ background:'none', border:'none', color:'#60a5fa', fontSize:9, cursor:'pointer', fontFamily:'var(--font-mono)' }}>View all →</button>
            </div>

            <div style={{ overflow:'auto', flex:1 }}>
              {topSignals.map(s => (
                <div key={s.id} onClick={() => { onSelectSignal(s); onViewAI() }}
                  style={{ padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer', transition:'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(30,120,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                    <span style={{ fontWeight:700, color:'#fff' }}>{s.ticker}</span>
                    <DirBadge dir={s.direction} />
                    <span style={{ marginLeft:'auto', color:s.trade?.change_pct > 0 ? '#22c55e' : '#ef4444', fontSize:10 }}>
                      {s.trade?.change_pct > 0 ? '▲' : '▼'}{Math.abs(s.trade?.change_pct || 0)}%
                    </span>
                  </div>
                  <div style={{ color:'rgba(255,255,255,0.3)', fontSize:9, marginBottom:5 }}>
                    {s.category} · ${s.trade?.current_price?.toLocaleString()}
                  </div>
                  <div style={{ height:2, background:'rgba(255,255,255,0.07)', borderRadius:1 }}>
                    <div style={{ height:'100%', width:`${s.confidence}%`, background:s.direction === 'BUY' ? '#22c55e' : '#ef4444', borderRadius:1 }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function DirBadge({ dir }) {
  const c = { BUY:'#22c55e', SELL:'#ef4444', HOLD:'#eab308' }[dir] || '#aaa'
  return <span style={{ padding:'2px 6px', borderRadius:3, fontSize:9, fontWeight:700, background:c+'22', color:c, border:`1px solid ${c}44` }}>{dir}</span>
}
function ConfBar({ label, value, color }) {
  return (
    <div style={{ marginBottom:6 }}>
      <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', marginBottom:2 }}>
        {label}: <span style={{ color }}>{value}%</span>
      </div>
      <div style={{ height:3, background:'rgba(255,255,255,0.08)', borderRadius:2 }}>
        <div style={{ height:'100%', width:`${value}%`, background:color, borderRadius:2 }} />
      </div>
    </div>
  )
}
