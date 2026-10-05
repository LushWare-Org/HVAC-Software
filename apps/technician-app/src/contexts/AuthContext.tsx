import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { AppState } from 'react-native'
import api, { setAuthHeader } from '@/lib/api'
import { setGpsAuthHeader } from '@/lib/gpsClient'
import { clearPersistedQueryCache } from '@/lib/queryPersistence'
import { stopBackgroundLocation } from '@/lib/backgroundLocation'
import * as storage from '@/lib/storage'
import type { TechUser, LoginResponse } from '@/types/api'

export type ApprovalStatus = 'APPROVED' | 'PENDING' | 'REJECTED'

export interface RegisterTechnicianData {
  companyId: string
  name: string
  email: string
  phone: string
  password: string
  skills: string[]
  latitude?: number
  longitude?: number
}

interface AuthContextType {
  user: TechUser | null
  token: string | null
  isAuthenticated: boolean
  mustResetPassword: boolean
  isLoading: boolean
  isInitializing: boolean
  pendingUser: { id: string; name: string; email: string } | null
  login: (email: string, password: string) => Promise<{ status: ApprovalStatus; mustResetPassword?: boolean; rejectionMessage?: string }>
  logout: () => Promise<void>
  registerTechnician: (data: RegisterTechnicianData) => Promise<void>
  clearPendingUser: () => Promise<void>
  updateLocalUser: (patch: Partial<TechUser>) => void
  clearMustResetPassword: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const PENDING_USER_KEY = 'tech_pending_user'

/**
 * When a JWT stops being valid, in ms since epoch, read from its own exp claim.
 * The signature is not checked here (the server does that); this only spots a
 * token that is certainly dead without a network call. Null if unreadable.
 */
export function tokenExpiresAt(token: string): number | null {
  try {
    const part = token.split('.')[1]
    if (!part || typeof globalThis.atob !== 'function') return null
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=')
    const exp = JSON.parse(globalThis.atob(b64)).exp
    return typeof exp === 'number' ? exp * 1000 : null
  } catch {
    return null
  }
}

/** Expired, or close enough that the next request would fail. */
export function isTokenExpired(token: string, now = Date.now()): boolean {
  const exp = tokenExpiresAt(token)
  return exp !== null && exp - now < 30_000
}

/** Longest delay setTimeout accepts; a 30-day token is rechecked when this fires. */
const MAX_TIMER_MS = 2_147_483_647
/** Server check on resume at most this often, so foregrounding stays cheap. */
const VERIFY_EVERY_MS = 10 * 60_000

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TechUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [pendingUser, setPendingUser] = useState<{ id: string; name: string; email: string } | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const savedToken = await storage.getToken()
        const savedUser = await storage.getUser<TechUser>()
        if (savedToken && savedUser && isTokenExpired(savedToken)) {
          // Restoring a dead token is what left the app looking signed in
          // while every request failed. Go straight to sign-in instead.
          await _clearSession()
        } else if (savedToken && savedUser) {
          setToken(savedToken)
          setUser(savedUser)
          setAuthHeader(savedToken)
          setGpsAuthHeader(savedToken)
        } else {
          const pendingRaw = await storage.getRaw(PENDING_USER_KEY)
          if (pendingRaw) setPendingUser(JSON.parse(pendingRaw))
        }
      } catch (err) {
        console.warn('[Auth] Failed to restore session:', err)
      } finally {
        setIsInitializing(false)
      }
    })()
  }, [])

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (res) => res,
      async (error) => {
        if (error.response?.status === 401) {
          const url = String(error.config?.url ?? '')
          // Don't auto-logout for background/non-critical routes (GPS, scheduling)
          // or for force-reset-password (user just logged in; let the screen handle the error)
          const isBackgroundRoute = url.includes('/scheduling/gps') || url.includes('/scheduling/technicians')
          const isAuthSetupRoute = url.includes('/auth/force-reset-password')
          if (!url.includes('/auth/login') && !isBackgroundRoute && !isAuthSetupRoute) await _clearSession()
        }
        return Promise.reject(error)
      },
    )
    return () => api.interceptors.response.eject(interceptor)
  }, [])

  // Keep a restored or live session honest: sign out the moment the token
  // expires, and on start-up and each return to the app confirm with the
  // server that it is still accepted. A 401/403 ends the session; no answer
  // (offline, server down) keeps it, because this app must work offline.
  const lastVerified = useRef(0)
  useEffect(() => {
    if (!token) return
    let cancelled = false

    const verify = async (force = false) => {
      if (isTokenExpired(token)) { await _clearSession(); return }
      if (!force && Date.now() - lastVerified.current < VERIFY_EVERY_MS) return
      lastVerified.current = Date.now()
      try {
        await api.get('/crm/users/me')
      } catch (err: any) {
        const status = err?.response?.status
        if (!cancelled && (status === 401 || status === 403)) await _clearSession()
      }
    }
    verify(true)

    let timer: ReturnType<typeof setTimeout> | undefined
    const arm = () => {
      const exp = tokenExpiresAt(token)
      if (exp === null) return
      timer = setTimeout(() => { isTokenExpired(token) ? _clearSession() : arm() }, Math.min(Math.max(exp - Date.now(), 0), MAX_TIMER_MS))
    }
    arm()

    const sub = AppState.addEventListener('change', (next) => { if (next === 'active') verify() })
    return () => { cancelled = true; if (timer) clearTimeout(timer); sub.remove() }
  }, [token])

  const _setSession = async (accessToken: string, userData: TechUser) => {
    setToken(accessToken)
    setUser(userData)
    setAuthHeader(accessToken)
    setGpsAuthHeader(accessToken)
    await storage.setToken(accessToken)
    await storage.setUser(userData)
    await storage.removeRaw(PENDING_USER_KEY)
    setPendingUser(null)
  }

  const _clearSession = async () => {
    setToken(null)
    setUser(null)
    setAuthHeader(null)
    setGpsAuthHeader(null)
    // The OS task outlives the React tree, so signing out has to tear it down
    // explicitly — otherwise a signed-out phone keeps reporting its position.
    await stopBackgroundLocation()
    clearPersistedQueryCache()
    await storage.clearAll()
  }

  const login = useCallback(async (email: string, password: string): Promise<{ status: ApprovalStatus; mustResetPassword?: boolean; rejectionMessage?: string }> => {
    setIsLoading(true)
    try {
      // platform: 'mobile' gets the 30-day phone session instead of the
      // 24-hour browser one, so technicians are not signed out every day.
      const res = await api.post<LoginResponse>('/crm/auth/login', { email, password, platform: 'mobile' })
      const { access_token, user: u } = res.data
      if (u.role.toLowerCase() !== 'technician') {
        throw new Error('This app is for technicians only.')
      }
      await _setSession(access_token, u)
      return { status: 'APPROVED', mustResetPassword: !!u.mustResetPassword }
    } catch (err: any) {
      const data = err.response?.data
      if (err.response?.status === 403 && data?.code === 'PENDING_APPROVAL') {
        const pu = data.user ?? { id: '', name: email, email }
        setPendingUser(pu)
        await storage.setRaw(PENDING_USER_KEY, JSON.stringify(pu))
        return { status: 'PENDING' }
      }
      if (err.response?.status === 403 && data?.code === 'ACCOUNT_REJECTED') {
        return { status: 'REJECTED', rejectionMessage: data.message }
      }
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const registerTechnician = useCallback(async (data: RegisterTechnicianData) => {
    setIsLoading(true)
    try {
      const res = await api.post('/crm/auth/register-technician', data)
      const pu = { id: res.data.userId ?? '', name: data.name, email: data.email }
      setPendingUser(pu)
      await storage.setRaw(PENDING_USER_KEY, JSON.stringify(pu))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearPendingUser = useCallback(async () => {
    setPendingUser(null)
    await storage.removeRaw(PENDING_USER_KEY)
  }, [])

  const logout = useCallback(async () => {
    // Stop push notifications reaching a signed-out device (best-effort;
    // must run BEFORE the session is cleared so the request is still authed).
    try {
      const { unregisterPushToken } = await import('@/hooks/usePushNotifications')
      await unregisterPushToken()
    } catch { /* best-effort */ }
    await _clearSession()
    setPendingUser(null)
    await storage.removeRaw(PENDING_USER_KEY)
  }, [])

  const updateLocalUser = useCallback((patch: Partial<TechUser>) => {
    setUser((prev) => {
      if (!prev) return prev
      const updated = { ...prev, ...patch }
      storage.setUser(updated)
      return updated
    })
  }, [])

  const clearMustResetPassword = useCallback(() => {
    updateLocalUser({ mustResetPassword: false })
  }, [updateLocalUser])

  const mustResetPassword = !!(user?.mustResetPassword)

  return (
    <AuthContext.Provider
      value={{
        user, token,
        isAuthenticated: !!token && !!user,
        mustResetPassword,
        isLoading, isInitializing, pendingUser,
        login, logout, registerTechnician, clearPendingUser, updateLocalUser, clearMustResetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
