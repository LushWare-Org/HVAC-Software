import { beforeEach, describe, expect, it } from 'vitest'
import { Placement, snap } from './placement'

const vp = { width: 1440, height: 900 }
const size = 60

describe('snap', () => {
  it('lands on the nearer side edge, at the height he was dropped', () => {
    expect(snap({ x: 300, y: 400, vx: 0, vy: 0 }, vp, size)).toEqual({ side: 'left', y: 400 })
    expect(snap({ x: 1000, y: 200, vx: 0, vy: 0 }, vp, size)).toEqual({ side: 'right', y: 200 })
  })
  it('a throw carries him: where he was heading decides the side and height', () => {
    expect(snap({ x: 650, y: 400, vx: 40, vy: 0 }, vp, size).side).toBe('right')
    expect(snap({ x: 800, y: 400, vx: -40, vy: 0 }, vp, size).side).toBe('left')
    expect(snap({ x: 1000, y: 400, vx: 0, vy: 20 }, vp, size).y).toBe(560)
  })
  it('never lands under the top bar or off the bottom', () => {
    expect(snap({ x: 1000, y: -50, vx: 0, vy: 0 }, vp, size).y).toBe(96)
    expect(snap({ x: 1000, y: 2000, vx: 0, vy: 0 }, vp, size).y).toBe(vp.height - size - 24)
  })
})

describe('Placement', () => {
  beforeEach(() => {
    const mem = new Map<string, string>()
    ;(globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => mem.set(k, v) }
  })
  it('remembers where each person keeps him; defaults to bottom right', () => {
    expect(Placement.load('u1')).toEqual({ side: 'right', y: null })
    Placement.save('u1', { side: 'left', y: 300 })
    expect(Placement.load('u1')).toEqual({ side: 'left', y: 300 })
    expect(Placement.load('u2')).toEqual({ side: 'right', y: null })
  })
  it('ignores rubbish in storage', () => {
    ;(globalThis as any).localStorage.setItem('kelvin:place:u1', '{"side":"middle","y":"x"}')
    expect(Placement.load('u1')).toEqual({ side: 'right', y: null })
  })
})
