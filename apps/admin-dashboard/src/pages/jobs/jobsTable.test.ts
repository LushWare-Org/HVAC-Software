import { describe, expect, it } from 'vitest'
import { missedDays, OPEN_STATUS_SET } from './JobsTable'
import { DONE_STATUSES, OPEN_STATUSES, PRIORITIES, priorityWord, statusWord } from './jobLabels'

const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(10, 0, 0, 0); return d.toISOString() }

describe('missed jobs', () => {
  it('counts whole days only for open jobs whose day has passed', () => {
    expect(missedDays({ status: 'SCHEDULED', scheduledStart: daysAgo(1) })).toBe(1)
    expect(missedDays({ status: 'PENDING', scheduledStart: daysAgo(3) })).toBe(3)
    expect(missedDays({ status: 'SCHEDULED', scheduledStart: daysAgo(0) })).toBe(0)
    expect(missedDays({ status: 'COMPLETED', scheduledStart: daysAgo(3) })).toBe(0)
    expect(missedDays({ status: 'SCHEDULED', scheduledStart: undefined })).toBe(0)
  })
  it('open and finished statuses never overlap', () => {
    for (const s of OPEN_STATUSES) expect(OPEN_STATUS_SET.has(s)).toBe(true)
    for (const s of DONE_STATUSES) expect(OPEN_STATUS_SET.has(s)).toBe(false)
  })
})

describe('label words', () => {
  it('reads plainly, and copes with unknown values', () => {
    expect(statusWord('EN_ROUTE')).toBe('En route')
    expect(statusWord('ON_SITE')).toBe('On site')
    expect(statusWord('SOMETHING_NEW')).toBe('Something new')
    expect(PRIORITIES.map(priorityWord)).toEqual(['Emergency', 'Urgent', 'High', 'Normal', 'Low'])
  })
})
