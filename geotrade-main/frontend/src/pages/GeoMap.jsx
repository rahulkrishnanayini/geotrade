import { useState, useEffect, useRef, useMemo } from 'react'
import CandleChart from '../components/CandleChart'
import CountryPanel from '../components/CountryPanel'
import { LEVEL_COLOR } from '../data/mockData'

// TopoJSON decoder
function topoFeature(topo, obj) {
  const arcs=topo.arcs, [sx,sy]=topo.transform.scale, [tx,ty]=topo.transform.translate
  function decodeArc(i){
    const arc=arcs[i<0?~i:i]; let x=0,y=0
    const pts=arc.map(([dx,dy])=>{x+=dx;y+=dy;return[x,y]})
    if(i<0) pts.reverse()
    return pts.map(([px,py])=>[px*sx+tx,py*sy+ty])
  }
  function stitch(rings){return rings.map(r=>r.flatMap(i=>decodeArc(i)))}
  return {
    type:'FeatureCollection',
    features:obj.geometries.map(g=>({
      type:'Feature', properties:g.properties||{}, id:g.id,
      geometry:!g?null:g.type==='Polygon'?{type:'Polygon',coordinates:stitch(g.arcs)}
        :g.type==='MultiPolygon'?{type:'MultiPolygon',coordinates:g.arcs.map(stitch)}:null
    }))
  }
}

const ISO_NAMES={'004':'Afghanistan','008':'Albania','012':'Algeria','024':'Angola','036':'Australia','040':'Austria','050':'Bangladesh','056':'Belgium','064':'Bhutan','068':'Bolivia','076':'Brazil','100':'Bulgaria','104':'Myanmar','116':'Cambodia','120':'Cameroon','124':'Canada','140':'Central African Republic','152':'Chile','156':'China','170':'Colombia','180':'Dem. Rep. Congo','188':'Costa Rica','191':'Croatia','192':'Cuba','196':'Cyprus','203':'Czech Republic','208':'Denmark','214':'Dominican Republic','218':'Ecuador','818':'Egypt','231':'Ethiopia','246':'Finland','250':'France','276':'Germany','288':'Ghana','300':'Greece','320':'Guatemala','324':'Guinea','332':'Haiti','340':'Honduras','348':'Hungary','356':'India','360':'Indonesia','364':'Iran','368':'Iraq','372':'Ireland','376':'Israel','380':'Italy','392':'Japan','400':'Jordan','398':'Kazakhstan','404':'Kenya','408':'North Korea','410':'South Korea','414':'Kuwait','418':'Laos','422':'Lebanon','434':'Libya','484':'Mexico','496':'Mongolia','504':'Morocco','516':'Namibia','524':'Nepal','528':'Netherlands','554':'New Zealand','558':'Nicaragua','566':'Nigeria','578':'Norway','586':'Pakistan','600':'Paraguay','604':'Peru','608':'Philippines','616':'Poland','620':'Portugal','634':'Qatar','642':'Romania','643':'Russia','682':'Saudi Arabia','706':'Somalia','710':'South Africa','724':'Spain','144':'Sri Lanka','729':'Sudan','752':'Sweden','756':'Switzerland','760':'Syria','158':'Taiwan','764':'Thailand','792':'Turkey','800':'Uganda','804':'Ukraine','784':'United Arab Emirates','826':'United Kingdom','840':'United States of America','858':'Uruguay','860':'Uzbekistan','862':'Venezuela','704':'Vietnam','887':'Yemen','894':'Zambia','716':'Zimbabwe','275':'Palestine','646':'Rwanda','788':'Tunisia'}

const ASSETS_LIST=[
  {key:'OIL',label:'WTI Oil'},{key:'GOLD',label:'Gold'},{key:'SILVER',label:'Silver'},
  {key:'GAS',label:'Nat. Gas'},{key:'SPX',label:'S&P 500'},{key:'BRENT',label:'Brent Oil'},
]

