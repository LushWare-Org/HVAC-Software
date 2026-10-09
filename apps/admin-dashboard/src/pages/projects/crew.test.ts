import { describe, expect, it } from 'vitest'
import { dayCrewFor, needsCrew } from './crew'

const roster = [
  { date: '2026-10-08', techUserIds: ['u-amal', 'u-kasun', 'u-nuwan'], isOverride: false, isOff: false },
  { date: '2026-10-09', techUserIds: [], isOverride: false, isOff: true },
]
const sched = new Map([['u-kasun', 't-kasun'], ['u-nuwan', 't-nuwan'], ['u-amal', 't-amal']])
const at = (iso: string) => ({ scheduledStart: iso })

describe('dayCrewFor', () => {
  it("gives a project job that day's rostered crew, base team first, the first of them leading", () => {
    // Thursday 8 Oct, 9:00 local.
    const crew = dayCrewFor(at(new Date(2026, 9, 8, 9, 0).toISOString()), roster, ['u-kasun'], sched)
    expect(crew).toEqual({ technicianIds: ['t-kasun', 't-amal', 't-nuwan'], leadTechnicianId: 't-kasun', userIds: ['u-kasun', 'u-amal', 'u-nuwan'] })
  })

  it('no crew for an unscheduled job, a site-closed day, or a day without a roster', () => {
    expect(dayCrewFor({}, roster, [], sched)).toBeNull()
    expect(dayCrewFor(at(new Date(2026, 9, 9, 9).toISOString()), roster, [], sched)).toBeNull()
    expect(dayCrewFor(at(new Date(2026, 9, 10, 9).toISOString()), roster, [], sched)).toBeNull()
  })

  it('leaves out rostered people who are not set up as technicians yet', () => {
    const crew = dayCrewFor(at(new Date(2026, 9, 8, 9).toISOString()), roster, [], new Map([['u-nuwan', 't-nuwan']]))
    expect(crew).toEqual({ technicianIds: ['t-nuwan'], leadTechnicianId: 't-nuwan', userIds: ['u-nuwan'] })
  })
})

describe('needsCrew', () => {
  it('only waiting, scheduled jobs with nobody on them', () => {
    expect(needsCrew({ status: 'SCHEDULED', scheduledStart: 'x' })).toBe(true)
    expect(needsCrew({ status: 'PENDING', scheduledStart: 'x' })).toBe(true)
    expect(needsCrew({ status: 'SCHEDULED', scheduledStart: 'x', assignedToName: 'Kasun' })).toBe(false)
    expect(needsCrew({ status: 'COMPLETED', scheduledStart: 'x' })).toBe(false)
    expect(needsCrew({ status: 'SCHEDULED' })).toBe(false)
  })
})
