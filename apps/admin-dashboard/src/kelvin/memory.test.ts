import { describe, expect, it } from 'vitest'
import { routineWhen } from './memory'

describe('routineWhen', () => {
  it('says the days and time plainly', () => {
    expect(routineWhen([1, 2, 3, 4, 5], '08:00')).toBe('Every weekday at 8:00 am')
    expect(routineWhen([0, 1, 2, 3, 4, 5, 6], '17:30')).toBe('Every day at 5:30 pm')
    expect(routineWhen([1, 4], '12:05')).toBe('Every Mon, Thu at 12:05 pm')
    expect(routineWhen([0, 6], '00:00')).toBe('Every weekend day at 12:00 am')
  })
})
