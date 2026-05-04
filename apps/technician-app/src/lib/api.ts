/**
 * api.ts — Axios instance for T&S CRM Technician App
 *
 * Auth: JWT Bearer token from POST /crm/auth/login
 * Token stored in expo-secure-store, injected by AuthContext.
 * Base URL is configurable via EXPO_PUBLIC_API_BASE_URL env var.
 */

import axios from 'axios'
import Constants from 'expo-constants'

function normalizeApiBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/$/, '')
  if (!trimmed) return 'http://localhost:80/api'
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

const BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  'http://localhost:80/api'

const api = axios.create({
  baseURL: normalizeApiBaseUrl(BASE_URL),
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Response interceptor — normalise errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Quiet background/heartbeat routes — they're noisy and non-actionable
    const url = String(error.config?.url ?? '')
    const isBackground =
      url.includes('/scheduling/gps') ||
      url.includes('/scheduling/technicians/me')
    if (isBackground) return Promise.reject(error)

    const msg =
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message ??
      'Unknown error'

    console.warn(
      `[Tech API] ${error.config?.method?.toUpperCase()} ${error.config?.url} → ${error.response?.status}: ${msg}`,
    )

    return Promise.reject(error)
  },
)

/**
 * Set the auth token on the axios instance
 */
export function setAuthHeader(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

export default api
