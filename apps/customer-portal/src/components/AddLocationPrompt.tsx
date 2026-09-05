/**
 * AddLocationPrompt — dashboard nudge shown until the customer has saved a
 * service location.
 *
 * Deliberately dismissible-by-doing rather than a hard gate: booking still
 * works without a saved pin (you just place one per job), so this asks rather
 * than blocks. It disappears on its own the moment a location exists.
 *
 * Colours come from the blue tokens so it stays legible in light, dark and
 * black themes — the same trap the reschedule banner fell into.
 */
import { useNavigate } from 'react-router-dom'
import { MapPin, ChevronRight } from 'lucide-react'
import { useCustomerProfile } from '../hooks/useMyProfile'

export default function AddLocationPrompt() {
  const navigate = useNavigate()
  const { data: profile, isLoading } = useCustomerProfile()

  // Nothing to nag about until we know, and nothing once it's set.
  if (isLoading || !profile) return null
  if (profile.latitude != null && profile.longitude != null) return null

  return (
    <button
      onClick={() => navigate('/profile#my-location')}
      style={{
        width: '100%', textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer',
        background: 'var(--blue-dim)',
        border: '1px solid color-mix(in srgb, var(--blue) 40%, transparent)',
        borderRadius: 14, padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 11,
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: 'color-mix(in srgb, var(--blue) 18%, transparent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <MapPin size={17} style={{ color: 'var(--blue)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--t1)' }}>
          Add your location
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--t2)' }}>
          Save it once and we'll use it every time you book, so you never have to find it on the map again.
        </p>
      </div>
      <span style={{
        display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0,
        fontSize: 12, fontWeight: 700, color: 'var(--blue)',
      }}>
        Add it <ChevronRight size={13} />
      </span>
    </button>
  )
}
