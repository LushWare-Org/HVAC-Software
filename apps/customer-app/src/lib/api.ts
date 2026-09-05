/**
 * api.ts — Axios instance for the HVACtor.ai customer app.
 *
 * Auth: JWT bearer from POST /crm/auth/login, held in expo-secure-store and
 * injected by AuthContext via setAuthHeader().
 *
 * Base URL: EXPO_PUBLIC_API_BASE_URL (set per EAS build profile), falling back
 * to the hvactor gateway. NOTE: the older 2ohuhmktua gateway that technician-app
 * still defaults to belongs to a decommissioned project — never use it here.
 */
import axios from 'axios'
import Constants from 'expo-constants'
import { devApiBaseUrl } from './devHost'

const DEFAULT_API_BASE_URL = 'https://nginx-gateway-536584181394.us-central1.run.app/api'

/** The address Metro is served from — the machine running the local services. */
export function expoHostUri(): string | undefined {
  const c = Constants as any
  return (
    c.expoConfig?.hostUri ??
    c.expoGoConfig?.debuggerHost ??
    c.manifest2?.extra?.expoGo?.debuggerHost ??
    c.manifest?.debuggerHost
  )
}

function getDefaultApiBaseUrl(): string {
  // In dev, talk to the machine serving Metro rather than "localhost", which on
  // a device points at the device itself and fails with a bare Network Error.
  return typeof __DEV__ !== 'undefined' && __DEV__
    ? devApiBaseUrl(expoHostUri())
    : DEFAULT_API_BASE_URL
}

/** Exported for testing: guarantees exactly one `/api` suffix. */
export function normalizeApiBaseUrl(baseUrl: string): string {
  const trimmed = (baseUrl ?? '').replace(/\/$/, '')
  if (!trimmed) return DEFAULT_API_BASE_URL
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

const BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  getDefaultApiBaseUrl()

const api = axios.create({
  baseURL: normalizeApiBaseUrl(String(BASE_URL)),
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

/**
 * Fires once when a request comes back 401 with a session already in place —
 * AuthContext registers this to clear the stored session and send the user
 * back to /login with an explanation, rather than leaving every screen stuck
 * on "could not load" forever with no visible reason why.
 */
let onSessionExpired: (() => void) | null = null
export function setOnSessionExpired(fn: (() => void) | null) {
  onSessionExpired = fn
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg =
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message ??
      'Unknown error'
    console.warn(
      `[Customer API] ${error.config?.method?.toUpperCase()} ${error.config?.url} → ${error.response?.status}: ${msg}`,
    )
    // A 401 on the login call itself just means wrong credentials — that is
    // not a session expiring, and must not trigger this path.
    const isLoginRequest = typeof error.config?.url === 'string' && error.config.url.includes('/auth/login')
    if (error.response?.status === 401 && !isLoginRequest) {
      onSessionExpired?.()
    }
    return Promise.reject(error)
  },
)

export function setAuthHeader(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

export default api