export default function GeoMap({ events, signals, tensions }) {
  const svgRef=useRef(null)
  const [geo,setGeo]=useState(null)
  const [hovered,setHovered]=useState(null)
  const [tooltip,setTooltip]=useState(null)
  const [selCountry,setSelCountry]=useState(null)
  const [selAsset,setSelAsset]=useState('OIL')

  useEffect(()=>{
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r=>r.json()).then(w=>setGeo(topoFeature(w,w.objects.countries))).catch(()=>{})
  },[])

  // Build dynamic color map from tensions prop (which comes from the dynamic NLP engine)
  const tensionMap = useMemo(()=>{
    const m={}
    tensions.forEach(t=>{ m[t.country]=t.level })
    return m
  },[tensions])

  function getColor(name){
    if(!name) return '#0d2a44'
    const level=tensionMap[name]
    if(level) return LEVEL_COLOR[level]
    // Check partial matches
    for(const [k,v] of Object.entries(tensionMap)){
      if(k.toLowerCase().includes(name.toLowerCase())||name.toLowerCase().includes(k.toLowerCase()))
        return LEVEL_COLOR[v]
    }
    return '#1a3a5c'  // default ocean-blue for unknown countries
  }

  function getName(feat){
    const id=String(feat.id||'').padStart(3,'0')
    return ISO_NAMES[id]||feat.properties?.name||''
  }

  const sig=signals.find(s=>{
    const m={OIL:'WTI',BRENT:'BZ=F',GOLD:'XAU/USD',SILVER:'SI=F',GAS:'NG=F',SPX:'SPX'}
    return s.ticker===(m[selAsset]||selAsset)
  })||signals[0]

  // Russia-safe equirectangular projection
  // Uses clamped longitude to handle Russia wrapping across antimeridian
  function project(lng, lat) {
    // Clamp to valid range
    const clampedLng = Math.max(-179.9, Math.min(179.9, lng))
    const clampedLat = Math.max(-89.9, Math.min(89.9, lat))
    return {
      x: ((clampedLng + 180) / 360) * 940 + 10,
      y: ((90 - clampedLat) / 180) * 460 + 20,
    }
  }

  function ringToPath(coords){
    if(!coords||coords.length<2) return ''
    // Split ring at antimeridian to fix Russia stretching
    const segments=[[]]
    for(let j=0;j<coords.length;j++){
      const curr=coords[j]
      const prev=j>0?coords[j-1]:null
      if(prev && Math.abs(curr[0]-prev[0])>180){
        // Antimeridian crossing — start new segment
        segments.push([])
      }
      segments[segments.length-1].push(curr)
    }
    return segments.filter(s=>s.length>1).map(seg=>{
      let d=''
      seg.forEach((pt,i)=>{
        const {x,y}=project(pt[0],pt[1])
        d+=i===0?`M${x.toFixed(1)},${y.toFixed(1)}`:`L${x.toFixed(1)},${y.toFixed(1)}`
      })
      return d+'Z'
    }).join(' ')
  }

  const getTensionForCountry=(name)=>{
    const level=tensionMap[name]
    if(level) return {level,color:LEVEL_COLOR[level]}
    for(const [k,v] of Object.entries(tensionMap))
      if(k.toLowerCase().includes((name||'').toLowerCase()||(name||'').toLowerCase().includes(k.toLowerCase())))
        return {level:v,color:LEVEL_COLOR[v]}
    return {level:'LOW',color:'#1a3a5c'}
  }

  return(
    <div style={{display:'flex',flex:1,overflow:'hidden',position:'relative'}}>
      {/* Map */}
      <div style={{flex:1,position:'relative',background:'#03090f',overflow:'hidden'}}>
        {/* Toolbar */}
        <div style={{position:'absolute',top:0,left:0,right:0,zIndex:10,padding:'6px 14px',background:'rgba(3,9,15,0.88)',backdropFilter:'blur(8px)',borderBottom:'1px solid rgba(255,255,255,0.05)',display:'flex',alignItems:'center',gap:10,fontSize:9,flexWrap:'wrap'}}>
          <span style={{color:'rgba(255,255,255,0.6)',letterSpacing:1.5,fontWeight:600}}>MARKET IMPACT MAP</span>
          <span style={{color:'rgba(255,255,255,0.2)'}}>·</span>
          <span style={{color:'#60a5fa',fontSize:9}}>🎯 Colors assigned dynamically from live news</span>
          <span style={{color:'rgba(255,255,255,0.2)'}}>·</span>
          <span style={{color:'rgba(255,255,255,0.4)',fontSize:9}}>Click any country for live data</span>
          <div style={{display:'flex',gap:10,marginLeft:'auto'}}>
            {[['CRITICAL','War / Civil War','#ef4444'],['HIGH','Mass Violence','#f97316'],['MEDIUM','Conflict Risk','#eab308'],['LOW','Stable','#22c55e']].map(([l,desc,c])=>(
              <span key={l} style={{display:'flex',alignItems:'center',gap:4}}>
                <span style={{width:9,height:9,borderRadius:2,background:c,display:'inline-block',opacity:0.9}}/>
                <span style={{color:c,fontSize:8}}>{l}</span>
                <span style={{color:'rgba(255,255,255,0.25)',fontSize:8}}>({desc})</span>
              </span>
            ))}
          </div>
        </div>

        {/* SVG World Map */}
        <div style={{position:'absolute',inset:0,paddingTop:34,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
          <svg ref={svgRef} viewBox="0 0 960 500" style={{width:'100%',height:'100%'}} preserveAspectRatio="xMidYMid meet">
            <rect width={960} height={500} fill="#04080f"/>
            {/* Ocean gradient */}
            <defs>
              <radialGradient id="oceanGrad" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor="#081828"/>
                <stop offset="100%" stopColor="#030c18"/>
              </radialGradient>
            </defs>
            <rect width={960} height={500} fill="url(#oceanGrad)"/>
            {/* Grid lines */}
            {[0,1,2,3,4,5,6,7,8,9].map(i=><line key={`v${i}`} x1={i*107} x2={i*107} y1={0} y2={500} stroke="rgba(30,120,255,0.04)" strokeWidth={0.5}/>)}
            {[0,1,2,3,4].map(i=><line key={`h${i}`} x1={0} x2={960} y1={i*125} y2={i*125} stroke="rgba(30,120,255,0.04)" strokeWidth={0.5}/>)}

            {/* Countries */}
            {geo?.features?.map((feat,i)=>{
              const name=getName(feat)
              const col=getColor(name)
              const isHov=hovered===name&&name
              const geom=feat.geometry
              if(!geom) return null
              const polys=geom.type==='Polygon'?[geom.coordinates]:geom.type==='MultiPolygon'?geom.coordinates:[]
              const pathD=polys.map(poly=>poly.map(ringToPath).join(' ')).join(' ')
              if(!pathD) return null
              const isCritical=tensionMap[name]==='CRITICAL'
              return(
                <g key={i}>
                  <path
                    d={pathD}
                    fill={col}
                    fillOpacity={isHov?0.9:isCritical?0.75:0.6}
                    stroke={isHov?'rgba(255,255,255,0.7)':'rgba(0,0,0,0.5)'}
                    strokeWidth={isHov?1.5:0.3}
                    style={{cursor:'pointer',transition:'fill-opacity 0.15s'}}
                    onMouseEnter={e=>{
                      setHovered(name)
                      const sr=svgRef.current?.getBoundingClientRect()
                      const er=e.target.getBoundingClientRect()
                      if(sr) setTooltip({name,x:er.left-sr.left+er.width/2,y:er.top-sr.top})
                    }}
                    onMouseLeave={()=>{setHovered(null);setTooltip(null)}}
                    onClick={()=>name&&setSelCountry(name)}
                  />
                </g>
              )
            })}

            {/* Tooltip */}
            {tooltip&&tooltip.name&&(()=>{
              const {level,color}=getTensionForCountry(tooltip.name)
              const tw=Math.max(140,tooltip.name.length*7+80)
              const tx=Math.min(930-tw,Math.max(10,tooltip.x-tw/2))
              const ty=Math.max(10,tooltip.y-44)
              const levelDesc={CRITICAL:'War / Civil War',HIGH:'Mass Violence',MEDIUM:'Conflict Risk',LOW:'Stable'}[level]||level
              return(
                <g>
                  <rect x={tx} y={ty} width={tw} height={34} rx={5} fill="rgba(4,11,21,0.95)" stroke={color} strokeWidth={0.8}/>
                  <text x={tx+tw/2} y={ty+13} fill="#fff" fontSize={10} textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontWeight={700}>{tooltip.name}</text>
                  <text x={tx+tw/2} y={ty+25} fill={color} fontSize={8} textAnchor="middle" fontFamily="JetBrains Mono,monospace">{level} · {levelDesc} · Click for live data</text>
                </g>
              )
            })()}
          </svg>
        </div>
      </div>

      {/* Right panel */}
      {!selCountry?(
        <div style={{width:450,flexShrink:0,borderLeft:'1px solid rgba(30,120,255,0.15)',background:'rgba(4,11,21,0.97)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
          {/* Asset tabs */}
          <div style={{padding:'10px 12px',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
            <div style={{color:'rgba(255,255,255,0.3)',fontSize:8,letterSpacing:1.5,marginBottom:8}}>SELECT ASSET</div>
            <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
              {ASSETS_LIST.map(a=>(
                <div key={a.key} onClick={()=>setSelAsset(a.key)} style={{padding:'5px 10px',borderRadius:6,cursor:'pointer',background:selAsset===a.key?'rgba(30,120,255,0.22)':'rgba(255,255,255,0.04)',border:`1px solid ${selAsset===a.key?'rgba(30,120,255,0.4)':'rgba(255,255,255,0.08)'}`,fontSize:10,color:selAsset===a.key?'#60a5fa':'rgba(255,255,255,0.6)',transition:'all 0.18s',fontFamily:'var(--font-mono)'}}>
                  {a.label}
                </div>
              ))}
            </div>
          </div>
          <div style={{padding:'8px 12px',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
              <span style={{fontWeight:700,color:'#fff',fontSize:12}}>{ASSETS_LIST.find(a=>a.key===selAsset)?.label}</span>
              <span style={{color:'#22c55e',fontSize:10}}>▲ live</span>
            </div>
            <CandleChart asset={selAsset} height={160}/>
          </div>
          {sig&&(
            <div style={{padding:'10px 12px',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
              <div style={{color:'rgba(255,255,255,0.3)',fontSize:8,letterSpacing:1.5,marginBottom:6}}>AI SIGNAL</div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                <span style={{fontWeight:700,color:'#fff'}}>{sig.ticker}</span>
                <span style={{padding:'2px 6px',borderRadius:3,fontSize:9,fontWeight:700,background:sig.direction==='BUY'?'rgba(34,197,94,0.2)':'rgba(239,68,68,0.2)',color:sig.direction==='BUY'?'#22c55e':'#ef4444'}}>{sig.direction}</span>
                <span style={{color:'rgba(255,255,255,0.4)',fontSize:9}}>{sig.confidence}% conf</span>
              </div>
              <div style={{color:'rgba(255,255,255,0.5)',fontSize:10,lineHeight:1.55}}>{sig.ai_analysis?.slice(0,120)}...</div>
            </div>
          )}
          <div style={{padding:'10px 12px',flex:1,overflow:'auto'}}>
            <div style={{color:'rgba(255,255,255,0.3)',fontSize:8,letterSpacing:1.5,marginBottom:8}}>DRIVING EVENTS — NLP SCORED</div>
            {events.slice(0,5).map(e=>(
              <div key={e.id} style={{display:'flex',gap:8,marginBottom:7,padding:'7px 9px',background:(LEVEL_COLOR[e.level]||'#3b82f6')+'10',border:`1px solid ${(LEVEL_COLOR[e.level]||'#3b82f6')}25`,borderRadius:6}}>
                <div style={{width:5,height:5,borderRadius:'50%',background:LEVEL_COLOR[e.level]||'#3b82f6',marginTop:3,flexShrink:0}}/>
                <div>
                  <div style={{color:'rgba(255,255,255,0.8)',fontSize:10,marginBottom:2}}>{e.title}</div>
                  <div style={{color:'rgba(255,255,255,0.35)',fontSize:9}}>{e.region} · <span style={{color:LEVEL_COLOR[e.level]||'#3b82f6'}}>{e.level}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ):(
        <div style={{width:390,flexShrink:0,position:'relative',overflow:'hidden'}}>
          <CountryPanel country={selCountry} onClose={()=>setSelCountry(null)} inline={true}/>
        </div>
      )}
    </div>
  )
}
