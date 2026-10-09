import { useSyncExternalStore } from 'react'
import { useCompanySettings } from '../../../hooks/useCompanySettings'

/**
 * Which map engine to draw with. Leaflet is the default for everyone; Google Maps
 * is opt-in per company (companies.features.googleMaps = true) and only when a key
 * is configured. Any failure on Google's side (bad key, blocked script, offline)
 * drops the page back to Leaflet instead of leaving an empty grey box.
 */
export type MapEngine = 'leaflet' | 'google'

export const GOOGLE_MAPS_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim() || ''
/** A Map ID is needed for Advanced Markers. "DEMO_MAP_ID" works for trying things out. */
export const GOOGLE_MAP_ID = (import.meta.env.VITE_GOOGLE_MAP_ID as string | undefined)?.trim() || 'DEMO_MAP_ID'

let failed = false
const listeners = new Set<() => void>()
export function markGoogleFailed(reason: string) {
  if (failed) return
  failed = true
  console.warn(`[Maps] Google Maps unavailable (${reason}); using the standard map instead.`)
  listeners.forEach((l) => l())
}
if (typeof window !== 'undefined') {
  // Google calls this global when the key is rejected (wrong domain, API not enabled, billing off).
  ;(window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => markGoogleFailed('key rejected')
}
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }

export function googleEnabledFor(features: Record<string, unknown> | undefined | null): boolean {
  return features?.googleMaps === true && !!GOOGLE_MAPS_KEY
}

export function useMapEngine(): MapEngine {
  const { data } = useCompanySettings()
  const didFail = useSyncExternalStore(subscribe, () => failed, () => false)
  // ?map=leaflet forces the standard map, handy for comparing the two side by side.
  const forced = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('map') : null
  if (forced === 'leaflet') return 'leaflet'
  return !didFail && googleEnabledFor(data?.features) ? 'google' : 'leaflet'
}
