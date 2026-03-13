/**
 * useSettings.ts — Hooks for Settings page (profile & company)
 * Profile via /crm/users/me, Company via /crm/company
 */

import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'

// ---- Profile (current user) ----

export interface UserProfile {
  id: string
  companyId: string
  auth0UserId?: string
  name: string
  email: string
  phone?: string
  role: string
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export function useMyProfile() {
  return useQuery<UserProfile>({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      const res = await api.get('/crm/users/me')
      return res.data
    },
  })
}

export function useUpdateMyProfile() {
  return useMutation({
    mutationFn: async (data: { name?: string; email?: string; phone?: string }) => {
      // We update via the users/:id route since /me has no PATCH
      const me = await api.get('/crm/users/me')
      const res = await api.patch(`/crm/users/${me.data.id}`, data)
      return res.data as UserProfile
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['team'] })
    },
  })
}

// ---- Company ----

export interface CompanyProfile {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country: string
  website?: string
  logoUrl?: string
  isActive: boolean
  trialEndsAt?: string
  createdAt: string
  updatedAt: string
}

export function useCompany() {
  return useQuery<CompanyProfile>({
    queryKey: ['company'],
    queryFn: async () => {
      const res = await api.get('/crm/company')
      return res.data
    },
  })
}

export function useUpdateCompany() {
  return useMutation({
    mutationFn: async (data: {
      name?: string
      email?: string
      phone?: string
      address?: string
      city?: string
      state?: string
      zipCode?: string
      country?: string
      website?: string
      logoUrl?: string
    }) => {
      const res = await api.patch('/crm/company', data)
      return res.data as CompanyProfile
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] })
    },
  })
}
