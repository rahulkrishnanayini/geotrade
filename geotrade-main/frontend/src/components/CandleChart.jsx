import { useMemo } from 'react'

export default function CandleChart({ asset = 'OIL', height = 180 }) {
  const data = useMemo(() => {
    const bases = { OIL: 82, GOLD: 2310, GAS: 3.2, SPX: 5100, BTC: 67000 }
    const base = bases[asset] || 100
    return Array.from({ length: 48 }, (_, i) => {
      const trend = Math.sin(i / 8) * base * 0.012
      const o = base + trend + (Math.sin(i * 2.1) * base * 0.004)
      const c = o + (Math.sin(i * 1.7 + 1) * base * 0.006)
      const h = Math.max(o, c) + Math.abs(Math.sin(i * 3.3)) * base * 0.003
      const l = Math.min(o, c) - Math.abs(Math.sin(i * 2.9)) * base * 0.003
      return { o, c, h, l }
    })
  }, [asset])

  const all   = data.flatMap(d => [d.h, d.l])
  const minV  = Math.min(...all)
  const maxV  = Math.max(...all)
  const range = maxV - minV || 1
  const W = 480, H = height
  const pad = { l: 4, r: 44, t: 8, b: 20 }
  const cw  = (W - pad.l - pad.r) / data.length

  const toY = v => pad.t + (maxV - v) / range * (H - pad.t - pad.b)
  const fmt  = v => v > 1000 ? v.toFixed(1) : v.toFixed(2)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height }} preserveAspectRatio="none">
      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map(f => {
        const y   = pad.t + f * (H - pad.t - pad.b)
        const val = maxV - f * range
        return (
          <g key={f}>
            <line x1={pad.l} x2={W - pad.r} y1={y} y2={y}
              stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} strokeDasharray="3,3" />
            <text x={W - pad.r + 4} y={y + 4}
              fill="rgba(255,255,255,0.3)" fontSize={7} fontFamily="monospace">
              {fmt(val)}
            </text>
          </g>
        )
      })}
      {/* Candles */}
      {data.map((d, i) => {
        const x   = pad.l + i * cw + cw / 2
        const up  = d.c >= d.o
        const col = up ? '#22c55e' : '#ef4444'
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={toY(d.h)} y2={toY(d.l)} stroke={col} strokeWidth={0.7} />
            <rect
              x={x - cw * 0.38}
              y={Math.min(toY(d.o), toY(d.c))}
              width={cw * 0.76}
              height={Math.max(Math.abs(toY(d.c) - toY(d.o)), 1)}
              fill={col} opacity={0.9}
            />
          </g>
        )
      })}
      {/* Current price line */}
      {(() => {
        const last = data[data.length - 1]
        const y = toY(last.c)
        return (
          <g>
            <line x1={pad.l} x2={W - pad.r} y1={y} y2={y}
              stroke="#3b82f6" strokeWidth={0.6} strokeDasharray="4,3" opacity={0.6} />
            <rect x={W - pad.r} y={y - 7} width={42} height={13} fill="#3b82f6" rx={2} />
            <text x={W - pad.r + 21} y={y + 4}
              fill="#fff" fontSize={7} fontFamily="monospace" textAnchor="middle">
              {fmt(last.c)}
            </text>
          </g>
        )
      })()}
    </svg>
  )
}
