import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { queryKeys } from '@/lib/queryClient'
import { useAuth } from '@/contexts/AuthContext'
import type { TechUser, TechnicianProfile } from '@/types/api'

/**
 * Get current user profile from CRM service
 */
export function useUserProfile() {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      const res = await api.get<TechUser>('/crm/users/me')
      return res.data
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60_000, // profile rarely changes
  })
}

/**
 * Get technician profile from scheduling service (skills, rating, location).
 *
 * The /scheduling/technicians/me endpoint auto-creates a scheduling profile
 * for approved CRM users on first call (SyncOneFromCRM). Returns null if the
 * user isn't in the scheduling DB yet and the sync fails — callers must handle
 * null gracefully instead of showing an error.
 */
export function useTechnicianProfile() {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: queryKeys.techProfile,
    queryFn: async () => {
      try {
        const res = await api.get<TechnicianProfile>('/scheduling/technicians/me')
        return res.data
      } catch (err: any) {
        // 404 = not yet approved / synced; return null, don't throw
        if (err?.response?.status === 404) return null
        throw err
      }
    },
    enabled: isAuthenticated,
    // Profile is stable — cache for 5 minutes so downstream hooks (useMyAssignments)
    // don't reload it on every render
    staleTime: 5 * 60_000,
    // Don't retry 404s
    retry: (count, err: any) => {
      if (err?.response?.status === 404) return false
      return count < 2
    },
  })
}

/**
 * Update user profile (name, phone)
 */
export function useUpdateProfile() {
  const qc = useQueryClient()
  const { updateLocalUser } = useAuth()

  return useMutation({
    mutationFn: async (data: { name?: string; phone?: string }) => {
      const res = await api.patch<TechUser>('/crm/users/me', data)
      return res.data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.profile })
      updateLocalUser({ name: data.name, phone: data.phone })
    },
  })
}

/**
 * Change password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await api.post('/crm/auth/change-password', data)
      return res.data
    },
  })
}

/**
 * Update technician base location (home GPS coordinates used by dispatch scoring).
 * PATCH /scheduling/technicians/:id  { latitude, longitude }
 * The technician profile ID comes from the scheduling service — pass it in from useTechnicianProfile().
 */
export function useUpdateBaseLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      technicianId,
      latitude,
      longitude,
    }: {
      technicianId: string
      latitude: number
      longitude: number
    }) => {
      const res = await api.patch(`/scheduling/technicians/${technicianId}`, { latitude, longitude })
      return res.data
    },
    onSuccess: (data) => {
      // Instantly update the cached profile with the server response — zero-lag UI
      if (data) qc.setQueryData(queryKeys.techProfile, data)
      // Also mark stale so a background re-fetch syncs any other fields
      qc.invalidateQueries({ queryKey: queryKeys.techProfile })
    },
  })
}
