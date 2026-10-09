import { canConfirm, isConfirmed } from './confirm'
import { formatWindow } from './format'

const start = '2026-10-12T04:00:00.000Z'

describe('visit confirmation', () => {
  it('is confirmed only for the time that was confirmed', () => {
    expect(isConfirmed({ scheduledStart: start, confirmedFor: start })).toBe(true)
    expect(isConfirmed({ scheduledStart: '2026-10-12T05:00:00.000Z', confirmedFor: start })).toBe(false)
    expect(isConfirmed({ scheduledStart: start })).toBe(false)
  })
  it('asks only for a booked visit that has a technician and a time', () => {
    const base = { status: 'SCHEDULED', assignedToId: 't1', scheduledStart: start, confirmedFor: null }
    expect(canConfirm(base)).toBe(true)
    expect(canConfirm({ ...base, confirmedFor: start })).toBe(false)
    expect(canConfirm({ ...base, assignedToId: null })).toBe(false)
    expect(canConfirm({ ...base, status: 'PENDING' })).toBe(false)
    expect(canConfirm({ ...base, scheduledStart: null })).toBe(false)
  })
})

describe('formatWindow', () => {
  it('names the part of day and gives both ends', () => {
    const a = new Date(2026, 9, 12, 8, 0).toISOString()
    const b = new Date(2026, 9, 12, 12, 0).toISOString()
    const text = formatWindow(a, b)
    expect(text.startsWith('Morning ')).toBe(true)
    expect(text).toContain('–')
  })
  it('is empty without a window', () => {
    expect(formatWindow(null, null)).toBe('')
  })
})
