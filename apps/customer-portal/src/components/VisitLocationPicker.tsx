/**
 * Drop a pin where the visit is. Used by the emailed share-location link and by
 * signed-in customers on their Jobs page. "Use where I am now" fills the pin
 * from the phone's location for people who are at the property.
 */
import { useState } from 'react'
import { LocateFixed, Loader2 } from 'lucide-react'
import MapPicker from './MapPickerLazy'

const COLOMBO = { lat: 6.9271, lng: 79.8612 }

export default function VisitLocationPicker({ initial, saving, onSave, saveLabel = 'Save this location' }: {
  initial?: { lat: number | null; lng: number | null }
  saving?: boolean
  onSave: (lat: number, lng: number) => void
  saveLabel?: string
}) {
  const start = initial?.lat != null && initial?.lng != null ? { lat: initial.lat, lng: initial.lng } : null
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(start)
  const [locating, setLocating] = useState(false)
  const [hint, setHint] = useState('')

  const useHere = () => {
    if (!navigator.geolocation) { setHint("Your browser can't share your location. Tap the map instead."); return }
    setLocating(true); setHint('')
    navigator.geolocation.getCurrentPosition(
      (p) => { setPin({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocating(false) },
      () => { setLocating(false); setHint("We couldn't get your location. Tap the map where the visit is instead.") },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  const shown = pin ?? COLOMBO
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <button type="button" className="btn btn-ghost" onClick={useHere} disabled={locating} style={{ alignSelf: 'flex-start', display: 'inline-flex', gap: 6 }}>
        {locating ? <Loader2 size={15} className="spin" /> : <LocateFixed size={15} />} Use where I am now
      </button>
      <MapPicker
        key={`${shown.lat.toFixed(5)},${shown.lng.toFixed(5)}`}
        lat={shown.lat}
        lng={shown.lng}
        zoom={pin ? 16 : 11}
        height="320px"
        onChange={(lat, lng) => setPin({ lat, lng })}
      />
      {hint && <p style={{ margin: 0, fontSize: 13, color: 'var(--amber, #b45309)' }}>{hint}</p>}
      <button type="button" className="btn btn-primary" disabled={!pin || saving} onClick={() => pin && onSave(pin.lat, pin.lng)}>
        {saving ? 'Saving…' : pin ? saveLabel : 'Tap the map to drop a pin'}
      </button>
    </div>
  )
}
