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

const DEFAULT_API_BASE_URL = 'https://nginx-gateway-536584181394.us-central1.run.app/api'

function getDefaultApiBaseUrl(): string {
  return typeof __DEV__ !== 'undefined' && __DEV__
    ? 'http://localhost:80/api'
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
