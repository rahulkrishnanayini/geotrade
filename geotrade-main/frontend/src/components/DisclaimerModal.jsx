import { useState } from 'react'

export default function DisclaimerModal({ onAccept }) {
  const [checked, setChecked] = useState(false)

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9999,
      background:'radial-gradient(ellipse at center, #071428 0%, #030910 100%)',
      display:'flex', alignItems:'center', justifyContent:'center',
      flexDirection:'column', gap:0,
    }}>
      {/* Animated background dots */}
      <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
        {Array.from({length:40},(_,i)=>(
          <div key={i} style={{
            position:'absolute',
            left:`${(Math.sin(i*137.5)*0.5+0.5)*100}%`,
            top:`${(Math.cos(i*137.5)*0.5+0.5)*100}%`,
            width: i%5===0?3:1.5,
            height: i%5===0?3:1.5,
            borderRadius:'50%',
            background:'rgba(255,255,255,0.4)',
          }}/>
        ))}
      </div>

      {/* Card */}
      <div style={{
        background:'linear-gradient(135deg, rgba(7,20,40,0.98), rgba(4,12,28,0.98))',
        border:'1px solid rgba(30,120,255,0.3)',
        borderRadius:20, padding:'44px 48px',
        maxWidth:560, width:'90%',
        boxShadow:'0 0 80px rgba(30,120,255,0.15), 0 0 120px rgba(0,0,0,0.8)',
        position:'relative', zIndex:1,
        animation:'fade-in 0.5s ease',
      }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{
            width:64, height:64, borderRadius:16,
            background:'linear-gradient(135deg,#1e78ff,#06b6d4)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:28, margin:'0 auto 14px',
            boxShadow:'0 0 32px rgba(30,120,255,0.5)',
          }}>⟁</div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:800, color:'#fff', letterSpacing:2 }}>GEOTRADE</div>
          <div style={{ color:'rgba(255,255,255,0.35)', fontSize:11, letterSpacing:2, marginTop:4 }}>GEOPOLITICAL INTELLIGENCE PLATFORM</div>
        </div>

        {/* Disclaimer box */}
        <div style={{
          background:'rgba(239,68,68,0.06)',
          border:'1px solid rgba(239,68,68,0.25)',
          borderRadius:12, padding:'18px 20px',
          marginBottom:24,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <span style={{ fontSize:18 }}>⚠️</span>
            <span style={{ color:'#ef4444', fontWeight:700, fontSize:12, letterSpacing:1 }}>IMPORTANT NOTICE</span>
          </div>
          <div style={{ color:'rgba(255,255,255,0.75)', fontSize:11, lineHeight:1.8 }}>
            <strong style={{ color:'#fff' }}>GeoTrade is NOT a trading platform.</strong>
            <br/><br/>
            This platform provides:
            <ul style={{ marginTop:8, paddingLeft:20, display:'flex', flexDirection:'column', gap:5 }}>
              <li>📰 <strong style={{color:'#60a5fa'}}>Real-time news</strong> from countries around the world in English</li>
              <li>📊 <strong style={{color:'#60a5fa'}}>Market data</strong> including stock indices, commodities and forex rates</li>
              <li>🤖 <strong style={{color:'#60a5fa'}}>AI-generated suggestions</strong> based on geopolitical event analysis</li>
              <li>📈 <strong style={{color:'#60a5fa'}}>Price forecasts</strong> using historical data and risk modeling</li>
            </ul>
            <br/>
            <strong style={{ color:'#f97316' }}>
              All trading suggestions are for educational and research purposes ONLY.
              They do NOT constitute financial advice.
            </strong>
            <br/><br/>
            Always consult a qualified financial advisor before making any investment decisions.
            Past performance and model predictions do not guarantee future results.
          </div>
        </div>

        {/* Checkbox */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:22, cursor:'pointer' }} onClick={()=>setChecked(!checked)}>
          <div style={{
            width:18, height:18, borderRadius:4, flexShrink:0, marginTop:1,
            border:`2px solid ${checked?'#3b82f6':'rgba(255,255,255,0.2)'}`,
            background: checked?'#3b82f6':'transparent',
            display:'flex', alignItems:'center', justifyContent:'center',
            transition:'all 0.2s',
          }}>
            {checked && <span style={{color:'#fff',fontSize:11,lineHeight:1}}>✓</span>}
          </div>
          <span style={{ color:'rgba(255,255,255,0.6)', fontSize:11, lineHeight:1.6 }}>
            I understand that GeoTrade is for informational and educational purposes only and is not a trading platform. I will not make financial decisions solely based on this platform.
          </span>
        </div>

        {/* Enter button */}
        <button
          onClick={()=>checked&&onAccept()}
          disabled={!checked}
          style={{
            width:'100%', padding:'14px',
            background: checked
              ? 'linear-gradient(135deg,#1e78ff,#06b6d4)'
              : 'rgba(255,255,255,0.06)',
            border:'none', borderRadius:10,
            color: checked?'#fff':'rgba(255,255,255,0.3)',
            fontSize:13, fontWeight:700, letterSpacing:1,
            cursor: checked?'pointer':'not-allowed',
            transition:'all 0.2s',
            fontFamily:'var(--font-mono)',
            boxShadow: checked?'0 0 24px rgba(30,120,255,0.35)':'none',
          }}
        >
          {checked ? 'ENTER GEOTRADE →' : 'Please accept the notice above'}
        </button>

        <div style={{ textAlign:'center', marginTop:14, color:'rgba(255,255,255,0.2)', fontSize:9, letterSpacing:0.8 }}>
          Data sources: BBC · Reuters · Al Jazeera · Guardian · DW · Yahoo Finance · Google News
        </div>
      </div>
    </div>
  )
}
