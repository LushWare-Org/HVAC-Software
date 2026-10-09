import { getInitials } from './threadActions'

describe('getInitials', () => {
  it('takes the first letters of the first two words', () => {
    expect(getInitials('Aluthge Pasindu')).toBe('AP')
    expect(getInitials('Orrix Engineering Pvt Ltd')).toBe('OE')
  })
  it('copes with one word, extra spaces and nothing at all', () => {
    expect(getInitials('Yumeth')).toBe('Y')
    expect(getInitials('  RP   Tech ')).toBe('RT')
    expect(getInitials(undefined)).toBe('?')
  })
})
