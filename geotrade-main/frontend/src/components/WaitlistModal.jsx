import { useState } from 'react'

export default function WaitlistModal({ onClose }) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email.includes('@')) return
    setLoading(true)
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch (_) {}
    setTimeout(() => { setLoading(false); setSubmitted(true) }, 800)
  }

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:999,
      background:'rgba(3,9,15,0.85)', backdropFilter:'blur(10px)',
      display:'flex', alignItems:'center', justifyContent:'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'linear-gradient(135deg,#07111f,#0b1a2f)',
        border:'1px solid rgba(30,120,255,0.3)',
        borderRadius:16, padding:'36px 40px',
        width:440, textAlign:'center',
        boxShadow:'0 0 60px rgba(30,120,255,0.2)',
        animation:'fade-in 0.3s ease',
      }}>
        {/* Logo */}
        <div style={{
          width:56, height:56, borderRadius:14,
          background:'linear-gradient(135deg,#1e78ff,#06b6d4)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:24, margin:'0 auto 16px',
          boxShadow:'0 0 24px rgba(30,120,255,0.5)',
          animation:'float 3s ease-in-out infinite',
        }}>⟁</div>

        {!submitted ? (
          <>
            <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, marginBottom:8 }}>
              Join the Waitlist
            </div>
            <div style={{ color:'var(--text-secondary)', fontSize:12, marginBottom:24, lineHeight:1.6 }}>
              Get early access to GeoTrade — the world's first<br />
              geopolitical-to-trading signal intelligence platform.
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="your@email.com"
                style={{
                  flex:1, background:'rgba(255,255,255,0.05)',
                  border:'1px solid rgba(30,120,255,0.3)',
                  color:'#fff', padding:'10px 14px',
                  borderRadius:8, fontSize:12, outline:'none',
                  fontFamily:'var(--font-mono)',
                }}
              />
              <button onClick={handleSubmit} disabled={loading} style={{
                background:'linear-gradient(135deg,#1e78ff,#06b6d4)',
                border:'none', color:'#fff',
                padding:'10px 18px', borderRadius:8,
                fontSize:11, fontWeight:700, cursor:'pointer',
                opacity: loading ? 0.7 : 1,
              }}>
                {loading ? '...' : 'JOIN →'}
              </button>
            </div>
            <div style={{ marginTop:14, color:'var(--text-muted)', fontSize:10 }}>
              No spam. Early access + exclusive features for waitlist members.
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize:36, marginBottom:12 }}>🎉</div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, marginBottom:8, color:'#22c55e' }}>
              You're on the list!
            </div>
            <div style={{ color:'var(--text-secondary)', fontSize:12, marginBottom:20 }}>
              We'll notify you at <strong style={{ color:'#60a5fa' }}>{email}</strong> when early access opens.
            </div>
            <button onClick={onClose} style={{
              background:'rgba(34,197,94,0.15)', border:'1px solid rgba(34,197,94,0.3)',
              color:'#22c55e', padding:'8px 20px', borderRadius:8,
              fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'var(--font-mono)',
            }}>Continue Exploring →</button>
          </>
        )}
      </div>
    </div>
  )
}
