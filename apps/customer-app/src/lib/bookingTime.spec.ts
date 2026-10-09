import { buildTiming, EXACT_TIMES } from './bookingTime'

const day = new Date(2026, 9, 12) // Mon 12 Oct 2026, local

describe('booking time', () => {
  it('keeps the whole arrival window for a window booking', () => {
    const t = buildTiming({ day, exact: false, windowKey: 'morning', exactTime: '10:00' })
    expect(t.timeMode).toBe('WINDOW')
    expect(new Date(t.preferredStart).getHours()).toBe(8)
    expect(new Date(t.preferredEnd as string).getHours()).toBe(12)
  })
  it('sends one time, with no end, for an exact booking', () => {
    const t = buildTiming({ day, exact: true, windowKey: 'morning', exactTime: '10:30' })
    expect(t.timeMode).toBe('EXACT')
    expect(t.preferredEnd).toBeUndefined()
    const s = new Date(t.preferredStart)
    expect([s.getHours(), s.getMinutes()]).toEqual([10, 30])
  })
  it('offers half-hour times from 7:00 AM to 7:00 PM', () => {
    expect(EXACT_TIMES[0]).toBe('07:00')
    expect(EXACT_TIMES[EXACT_TIMES.length - 1]).toBe('19:00')
    expect(EXACT_TIMES).toHaveLength(25)
  })
})
