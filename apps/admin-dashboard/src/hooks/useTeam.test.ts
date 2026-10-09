import { describe, expect, it, beforeEach } from 'vitest'
import { queryClient } from '../lib/queryClient'
import { addToTeamCache, type TeamMember } from './useTeam'

const existing = { id: 'u-1', name: 'Orrix Admin', email: 'a@x', role: 'company_admin' } as TeamMember
const list = (key: unknown[]) => (queryClient.getQueryData(key) as any)?.data as TeamMember[] | undefined

describe('addToTeamCache', () => {
  beforeEach(() => queryClient.clear())

  it('shows a new technician at the top of the Team list straight away', () => {
    queryClient.setQueryData(['team', { limit: 200 }], { data: [existing], total: 1, page: 1, limit: 200, totalPages: 1 })
    addToTeamCache({ id: 'u-2', name: 'RP Tech', email: 't@x', role: 'technician' })
    expect(list(['team', { limit: 200 }])!.map((m) => m.name)).toEqual(['RP Tech', 'Orrix Admin'])
    expect((queryClient.getQueryData(['team', { limit: 200 }]) as any).total).toBe(2)
  })

  it('leaves lists filtered to another role alone, and never adds the same person twice', () => {
    queryClient.setQueryData(['team', { role: 'dispatcher' }], { data: [], total: 0, page: 1, limit: 50, totalPages: 1 })
    queryClient.setQueryData(['team', { limit: 200 }], { data: [existing], total: 1, page: 1, limit: 200, totalPages: 1 })
    addToTeamCache({ id: 'u-2', name: 'RP Tech', email: 't@x', role: 'technician' })
    addToTeamCache({ id: 'u-2', name: 'RP Tech', email: 't@x', role: 'technician' })
    expect(list(['team', { role: 'dispatcher' }])).toEqual([])
    expect(list(['team', { limit: 200 }])).toHaveLength(2)
  })

  it('does not touch the pending-technicians or single-member caches', () => {
    queryClient.setQueryData(['team', 'pending-technicians'], { data: [], total: 0 })
    queryClient.setQueryData(['team', 'u-1'], existing)
    addToTeamCache({ id: 'u-2', name: 'RP Tech', email: 't@x', role: 'technician' })
    expect(queryClient.getQueryData(['team', 'pending-technicians'])).toEqual({ data: [], total: 0 })
    expect(queryClient.getQueryData(['team', 'u-1'])).toEqual(existing)
  })
})
