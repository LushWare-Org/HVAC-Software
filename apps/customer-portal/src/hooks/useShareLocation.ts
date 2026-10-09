import { useMutation, useQuery } from '@tanstack/react-query'
import api from '../lib/api'

export interface SharedVisit {
  jobNumber: string
  title: string
  customerName: string | null
  address: string | null
  scheduledStart: string | null
  open: boolean
  lat: number | null
  lng: number | null
}

/** The visit a share-location link is for. Public: the token in the link is the key. */
export function useVisitByLocationToken(token?: string) {
  return useQuery<SharedVisit>({
    queryKey: ['share-location', token],
    queryFn: async () => (await api.get(`/jobs/location-requests/${token}`)).data,
    enabled: !!token,
    retry: false,
  })
}

export function useShareLocation() {
  return useMutation({
    mutationFn: async (v: { token: string; lat: number; lng: number }) =>
      (await api.post(`/jobs/location-requests/${v.token}`, { lat: v.lat, lng: v.lng })).data,
  })
}

/** Signed in: put one of my own visits on the map. */
export function useSetMyVisitLocation() {
  return useMutation({
    mutationFn: async (v: { jobId: string; lat: number; lng: number }) =>
      (await api.post(`/jobs/jobs/${v.jobId}/customer-location`, { lat: v.lat, lng: v.lng })).data,
  })
}
