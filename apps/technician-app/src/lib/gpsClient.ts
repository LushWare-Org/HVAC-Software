/**
 * gpsClient.ts — dedicated axios instance for GPS heartbeats.
 *
 * GPS pings are high-frequency (every 30–60s) and best-effort. We do NOT want
 * a slow scheduling endpoint blocking the regular app API queue, spamming
 * warning logs, or inflating error state. So GPS gets its own instance with:
 *   - Short timeout (5s — if the server is slow, skip the ping)
 *   - No interceptor noise (silent by default — console.debug only)
 *   - No retry
 *
 * Auth header is set alongside the main api client so logins and logouts flow
 * through to both.
 */

import axios from 'axios'
import Constants from 'expo-constants'

const DEFAULT_API_BASE_URL = 'https://nginx-gateway-2ohuhmktua-uc.a.run.app/api'

function getDefaultApiBaseUrl(): string {
  return __DEV__ ? 'http://localhost:80/api' : DEFAULT_API_BASE_URL
}

function normalizeApiBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/$/, '')
  if (!trimmed) return getDefaultApiBaseUrl()
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

const BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  getDefaultApiBaseUrl()

const gpsClient = axios.create({
  baseURL: normalizeApiBaseUrl(BASE_URL),
  headers: { 'Content-Type': 'application/json' },
  timeout: 5000,
})

// Silent failure — GPS is fire-and-forget; we don't want the console spam.
gpsClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Deliberately swallow noise; caller decides whether to log.
    return Promise.reject(error)
  },
)

export function setGpsAuthHeader(token: string | null) {
  if (token) {
    gpsClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete gpsClient.defaults.headers.common['Authorization']
  }
}

export default gpsClient
