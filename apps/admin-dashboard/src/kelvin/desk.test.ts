import { describe, expect, it } from 'vitest'
import { ago, greeting, suggestions } from './desk'
import type { KelvinItem } from './types'

const it_ = (id: string, urgency: KelvinItem['urgency']): KelvinItem => ({ id, kind: 'LATE', urgency, title: id, fixes: [], audience: 'dispatch', createdAt: '' })
const morning = new Date(2026, 9, 6, 8, 0)

describe('greeting', () => {
  it('counts what needs you, by name and time of day', () => {
    expect(greeting({ items: [it_('a', 'urgent'), it_('b', 'soon'), it_('c', 'quiet')], unavailable: [], name: 'Sam Perera', now: morning }))
      .toEqual({ line: 'Good morning, Sam. Two things need you.', sub: 'Everything else is on track.' })
  })
  it('one thing, afternoon, no name', () => {
    expect(greeting({ items: [it_('a', 'soon')], unavailable: [], now: new Date(2026, 9, 6, 14) }).line).toBe('Good afternoon. One thing needs you.')
  })
  it('all clear only when every source answered', () => {
    expect(greeting({ items: [], unavailable: [], now: morning }).line).toBe('Good morning. Nothing needs you right now.')
  })
  it('never claims all clear when sources failed', () => {
    const g = greeting({ items: [], unavailable: ['running behind', 'freed time'], now: morning })
    expect(g.line).toBe("Good morning. I couldn't check everything just now.")
    expect(g.sub).toBe("Couldn't check running behind and freed time. I'll try again in a minute.")
  })
})

describe('greeting when Kelvin cannot be reached', () => {
  it('offline is never all clear', () => {
    expect(greeting({ items: [], unavailable: [], now: morning, state: 'offline' }))
      .toEqual({ line: "Good morning. I can't check anything right now.", sub: "I'm offline. Your pages still work; I'll be back as soon as I can." })
  })
  it('while loading he says he is looking', () => {
    expect(greeting({ items: [], unavailable: [], now: morning, state: 'loading' }).line).toBe('Good morning. Let me look…')
  })
})

describe('suggestions', () => {
  it('three, changing with role and time of day', () => {
    expect(suggestions('dispatcher', morning)).toEqual(["Who's free this morning?", 'Create a job', "What's running late?"])
    expect(suggestions('office_manager', new Date(2026, 9, 6, 16))).toEqual(["What's on tomorrow?", 'Create a job', 'Which invoices are overdue?'])
  })
})

describe('ago', () => {
  const now = new Date('2026-10-06T12:00:00Z')
  it('says it plainly', () => {
    expect(ago('2026-10-06T11:59:40Z', now)).toBe('just now')
    expect(ago('2026-10-06T11:58:00Z', now)).toBe('2 minutes ago')
    expect(ago('2026-10-06T11:59:00Z', now)).toBe('1 minute ago')
    expect(ago('2026-10-06T09:00:00Z', now)).toBe('3 hours ago')
    expect(ago('2026-10-04T12:00:00Z', now)).toBe('2 days ago')
    expect(ago('nonsense', now)).toBe('')
  })
})
