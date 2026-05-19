/**
 * api.ts — Axios instance for T&S CRM Customer Portal
 *
 * Auth: JWT Bearer token from POST /crm/auth/login (or /register)
 * The token is stored in localStorage and injected by AuthContext.
 * Base URL is '/api' — Vite dev proxy routes it to nginx:80 → upstream services.
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
  if (import.meta.env.DEV && import.meta.env.VITE_COMPANY_ID) {
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

// Response interceptor — normalise errors + auto-logout on 401
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
      // A failed payment-intent call should show an error, not log the user out.
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register')
      const isPaymentEndpoint = url.includes('/finance/') || url.includes('/payment')
      if (!isAuthEndpoint && !isPaymentEndpoint) {
        localStorage.removeItem('cp_token')
        localStorage.removeItem('cp_user')
        delete api.defaults.headers.common['Authorization']
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  },
)

export default api
