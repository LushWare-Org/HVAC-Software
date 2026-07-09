/**
 * api.ts — Axios instance for T&S CRM Customer Portal
 *
 * Any 401 response (except on the login endpoint itself) fires a global
 * "auth:expired" CustomEvent that AuthContext listens to and calls logout().
 */

import axios from 'axios'

const DEFAULT_API_BASE_URL = 'https://nginx-gateway-2ohuhmktua-uc.a.run.app/api'

function normalizeApiBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/$/, '')
  const resolved = trimmed && trimmed !== '/api'
    ? trimmed
    : (import.meta.env.PROD ? DEFAULT_API_BASE_URL : '/api')
  return resolved.endsWith('/api') ? resolved : `${resolved}/api`
}

const api = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL ?? '/api'),
  headers: { 'Content-Type': 'application/json' },
})

// Restore token from localStorage on startup
const storedToken = localStorage.getItem('cp_token')
if (storedToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
}

api.interceptors.request.use((config) => {
  // Attach the token per-request — closes the race where requests fired right
  // after login go out before the default header is set (401 → auto-logout).
  if (!config.headers.Authorization) {
    const token = localStorage.getItem('cp_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  // Dev bypass identity headers — only when there's NO real session. Sending
  // them alongside a real JWT made the backend guard impersonate the demo
  // tenant, 401-ing every request for users of other companies.
  if (import.meta.env.DEV && import.meta.env.VITE_COMPANY_ID && !config.headers.Authorization) {
    config.headers['x-test-company-id'] = import.meta.env.VITE_COMPANY_ID
    config.headers['x-test-user-role'] = 'CUSTOMER'
    try {
      const cpUser = localStorage.getItem('cp_user')
      if (cpUser) {
        const parsed = JSON.parse(cpUser)
        if (parsed?.id)         config.headers['x-test-user-id']      = parsed.id
        if (parsed?.email)      config.headers['x-test-user-email']   = parsed.email
        if (parsed?.name)       config.headers['x-test-user-name']    = parsed.name
        if (parsed?.customerId) config.headers['x-test-customer-id']  = parsed.customerId
      }
    } catch { /* localStorage not available */ }
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
      'Unknown error'
    console.error(`[CP API] ${error.config?.method?.toUpperCase()} ${error.config?.url} → ${error.response?.status}: ${msg}`)

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
