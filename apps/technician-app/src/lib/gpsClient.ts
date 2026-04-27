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

const BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  'http://localhost:80/api'

const gpsClient = axios.create({
  baseURL: BASE_URL,
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
