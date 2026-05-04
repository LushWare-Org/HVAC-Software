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
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
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
