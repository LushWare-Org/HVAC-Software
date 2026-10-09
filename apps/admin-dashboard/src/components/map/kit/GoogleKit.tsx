import { createContext, useContext, useEffect, useId, useRef, useState } from 'react'
import { APIProvider, AdvancedMarker, InfoWindow, Map as GMap, useMap } from '@vis.gl/react-google-maps'
import { ensurePinStyles } from '../../../lib/maps/pins'
import { GOOGLE_MAPS_KEY, GOOGLE_MAP_ID, markGoogleFailed } from './provider'
import type { BaseMapProps, LineProps, PinProps } from './types'

/** One popup open at a time, like Leaflet. */
const OpenPin = createContext<{ openId: string | null; setOpenId: (id: string | null) => void }>({ openId: null, setOpenId: () => {} })

function View({ fit, refitKey, viewStore }: Pick<BaseMapProps, 'fit' | 'refitKey' | 'viewStore'>) {
  const map = useMap()
  // The fit key this map last settled. Development's StrictMode runs effects twice: a plain
  // "first time" flag restored the saved view on the first run, then fitted all pins over it on
  // the second, and saved that, so the view was never kept. Settle each key once instead.
  const settled = useRef<string | null>(null)
  const fitKey = refitKey ?? ''

  useEffect(() => {
    if (!map || settled.current === fitKey) return
    const firstTime = settled.current === null
    settled.current = fitKey
    const saved = firstTime ? viewStore?.read() : null
    if (saved) { map.setCenter({ lat: saved.center[0], lng: saved.center[1] }); map.setZoom(saved.zoom); return }
    const pts = fit ?? []
    if (pts.length === 1) { map.setCenter({ lat: pts[0][0], lng: pts[0][1] }); map.setZoom(13) }
    else if (pts.length > 1) {
      const b = new google.maps.LatLngBounds()
      pts.forEach((p) => b.extend({ lat: p[0], lng: p[1] }))
      map.fitBounds(b, 48)
      // Don't zoom in past street level when the points are close together.
      google.maps.event.addListenerOnce(map, 'idle', () => { if ((map.getZoom() ?? 0) > 14) map.setZoom(14) })
    }
  }, [map, fitKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!map || !viewStore) return
    const l = map.addListener('idle', () => {
      const c = map.getCenter(); const z = map.getZoom()
      if (c && z != null) viewStore.write({ center: [c.lat(), c.lng()], zoom: z })
    })
    return () => l.remove()
  }, [map, viewStore])
  return null
}

// baseLayer is not used here: Google's own Map/Satellite control does that job.
export function GoogleBaseMap({ center, zoom, fit, refitKey, viewStore, style, children }: BaseMapProps) {
  ensurePinStyles()
  const [openId, setOpenId] = useState<string | null>(null)
  return (
    <APIProvider apiKey={GOOGLE_MAPS_KEY} language="en" onError={() => markGoogleFailed('script failed to load')}>
      <OpenPin.Provider value={{ openId, setOpenId }}>
        <GMap
          mapId={GOOGLE_MAP_ID}
          defaultCenter={{ lat: center[0], lng: center[1] }}
          defaultZoom={zoom}
          gestureHandling="greedy"
          mapTypeControl
          fullscreenControl
          streetViewControl={false}
          clickableIcons={false}
          style={{ height: '100%', width: '100%', ...style }}
          onClick={() => setOpenId(null)}
        >
          <View fit={fit} refitKey={refitKey} viewStore={viewStore} />
          {children}
        </GMap>
      </OpenPin.Provider>
    </APIProvider>
  )
}

export function GooglePin({ position, html, width, height, anchor, opacity, zIndex, popup, popupWidth = 240, label }: PinProps) {
  const id = useId()
  const { openId, setOpenId } = useContext(OpenPin)
  const [marker, setMarker] = useState<google.maps.marker.AdvancedMarkerElement | null>(null)
  const pos = { lat: position[0], lng: position[1] }
  // Advanced markers sit with the bottom-centre of their content on the point;
  // shift so the artwork's own anchor lands there instead.
  const shift = `translate(${width / 2 - anchor[0]}px, ${height - anchor[1]}px)`
  return (
    <>
      <AdvancedMarker ref={setMarker} position={pos} zIndex={zIndex} onClick={popup ? () => setOpenId(openId === id ? null : id) : undefined}>
        <div style={{ width, height, transform: shift, opacity }} dangerouslySetInnerHTML={{ __html: html }} />
      </AdvancedMarker>
      {label && (
        <AdvancedMarker position={pos} zIndex={(zIndex ?? 0) + 1} clickable={false}>
          <div className="hp-tip" style={{ transform: `translateY(-${anchor[1] + 2}px)`, pointerEvents: 'none' }}>{label}</div>
        </AdvancedMarker>
      )}
      {popup && openId === id && marker && (
        <InfoWindow anchor={marker} maxWidth={popupWidth} onCloseClick={() => setOpenId(null)} pixelOffset={[0, -(anchor[1] - 6)]}>
          {popup}
        </InfoWindow>
      )}
    </>
  )
}

export function GoogleLine({ positions, color, weight, opacity = 1, dash }: LineProps) {
  const map = useMap()
  useEffect(() => {
    if (!map) return
    const path = positions.map((p) => ({ lat: p[0], lng: p[1] }))
    let dashLen = 0, gapLen = 0
    if (dash) [dashLen, gapLen] = dash.split(/\s+/).map(Number)
    const line = new google.maps.Polyline({
      map, path, geodesic: false, clickable: false,
      strokeColor: color,
      // Google draws dashes with repeating symbols on an invisible line.
      strokeOpacity: dash ? 0 : opacity,
      strokeWeight: weight,
      icons: dash ? [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: opacity, strokeColor: color, strokeWeight: weight, scale: dashLen / 2 }, offset: '0', repeat: `${dashLen + gapLen}px` }] : undefined,
    })
    return () => line.setMap(null)
  }, [map, JSON.stringify(positions), color, weight, opacity, dash]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}
