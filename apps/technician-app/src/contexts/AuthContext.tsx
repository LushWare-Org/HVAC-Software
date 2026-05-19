import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import api, { setAuthHeader } from '@/lib/api'
import { setGpsAuthHeader } from '@/lib/gpsClient'
import { clearPersistedQueryCache } from '@/lib/queryPersistence'
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
        if (savedToken && savedUser) {
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
    clearPersistedQueryCache()
    await storage.clearAll()
  }

  const login = useCallback(async (email: string, password: string): Promise<{ status: ApprovalStatus; mustResetPassword?: boolean; rejectionMessage?: string }> => {
    setIsLoading(true)
    try {
      const res = await api.post<LoginResponse>('/crm/auth/login', { email, password })
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
