/**
 * useMyProfile — Customer profile, user account, equipment, reviews,
 * and password-change hooks. Everything that lives on the Profile page.
 *
 * Split out of `useCustomerPortal.ts`.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { keys } from './keys'
import type {
  CustomerProfile, Review, ReviewType, CompanyReviewStats,
} from '../types/api'

// ─── Customer profile ───────────────────────────────────────────────────────

export function useCustomerProfile() {
  return useQuery<CustomerProfile>({
    queryKey: keys.profile(),
    queryFn: async () => {
      const { data } = await api.get('/crm/customers/me')
      return data
    },
    retry: (failureCount, error: any) => {
      if ([403, 404].includes(error?.response?.status)) return false
      return failureCount < 1
    },
  })
}

export function useUpdateCustomerProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: Partial<CustomerProfile>) => {
      const { data } = await api.patch('/crm/customers/me', dto)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.profile() }),
  })
}

// ─── User profile (CompanyUser record) ─────────────────────────────────────

export function useMyUserProfile() {
  return useQuery({
    queryKey: ['customer', 'user-profile'],
    queryFn: async () => {
      const { data } = await api.get('/crm/users/me')
      return data
    },
  })
}

export function useUpdateUserProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: { name?: string; phone?: string }) => {
      const { data } = await api.patch('/crm/users/me', dto)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customer', 'user-profile'] }),
  })
}

// ─── Equipment (customer's installed assets) ───────────────────────────────

export function useMyEquipment() {
  const { user } = useAuth()
  return useQuery<import('../types/api').CustomerEquipment[]>({
    queryKey: ['customer', 'equipment', user?.customerId],
    queryFn: async () => {
      const { data } = await api.get(`/crm/customers/${user!.customerId}/equipment`)
      return data
    },
    enabled: !!user?.customerId,
  })
}

export function useSaveMyEquipment() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (
      equipment: Array<{
        type?: string
        brand?: string
        model?: string
        serialNo?: string
        installDate?: string
        warrantyEnd?: string
        notes?: string
      }>,
    ) => {
      const { data } = await api.put(`/crm/customers/${user!.customerId}/equipment`, { equipment })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customer', 'equipment', user?.customerId] })
      qc.invalidateQueries({ queryKey: ['customer', 'profile'] })
    },
  })
}

// ─── Reviews ────────────────────────────────────────────────────────────────
// Customers can rate individual jobs (one review per job, upserted) and the
// company overall. Both feed the admin dashboard's Reviews section and the
// technician's rating in scheduling's smart-assign scoring.

export function useMyReviews() {
  const { user } = useAuth()
  return useQuery<Review[]>({
    queryKey: ['customer', 'reviews', user?.customerId],
    queryFn: async () => {
      const { data } = await api.get(`/crm/reviews/customer/${user!.customerId}`)
      return Array.isArray(data) ? data : data?.data ?? []
    },
    enabled: !!user?.customerId,
  })
}

export function useJobReview(jobId: string | null) {
  const { user } = useAuth()
  return useQuery<Review | null>({
    queryKey: ['customer', 'job-review', jobId, user?.customerId],
    queryFn: async () => {
      const { data } = await api.get(`/crm/reviews/job/${jobId}`)
      const arr: Review[] = Array.isArray(data) ? data : data?.data ?? []
      // Return only THIS customer's review for the job (server already filters
      // for CUSTOMER role, but this makes client code straightforward).
      return arr.find((r) => r.customerId === user?.customerId) ?? null
    },
    enabled: !!jobId && !!user?.customerId,
  })
}

export function useCompanyReviewStats() {
  return useQuery<CompanyReviewStats>({
    queryKey: ['customer', 'review-stats', 'company'],
    queryFn: async () => {
      const { data } = await api.get('/crm/reviews/stats/company')
      return data
    },
    staleTime: 60 * 1000,
  })
}

export function useSubmitReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: {
      type:           ReviewType
      rating:         number
      comment?:       string
      jobId?:         string
      technicianId?:  string
      technicianName?: string
    }) => {
      const { data } = await api.post('/crm/reviews', dto)
      return data as Review
    },
    onSuccess: (_rev, vars) => {
      qc.invalidateQueries({ queryKey: ['customer', 'reviews'] })
      qc.invalidateQueries({ queryKey: ['customer', 'review-stats'] })
      if (vars.jobId) {
        qc.invalidateQueries({ queryKey: ['customer', 'job-review', vars.jobId] })
      }
    },
  })
}

// ─── Auth ──────────────────────────────────────────────────────────────────

export function useChangePassword() {
  return useMutation({
    mutationFn: async (dto: { currentPassword: string; newPassword: string }) => {
      const { data } = await api.post('/crm/auth/change-password', dto)
      return data
    },
  })
}
