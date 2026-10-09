import { beforeEach, describe, expect, it } from 'vitest'
import { Placement, panelSide, pointFor, snap } from './placement'

const vp = { width: 1440, height: 900 }
const size = 60

describe('snap', () => {
  it('lands on the nearest edge, where he was dropped along it', () => {
    expect(snap({ x: 30, y: 400, vx: 0, vy: 0 }, vp, size)).toEqual({ edge: 'left', at: 400 })
    expect(snap({ x: 1340, y: 200, vx: 0, vy: 0 }, vp, size)).toEqual({ edge: 'right', at: 200 })
    expect(snap({ x: 700, y: 110, vx: 0, vy: 0 }, vp, size)).toEqual({ edge: 'top', at: 700 })
    expect(snap({ x: 500, y: 800, vx: 0, vy: 0 }, vp, size)).toEqual({ edge: 'bottom', at: 500 })
  })
  it('a throw carries him: where he was heading decides the edge', () => {
    expect(snap({ x: 650, y: 450, vx: 80, vy: 0 }, vp, size).edge).toBe('right')
    expect(snap({ x: 650, y: 450, vx: -80, vy: 0 }, vp, size).edge).toBe('left')
    expect(snap({ x: 650, y: 450, vx: 0, vy: -50 }, vp, size).edge).toBe('top')
    expect(snap({ x: 650, y: 450, vx: 0, vy: 50 }, vp, size).edge).toBe('bottom')
  })
  it('never lands under the top bar, off the bottom, or past the sides', () => {
    expect(snap({ x: 1420, y: 60, vx: 0, vy: 0 }, vp, size)).toEqual({ edge: 'right', at: 96 })
    expect(snap({ x: 1400, y: -50, vx: 0, vy: 0 }, vp, size)).toEqual({ edge: 'top', at: vp.width - size - 16 - 8 })
    expect(snap({ x: 1420, y: 860, vx: 0, vy: 0 }, vp, size)).toEqual({ edge: 'right', at: vp.height - size - 24 })
    expect(snap({ x: -300, y: 860, vx: 0, vy: 0 }, vp, size)).toEqual({ edge: 'left', at: vp.height - size - 24 })
    expect(pointFor({ edge: 'bottom', at: 5000 }, vp, size).x).toBe(vp.width - size - 16 - 8)
  })
})

describe('panelSide', () => {
  it('opens on his side; on the top or bottom, on the half he is in', () => {
    expect(panelSide({ edge: 'left', at: 300 }, vp, size)).toBe('left')
    expect(panelSide({ edge: 'top', at: 200 }, vp, size)).toBe('left')
    expect(panelSide({ edge: 'bottom', at: 1100 }, vp, size)).toBe('right')
  })
})

describe('Placement', () => {
  beforeEach(() => {
    const mem = new Map<string, string>()
    ;(globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => mem.set(k, v) }
  })
  it('remembers where each person keeps him; defaults to bottom right', () => {
    expect(Placement.load('u1')).toEqual({ edge: 'right', at: null })
    Placement.save('u1', { edge: 'top', at: 300 })
    expect(Placement.load('u1')).toEqual({ edge: 'top', at: 300 })
    expect(Placement.load('u2')).toEqual({ edge: 'right', at: null })
  })
  it('reads the older left/right setting', () => {
    ;(globalThis as any).localStorage.setItem('kelvin:place:u1', '{"side":"left","y":250}')
    expect(Placement.load('u1')).toEqual({ edge: 'left', at: 250 })
  })
  it('ignores rubbish in storage', () => {
    ;(globalThis as any).localStorage.setItem('kelvin:place:u1', '{"edge":"middle","at":"x"}')
    expect(Placement.load('u1')).toEqual({ edge: 'right', at: null })
  })
})
