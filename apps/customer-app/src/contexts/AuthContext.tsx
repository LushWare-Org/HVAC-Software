import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as LocalAuthentication from 'expo-local-authentication'
import api, { setAuthHeader } from '@/lib/api'
import * as storage from '@/lib/storage'
import { assertCustomer } from '@/lib/authGate'
import { queryClient } from '@/lib/queryClient'
import { clearPersistedQueryCache } from '@/lib/queryPersistence'
import type { CustomerUser, LoginResponse } from '@/types/api'

interface AuthContextValue {
  user: CustomerUser | null
  token: string | null
  isAuthenticated: boolean
  isInitializing: boolean
  isLoading: boolean
  biometricEnabled: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setBiometricEnabled: (enabled: boolean) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * Prompts for Face ID / fingerprint before restoring a stored session.
 *
 * This is a local convenience over a token we already hold — never a
 * replacement for authentication. A device with no hardware or no enrolled
 * biometrics skips the prompt rather than locking the user out.
 */
async function unlockWithBiometrics(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync()
    const enrolled = await LocalAuthentication.isEnrolledAsync()
    if (!hasHardware || !enrolled) return true
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock HVACtor.ai',
      fallbackLabel: 'Use password',
    })
    return res.success
  } catch {
    // A biometric subsystem failure must never hard-block a valid session.
    return true
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [biometricEnabled, setBiometricEnabledState] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const [savedToken, savedUser, bioPref] = await Promise.all([
          storage.getToken(),
          storage.getUser<CustomerUser>(),
          storage.getBiometricEnabled(),
        ])
        setBiometricEnabledState(bioPref)

        if (savedToken && savedUser) {
          const unlocked = bioPref ? await unlockWithBiometrics() : true
          if (unlocked) {
            setToken(savedToken)
            setUser(savedUser)
            setAuthHeader(savedToken)
          }
        }
      } finally {
        setIsInitializing(false)
      }
    })()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await api.post<LoginResponse>('/crm/auth/login', { email, password })
      const { access_token, user: u } = res.data

      const gate = assertCustomer(u)
      if (!gate.ok) {
        // Persist nothing — a half-session would leave the app signed-in but
        // empty on the next launch, with no way for the user to understand why.
        setAuthHeader(null)
        throw new Error(gate.message)
      }

      await Promise.all([storage.setToken(access_token), storage.setUser(u)])
      setAuthHeader(access_token)
      setToken(access_token)
      setUser(u)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    // Best-effort: stop this device receiving further pushes.
    try {
      await api.delete('/crm/users/me/push-token')
    } catch {
      // Signed-out cleanup is best-effort; the backend also drops dead tokens.
    }
    await storage.clearAll()
    setAuthHeader(null)
    setToken(null)
    setUser(null)
    // Clear cached data so the next account never sees the previous one's.
    queryClient.clear()
    clearPersistedQueryCache()
  }, [])

  const setBiometricEnabled = useCallback(async (enabled: boolean) => {
    await storage.setBiometricEnabled(enabled)
    setBiometricEnabledState(enabled)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        isInitializing,
        isLoading,
        biometricEnabled,
        login,
        logout,
        setBiometricEnabled,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
