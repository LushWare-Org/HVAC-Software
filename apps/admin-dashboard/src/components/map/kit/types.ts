import type { ReactNode } from 'react'
import type { MapViewStore } from '../../../lib/mapView'

export type LatLng = [number, number]

export interface BaseMapProps {
  center: LatLng
  zoom: number
  /** Points to fit on first load (when there is no remembered view). */
  fit?: LatLng[]
  /** Change this to force a re-fit, e.g. when the planner switches to another day. */
  refitKey?: string
  /** Remembers where the user left the map. */
  viewStore?: MapViewStore
  baseLayer?: 'street' | 'satellite'
  style?: React.CSSProperties
  children?: ReactNode
}

export interface PinProps {
  position: LatLng
  /** The pin artwork, from lib/maps/pins. */
  html: string
  width: number
  height: number
  /** The pixel inside the artwork that sits exactly on `position`. */
  anchor: [number, number]
  opacity?: number
  zIndex?: number
  /** Shown when the pin is clicked. */
  popup?: ReactNode
  popupWidth?: number
  /** Always-visible bar above the pin (the "Job details" mode). */
  label?: ReactNode
}

export interface LineProps {
  positions: LatLng[]
  color: string
  weight: number
  opacity?: number
  /** Dash pattern as "dash gap" in pixels, e.g. "10 6". Solid when omitted. */
  dash?: string
}
