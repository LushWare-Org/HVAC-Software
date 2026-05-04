/**
 * api.ts — Axios instance for T&S CRM Admin Dashboard
 *
 * Authenticated requests carry a Bearer token (JWT) obtained from
 * POST /crm/auth/login.  The token is stored in localStorage and
 * injected by AuthContext.
 *
 * The base URL is '/api' which Vite's dev proxy (vite.config.ts) forwards to
 * nginx :80 → upstream services.  In production this path is handled directly
 * by Kong Gateway.
 */

import axios from 'axios'

function normalizeApiBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/$/, '')
  if (!trimmed) return '/api'
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

// ─── Axios instance ─────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL ?? '/api'),
  headers: {
    'Content-Type': 'application/json',
  },
})

// Restore token from localStorage on startup
const storedToken = localStorage.getItem('tscrm_token')
if (storedToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
}

// ─── Request interceptor — inject auth token ─────────────────────────────────
api.interceptors.request.use((config) => {
  // Token is already set by AuthContext via api.defaults.headers.common['Authorization']
  // Nothing extra needed here
  return config
})

// ─── Response interceptor — normalise errors ─────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg =
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message ??
      'Unknown API error'
    console.error(`[API] ${error.config?.method?.toUpperCase()} ${error.config?.url} → ${error.response?.status}: ${msg}`)

    // If 401, only force logout for critical CRM auth identity calls.
    // Other service 401s should not bounce users back to login page.
    if (error.response?.status === 401) {
      const url = String(error.config?.url ?? '')
      const isLoginRequest = url.includes('/auth/login')
      const shouldForceLogout =
        !isLoginRequest &&
        (url.includes('/crm/users/me') || url.includes('/crm/company') || url.includes('/crm/auth/me'))

      if (shouldForceLogout) {
        localStorage.removeItem('tscrm_token')
        localStorage.removeItem('tscrm_user')
        delete api.defaults.headers.common['Authorization']
        // Reload to show login page
        window.location.reload()
      }
    }

    return Promise.reject(error)
  },
)

export default api
