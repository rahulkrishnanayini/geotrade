import { LEVEL_COLOR } from '../data/mockData'

export default function TickerBar({ gti, events, onWaitlist }) {
  return (
    <div style={{
      height: 38,
      display: 'flex',
      alignItems: 'center',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      background: 'rgba(3,9,15,0.95)',
      flexShrink: 0,
      overflow: 'hidden',
      gap: 0,
    }}>
      {/* GTI label */}
      <div style={{
        display:'flex', alignItems:'center', gap:8,
        padding:'0 14px',
        borderRight:'1px solid rgba(255,255,255,0.06)',
        height:'100%', flexShrink:0,
      }}>
        <span style={{ color:'var(--text-muted)', fontSize:9, letterSpacing:1.5 }}>GTI TREND</span>
        <span style={{ color:'#f97316', fontWeight:700, fontSize:12 }}>{gti.value}</span>
      </div>

      {/* Scrolling events */}
      <div style={{ flex:1, overflow:'hidden', position:'relative', height:'100%' }}>
        <div style={{
          display:'flex', alignItems:'center', gap:10,
          height:'100%', padding:'0 10px',
          animation:'ticker-scroll 120s linear infinite',
          width:'max-content',
        }}>
          {[...events, ...events].map((e, i) => (
            <div key={i} style={{
              display:'flex', alignItems:'center', gap:8,
              padding:'3px 10px',
              background: LEVEL_COLOR[e.level] + '12',
              border:`1px solid ${LEVEL_COLOR[e.level]}30`,
              borderRadius:4,
              whiteSpace:'nowrap', flexShrink:0,
            }}>
              <div style={{
                width:5, height:5, borderRadius:'50%',
                background: LEVEL_COLOR[e.level],
              }} />
              <span style={{ color:'rgba(255,255,255,0.75)', fontSize:10 }}>{e.title}</span>
              <span style={{ color:'var(--text-muted)', fontSize:9 }}>
                {e.published_at} · {e.region}
              </span>
              <span style={{ color: LEVEL_COLOR[e.level], fontSize:9, fontWeight:700 }}>{e.level}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Waitlist */}
      <button onClick={onWaitlist} style={{
        flexShrink:0,
        background:'linear-gradient(135deg,#7c3aed,#4f46e5)',
        border:'none', color:'#fff',
        padding:'6px 16px', margin:'0 10px',
        borderRadius:20, fontSize:10, fontWeight:700,
        cursor:'pointer',
      }}>● JOIN WAITLIST</button>
    </div>
  )
}
