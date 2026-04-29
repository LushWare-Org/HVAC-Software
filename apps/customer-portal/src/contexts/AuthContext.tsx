import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import api from '../lib/api'

export interface PortalUser {
  id: string
  email: string
  name: string
  role: string
  companyId: string
  phone?: string
  customerId?: string        // links to CRM customers table
  mustResetPassword?: boolean // true on first login when admin provisioned the account
}

interface AuthContextType {
  user: PortalUser | null
  token: string | null
  isAuthenticated: boolean
  mustResetPassword: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
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

const TOKEN_KEY = 'cp_token'
const USER_KEY  = 'cp_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(() => {
    try {
      const saved = localStorage.getItem(USER_KEY)
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete api.defaults.headers.common['Authorization']
    }
  }, [token])

  const _setSession = (access_token: string, userData: PortalUser) => {
    localStorage.setItem(TOKEN_KEY, access_token)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    setToken(access_token)
    setUser(userData)
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
  }

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await api.post('/crm/auth/login', { email, password })
      const { access_token, user: u } = res.data
      _setSession(access_token, u)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true)
    try {
      const res = await api.post('/crm/auth/register', data)
      const { access_token, user: u } = res.data
      _setSession(access_token, u)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
    delete api.defaults.headers.common['Authorization']
  }, [])

  const updateLocalUser = useCallback((patch: Partial<PortalUser>) => {
    setUser(prev => {
      if (!prev) return prev
      const updated = { ...prev, ...patch }
      localStorage.setItem(USER_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  /** Called after successful force-reset so the gate clears immediately. */
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
