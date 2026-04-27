import { useState, useEffect } from 'react'
import { LEVEL_COLOR } from '../data/mockData'

export default function Navbar({ view, setView, gti, isLive, onWaitlist }) {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const utc = time.toUTCString().split(' ')[4] + ' UTC'
  const level = gti.value >= 75 ? 'CRITICAL' : gti.value >= 55 ? 'ELEVATED' : gti.value >= 35 ? 'MODERATE' : 'LOW'
  const levelCol = { CRITICAL:'#ef4444', ELEVATED:'#f97316', MODERATE:'#eab308', LOW:'#3b82f6' }[level]

  const NAV_ITEMS = [
    { key:'earth', icon:'◉', label:'EARTH PULSE' },
    { key:'geo',   icon:'⊞', label:'GEO MAP'    },
    { key:'ai',    icon:'⟁', label:'AI SIGNALS' },
  ]

  return (
    <nav style={{
      display:'flex', alignItems:'center', gap:0,
      padding:'0 16px', height:46,
      borderBottom:'1px solid rgba(30,120,255,0.18)',
      background:'rgba(3,9,15,0.97)',
      backdropFilter:'blur(12px)',
      position:'sticky', top:0, zIndex:200,
      flexShrink:0,
    }}>
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:9, marginRight:20, userSelect:'none' }}>
        <div style={{
          width:32, height:32, borderRadius:8,
          background:'linear-gradient(135deg,#1e78ff,#06b6d4)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:16, fontWeight:700, color:'#fff',
          boxShadow:'0 0 16px rgba(30,120,255,0.4)',
        }}>⟁</div>
        <div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:800, letterSpacing:2, color:'#fff' }}>GEOTRADE</div>
          <div style={{ fontSize:8, color:'var(--text-muted)', letterSpacing:1.5 }}>TRADER v2.0</div>
        </div>
      </div>

      {/* GTI */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginRight:'auto' }}>
        <div style={{ width:1, height:28, background:'var(--border)', marginRight:4 }} />
        <div>
          <div style={{ fontSize:8, color:'var(--text-muted)', letterSpacing:1.8, textTransform:'uppercase', marginBottom:2 }}>
            Global Tension Index (GTI)
          </div>
          <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
            <span style={{ fontSize:24, fontWeight:700, color:'#fff', lineHeight:1, fontFamily:'var(--font-display)' }}>
              {gti.value}
            </span>
            <span style={{ fontSize:11, color: gti.change > 0 ? '#22c55e' : '#ef4444', fontWeight:600 }}>
              {gti.change > 0 ? '▲' : '▼'}{Math.abs(gti.change)}
            </span>
            <span style={{
              padding:'2px 8px', borderRadius:4, fontSize:9, fontWeight:700, letterSpacing:1.5,
              background: levelCol + '22', color: levelCol,
              border:`1px solid ${levelCol}44`,
            }}>{level}</span>
          </div>
        </div>
      </div>

      {/* View switcher */}
      <div style={{
        display:'flex', gap:2,
        background:'rgba(255,255,255,0.04)',
        border:'1px solid var(--border)',
        borderRadius:10, padding:3, marginRight:16,
      }}>
        {NAV_ITEMS.map(({ key, icon, label }) => {
          const active = view === key
          return (
            <button key={key} onClick={() => setView(key)} style={{
              padding:'6px 14px', borderRadius:7, border:'none',
              background: active ? 'rgba(30,120,255,0.22)' : 'transparent',
              color: active ? '#60a5fa' : 'var(--text-secondary)',
              fontSize:10, fontWeight: active ? 700 : 500,
              letterSpacing:0.8, cursor:'pointer',
              display:'flex', alignItems:'center', gap:6,
              transition:'all 0.18s',
              fontFamily:'var(--font-mono)',
            }}>
              <span style={{ fontSize:12 }}>{icon}</span>{label}
            </button>
          )
        })}
      </div>

      {/* Live indicator */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginRight:16, fontSize:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <div style={{
            width:7, height:7, borderRadius:'50%',
            background: isLive ? '#22c55e' : '#f97316',
            animation:'pulse-dot 1.5s infinite',
          }} />
          <span style={{ color: isLive ? '#22c55e' : '#f97316', fontWeight:700 }}>
            {isLive ? 'LIVE' : 'DEMO'}
          </span>
        </div>
        <span style={{ color:'var(--text-muted)' }}>·</span>
        <span style={{ color:'var(--text-muted)' }}>{isLive ? '4 feeds' : 'mock data'}</span>
        <span style={{ color:'var(--text-muted)' }}>·</span>
        <span style={{ color:'var(--text-secondary)' }}>🕐 {utc}</span>
      </div>

      {/* Waitlist button */}
      <button onClick={onWaitlist} style={{
        background:'linear-gradient(135deg,#7c3aed,#4f46e5)',
        border:'none', color:'#fff',
        padding:'7px 16px', borderRadius:20,
        fontSize:10, fontWeight:700, letterSpacing:0.5,
        boxShadow:'0 0 16px rgba(124,58,237,0.35)',
        transition:'all 0.2s',
        cursor:'pointer',
      }}>● JOIN WAITLIST</button>
    </nav>
  )
}
