/**
 * useTeam.ts — Hooks for Team management page
 * Routes → nginx /api/crm/users → crm-service :3001
 */

import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'
import type { PaginatedResponse } from '../types/api'

export interface TeamMember {
  id: string
  companyId: string
  auth0UserId?: string
  name: string
  email: string
  phone?: string
  role: string
  isActive: boolean
  approvalStatus: string   // APPROVED | PENDING | REJECTED
  approvalNote?: string
  avatarUrl?: string
  skills: string[]
  latitude?: number
  longitude?: number
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

interface TeamFilters {
  role?: string
  search?: string
  isActive?: boolean
  page?: number
  limit?: number
}

/**
 * Shows a just-created team member in every cached Team list straight away,
 * then refetches for the real rows. Without this, a new technician only appears
 * after the 5-minute cache window or a reload, even though it is already saved.
 */
export function addToTeamCache(member: Pick<TeamMember, 'id' | 'name' | 'email' | 'role'> & Partial<TeamMember>) {
  const now = new Date().toISOString()
  const row: TeamMember = {
    companyId: '', isActive: true, approvalStatus: 'APPROVED', skills: [], createdAt: now, updatedAt: now, ...member,
  }
  queryClient.setQueriesData<PaginatedResponse<TeamMember>>(
    {
      predicate: (q) => {
        const f = q.queryKey[1] as TeamFilters | string | undefined
        return q.queryKey[0] === 'team' && !!f && typeof f === 'object' && (!f.role || f.role === row.role) && (f.isActive === undefined || f.isActive === row.isActive)
      },
    },
    (old) => (old && Array.isArray(old.data) && !old.data.some((m) => m.id === row.id)
      ? { ...old, data: [row, ...old.data], total: (old.total ?? old.data.length) + 1 }
      : old),
  )
  queryClient.invalidateQueries({ queryKey: ['team'] })
}

export function useTeamMembers(filters: TeamFilters = {}) {
  return useQuery<PaginatedResponse<TeamMember>>({
    queryKey: ['team', filters],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        page: filters.page ?? 1,
        limit: filters.limit ?? 50,
      }
      if (filters.role) params.role = filters.role
      if (filters.search) params.search = filters.search
      if (filters.isActive !== undefined) params.isActive = filters.isActive
      const res = await api.get('/crm/users', { params })
      return res.data
    },
  })
}

export function useTeamMember(id: string) {
  return useQuery<TeamMember>({
    queryKey: ['team', id],
    queryFn: async () => {
      const res = await api.get(`/crm/users/${id}`)
      return res.data
    },
    enabled: !!id,
  })
}

export function useCreateTeamMember() {
  return useMutation({
    mutationFn: async (data: { name: string; email: string; phone?: string; role?: string }) => {
      const res = await api.post('/crm/users', data)
      return res.data as TeamMember
    },
    onSuccess: (member, vars) => {
      addToTeamCache({ ...member, name: member?.name ?? vars.name, email: member?.email ?? vars.email, role: member?.role ?? vars.role ?? 'office_manager' })
      queryClient.invalidateQueries({ queryKey: ['scheduling', 'technicians'] })
    },
  })
}

export function useUpdateTeamMember() {
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; email?: string; phone?: string; role?: string; isActive?: boolean }) => {
      const res = await api.patch(`/crm/users/${id}`, data)
      return res.data as TeamMember
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
    },
  })
}

export function useDeleteTeamMember() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/crm/users/${id}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
    },
  })
}

export function usePendingTechnicians() {
  return useQuery<{ data: TeamMember[]; total: number }>({
    queryKey: ['team', 'pending-technicians'],
    queryFn: async () => {
      const res = await api.get('/crm/users/pending-technicians')
      return res.data
    },
    refetchInterval: 30_000, // poll every 30s
  })
}

export function useApproveTechnician() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/crm/users/${id}/approve`)
      return res.data as TeamMember
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
      queryClient.invalidateQueries({ queryKey: ['scheduling', 'technicians'] })
    },
  })
}

export function useRejectTechnician() {
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      const res = await api.post(`/crm/users/${id}/reject`, { note })
      return res.data as TeamMember
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
    },
  })
}

export interface LoginEvent {
  id: string
  loggedInAt: string
  ipAddress?: string
  userAgent?: string
}

export function useLoginHistory(userId: string) {
  return useQuery<LoginEvent[]>({
    queryKey: ['team', userId, 'login-history'],
    queryFn: async () => {
      try {
        const res = await api.get(`/crm/users/${userId}/login-history`)
        return res.data as LoginEvent[]
      } catch {
        return []
      }
    },
    enabled: !!userId,
  })
}
