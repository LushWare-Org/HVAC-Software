import { getInitials, getThreadTitle, isTechThread, sortThreads } from './threadActions'
import type { MessageThread } from '@/types/api'

function thread(overrides: Partial<MessageThread>): MessageThread {
  return {
    id: 't-1',
    companyId: 'co-1',
    status: 'ACTIVE',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
    ...overrides,
  }
}

describe('getThreadTitle', () => {
  it('strips the technician prefix', () => {
    expect(getThreadTitle({ subject: 'Chat with Technician: Jane Doe' })).toBe('Jane Doe')
  })

  it('falls back to "Technician" for an empty tech name', () => {
    expect(getThreadTitle({ subject: 'Chat with Technician:' })).toBe('Technician')
  })

  it('labels null-subject threads as Admin', () => {
    expect(getThreadTitle({ subject: null })).toBe('Admin')
    expect(getThreadTitle({ subject: undefined })).toBe('Admin')
  })
})

describe('isTechThread', () => {
  it('detects technician threads by subject prefix', () => {
    expect(isTechThread({ subject: 'Chat with Technician: Jane Doe' })).toBe(true)
    expect(isTechThread({ subject: null })).toBe(false)
  })
})

describe('getInitials', () => {
  it('takes the first letter of up to two words', () => {
    expect(getInitials('Jane Doe')).toBe('JD')
    expect(getInitials('Cher')).toBe('C')
  })

  it('handles missing names', () => {
    expect(getInitials(undefined)).toBe('?')
  })
})

describe('sortThreads', () => {
  it('orders by most recent activity first', () => {
    const older = thread({ id: 'a', lastMessageAt: '2026-08-01T00:00:00Z' })
    const newer = thread({ id: 'b', lastMessageAt: '2026-08-02T00:00:00Z' })
    expect(sortThreads([older, newer]).map((t) => t.id)).toEqual(['b', 'a'])
  })

  it('falls back to updatedAt when lastMessageAt is missing', () => {
    const older = thread({ id: 'a', updatedAt: '2026-08-01T00:00:00Z' })
    const newer = thread({ id: 'b', updatedAt: '2026-08-03T00:00:00Z' })
    expect(sortThreads([older, newer]).map((t) => t.id)).toEqual(['b', 'a'])
  })
})
