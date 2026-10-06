import { describe, expect, it, beforeEach } from 'vitest'
import { GAP_MS, endOfLocalDay, isBusy, nextToSpeak, overlayOpen, SpokenStore } from './speech'
import type { KelvinItem } from './types'

const item = (id: string, urgency: KelvinItem['urgency'], extra: Partial<KelvinItem> = {}): KelvinItem =>
  ({ id, kind: 'LATE', urgency, title: id, fixes: [], audience: 'dispatch', createdAt: '2026-10-06T05:00:00Z', ...extra })
const base = { now: Date.parse('2026-10-06T05:00:00Z'), busy: false, visible: true, page: 'jobs', mode: 'ALL' as const, quietUntil: null, lastSpokeAt: null, spoken: new Set<string>() }

describe('nextToSpeak', () => {
  it('speaks the first soon item when nothing was said recently', () => {
    expect(nextToSpeak({ ...base, items: [item('q', 'quiet'), item('s', 'soon')] })?.id).toBe('s')
  })
  it('waits 10 minutes between bubbles, but urgent skips the wait', () => {
    const recent = { ...base, lastSpokeAt: base.now - GAP_MS + 1000 }
    expect(nextToSpeak({ ...recent, items: [item('s', 'soon')] })).toBeNull()
    expect(nextToSpeak({ ...recent, items: [item('s', 'soon'), item('u', 'urgent')] })?.id).toBe('u')
    expect(nextToSpeak({ ...base, lastSpokeAt: base.now - GAP_MS, items: [item('s', 'soon')] })?.id).toBe('s')
  })
  it('never repeats: spoken on the server or in this browser', () => {
    expect(nextToSpeak({ ...base, items: [item('a', 'urgent', { spoken: true })] })).toBeNull()
    expect(nextToSpeak({ ...base, spoken: new Set(['a']), items: [item('a', 'urgent')] })).toBeNull()
  })
  it('stays quiet while busy, in quiet time, or when told never', () => {
    const items = [item('u', 'urgent')]
    expect(nextToSpeak({ ...base, busy: true, items })).toBeNull()
    expect(nextToSpeak({ ...base, quietUntil: base.now + 1, items })).toBeNull()
    expect(nextToSpeak({ ...base, mode: 'NEVER', items })).toBeNull()
  })
  it('only urgent in URGENT_ONLY mode', () => {
    expect(nextToSpeak({ ...base, mode: 'URGENT_ONLY', items: [item('s', 'soon')] })).toBeNull()
    expect(nextToSpeak({ ...base, mode: 'URGENT_ONLY', items: [item('s', 'soon'), item('u', 'urgent')] })?.id).toBe('u')
  })
  it('drops an expired item', () => {
    expect(nextToSpeak({ ...base, items: [item('g', 'soon', { expiresAt: '2026-10-06T04:59:59Z' })] })).toBeNull()
  })
  it('never speaks in a hidden tab, so the bubble is not wasted where nobody looks', () => {
    expect(nextToSpeak({ ...base, visible: false, items: [item('u', 'urgent')] })).toBeNull()
  })
  it('stays quiet when the person\'s settings could not be read', () => {
    expect(nextToSpeak({ ...base, mode: null, items: [item('u', 'urgent')] })).toBeNull()
  })
  it('the brief speaks once a day, even when a different fact becomes first', () => {
    const first = item('brief:2026-10-06:a', 'soon', { kind: 'BRIEF' })
    const reordered = item('brief:2026-10-06:b', 'soon', { kind: 'BRIEF' })
    expect(nextToSpeak({ ...base, page: 'dashboard', spoken: new Set([first.id]), items: [reordered] })).toBeNull()
    expect(nextToSpeak({ ...base, page: 'dashboard', items: [reordered, { ...first, urgency: 'quiet', spoken: true }] })).toBeNull()
    expect(nextToSpeak({ ...base, page: 'dashboard', spoken: new Set(['brief:2026-10-05:a']), items: [reordered] })?.id).toBe(reordered.id)
  })
  it('the brief speaks only on the dashboard', () => {
    const brief = item('brief:2026-10-06:f1', 'soon', { kind: 'BRIEF' })
    expect(nextToSpeak({ ...base, page: 'jobs', items: [brief] })).toBeNull()
    expect(nextToSpeak({ ...base, page: 'dashboard', items: [brief] })?.id).toBe(brief.id)
  })
})

describe('isBusy', () => {
  it('typing, choosing or a modal means busy; a button does not', () => {
    expect(isBusy({ tagName: 'INPUT' }, false)).toBe(true)
    expect(isBusy({ tagName: 'TEXTAREA' }, false)).toBe(true)
    expect(isBusy({ tagName: 'SELECT' }, false)).toBe(true)
    expect(isBusy({ tagName: 'DIV', isContentEditable: true }, false)).toBe(true)
    expect(isBusy({ tagName: 'BUTTON' }, true)).toBe(true)
    expect(isBusy({ tagName: 'BUTTON' }, false)).toBe(false)
    expect(isBusy(null, false)).toBe(false)
  })
})

describe('overlayOpen', () => {
  const vp = { width: 1440, height: 900 }
  const el = (o: Partial<{ ariaModal: boolean; role: string; position: string; rect: { width: number; height: number }; kelvin: boolean }>) =>
    ({ ariaModal: false, role: '', position: 'static', rect: { width: 100, height: 100 }, kelvin: false, ...o })
  it('a page modal without aria-modal still counts: any fixed overlay covering most of the screen', () => {
    expect(overlayOpen([el({ position: 'fixed', rect: { width: 1440, height: 900 } })], vp)).toBe(true)
    expect(overlayOpen([el({ ariaModal: true })], vp)).toBe(true)
    expect(overlayOpen([el({ role: 'dialog' })], vp)).toBe(true)
  })
  it('Kelvin\'s own panel, small fixed things and ordinary content do not', () => {
    expect(overlayOpen([el({ role: 'dialog', kelvin: true })], vp)).toBe(false)
    expect(overlayOpen([el({ position: 'fixed', rect: { width: 60, height: 60 } })], vp)).toBe(false)
    expect(overlayOpen([el({ rect: { width: 1440, height: 900 } })], vp)).toBe(false)
  })
})

describe('SpokenStore', () => {
  beforeEach(() => {
    const mem = new Map<string, string>()
    ;(globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => mem.set(k, v) }
  })
  it('shares spoken ids across tabs through storage, per person, capped', () => {
    SpokenStore.add('u1', 'a')
    expect(SpokenStore.load('u1').has('a')).toBe(true)
    expect(SpokenStore.load('u2').has('a')).toBe(false)
    for (let i = 0; i < 400; i++) SpokenStore.add('u1', `x${i}`)
    expect(SpokenStore.load('u1').size).toBe(300)
  })
  it('shares the time of the last bubble across tabs and reloads', () => {
    expect(SpokenStore.lastSpokeAt('u1')).toBeNull()
    SpokenStore.setLastSpokeAt('u1', 1234)
    expect(SpokenStore.lastSpokeAt('u1')).toBe(1234)
    expect(SpokenStore.lastSpokeAt('u2')).toBeNull()
  })
  it('survives broken storage', () => {
    ;(globalThis as any).localStorage = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }
    expect(SpokenStore.load('u1').size).toBe(0)
    expect(() => SpokenStore.add('u1', 'a')).not.toThrow()
  })
})

describe('endOfLocalDay', () => {
  it('is the next local midnight', () => {
    const d = endOfLocalDay(new Date(2026, 9, 6, 14, 30))
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()]).toEqual([2026, 9, 7, 0, 0])
  })
})
