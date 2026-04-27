import { useState, useEffect, useCallback } from 'react'
import { MOCK_GTI, MOCK_EVENTS, MOCK_SIGNALS, MOCK_COUNTRY_TENSIONS } from '../data/mockData'
import { API } from '../config'

const REFRESH_MS = 60_000

async function safeFetch(url, fallback) {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(20000),
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    if (!text || text.trim().startsWith('<')) {
      console.warn('Non-JSON response from:', url)
      return fallback
    }
    return JSON.parse(text)
  } catch (e) {
    console.warn('Fetch failed:', url, e.message)
    return fallback
  }
}

export function useGeoTrade() {
  const [gti,      setGti]      = useState(MOCK_GTI)
  const [events,   setEvents]   = useState(MOCK_EVENTS)
  const [signals,  setSignals]  = useState(MOCK_SIGNALS)
  const [tensions, setTensions] = useState(MOCK_COUNTRY_TENSIONS)
  const [isLive,   setIsLive]   = useState(false)

  const refresh = useCallback(async () => {
    // Always try to fetch — don't gate everything behind health check
    const [health, g, e, s, t] = await Promise.all([
      safeFetch(`${API}/api/health`, null),
      safeFetch(`${API}/api/gti`,              MOCK_GTI),
      safeFetch(`${API}/api/events`,           MOCK_EVENTS),
      safeFetch(`${API}/api/signals`,          MOCK_SIGNALS),
      safeFetch(`${API}/api/country-tensions`, MOCK_COUNTRY_TENSIONS),
    ])
    setIsLive(!!health)
    if (g)  setGti(g)
    if (e)  setEvents(e)
    if (s)  setSignals(s)
    if (t)  setTensions(t)
  }, [])

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, REFRESH_MS)
    return () => clearInterval(t)
  }, [refresh])

  return { gti, events, signals, tensions, isLive }
}
