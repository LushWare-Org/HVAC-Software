import { describe, expect, it } from 'vitest'
import { bestFits, sortByUrgency, whenNeeded } from './boardFit'

const now = new Date('2026-10-09T10:00:00')
const recent = new Date().toISOString()

describe('order of the waiting jobs', () => {
  it('emergencies first, then high, then the rest; soonest first; no date last', () => {
    const jobs = [
      { id: 'a', priority: 'NORMAL', scheduledStart: '2026-10-09T15:00:00' },
      { id: 'b', priority: 'NORMAL', scheduledStart: undefined },
      { id: 'c', priority: 'EMERGENCY', scheduledStart: undefined },
      { id: 'd', priority: 'HIGH', scheduledStart: '2026-10-10T09:00:00' },
      { id: 'e', priority: 'NORMAL', scheduledStart: '2026-10-06T09:00:00' },
    ] as any[]
    expect(sortByUrgency(jobs).map(j => j.id)).toEqual(['c', 'd', 'e', 'a', 'b'])
  })
})

describe('when a job is needed', () => {
  it('reads plainly', () => {
    expect(whenNeeded({ priority: 'EMERGENCY' } as any, now)).toEqual({ label: 'Emergency · needed now', tone: 'red' })
    expect(whenNeeded({ priority: 'NORMAL' } as any, now)).toEqual({ label: 'No date yet', tone: 'grey' })
    expect(whenNeeded({ priority: 'NORMAL', scheduledStart: '2026-10-09T14:00:00' } as any, now).label).toBe('Today · 2:00 pm')
    expect(whenNeeded({ priority: 'NORMAL', scheduledStart: '2026-10-10T09:00:00' } as any, now).label).toBe('Tomorrow · 9:00 am')
    expect(whenNeeded({ priority: 'NORMAL', scheduledStart: '2026-10-06T09:00:00' } as any, now)).toEqual({ label: 'Overdue · was Tue 6 Oct', tone: 'amber' })
  })
})

describe('best technician for a job', () => {
  const tech = (id: string, lat: number, lng: number, extra: any = {}) => ({ id, userId: `u-${id}`, name: id, isActive: true, lastSeenAt: recent, currentLocation: { lat, lng }, ...extra })
  const job = { id: 'j', serviceLatitude: '6.90', serviceLongitude: '79.86' } as any

  it('prefers the nearest technician who is free', () => {
    const fit = bestFits([job], [tech('far', 7.2, 79.9) as any, tech('near', 6.91, 79.86) as any], {}, [])
    expect(fit.j.ranked.map(r => r.tech.id)).toEqual(['near', 'far'])
    expect(fit.j.ranked[0].why).toBe('1 km away · free now · nothing booked')
  })

  it('a nearby technician who is busy and booked up can lose to one a little further away', () => {
    const busyNear = tech('busy', 6.905, 79.86) as any
    const freeFar = tech('free', 6.95, 79.86) as any
    const assignments = [{ technicianId: 'busy', status: 'ON_SITE' }, { technicianId: 'busy', status: 'ASSIGNED' }] as any[]
    expect(bestFits([job], [busyNear, freeFar], {}, assignments).j.ranked[0].tech.id).toBe('free')
  })

  it('offline technicians are not suggested but can still be picked by hand', () => {
    const off = tech('off', 6.9, 79.86, { lastSeenAt: '2026-01-01T00:00:00Z' }) as any
    const fit = bestFits([job], [off], {}, [])
    expect(fit.j.ranked).toEqual([])
    expect(fit.j.unavailable.map(t => t.id)).toEqual(['off'])
  })
})
