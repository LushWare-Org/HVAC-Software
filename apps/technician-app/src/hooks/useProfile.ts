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
  })
}

/**
 * Get technician profile from scheduling service (skills, rating, location)
 */
export function useTechnicianProfile() {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: queryKeys.techProfile,
    queryFn: async () => {
      const res = await api.get<TechnicianProfile>('/scheduling/technicians/me')
      return res.data
    },
    enabled: isAuthenticated,
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
