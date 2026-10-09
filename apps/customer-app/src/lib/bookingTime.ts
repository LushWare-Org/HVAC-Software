/**
 * The time a customer asks for when booking: an arrival window (the easy default) or one exact
 * time. The same windows and limits as the portal, so a visit booked in either place reads the same
 * to the office.
 */
export const WINDOWS = [
  { key: 'morning', label: 'Morning', startHour: 8, endHour: 12, range: '8:00 AM – 12:00 PM' },
  { key: 'afternoon', label: 'Afternoon', startHour: 12, endHour: 16, range: '12:00 – 4:00 PM' },
  { key: 'evening', label: 'Evening', startHour: 16, endHour: 19, range: '4:00 – 7:00 PM' },
] as const

export type WindowKey = (typeof WINDOWS)[number]['key']

/** Exact times offered: every half hour from 7:00 AM to 7:00 PM. */
export const EXACT_TIMES: string[] = Array.from({ length: 25 }, (_, i) => {
  const minutes = 7 * 60 + i * 30
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
})

export function timeLabel(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date(2000, 0, 1, h, m)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export interface BookingTiming {
  preferredStart: string
  preferredEnd?: string
  timeMode: 'EXACT' | 'WINDOW'
}

/** What to send for the chosen day and time. A window keeps its whole range; an exact time has no end. */
export function buildTiming(opts: { day: Date; exact: boolean; windowKey: WindowKey; exactTime: string }): BookingTiming {
  const at = (hour: number, minute = 0) => {
    const d = new Date(opts.day)
    d.setHours(hour, minute, 0, 0)
    return d
  }
  if (opts.exact) {
    const [h, m] = opts.exactTime.split(':').map(Number)
    return { preferredStart: at(h, m).toISOString(), timeMode: 'EXACT' }
  }
  const w = WINDOWS.find((x) => x.key === opts.windowKey) ?? WINDOWS[0]
  return { preferredStart: at(w.startHour).toISOString(), preferredEnd: at(w.endHour).toISOString(), timeMode: 'WINDOW' }
}
