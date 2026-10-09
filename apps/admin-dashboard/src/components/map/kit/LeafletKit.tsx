import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ensurePinStyles } from '../../../lib/maps/pins'
import type { BaseMapProps, LineProps, PinProps } from './types'

const TILES = {
  street: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics' },
} as const

/** Restores the remembered view, else fits the points; saves the view whenever the user moves it. */
function ViewKeeper({ fit, refitKey, viewStore }: Pick<BaseMapProps, 'fit' | 'refitKey' | 'viewStore'>) {
  const map = useMap()
  // Settle each fit key once (StrictMode runs effects twice in development; see GoogleKit).
  const settled = useRef<string | null>(null)
  const fitKey = refitKey ?? ''

  useEffect(() => {
    if (settled.current === fitKey) return
    const firstTime = settled.current === null
    settled.current = fitKey
    const saved = firstTime ? viewStore?.read() : null
    if (saved) { map.setView(saved.center, saved.zoom, { animate: false }); return }
    const pts = fit ?? []
    if (pts.length === 1) map.setView(pts[0], 13)
    else if (pts.length > 1) map.fitBounds(L.latLngBounds(pts.map((p) => L.latLng(p[0], p[1]))), { padding: [48, 48], maxZoom: 14 })
    // Fits on mount and when refitKey changes only: re-fitting on every technician move would yank the map back.
  }, [fitKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!viewStore) return
    const save = () => {
      // Leaflet reads live DOM nodes, so this throws while the map is being torn down.
      try { const c = map.getCenter(); viewStore.write({ center: [c.lat, c.lng], zoom: map.getZoom() }) } catch { /* going away */ }
    }
    map.on('moveend', save)
    return () => { map.off('moveend', save) }
  }, [map, viewStore])
  return null
}

export function LeafletBaseMap({ center, zoom, fit, refitKey, viewStore, baseLayer = 'street', style, children }: BaseMapProps) {
  ensurePinStyles()
  const tile = TILES[baseLayer]
  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%', ...style }} scrollWheelZoom>
      {/* key forces a clean TileLayer remount when the base layer flips */}
      <TileLayer key={baseLayer} attribution={tile.attribution} url={tile.url} />
      <ViewKeeper fit={fit} refitKey={refitKey} viewStore={viewStore} />
      {children}
    </MapContainer>
  )
}

export function LeafletPin({ position, html, width, height, anchor, opacity, zIndex, popup, popupWidth = 240, label }: PinProps) {
  const icon = useMemo(
    () => L.divIcon({ className: '', html, iconSize: [width, height], iconAnchor: anchor, popupAnchor: [0, -anchor[1] + 4] }),
    [html, width, height, anchor[0], anchor[1]], // eslint-disable-line react-hooks/exhaustive-deps
  )
  // The Marker is re-created when the label appears or goes: react-leaflet doesn't
  // reliably unbind a permanent Tooltip from a live Marker.
  return (
    <Marker key={label ? 'with-label' : 'plain'} position={position} icon={icon} opacity={opacity} zIndexOffset={zIndex ?? 0}>
      {label && <Tooltip permanent direction="top" offset={[0, -anchor[1]]} className="hp-tip">{label}</Tooltip>}
      {popup && <Popup maxWidth={popupWidth}>{popup}</Popup>}
    </Marker>
  )
}

export function LeafletLine({ positions, color, weight, opacity = 1, dash }: LineProps) {
  return <Polyline positions={positions} pathOptions={{ color, weight, opacity, dashArray: dash, lineCap: 'round', lineJoin: 'round' }} />
}
