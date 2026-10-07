import { describe, expect, it } from 'vitest'
import { countdown, isUndoCommand, skipList, toggleStep } from './plan'

const steps = [
  { n: 1, dependsOn: [] },
  { n: 2, dependsOn: [1] },
  { n: 3, dependsOn: [2] },
  { n: 4, dependsOn: [] },
]
const all = new Set([1, 2, 3, 4])

describe('toggleStep', () => {
  it('unticking a step unticks everything that needs it', () => {
    expect([...toggleStep(steps, all, 1, false)].sort()).toEqual([4])
    expect([...toggleStep(steps, all, 2, false)].sort()).toEqual([1, 4])
  })
  it('ticking a step ticks what it needs', () => {
    expect([...toggleStep(steps, new Set([4]), 3, true)].sort()).toEqual([1, 2, 3, 4])
  })
  it('the unticked steps are what the server skips', () => {
    expect(skipList(steps, new Set([1, 4]))).toEqual([2, 3])
  })
})

describe('countdown', () => {
  const now = Date.parse('2026-10-07T10:00:00Z')
  it('counts down minutes and seconds, and ends', () => {
    expect(countdown('2026-10-07T10:09:41Z', now)).toBe('9:41')
    expect(countdown('2026-10-07T10:00:05Z', now)).toBe('0:05')
    expect(countdown('2026-10-07T09:59:59Z', now)).toBeNull()
    expect(countdown(undefined, now)).toBeNull()
  })
})

describe('isUndoCommand', () => {
  it('recognises a plain request to undo, nothing more', () => {
    for (const t of ['undo', 'Undo that', 'undo it.', '  UNDO this ', 'take that back']) expect(isUndoCommand(t)).toBe(true)
    for (const t of ['undo the quote for R&R and resend', 'how do I undo?', 'do it']) expect(isUndoCommand(t)).toBe(false)
  })
})
