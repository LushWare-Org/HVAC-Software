import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Alert } from 'react-native'
import { router } from 'expo-router'
import * as LocalAuthentication from 'expo-local-authentication'
import api, { setAuthHeader, setOnSessionExpired } from '@/lib/api'
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
  /**
   * A valid session is on the device but locked (biometric prompt was
   * dismissed/failed at launch, or hasn't been retried yet) — the login
   * screen uses this to show "Unlock" instead of asking for a password.
   */
  hasStoredSession: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setBiometricEnabled: (enabled: boolean) => Promise<void>
  /** Re-prompts Face ID/fingerprint/passcode for the session already on the device. */
  retryUnlock: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * Unlocks a stored session the same way the phone itself unlocks: Face ID or
 * fingerprint if the device has one enrolled, device passcode/PIN/pattern if
 * it doesn't, and straight through if the device has no lock configured at
 * all (SecurityLevel.NONE) — there is nothing to gate with in that case.
 *
 * `authenticateAsync` already picks Face ID vs. fingerprint vs. passcode on
 * its own based on what's enrolled; the one thing it does NOT do is fall
 * back to passcode-only devices unless we actually call it for them too —
 * the previous version skipped the prompt entirely whenever no *biometric*
 * was enrolled, even if the device had a passcode set, which is not "same as
 * phone unlock".
 *
 * This is a local convenience over a token we already hold — never a
 * replacement for authentication.
 */
async function unlockWithBiometrics(): Promise<boolean> {
  try {
    const level = await LocalAuthentication.getEnrolledLevelAsync()
    if (level === LocalAuthentication.SecurityLevel.NONE) return true

    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock HVACtor.ai',
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false,
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
  const [hasStoredSession, setHasStoredSession] = useState(false)
  // Multiple in-flight requests can all 401 around the same moment (several
  // screens querying at once) — this keeps the resulting sign-out-and-explain
  // flow from firing more than once for a single expiry.
  const handlingExpiryRef = useRef(false)

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
          setHasStoredSession(true)
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
      // 'mobile' gets a 30-day token instead of the 24h web default — see
      // auth.service.ts. Day-to-day access is still gated by the device's own
      // Face ID/fingerprint/passcode unlock, not by this token's lifetime.
      const res = await api.post<LoginResponse>('/crm/auth/login', { email, password, platform: 'mobile' })
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
      setHasStoredSession(true)
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
    setHasStoredSession(false)
    // Clear cached data so the next account never sees the previous one's.
    queryClient.clear()
    clearPersistedQueryCache()
  }, [])

  const setBiometricEnabled = useCallback(async (enabled: boolean) => {
    await storage.setBiometricEnabled(enabled)
    setBiometricEnabledState(enabled)
  }, [])

  /** Re-prompts for the session already stored on the device — no password needed. */
  const retryUnlock = useCallback(async (): Promise<boolean> => {
    const [savedToken, savedUser] = await Promise.all([
      storage.getToken(),
      storage.getUser<CustomerUser>(),
    ])
    if (!savedToken || !savedUser) {
      setHasStoredSession(false)
      return false
    }
    const unlocked = await unlockWithBiometrics()
    if (unlocked) {
      setToken(savedToken)
      setUser(savedUser)
      setAuthHeader(savedToken)
    }
    return unlocked
  }, [])

  // A 401 with a session in place means the token itself expired or was
  // revoked server-side — the only path that should *still* ask for a
  // password. Clears the stale session and explains why, instead of leaving
  // every screen stuck on "could not load" with no visible cause.
  useEffect(() => {
    setOnSessionExpired(() => {
      if (handlingExpiryRef.current) return
      handlingExpiryRef.current = true
      ;(async () => {
        await logout()
        router.replace('/login')
        Alert.alert('Signed out', 'Your session expired. Please sign in again.')
        handlingExpiryRef.current = false
      })()
    })
    return () => setOnSessionExpired(null)
  }, [logout])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        isInitializing,
        isLoading,
        biometricEnabled,
        hasStoredSession,
        login,
        logout,
        setBiometricEnabled,
        retryUnlock,
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
