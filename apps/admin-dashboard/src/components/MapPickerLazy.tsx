/**
 * MapPickerLazy — Suspense-friendly wrapper around the Leaflet-based MapPicker.
 *
 * Reason: `./MapPicker.tsx` imports `react-leaflet`, `leaflet`, and the leaflet
 * CSS at module load. Anything that statically imports MapPicker pulls Leaflet
 * (~150 KB gzipped) into its chunk — even when the map is only shown inside
 * a modal that the user might never open. Importing this lazy wrapper instead
 * keeps Leaflet out of the modal's chunk until the user actually opens it.
 *
 * Drop-in: same prop surface as MapPicker. Falls back to a small placeholder
 * while the chunk arrives (usually <300 ms).
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
