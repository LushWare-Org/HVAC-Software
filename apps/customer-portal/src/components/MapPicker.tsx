/**
 * MapPicker — Reusable Leaflet map for picking GPS coordinates.
 * Forward geocoding:  type address → Search → pin moves to result
 * Reverse geocoding:  click anywhere on map → pin moves + address appears in search box
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { LeafletMouseEvent } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

interface MapPickerProps {
  lat: number
  lng: number
  onChange: (lat: number, lng: number) => void
  height?: string
  zoom?: number
  label?: string
}

/** Inner click handler — must be inside MapContainer to access Leaflet context */
function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

/** Smoothly re-centers the map whenever lat/lng props change */
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  const prevRef = useRef({ lat, lng })
  useEffect(() => {
    if (prevRef.current.lat !== lat || prevRef.current.lng !== lng) {
      map.setView([lat, lng], map.getZoom())
      prevRef.current = { lat, lng }
    }
  }, [lat, lng, map])
  return null
}

export default function MapPicker({ lat, lng, onChange, height = '250px', zoom = 13, label }: MapPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching]     = useState(false)
  const [reversing, setReversing]     = useState(false)

  /** Forward geocode: search box → pin */
  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim()
    if (!q) return
    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
        { headers: { 'Accept-Language': 'en' } },
      )
      const data = await res.json()
      if (data.length > 0) {
        const { lat: newLat, lon: newLng, display_name } = data[0]
        onChange(Number.parseFloat(newLat), Number.parseFloat(newLng))
        // Replace raw query with clean resolved name (first 3 segments)
        setSearchQuery(display_name.split(',').slice(0, 3).join(',').trim())
      }
    } finally {
      setSearching(false)
    }
  }, [searchQuery, onChange])

  /** Reverse geocode: map click → pin + address in search box */
  const handleMapClick = useCallback(async (clickLat: number, clickLng: number) => {
    onChange(clickLat, clickLng)
    setReversing(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${clickLat}&lon=${clickLng}`,
        { headers: { 'Accept-Language': 'en' } },
      )
      const data = await res.json()
      if (data?.display_name) {
        setSearchQuery(data.display_name.split(',').slice(0, 4).join(',').trim())
      }
    } catch {
      // Silently fail
    } finally {
      setReversing(false)
    }
  }, [onChange])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {label && (
        <label style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </label>
      )}

      {/* Search bar */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder={reversing ? 'Resolving address…' : 'Search address or place'}
          disabled={reversing}
          style={{
            flex: 1,
            padding: '9px 12px',
            borderRadius: 8,
            border: '1px solid #D1D5DB',
            background: reversing ? '#F9FAFB' : '#fff',
            color: '#111827',
            fontSize: 13,
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching || reversing}
          style={{
            padding: '9px 14px',
            borderRadius: 8,
            border: 'none',
            background: (searching || reversing) ? '#93C5FD' : '#2563EB',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: (searching || reversing) ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {searching ? '...' : reversing ? '...' : 'Search'}
        </button>
      </div>

      {/* Map */}
      <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #E5E7EB', height }}>
        <MapContainer center={[lat, lng]} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lng]} />
          <ClickHandler onMapClick={handleMapClick} />
          <RecenterMap lat={lat} lng={lng} />
        </MapContainer>
      </div>

      {/* Coordinates + hint */}
      <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#9CA3AF' }}>
        <span>Lat: {lat.toFixed(6)}</span>
        <span>Lng: {lng.toFixed(6)}</span>
        <span>{reversing ? 'Resolving address…' : 'Click map or search to set location'}</span>
      </div>
    </div>
  )
}
