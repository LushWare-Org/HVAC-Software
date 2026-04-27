/**
 * useReviews — technician's received reviews + aggregate rating stats.
 *
 * Backed by crm-service /reviews endpoints. We key on the scheduling-profile's
 * id (which is what review.technicianId stores), falling back to the CRM user
 * id in the rare case the scheduling profile is missing.
 */
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useTechnicianProfile } from './useProfile'

export type ReviewType = 'JOB' | 'COMPANY'

export interface Review {
  id: string
  type: ReviewType
  customerId?: string | null
  customerName?: string | null
  jobId?: string | null
  technicianId?: string | null
  technicianName?: string | null
  rating: number
  comment?: string | null
  platform: string
  isPublished: boolean
  respondedAt?: string | null
  response?: string | null
  createdAt: string
  updatedAt: string
}

export interface ReviewStats {
  technicianId: string
  avgRating:    number
  totalRatings: number
}

/**
 * Reviews targeted at the logged-in technician. Empty array until a scheduling
 * profile exists.
 */
export function useMyReviews() {
  const { isAuthenticated } = useAuth()
  const { data: techProfile } = useTechnicianProfile()
  const technicianId = techProfile?.id ?? null

  return useQuery<Review[]>({
    queryKey: ['reviews', 'my', technicianId],
    queryFn: async () => {
      if (!technicianId) return []
      const { data } = await api.get(`/crm/reviews/technician/${technicianId}`)
      return Array.isArray(data) ? data : data?.data ?? []
    },
    enabled: isAuthenticated && !!technicianId,
    staleTime: 30_000,
  })
}

export function useMyReviewStats() {
  const { isAuthenticated } = useAuth()
  const { data: techProfile } = useTechnicianProfile()
  const technicianId = techProfile?.id ?? null

  return useQuery<ReviewStats>({
    queryKey: ['reviews', 'my-stats', technicianId],
    queryFn: async () => {
      const { data } = await api.get(`/crm/reviews/stats/technician/${technicianId}`)
      return data
    },
    enabled: isAuthenticated && !!technicianId,
    staleTime: 60_000,
  })
}
