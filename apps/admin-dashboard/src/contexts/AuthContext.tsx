import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import api from '../lib/api'
import { clearPersistedQueryCache, queryClient } from '../lib/queryClient'

/**
 * Kick off background fetches for the data most pages need immediately so
 * the first render after login already has cached results. Fire-and-forget —
 * individual hooks still own their own query keys and will reuse the cache
 * entry we prime here.
 *
 * Keys MUST match the ones used by hooks in src/hooks/* or TanStack Query
 * will not deduplicate the request.
 */
function warmCriticalCaches(): void {
  // Customers list (default page/limit)
  queryClient.prefetchQuery({
    queryKey: ['customers', { page: 1, limit: 50 }],
    queryFn: async () => {
      const { data } = await api.get('/crm/customers', { params: { page: 1, limit: 50 } })
      return data.meta ? { data: data.data, ...data.meta } : data
    },
  }).catch(() => { /* ignore — the real hook will retry */ })

  // Jobs list (dispatch + jobs page share this)
  queryClient.prefetchQuery({
    queryKey: ['jobs', { page: 1, limit: 50 }],
    queryFn: async () => {
      const { data } = await api.get('/jobs/jobs', { params: { page: 1, limit: 50 } })
      return data
    },
  }).catch(() => {})

  // Dashboard KPIs — real endpoint is /analytics/dashboard/kpis
  queryClient.prefetchQuery({
    queryKey: ['dashboard', 'kpis', undefined, undefined],
    queryFn: async () => {
      const { data } = await api.get('/analytics/dashboard/kpis')
      return data
    },
  }).catch(() => {})
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  companyId: string
  phone?: string
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'tscrm_token'
const USER_KEY = 'tscrm_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(USER_KEY)
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [isLoading, setIsLoading] = useState(false)

  // Keep token in sync with api instance
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete api.defaults.headers.common['Authorization']
    }
  }, [token])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await api.post('/crm/auth/login', { email, password })
      const { access_token, user: userData } = res.data
      localStorage.setItem(TOKEN_KEY, access_token)
      localStorage.setItem(USER_KEY, JSON.stringify(userData))
      setToken(access_token)
      setUser(userData)
      // Kick off critical prefetches in parallel with initial route render —
      // by the time the user sees the dashboard, customers/jobs data is
      // usually already in cache, skipping the loading state on next click.
      warmCriticalCaches()
    } finally {
      setIsLoading(false)
    }
  }, [])

  // If we restored a session from localStorage (hot-refresh, new tab), also
  // warm caches once on mount so the first navigation feels instant.
  useEffect(() => {
    if (token) warmCriticalCaches()
    // Intentionally run only on initial mount — subsequent logins are handled
    // by login() above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
    delete api.defaults.headers.common['Authorization']
    // Drop the persisted cache so the next user doesn't briefly see the
    // previous user's data while fresh queries are in flight.
    clearPersistedQueryCache()
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token && !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
