import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import api from '../lib/api'
import { clearPersistedQueryCache, queryClient } from '../lib/queryClient'

// ─── JWT expiry check (no library needed) ────────────────────────────────────
// Decodes the payload section of a JWT and checks the `exp` claim.
// Returns true if the token is expired or malformed.
function isTokenExpired(token: string): boolean {
  try {
    // JWT payload is base64url-encoded — replace url-safe chars before atob
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()
  } catch {
    return true // malformed token → treat as expired
  }
}

function warmCriticalCaches(): void {
  queryClient.prefetchQuery({
    queryKey: ['customers', { page: 1, limit: 50 }],
    queryFn: async () => {
      const { data } = await api.get('/crm/customers', { params: { page: 1, limit: 50 } })
      return data.meta ? { data: data.data, ...data.meta } : data
    },
  }).catch(() => {})

  queryClient.prefetchQuery({
    queryKey: ['jobs', { page: 1, limit: 50 }],
    queryFn: async () => {
      const { data } = await api.get('/jobs/jobs', { params: { page: 1, limit: 50 } })
      return data
    },
  }).catch(() => {})

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
  updateLocalUser: (patch: Partial<AuthUser>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'tscrm_token'
const USER_KEY  = 'tscrm_user'

// ─── Session restore — synchronous, runs before first render ─────────────────
// Clears localStorage immediately if the stored token is expired so the app
// never renders the dashboard with a dead session.
function initToken(): string | null {
  const stored = localStorage.getItem(TOKEN_KEY)
  if (!stored || isTokenExpired(stored)) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    return null
  }
  return stored
}

function initUser(): AuthUser | null {
  // Re-check localStorage — initToken() may have cleared it already
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return null
  try {
    const saved = localStorage.getItem(USER_KEY)
    return saved ? JSON.parse(saved) : null
  } catch { return null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(initToken)
  const [user,  setUser]  = useState<AuthUser | null>(initUser)
  const [isLoading, setIsLoading] = useState(false)

  // Keep axios default header in sync with token state
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete api.defaults.headers.common['Authorization']
    }
  }, [token])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
    delete api.defaults.headers.common['Authorization']
    clearPersistedQueryCache()
    window.location.href = '/login'
  }, [])

  // ── Global 401 listener ───────────────────────────────────────────────────
  // api.ts fires "auth:expired" on any 401 that isn't a login attempt.
  // This decouples the axios interceptor from AuthContext without a circular import.
  useEffect(() => {
    const handle = () => logout()
    window.addEventListener('auth:expired', handle)
    return () => window.removeEventListener('auth:expired', handle)
  }, [logout])

  // ── Tab visibility check ──────────────────────────────────────────────────
  // When the user switches back to this tab after a long time, re-check the
  // token expiry. If it expired while the tab was in the background, log out
  // immediately instead of letting the next API call fail first.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && token && isTokenExpired(token)) {
        logout()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [token, logout])

  // Warm caches once on mount (only if session is valid)
  useEffect(() => {
    if (token) warmCriticalCaches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await api.post('/crm/auth/login', { email, password })
      const { access_token, user: userData } = res.data
      localStorage.setItem(TOKEN_KEY, access_token)
      localStorage.setItem(USER_KEY, JSON.stringify(userData))
      // Set the axios header synchronously — the token-sync useEffect hasn't
      // run yet, and warmCriticalCaches() fires requests immediately.
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      setToken(access_token)
      setUser(userData)
      warmCriticalCaches()
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateLocalUser = useCallback((patch: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev
      const updated = { ...prev, ...patch }
      localStorage.setItem(USER_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <AuthContext.Provider value={{
      user, token,
      isAuthenticated: !!token && !!user,
      isLoading,
      login, logout, updateLocalUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
