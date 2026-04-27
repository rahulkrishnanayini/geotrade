import { useState } from 'react'
import Navbar          from './components/Navbar'
import TickerBar       from './components/TickerBar'
import WaitlistModal   from './components/WaitlistModal'
import DisclaimerModal from './components/DisclaimerModal'
import EarthPulse      from './pages/EarthPulse'
import GeoMap          from './pages/GeoMap'
import AISignals       from './pages/AISignals'
import { useGeoTrade } from './hooks/useGeoTrade'

export default function App() {
  const [accepted, setAccepted]         = useState(false)
  const [view, setView]                 = useState('earth')
  const [showWaitlist, setWaitlist]     = useState(false)
  const [selectedSignal, setSignal]     = useState(null)
  const { gti, events, signals, tensions, isLive } = useGeoTrade()

  if (!accepted) return <DisclaimerModal onAccept={() => setAccepted(true)} />

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:'var(--bg-deep)' }}>
      <Navbar view={view} setView={setView} gti={gti} isLive={isLive} onWaitlist={() => setWaitlist(true)} />
      <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', position:'relative' }}>
        {view === 'earth' && <EarthPulse gti={gti} events={events} signals={signals} tensions={tensions} onSelectSignal={setSignal} onViewAI={() => setView('ai')} />}
        {view === 'geo'   && <GeoMap events={events} signals={signals} tensions={tensions} />}
        {view === 'ai'    && <AISignals signals={selectedSignal ? [selectedSignal,...signals.filter(s=>s.id!==selectedSignal.id)] : signals} events={events} />}
      </div>
      <TickerBar gti={gti} events={events} onWaitlist={() => setWaitlist(true)} />
      {showWaitlist && <WaitlistModal onClose={() => setWaitlist(false)} />}
    </div>
  )
}
