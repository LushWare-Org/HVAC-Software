import { describe, expect, it } from 'vitest'
import { bearing, jobPinHtml, metresBetween, stageOf, techPinHtml, tradeOf, urgencyOf } from './pins'

describe('tradeOf', () => {
  it('uses the job tags first, then its type, then its title', () => {
    expect(tradeOf({ tags: ['seed', 'plumbing'], title: 'AC service' })).toBe('plumbing')
    expect(tradeOf({ jobTypeName: 'Electrical repair', title: 'Visit' })).toBe('electrical')
    expect(tradeOf({ title: 'Cold room compressor failure' })).toBe('hvac')
    expect(tradeOf({ title: 'Bathroom pipe leak repair' })).toBe('plumbing')
  })
  it('falls back to agreement visits, then other', () => {
    expect(tradeOf({ title: 'Quarterly visit', isAgreementJob: true })).toBe('agreement')
    expect(tradeOf({ title: 'Site visit' })).toBe('general')
  })
})

describe('stageOf', () => {
  it('reads the job status first, then the assignment', () => {
    expect(stageOf({ status: 'COMPLETED' }, true)).toBe('done')
    expect(stageOf({ status: 'PAID' }, true)).toBe('done')
    expect(stageOf({ status: 'ON_HOLD' }, true)).toBe('hold')
    expect(stageOf({ status: 'SCHEDULED' }, true, 'EN_ROUTE')).toBe('enroute')
    expect(stageOf({ status: 'ON_SITE' }, true)).toBe('onsite')
    expect(stageOf({ status: 'SCHEDULED' }, true)).toBe('scheduled')
    expect(stageOf({ status: 'PENDING' }, false)).toBe('unassigned')
  })
})

describe('urgencyOf', () => {
  it('maps priorities to the pin halo', () => {
    expect(urgencyOf('EMERGENCY')).toBe('emergency')
    expect(urgencyOf('urgent')).toBe('emergency')
    expect(urgencyOf('HIGH')).toBe('high')
    expect(urgencyOf('NORMAL')).toBe('normal')
    expect(urgencyOf(undefined)).toBe('normal')
  })
})

describe('pin artwork', () => {
  it('unassigned pins are dashed and white; assigned ones are filled with the trade colour', () => {
    expect(jobPinHtml('hvac', 'unassigned')).toContain('stroke-dasharray="5 3"')
    const filled = jobPinHtml('plumbing', 'scheduled')
    expect(filled).toContain('fill="#4F46E5"')
    expect(filled).not.toContain('stroke-dasharray="5 3"')
  })
  it('emergency pulses red and high priority gets an orange ring', () => {
    expect(jobPinHtml('hvac', 'scheduled', 'emergency')).toContain('hp-pulse')
    expect(jobPinHtml('hvac', 'scheduled', 'high')).toContain('#F97316')
  })
  it('a technician pin shows one ring segment per job slot, filled for booked jobs', () => {
    const html = techPinHtml({ name: 'RP Tech', color: '#10B981', workload: 2, maxJobs: 5 })
    expect(html.match(/stroke-width="4.5"/g)).toHaveLength(5)
    expect(html.match(/stroke="#10B981"/g)).toHaveLength(2)
  })
  it('turns red when the day is full, and only moving technicians get a heading arrow and ripple', () => {
    expect(techPinHtml({ name: 'A', color: '#10B981', workload: 3, maxJobs: 3 })).toContain('#EF4444')
    const still = techPinHtml({ name: 'A', color: '#10B981', workload: 0, maxJobs: 3, heading: 90 })
    const moving = techPinHtml({ name: 'A', color: '#10B981', workload: 0, maxJobs: 3, moving: true, heading: 90 })
    expect(still).not.toContain('rotate(90deg)')
    expect(moving).toContain('rotate(90deg)')
    expect(moving).toContain('hp-ripple')
  })
  it('puts a photo in the round when there is one, and escapes names and urls', () => {
    const html = techPinHtml({ name: '<b>"x"</b>', avatarUrl: 'https://x/y.jpg?a="1"', color: '#2563EB', workload: 0, maxJobs: 4 })
    expect(html).toContain('<img src="https://x/y.jpg?a=&quot;1&quot;"')
    expect(html).not.toContain('<b>')
  })
})

describe('movement helpers', () => {
  it('bearing points the right way', () => {
    expect(Math.round(bearing([6.9, 79.8], [7.0, 79.8]))).toBe(0)
    expect(Math.round(bearing([6.9, 79.8], [6.9, 79.9]))).toBe(90)
    expect(Math.round(bearing([6.9, 79.8], [6.8, 79.8]))).toBe(180)
  })
  it('measures short distances in metres', () => {
    expect(Math.round(metresBetween([6.9, 79.8], [6.901, 79.8]))).toBeGreaterThan(100)
    expect(metresBetween([6.9, 79.8], [6.9, 79.8])).toBe(0)
  })
})
