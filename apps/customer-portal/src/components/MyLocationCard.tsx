/**
 * MyLocationCard — where a customer sets the service location we remember.
 *
 * Saving it once means every later booking (theirs or one an admin raises for
 * them) starts with the pin already on their place, instead of making someone
 * hunt for the same house on a map every single time. Still overridable per
 * job — this is a default, not a lock.
 */
import { useEffect, useState } from 'react'
import { MapPin, Check, Loader2 } from 'lucide-react'
import MapPicker from './MapPickerLazy'
import { useCustomerProfile, useUpdateCustomerProfile } from '../hooks/useMyProfile'
import { useToast } from '../contexts/ToastContext'

/** Sensible starting view when the customer has never set a pin. */
const FALLBACK = { lat: 6.9271, lng: 79.8612 }

export default function MyLocationCard() {
  const { data: profile } = useCustomerProfile()
  const update = useUpdateCustomerProfile()
  const { showSuccess, showError } = useToast()

  const saved = profile?.latitude != null && profile?.longitude != null
  const [coords, setCoords] = useState(FALLBACK)
  const [tag, setTag] = useState('')
  const [dirty, setDirty] = useState(false)

  // Seed from the saved pin once the profile loads.
  useEffect(() => {
    if (profile?.latitude != null && profile?.longitude != null) {
      setCoords({ lat: Number(profile.latitude), lng: Number(profile.longitude) })
    }
    setTag(profile?.locationTag ?? '')
    setDirty(false)
  }, [profile?.latitude, profile?.longitude, profile?.locationTag])

  const save = () => {
    update.mutate(
      { latitude: coords.lat, longitude: coords.lng, locationTag: tag.trim() || undefined },
      {
        onSuccess: () => { setDirty(false); showSuccess('Location saved') },
        onError: () => showError('Could not save your location. Please try again.'),
      },
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MapPin size={15} /> My service location
        </div>
        {saved && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5,
            fontWeight: 700, color: 'var(--green)',
          }}>
            <Check size={12} /> Saved
          </span>
        )}
      </div>
      <div style={{ padding: '16px 18px' }}>
        <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 12px', lineHeight: 1.6 }}>
          {saved
            ? 'We use this as the default location when you book a service. You can still change it for any individual visit.'
            : "Set this once and we'll use it as the starting point for every service you book — no need to find it on the map each time."}
        </p>

        <MapPicker
          label="Drag the pin to your location"
          lat={coords.lat}
          lng={coords.lng}
          onChange={(lat, lng) => { setCoords({ lat, lng }); setDirty(true) }}
          height="240px"
        />

        <div style={{ marginTop: 12 }}>
          <label style={{
            display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--t3)',
            textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6,
          }}>
            Label (optional)
          </label>
          <input
            className="form-input"
            value={tag}
            maxLength={60}
            placeholder="Home, Shop, Site B…"
            onChange={(e) => { setTag(e.target.value); setDirty(true) }}
            style={{ maxWidth: 280 }}
          />
        </div>

        <button
          className="btn btn-primary"
          style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          onClick={save}
          disabled={update.isPending || (!dirty && saved)}
        >
          {update.isPending
            ? <><Loader2 size={13} className="spin" /> Saving…</>
            : <>{saved ? 'Update location' : 'Save location'}</>}
        </button>
      </div>
    </div>
  )
}
