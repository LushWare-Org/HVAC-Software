/**
 * MapPickerLazy — Suspense-friendly wrapper around the Leaflet-based MapPicker.
 *
 * `./MapPicker.tsx` imports react-leaflet/leaflet/leaflet.css at module load,
 * so any modal that statically imports it pulls Leaflet (~150 KB gz) into the
 * modal's chunk. Importing this lazy wrapper keeps Leaflet out until the
 * user opens the modal that needs the map.
 */
import { lazy, Suspense, type ComponentProps } from 'react'

const MapPicker = lazy(() => import('./MapPicker'))

type Props = ComponentProps<typeof MapPicker>

export default function MapPickerLazy(props: Props) {
  return (
    <Suspense
      fallback={
        <div
          style={{
            width: '100%', height: 300, borderRadius: 8,
            background: 'var(--bg-hover, #f3f4f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--t3, #6b7280)', fontSize: 13,
          }}
        >
          Loading map…
        </div>
      }
    >
      <MapPicker {...props} />
    </Suspense>
  )
}
