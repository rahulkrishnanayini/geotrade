import { useRef, useEffect, useCallback } from 'react'

const LEVEL_COLOR = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#3b82f6' }

const COUNTRY_TENSION = {
  'Russia':             { level: 'CRITICAL', gti: 82 },
  'Ukraine':            { level: 'CRITICAL', gti: 79 },
  'Iran':               { level: 'CRITICAL', gti: 78 },
  'Israel':             { level: 'CRITICAL', gti: 76 },
  'Palestine':          { level: 'CRITICAL', gti: 75 },
  'North Korea':        { level: 'HIGH',     gti: 70 },
  'Myanmar':            { level: 'HIGH',     gti: 61 },
  'Sudan':              { level: 'HIGH',     gti: 58 },
  'Ethiopia':           { level: 'HIGH',     gti: 56 },
  'Yemen':              { level: 'HIGH',     gti: 62 },
  'Syria':              { level: 'HIGH',     gti: 60 },
  'China':              { level: 'MEDIUM',   gti: 55 },
  'Pakistan':           { level: 'MEDIUM',   gti: 48 },
  'India':              { level: 'MEDIUM',   gti: 44 },
  'Saudi Arabia':       { level: 'MEDIUM',   gti: 52 },
  'Iraq':               { level: 'MEDIUM',   gti: 50 },
  'Afghanistan':        { level: 'MEDIUM',   gti: 55 },
  'Venezuela':          { level: 'MEDIUM',   gti: 42 },
  'United States of America': { level: 'LOW', gti: 35 },
  'Germany':            { level: 'LOW',      gti: 30 },
  'France':             { level: 'LOW',      gti: 28 },
  'United Kingdom':     { level: 'LOW',      gti: 28 },
  'Japan':              { level: 'LOW',      gti: 32 },
  'Australia':          { level: 'LOW',      gti: 22 },
  'Brazil':             { level: 'LOW',      gti: 30 },
  'Canada':             { level: 'LOW',      gti: 20 },
}

const DEFAULT_COLOR = '#0d2a44'

function getTensionColor(name, tensions) {
  if (!name) return DEFAULT_COLOR
  const t = tensions.find(t => t.country && name.toLowerCase().includes(t.country.toLowerCase()))
  if (t) return LEVEL_COLOR[t.level] || DEFAULT_COLOR
  const s = COUNTRY_TENSION[name]
  if (s) return LEVEL_COLOR[s.level] || DEFAULT_COLOR
  return DEFAULT_COLOR
}

// Inline TopoJSON → GeoJSON converter
function topoFeature(topology, obj) {
  const arcs = topology.arcs
  const [sx, sy] = topology.transform.scale
  const [tx, ty] = topology.transform.translate

  function decodeArc(index) {
    const arc = arcs[index < 0 ? ~index : index]
    let x = 0, y = 0
    const pts = arc.map(([dx, dy]) => { x += dx; y += dy; return [x, y] })
    if (index < 0) pts.reverse()
    return pts.map(([px, py]) => [px * sx + tx, py * sy + ty])
  }

  function stitchRings(rings) {
    return rings.map(ring => ring.flatMap(i => decodeArc(i)))
  }

  return {
    type: 'FeatureCollection',
    features: obj.geometries.map(geom => ({
      type: 'Feature',
      properties: geom.properties || {},
      geometry: !geom ? null
        : geom.type === 'Polygon'      ? { type: 'Polygon',      coordinates: stitchRings(geom.arcs) }
        : geom.type === 'MultiPolygon' ? { type: 'MultiPolygon', coordinates: geom.arcs.map(stitchRings) }
        : null,
    }))
  }
}

