import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import api from '../lib/api'
import { clearPersistedQueryCache } from '../lib/queryClient'
import { authStorage } from '../lib/authStorage'

// ─── JWT expiry check (no library needed) ────────────────────────────────────
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

export interface PortalUser {
  id: string
  email: string
  name: string
  role: string
  companyId: string
  phone?: string
  customerId?: string
  mustResetPassword?: boolean
}

interface AuthContextType {
  user: PortalUser | null
  token: string | null
  isAuthenticated: boolean
  mustResetPassword: boolean
  isLoading: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  justSignedIn: boolean
  finishSignIn: () => void
  updateLocalUser: (patch: Partial<PortalUser>) => void
  clearMustResetPassword: () => void
}

export interface RegisterData {
  companyId: string
  name: string
  email: string
  phone?: string
  password: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ─── Session restore — synchronous, runs before first render ─────────────────
function initToken(): string | null {
  const stored = authStorage.getToken()
  if (!stored || isTokenExpired(stored)) {
    authStorage.clear()
    return null
  }
  return stored
}

function initUser(): PortalUser | null {
  if (!authStorage.getToken()) return null
  try {
    const saved = authStorage.getUserRaw()
    return saved ? JSON.parse(saved) : null
  } catch { return null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(initToken)
  const [user,  setUser]  = useState<PortalUser | null>(initUser)
  const [isLoading, setIsLoading] = useState(false)
  // True from a successful sign-in until the first screen's data has loaded.
  const [justSignedIn, setJustSignedIn] = useState(false)
  const finishSignIn = useCallback(() => setJustSignedIn(false), [])

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete api.defaults.headers.common['Authorization']
    }
  }, [token])

  const logout = useCallback(() => {
    // Otherwise the next login on this browser (any account) would rehydrate
    // this session's persisted query results under the same unscoped-by-login
    // keys until each query's own refetch resolves — same risk _setSession
    // guards against on the way in.
    clearPersistedQueryCache()
    authStorage.clear()
    setToken(null)
    setUser(null)
    delete api.defaults.headers.common['Authorization']
    window.location.href = '/login'
  }, [])

  // ── Global 401 listener ───────────────────────────────────────────────────
  useEffect(() => {
    const handle = () => logout()
    window.addEventListener('auth:expired', handle)
    return () => window.removeEventListener('auth:expired', handle)
  }, [logout])

  // ── Tab visibility check ──────────────────────────────────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && token && isTokenExpired(token)) {
        logout()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [token, logout])

  const _setSession = useCallback((access_token: string, userData: PortalUser, remember: boolean) => {
    // The query cache is persisted to localStorage keyed by generic query names
    // (['my-houses'], ['my-projects'], ...) with no customerId in the key — if a
    // different account previously logged into this same browser, its cached
    // (and momentarily still-rendered, via placeholderData) results would
    // otherwise bleed into this session until each query's own refetch resolves.
    // login()/register() never hard-reload the page (unlike logout()), so this
    // is the one place that must clear it explicitly.
    clearPersistedQueryCache()
    authStorage.save(access_token, userData, remember)
    setToken(access_token)
    setUser(userData)
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
  }, [])

  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    setIsLoading(true)
    try {
      const res = await api.post('/crm/auth/login', { email, password, rememberMe })
      const { access_token, user: u } = res.data
      // A forced password change comes first; the loading screen would cover it.
      setJustSignedIn(!u?.mustResetPassword)
      _setSession(access_token, u, rememberMe)
    } finally {
      setIsLoading(false)
    }
  }, [_setSession])

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true)
    try {
      const res = await api.post('/crm/auth/register', data)
      const { access_token, user: u } = res.data
      _setSession(access_token, u, true)
    } finally {
      setIsLoading(false)
    }
  }, [_setSession])

  const updateLocalUser = useCallback((patch: Partial<PortalUser>) => {
    setUser(prev => {
      if (!prev) return prev
      const updated = { ...prev, ...patch }
      authStorage.saveUser(updated)
      return updated
    })
  }, [])

  const clearMustResetPassword = useCallback(() => {
    updateLocalUser({ mustResetPassword: false })
  }, [updateLocalUser])

  const mustResetPassword = !!(user?.mustResetPassword)

  return (
    <AuthContext.Provider value={{
      user, token,
      isAuthenticated: !!token && !!user,
      mustResetPassword,
      isLoading,
      justSignedIn, finishSignIn,
      login, register, logout, updateLocalUser, clearMustResetPassword,
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
