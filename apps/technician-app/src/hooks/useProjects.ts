import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import type { ProjectDayRoster, ProjectInfo, ProjectUnit } from '@/types/api'

/** Local YYYY-MM-DD: rosters are kept per calendar day. */
export const todayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** The project a visit belongs to. */
export function useProject(projectId?: string | null) {
  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: async () => (await api.get<ProjectInfo>(`/crm/projects/${projectId}`)).data,
    enabled: !!projectId,
    staleTime: 10 * 60_000,
  })
}

/** The house or unit within a project that a visit is for. */
export function useProjectUnit(componentId?: string | null) {
  return useQuery({
    queryKey: ['projects', 'unit', componentId],
    queryFn: async () => (await api.get<ProjectUnit>(`/crm/components/${componentId}`)).data,
    enabled: !!componentId,
    staleTime: 10 * 60_000,
  })
}

/**
 * The project this technician is rostered on today, if any: they're reserved
 * for that site, so the home screen leads with it.
 */
export function useMyProjectToday() {
  const { user } = useAuth()
  const date = todayKey()
  return useQuery({
    queryKey: ['projects', 'rosters', date, user?.id],
    queryFn: async () => {
      const rows = (await api.get<ProjectDayRoster[]>('/crm/projects/rosters', { params: { date } })).data ?? []
      const mine = rows.find((r) => !r.isOff && r.techUserIds.includes(user!.id))
      if (!mine) return null
      return { ...mine, crewCount: mine.techUserIds.length }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
  })
}