// Point-in-polygon test (ray casting)
function pointInPolygon(px, py, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

export default function Globe({ tensions = [], onCountryClick }) {
  const canvasRef    = useRef(null)
  const animRef      = useRef(null)
  const rotRef       = useRef(20)
  const geoRef       = useRef(null)
  const namesRef     = useRef({})
  const dragging     = useRef(false)
  const lastX        = useRef(0)
  const didDrag      = useRef(false)   // distinguish click vs drag
  const hoverRef     = useRef(null)    // currently hovered country name
  const featuresRef  = useRef([])      // projected feature cache

  // Load world atlas GeoJSON
  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r => r.json())
      .then(world => {
        geoRef.current = topoFeature(world, world.objects.countries)
      })
      .catch(() => { geoRef.current = { features: [] } })

    // Load ISO country names
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .catch(() => {})

    // Hardcoded numeric ID → name map (ISO 3166-1 numeric, subset)
    namesRef.current = {
      '004':'Afghanistan','008':'Albania','012':'Algeria','024':'Angola',
      '036':'Australia','040':'Austria','050':'Bangladesh','056':'Belgium',
      '064':'Bhutan','068':'Bolivia','076':'Brazil','100':'Bulgaria',
      '104':'Myanmar','116':'Cambodia','120':'Cameroon','124':'Canada',
      '140':'Central African Republic','152':'Chile','156':'China',
      '170':'Colombia','180':'Dem. Rep. Congo','188':'Costa Rica',
      '191':'Croatia','192':'Cuba','196':'Cyprus','203':'Czech Republic',
      '208':'Denmark','214':'Dominican Republic','218':'Ecuador',
      '818':'Egypt','222':'El Salvador','231':'Ethiopia','246':'Finland',
      '250':'France','266':'Gabon','276':'Germany','288':'Ghana',
      '300':'Greece','320':'Guatemala','324':'Guinea','332':'Haiti',
      '340':'Honduras','348':'Hungary','356':'India','360':'Indonesia',
      '364':'Iran','368':'Iraq','372':'Ireland','376':'Israel',
      '380':'Italy','388':'Jamaica','392':'Japan','400':'Jordan',
      '398':'Kazakhstan','404':'Kenya','408':'North Korea','410':'South Korea',
      '414':'Kuwait','418':'Laos','422':'Lebanon','430':'Liberia',
      '434':'Libya','442':'Luxembourg','484':'Mexico','496':'Mongolia',
      '504':'Morocco','508':'Mozambique','516':'Namibia','524':'Nepal',
      '528':'Netherlands','540':'New Caledonia','554':'New Zealand',
      '558':'Nicaragua','566':'Nigeria','578':'Norway','586':'Pakistan',
      '591':'Panama','598':'Papua New Guinea','600':'Paraguay','604':'Peru',
      '608':'Philippines','616':'Poland','620':'Portugal','630':'Puerto Rico',
      '634':'Qatar','642':'Romania','643':'Russia','682':'Saudi Arabia',
      '686':'Senegal','694':'Sierra Leone','706':'Somalia','710':'South Africa',
      '724':'Spain','144':'Sri Lanka','729':'Sudan','752':'Sweden',
      '756':'Switzerland','760':'Syria','158':'Taiwan','764':'Thailand',
      '792':'Turkey','800':'Uganda','804':'Ukraine','784':'United Arab Emirates',
      '826':'United Kingdom','840':'United States of America',
      '858':'Uruguay','860':'Uzbekistan','862':'Venezuela','704':'Vietnam',
      '887':'Yemen','894':'Zambia','716':'Zimbabwe','275':'Palestine',
      '646':'Rwanda','788':'Tunisia','012':'Algeria',
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width  = rect.width  * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // ── Interaction ──────────────────────────────────────────────────────────
    const onDown = e => {
      dragging.current = true
      didDrag.current  = false
      lastX.current    = e.clientX
    }
    const onMove = e => {
      if (!dragging.current) {
        // Update hover
        const rect = canvas.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top
        hoverRef.current = hitTest(mx, my)
        canvas.style.cursor = hoverRef.current ? 'pointer' : 'grab'
        return
      }
      const dx = e.clientX - lastX.current
      if (Math.abs(dx) > 2) didDrag.current = true
      rotRef.current += dx * 0.35
      lastX.current   = e.clientX
    }
    const onUp = e => {
      if (!didDrag.current) {
        // It was a click — hit test
        const rect = canvas.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top
        const name = hitTest(mx, my)
        if (name && onCountryClick) onCountryClick(name)
      }
      dragging.current = false
    }

    // Touch
    const onTouchStart = e => { dragging.current = true; didDrag.current = false; lastX.current = e.touches[0].clientX }
    const onTouchMove  = e => {
      const dx = e.touches[0].clientX - lastX.current
      if (Math.abs(dx) > 2) didDrag.current = true
      rotRef.current += dx * 0.35
      lastX.current   = e.touches[0].clientX
    }
    const onTouchEnd = e => {
      if (!didDrag.current && e.changedTouches[0]) {
        const rect = canvas.getBoundingClientRect()
        const mx = e.changedTouches[0].clientX - rect.left
        const my = e.changedTouches[0].clientY - rect.top
        const name = hitTest(mx, my)
        if (name && onCountryClick) onCountryClick(name)
      }
      dragging.current = false
    }

    canvas.addEventListener('mousedown',  onDown)
    window .addEventListener('mousemove',  onMove)
    window .addEventListener('mouseup',    onUp)
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: true })
    canvas.addEventListener('touchend',   onTouchEnd)

    // Stars
    const stars = Array.from({ length: 200 }, (_, i) => ({
      x: (Math.sin(i * 137.508 + 1) * 0.5 + 0.5),
      y: (Math.cos(i * 137.508 + 2) * 0.5 + 0.5),
      r: 0.3 + (i % 5) * 0.15,
      a: 0.15 + (i % 6) * 0.1,
    }))

    function params() {
      const W = canvas.offsetWidth, H = canvas.offsetHeight
      return { W, H, cx: W / 2, cy: H / 2, R: Math.min(W, H) * 0.42 }
    }

    function project(lng, lat, rot, cx, cy, R) {
      const λ = (lng + rot) * Math.PI / 180
      const φ = lat * Math.PI / 180
      return {
        x: cx + R * Math.cos(φ) * Math.sin(λ),
        y: cy - R * Math.sin(φ),
        z:      R * Math.cos(φ) * Math.cos(λ),
      }
    }

    // Hit test: given mouse x,y → country name or null
    function hitTest(mx, my) {
      for (const feat of featuresRef.current) {
        if (!feat.screenRings) continue
        for (const ring of feat.screenRings) {
          if (pointInPolygon(mx, my, ring)) return feat.name
        }
      }
      return null
    }

    function drawRing(coords, rot, cx, cy, R) {
      ctx.beginPath()
      let penDown = false
      for (const [lng, lat] of coords) {
        const p = project(lng, lat, rot, cx, cy, R)
        if (p.z >= -R * 0.05) {
          if (!penDown) { ctx.moveTo(p.x, p.y); penDown = true }
          else            ctx.lineTo(p.x, p.y)
        } else penDown = false
      }
    }

    function draw() {
      const { W, H, cx, cy, R } = params()
      if (!W || !H) { animRef.current = requestAnimationFrame(draw); return }

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#03090f'
      ctx.fillRect(0, 0, W, H)

      // Stars
      for (const s of stars) {
        ctx.beginPath()
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${s.a})`
        ctx.fill()
      }

      // Ocean
      const ocean = ctx.createRadialGradient(cx - R * 0.2, cy - R * 0.2, 0, cx, cy, R)
      ocean.addColorStop(0, '#0e2a48'); ocean.addColorStop(0.7, '#061726'); ocean.addColorStop(1, '#020c18')
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = ocean; ctx.fill()

      ctx.save()
      ctx.beginPath(); ctx.arc(cx, cy, R - 1, 0, Math.PI * 2); ctx.clip()

      const rot = rotRef.current

      // Graticule
      ctx.lineWidth = 0.4; ctx.strokeStyle = 'rgba(30,100,200,0.15)'
      for (let lat = -80; lat <= 80; lat += 20) {
        let s = false; ctx.beginPath()
        for (let lng = -180; lng <= 180; lng += 3) {
          const p = project(lng, lat, rot, cx, cy, R)
          if (p.z >= 0) { s ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); s = true } else s = false
        }
        ctx.stroke()
      }
      for (let lng = -180; lng <= 180; lng += 20) {
        let s = false; ctx.beginPath()
        for (let lat = -89; lat <= 89; lat += 3) {
          const p = project(lng, lat, rot, cx, cy, R)
          if (p.z >= 0) { s ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); s = true } else s = false
        }
        ctx.stroke()
      }

      // Countries
      const geo = geoRef.current
      const newCache = []

      if (geo?.features?.length) {
        for (const feat of geo.features) {
          const numId  = String(feat.id || feat.properties?.id || '').padStart(3,'0')
          const name   = namesRef.current[numId] || feat.properties?.name || ''
          const color  = getTensionColor(name, tensions)
          const isHov  = hoverRef.current === name && name
          const geom   = feat.geometry
          if (!geom) continue

          const polys = geom.type === 'Polygon'      ? [geom.coordinates]
                      : geom.type === 'MultiPolygon' ?  geom.coordinates
                      : []

          const screenRings = []

          for (const poly of polys) {
            const outer = poly[0]; if (!outer?.length) continue

            // Visibility cull
            let anyVis = false
            for (let i = 0; i < outer.length; i += 5) {
              if (project(outer[i][0], outer[i][1], rot, cx, cy, R).z >= 0) { anyVis = true; break }
            }
            if (!anyVis) continue

            // Build screen-space ring for hit testing
            const sr = outer.map(([lng, lat]) => {
              const p = project(lng, lat, rot, cx, cy, R)
              return [p.x, p.y]
            })
            screenRings.push(sr)

            // Fill
            drawRing(outer, rot, cx, cy, R)
            ctx.fillStyle = isHov ? color + 'ff' : color + 'cc'
            ctx.fill()

            // Holes
            for (let h = 1; h < poly.length; h++) {
              drawRing(poly[h], rot, cx, cy, R)
              ctx.fillStyle = '#061726'; ctx.fill()
            }

            // Border
            drawRing(outer, rot, cx, cy, R)
            ctx.strokeStyle = isHov ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)'
            ctx.lineWidth   = isHov ? 1.5 : 0.5
            ctx.stroke()
          }

          if (screenRings.length) newCache.push({ name, screenRings })
        }
      } else {
        // Fallback blobs while loading
        const blobs = [
          { lat:60, lng:90, level:'CRITICAL', r:0.14 }, { lat:49, lng:31, level:'CRITICAL', r:0.06 },
          { lat:32, lng:53, level:'CRITICAL', r:0.06 }, { lat:35, lng:105, level:'MEDIUM', r:0.10 },
          { lat:40, lng:-100, level:'LOW', r:0.12 },    { lat:20, lng:78, level:'MEDIUM', r:0.08 },
          { lat:-25, lng:135, level:'LOW', r:0.09 },    { lat:-10, lng:-53, level:'LOW', r:0.10 },
        ]
        for (const b of blobs) {
          const p = project(b.lng, b.lat, rot, cx, cy, R); if (p.z < 0) continue
          const br = R * b.r; const col = LEVEL_COLOR[b.level]
          const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, br)
          gr.addColorStop(0, col + 'cc'); gr.addColorStop(1, col + '00')
          ctx.beginPath(); ctx.arc(p.x, p.y, br, 0, Math.PI * 2); ctx.fillStyle = gr; ctx.fill()
        }
      }

      featuresRef.current = newCache

      ctx.restore()

      // Hover tooltip
      if (hoverRef.current) {
        const name = hoverRef.current
        const tension = COUNTRY_TENSION[name]
        const col = tension ? LEVEL_COLOR[tension.level] : '#3b82f6'
        const tw = ctx.measureText(name).width + 80
        const tx = Math.min(W - tw - 10, Math.max(10, W / 2 - tw / 2))
        const ty = H - 60
        ctx.fillStyle = 'rgba(4,11,21,0.92)'
        roundRect(ctx, tx, ty, tw, 32, 6)
        ctx.fillStyle = col + '33'
        roundRect(ctx, tx, ty, tw, 32, 6)
        ctx.strokeStyle = col + '66'; ctx.lineWidth = 1
        roundRect(ctx, tx, ty, tw, 32, 6, true)
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px JetBrains Mono, monospace'
        ctx.fillText(name, tx + 10, ty + 14)
        if (tension) {
          ctx.fillStyle = col; ctx.font = '9px JetBrains Mono, monospace'
          ctx.fillText(`${tension.level} · GTI ${tension.gti}  · Click for analysis`, tx + 10, ty + 25)
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '9px JetBrains Mono, monospace'
          ctx.fillText('Click for market analysis', tx + 10, ty + 25)
        }
      }

      // Globe rim
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(30,120,255,0.45)'; ctx.lineWidth = 1.5; ctx.stroke()

      // Atmosphere
      const atm = ctx.createRadialGradient(cx, cy, R * 0.88, cx, cy, R * 1.1)
      atm.addColorStop(0, 'rgba(30,120,255,0.00)'); atm.addColorStop(1, 'rgba(30,120,255,0.22)')
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.1, 0, Math.PI * 2); ctx.fillStyle = atm; ctx.fill()

      // Orbital ring
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(0.28); ctx.scale(1, 0.26)
      const t = (Date.now() / 9000) % 1
      ctx.beginPath(); ctx.arc(0, 0, R * 1.25, t * Math.PI * 2 - 0.5, t * Math.PI * 2 + 0.5)
      ctx.strokeStyle = 'rgba(255,180,0,0.55)'; ctx.lineWidth = 2; ctx.stroke()
      ctx.restore()

      // CRITICAL pulses
      const criticals = [{ lat:49, lng:31 }, { lat:32, lng:53 }, { lat:31, lng:35 }]
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 700)
      for (const c of criticals) {
        const p = project(c.lng, c.lat, rot, cx, cy, R); if (p.z < 0) continue
        ctx.beginPath(); ctx.arc(p.x, p.y, 5 + pulse * 9, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(239,68,68,${0.7 * (1 - pulse)})`
        ctx.lineWidth = 1.5; ctx.stroke()
      }

      if (!dragging.current) rotRef.current += 0.05
      animRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animRef.current)
      ro.disconnect()
      canvas.removeEventListener('mousedown',  onDown)
      window .removeEventListener('mousemove',  onMove)
      window .removeEventListener('mouseup',    onUp)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove',  onTouchMove)
      canvas.removeEventListener('touchend',   onTouchEnd)
    }
  }, [tensions, onCountryClick])

  return (
    <canvas
      ref={canvasRef}
      style={{ width:'100%', height:'100%', display:'block' }}
    />
  )
}

function roundRect(ctx, x, y, w, h, r, stroke = false) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
  stroke ? ctx.stroke() : ctx.fill()
}
