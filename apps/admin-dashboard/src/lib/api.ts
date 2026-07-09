/**
 * api.ts — Axios instance for T&S CRM Admin Dashboard
 *
 * Any 401 response (except on the login endpoint itself) fires a global
 * "auth:expired" CustomEvent that AuthContext listens to and calls logout().
 * This covers expired JWTs, revoked sessions, and any service returning 401.
 */

import axios from 'axios'

function normalizeApiBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/$/, '')
  if (!trimmed) return '/api'
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

const api = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL ?? '/api'),
  headers: { 'Content-Type': 'application/json' },
})

// Restore token from localStorage on startup
const storedToken = localStorage.getItem('tscrm_token')
if (storedToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
}

// Attach the token per-request from localStorage. This closes the race where
// requests fired right after login (cache warming, mounting queries) went out
// before AuthContext's useEffect set the default header — the resulting 401
// triggered auth:expired and logged the user straight back out.
api.interceptors.request.use((config) => {
  if (!config.headers.Authorization) {
    const token = localStorage.getItem('tscrm_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg =
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message ??
      'Unknown API error'
    console.error(
      `[API] ${error.config?.method?.toUpperCase()} ${error.config?.url} → ${error.response?.status}: ${msg}`,
    )

    if (error.response?.status === 401) {
      const url = String(error.config?.url ?? '')
      // Don't log out on a failed login attempt — that's just wrong credentials.
      if (!url.includes('/auth/login')) {
        window.dispatchEvent(new CustomEvent('auth:expired'))
      }
    }

    return Promise.reject(error)
  },
)

export default api
