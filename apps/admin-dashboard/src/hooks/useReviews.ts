/**
 * useReviews.ts — Reviews (customer feedback) hooks for the admin dashboard.
 * Routes → nginx /api/crm/ → crm-service :3001
 *
 * Admins list reviews per customer / technician / company, respond in-place,
 * and see aggregate stats (avg + count). Customer-submitted reviews land here
 * automatically since the customer portal hits the same endpoints.
 */

import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { queryClient } from '../lib/queryClient'

export type ReviewType = 'JOB' | 'COMPANY'

export interface Review {
  id:             string
  companyId:      string
  type:           ReviewType
  customerId?:    string | null
  customerName?:  string | null
  jobId?:         string | null
  technicianId?:  string | null
  technicianName?: string | null
  rating:         number
  comment?:       string | null
  platform:       string
  isPublished:    boolean
  respondedAt?:   string | null
  response?:      string | null
  createdAt:      string
  updatedAt:      string
}

export interface ReviewStats {
  avgRating:    number
  totalRatings: number
}

export interface CompanyReviewStats {
  companyReviews: ReviewStats
  jobReviews:     ReviewStats
}

// ─── Lists ──────────────────────────────────────────────────────────────────

export function useCustomerReviews(customerId?: string) {
  return useQuery<Review[]>({
    queryKey: ['reviews', 'customer', customerId],
    queryFn: async () => {
      const { data } = await api.get(`/crm/reviews/customer/${customerId}`)
      return Array.isArray(data) ? data : data?.data ?? []
    },
    enabled: !!customerId,
  })
}

export function useTechnicianReviews(technicianId?: string) {
  return useQuery<Review[]>({
    queryKey: ['reviews', 'technician', technicianId],
    queryFn: async () => {
      const { data } = await api.get(`/crm/reviews/technician/${technicianId}`)
      return Array.isArray(data) ? data : data?.data ?? []
    },
    enabled: !!technicianId,
  })
}

export function useCompanyReviewsFeed() {
  return useQuery<Review[]>({
    queryKey: ['reviews', 'company-feed'],
    queryFn: async () => {
      const { data } = await api.get('/crm/reviews/company')
      return Array.isArray(data) ? data : data?.data ?? []
    },
  })
}

export function useCompanyReviewStats() {
  return useQuery<CompanyReviewStats>({
    queryKey: ['reviews', 'stats', 'company'],
    queryFn: async () => {
      const { data } = await api.get('/crm/reviews/stats/company')
      return data
    },
    staleTime: 60 * 1000,
  })
}

export function useTechnicianReviewStats(technicianId?: string) {
  return useQuery<ReviewStats & { technicianId: string }>({
    queryKey: ['reviews', 'stats', 'technician', technicianId],
    queryFn: async () => {
      const { data } = await api.get(`/crm/reviews/stats/technician/${technicianId}`)
      return data
    },
    enabled: !!technicianId,
    staleTime: 60 * 1000,
  })
}

// ─── Mutations ──────────────────────────────────────────────────────────────

function invalidateReviewQueries(review?: Partial<Review>) {
  queryClient.invalidateQueries({ queryKey: ['reviews'] })
  if (review?.customerId) {
    queryClient.invalidateQueries({ queryKey: ['reviews', 'customer', review.customerId] })
  }
  if (review?.technicianId) {
    queryClient.invalidateQueries({ queryKey: ['reviews', 'technician', review.technicianId] })
  }
}

export function useCreateReview() {
  return useMutation({
    mutationFn: async (dto: {
      type:            ReviewType
      rating:          number
      customerId?:     string
      customerName?:   string
      jobId?:          string
      technicianId?:   string
      technicianName?: string
      comment?:        string
      platform?:       string
    }) => {
      const { data } = await api.post('/crm/reviews', dto)
      return data as Review
    },
    onSuccess: (review) => invalidateReviewQueries(review),
  })
}
