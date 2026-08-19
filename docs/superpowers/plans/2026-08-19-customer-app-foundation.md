# Customer App Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A runnable, installable Expo customer app with auth (role-gated + biometric unlock), theming, an API client, a live socket consuming M1's customer events, a persisted query cache, push registration, OTA updates, and a Home screen that proves each of those layers works.

**Architecture:** New `apps/customer-app/` copying technician-app's proven patterns (axios client, MMKV-hydrated TanStack Query cache, listener-forwarding socket context) with customer-specific adaptations: namespaced storage keys, a login role gate, biometric unlock, and the current `hvactor` gateway. Pure logic gets unit tests; UI/device behaviour is a manual checklist.

**Tech Stack:** Expo SDK 54, expo-router, React Native 0.81, TanStack Query v5, axios, socket.io-client, react-native-mmkv, expo-secure-store, expo-local-authentication, expo-updates, expo-notifications, Jest + ts-jest.

**Spec:** `docs/superpowers/specs/2026-08-19-customer-app-foundation-design.md`

## Global Constraints

- Display name **"HVACtor.ai"**, slug `ts-customer`, scheme `tscustomer`, bundle/package `com.tscrm.customer`.
- Gateway is **`https://nginx-gateway-536584181394.us-central1.run.app`** (hvactor). Never the `2ohuhmktua` URL — that project is decommissioned.
- Storage keys are `cust_token` / `cust_user`; MMKV cache id is `customerapp-query-cache`. Never reuse technician-app's `tech_*` keys.
- A login whose user is not `role === 'customer'` (or has no `customerId`) is rejected, the token is discarded, and the message is exactly: `This app is for customers. Staff should use the HVACtor.ai Field app.`
- Socket event names are M1's, verbatim: `job_changed`, `quote_changed`, `invoice_changed`, `message_new`.
- `runtimeVersion` uses `{ "policy": "fingerprint" }`.
- Biometric unlock gates restoring an existing token; it never replaces password auth, and a device without enrolled biometrics skips it silently.
- Do not add maps, background location, camera, signature, or task-manager dependencies — the customer app has no honest use for them.
- **This environment cannot build or run the app.** Steps marked **[MANUAL — product owner]** are not to be claimed as verified.

---

### Task 1: Scaffold the app

**Files:**
- Create: `apps/customer-app/package.json`
- Create: `apps/customer-app/app.json`
- Create: `apps/customer-app/tsconfig.json`
- Create: `apps/customer-app/babel.config.js`
- Create: `apps/customer-app/jest.config.js`
- Create: `apps/customer-app/expo-env.d.ts`
- Create: `apps/customer-app/.gitignore`

**Interfaces:**
- Consumes: nothing.
- Produces: the `customer-app` pnpm workspace package with `@/*` → `./src/*` and `@app/*` → `./app/*` path aliases, and a `test` script — every later task depends on both.

- [ ] **Step 1: Create package.json**

```json
{
  "name": "customer-app",
  "version": "1.0.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "dev": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "build": "echo 'Use EAS Build for production'",
    "test": "jest",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@react-navigation/bottom-tabs": "^7.0.0",
    "@react-navigation/native": "^7.0.0",
    "@tanstack/react-query": "^5.60.0",
    "axios": "^1.7.0",
    "date-fns": "^4.1.0",
    "expo": "~54.0.0",
    "expo-constants": "~18.0.13",
    "expo-device": "~8.0.10",
    "expo-linking": "~8.0.11",
    "expo-local-authentication": "~17.0.7",
    "expo-notifications": "~0.32.16",
    "expo-router": "~6.0.23",
    "expo-secure-store": "~15.0.8",
    "expo-splash-screen": "~31.0.13",
    "expo-status-bar": "~3.0.9",
    "expo-updates": "~29.0.12",
    "react": "19.1.0",
    "react-native": "0.81.5",
    "react-native-gesture-handler": "~2.28.0",
    "react-native-mmkv": "^3.1.0",
    "react-native-reanimated": "~4.1.1",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0",
    "react-native-worklets": "0.5.1",
    "socket.io-client": "^4.8.3"
  },
  "devDependencies": {
    "@babel/core": "^7.25.0",
    "@types/jest": "^29.5.0",
    "@types/react": "~19.1.0",
    "babel-plugin-module-resolver": "^5.0.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "~5.9.0"
  }
}
```

- [ ] **Step 2: Create app.json**

```json
{
  "expo": {
    "name": "HVACtor.ai",
    "slug": "ts-customer",
    "version": "1.0.0",
    "orientation": "portrait",
    "scheme": "tscustomer",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "runtimeVersion": { "policy": "fingerprint" },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.tscrm.customer",
      "infoPlist": {
        "NSFaceIDUsageDescription": "Unlock HVACtor.ai with Face ID instead of typing your password.",
        "UIBackgroundModes": ["remote-notification"]
      }
    },
    "android": {
      "package": "com.tscrm.customer",
      "permissions": ["VIBRATE", "USE_BIOMETRIC", "USE_FINGERPRINT"]
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      ["expo-notifications", { "color": "#2563EB" }],
      "expo-local-authentication",
      "expo-updates"
    ],
    "experiments": { "typedRoutes": true },
    "extra": { "router": {} }
  }
}
```

`extra.eas.projectId` is deliberately absent — Task 8 adds it via `eas init`.

- [ ] **Step 3: Create tsconfig.json, babel.config.js, expo-env.d.ts and .gitignore**

```json
// tsconfig.json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@app/*": ["./app/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"],
  "exclude": ["node_modules", "dist"]
}
```

```js
// babel.config.js
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', { alias: { '@': './src', '@app': './app' } }],
      'react-native-reanimated/plugin',
    ],
  }
}
```

```ts
// expo-env.d.ts
/// <reference types="expo/types" />
```

```gitignore
# .gitignore
node_modules/
.expo/
dist/
*.log
```

- [ ] **Step 4: Create jest.config.js**

Tests here cover pure logic only (no React Native renderer), so `ts-jest` in a node environment is enough and avoids the heavyweight RN preset.

```js
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  globals: {
    'ts-jest': {
      tsconfig: { module: 'commonjs', strict: true, esModuleInterop: true },
    },
  },
}
```

- [ ] **Step 5: Install**

Run: `pnpm install --filter customer-app`
Expected: completes. Pre-existing peer-dependency warnings elsewhere in the monorepo are unrelated to this package.

- [ ] **Step 6: Commit**

```bash
git add apps/customer-app
git commit -m "feat(customer-app): scaffold Expo app with router, jest and path aliases"
```

---

### Task 2: Theme tokens

**Files:**
- Create: `apps/customer-app/src/constants/theme.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `Colors`, `Spacing`, `Radius`, `FontSize` — every screen imports these.

- [ ] **Step 1: Create the tokens**

Values are the customer portal's CSS variables, so both clients read as one product.

```ts
// apps/customer-app/src/constants/theme.ts
// ============================================================
// HVACtor.ai Customer App — Design Tokens
// Mirrors the customer portal's CSS variables (src/index.css) so
// web and mobile are visibly the same product.
// ============================================================

export const Colors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#DBEAFE',

  success: '#059669',
  successLight: '#D1FAE5',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  info: '#0891B2',
  infoLight: '#CFFAFE',

  white: '#FFFFFF',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceAlt: '#F3F4F6',
  border: '#E5E7EB',

  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  textInverse: '#FFFFFF',
  disabled: '#D1D5DB',
} as const

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
} as const

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
} as const
```

- [ ] **Step 2: Type-check**

Run: `pnpm --filter customer-app type-check`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add apps/customer-app/src/constants/theme.ts
git commit -m "feat(customer-app): add brand design tokens matching the portal"
```

---

### Task 3: API client and secure storage

**Files:**
- Create: `apps/customer-app/src/lib/api.ts`
- Create: `apps/customer-app/src/lib/storage.ts`
- Create: `apps/customer-app/src/lib/api.spec.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: default export `api` (axios instance), `setAuthHeader(token: string | null): void`, `normalizeApiBaseUrl(baseUrl: string): string`; and from storage: `getToken()`, `setToken(t)`, `removeToken()`, `getUser<T>()`, `setUser(u)`, `removeUser()`, `clearAll()`. Tasks 5-7 and 9-11 use these.

- [ ] **Step 1: Write the failing test**

```ts
// apps/customer-app/src/lib/api.spec.ts
import { normalizeApiBaseUrl } from './api'

describe('normalizeApiBaseUrl', () => {
  it('appends /api when missing', () => {
    expect(normalizeApiBaseUrl('https://gw.example.com')).toBe('https://gw.example.com/api')
  })

  it('leaves an existing /api suffix alone', () => {
    expect(normalizeApiBaseUrl('https://gw.example.com/api')).toBe('https://gw.example.com/api')
  })

  it('strips a trailing slash before deciding', () => {
    expect(normalizeApiBaseUrl('https://gw.example.com/api/')).toBe('https://gw.example.com/api')
    expect(normalizeApiBaseUrl('https://gw.example.com/')).toBe('https://gw.example.com/api')
  })

  it('falls back to the hvactor gateway for an empty value', () => {
    expect(normalizeApiBaseUrl('')).toContain('nginx-gateway-536584181394')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter customer-app test -- api`
Expected: FAIL — cannot find module `./api`.

- [ ] **Step 3: Implement the API client**

```ts
// apps/customer-app/src/lib/api.ts
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
```

- [ ] **Step 4: Implement secure storage**

```ts
// apps/customer-app/src/lib/storage.ts
/**
 * Secure storage for the customer app.
 *
 * Keys are namespaced `cust_*` so this app and the technician app can be
 * installed side by side on one device without clobbering each other's session.
 */
import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = 'cust_token'
const USER_KEY = 'cust_user'
const BIOMETRIC_PREF_KEY = 'cust_biometric_enabled'

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY)
  } catch {
    return null
  }
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}

export async function getUser<T>(): Promise<T | null> {
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export async function setUser(user: object): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user))
}

export async function removeUser(): Promise<void> {
  await SecureStore.deleteItemAsync(USER_KEY)
}

/** Whether the user opted into unlocking with biometrics. Defaults to true. */
export async function getBiometricEnabled(): Promise<boolean> {
  try {
    const raw = await SecureStore.getItemAsync(BIOMETRIC_PREF_KEY)
    return raw === null ? true : raw === 'true'
  } catch {
    return true
  }
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRIC_PREF_KEY, String(enabled))
}

export async function clearAll(): Promise<void> {
  await Promise.all([removeToken(), removeUser()])
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter customer-app test -- api`
Expected: PASS — all 4 assertions green.

- [ ] **Step 6: Commit**

```bash
git add apps/customer-app/src/lib
git commit -m "feat(customer-app): add API client and namespaced secure storage"
```

---

### Task 4: Query client with MMKV persistence

**Files:**
- Create: `apps/customer-app/src/lib/queryPersistence.ts`
- Create: `apps/customer-app/src/lib/queryClient.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `queryClient` (a configured `QueryClient`, hydrated at module-eval), `queryKeys` (key factory), `clearPersistedQueryCache(): void`. Tasks 5-7 and 9-11 import these.

- [ ] **Step 1: Implement persistence**

```ts
// apps/customer-app/src/lib/queryPersistence.ts
/**
 * MMKV-backed React Query cache persistence.
 *
 * Why: TanStack Query's cache is in-memory, so on cold start every screen
 * would flash a spinner. Persisting to MMKV lets us hydrate before the first
 * render and paint last-known-good data immediately, refetching behind it.
 *
 * react-native-mmkv 3.x needs the New Architecture. app.json sets
 * newArchEnabled, but an older installed binary would throw at module load and
 * take the whole import chain down — hence the dynamic require + no-op fallback.
 */
import { QueryClient, dehydrate, hydrate } from '@tanstack/react-query'

const CACHE_KEY = 'customer-query-cache'
const MAX_AGE_MS = 24 * 60 * 60 * 1000
const WRITE_THROTTLE_MS = 2_000

type SimpleStorage = {
  getString(key: string): string | undefined
  set(key: string, value: string): void
  delete(key: string): void
}

const noopStorage: SimpleStorage = {
  getString: () => undefined,
  set: () => {},
  delete: () => {},
}

function createStorage(): SimpleStorage {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv')
    return new MMKV({ id: 'customerapp-query-cache' }) as unknown as SimpleStorage
  } catch {
    return noopStorage
  }
}

const storage = createStorage()

export function hydrateQueryClient(client: QueryClient): void {
  try {
    const raw = storage.getString(CACHE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as { savedAt: number; state: unknown }
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      storage.delete(CACHE_KEY)
      return
    }
    hydrate(client, parsed.state)
  } catch {
    storage.delete(CACHE_KEY)
  }
}

let lastWrite = 0
export function persistQueryClient(client: QueryClient): void {
  const now = Date.now()
  if (now - lastWrite < WRITE_THROTTLE_MS) return
  lastWrite = now
  try {
    const state = dehydrate(client, {
      shouldDehydrateQuery: (q) => q.state.status === 'success',
    })
    storage.set(CACHE_KEY, JSON.stringify({ savedAt: now, state }))
  } catch {
    // Persistence is an optimisation; never let it break the app.
  }
}

export function clearPersistedQueryCache(): void {
  storage.delete(CACHE_KEY)
}
```

- [ ] **Step 2: Implement the query client**

```ts
// apps/customer-app/src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'
import { hydrateQueryClient, persistQueryClient } from './queryPersistence'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 30 * 60 * 1000,
      // Paint cached data on mount, refetch behind it (stale-while-revalidate).
      refetchOnMount: true,
      // Native has no window focus — AppState in _layout.tsx covers foregrounding.
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error: any) => {
        const status = error?.response?.status
        if (status === 401 || status === 403 || status === 404) return false
        return failureCount < 2
      },
      placeholderData: (prev: unknown) => prev,
    },
    mutations: { retry: false },
  },
})

// Hydrate at module-evaluation time, before any screen renders.
hydrateQueryClient(queryClient)

// Persist on every settled query, throttled inside persistQueryClient.
queryClient.getQueryCache().subscribe(() => persistQueryClient(queryClient))

export const queryKeys = {
  profile: ['profile'] as const,
  dashboard: ['dashboard'] as const,
  jobs: (filters?: Record<string, unknown>) => ['jobs', filters] as const,
  jobDetail: (id: string) => ['jobs', 'detail', id] as const,
  quotes: (filters?: Record<string, unknown>) => ['quotes', filters] as const,
  invoices: (filters?: Record<string, unknown>) => ['invoices', filters] as const,
  threads: (filters?: Record<string, unknown>) => ['threads', filters] as const,
  notifications: ['notifications'] as const,
} as const
```

- [ ] **Step 3: Type-check**

Run: `pnpm --filter customer-app type-check`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add apps/customer-app/src/lib/queryClient.ts apps/customer-app/src/lib/queryPersistence.ts
git commit -m "feat(customer-app): add MMKV-hydrated query client for instant cold starts"
```

---

### Task 5: Auth types and the role gate

**Files:**
- Create: `apps/customer-app/src/types/api.ts`
- Create: `apps/customer-app/src/lib/authGate.ts`
- Create: `apps/customer-app/src/lib/authGate.spec.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: types `CustomerUser { id, name, email, role, companyId, customerId?, mustResetPassword? }` and `LoginResponse { access_token, user }`; and `assertCustomer(user: CustomerUser): { ok: true } | { ok: false; message: string }` plus the exported constant `STAFF_LOGIN_MESSAGE`. Task 6's AuthContext calls `assertCustomer`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/customer-app/src/lib/authGate.spec.ts
import { assertCustomer, STAFF_LOGIN_MESSAGE } from './authGate'
import type { CustomerUser } from '@/types/api'

function user(patch: Partial<CustomerUser> = {}): CustomerUser {
  return {
    id: 'u-1',
    name: 'Grace Morgan',
    email: 'grace@example.com',
    role: 'customer',
    companyId: 'co-demo-001',
    customerId: 'demo-customer-017',
    ...patch,
  }
}

describe('assertCustomer', () => {
  it('accepts a customer with a customerId', () => {
    expect(assertCustomer(user())).toEqual({ ok: true })
  })

  it('rejects a technician with the staff message', () => {
    expect(assertCustomer(user({ role: 'technician', customerId: undefined })))
      .toEqual({ ok: false, message: STAFF_LOGIN_MESSAGE })
  })

  it('rejects a company_admin', () => {
    expect(assertCustomer(user({ role: 'company_admin', customerId: undefined }).valueOf() as CustomerUser).ok)
      .toBe(false)
  })

  it('rejects a customer role that somehow has no customerId', () => {
    // Without customerId every customer-scoped query returns nothing, so this
    // would be an empty app with no explanation — reject it as staff would be.
    expect(assertCustomer(user({ customerId: undefined })).ok).toBe(false)
  })

  it('uses the exact approved copy', () => {
    expect(STAFF_LOGIN_MESSAGE).toBe(
      'This app is for customers. Staff should use the HVACtor.ai Field app.',
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter customer-app test -- authGate`
Expected: FAIL — cannot find module `./authGate`.

- [ ] **Step 3: Create the types**

```ts
// apps/customer-app/src/types/api.ts
export interface CustomerUser {
  id: string
  name: string
  email: string
  role: string
  companyId: string
  /** Present for portal customers; absent for staff roles. */
  customerId?: string
  mustResetPassword?: boolean
}

export interface LoginResponse {
  access_token: string
  user: CustomerUser
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages?: number
}

export interface Job {
  id: string
  jobNumber?: string
  title: string
  status: string
  scheduledStart?: string | null
  customerId?: string
  currency?: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  status: string
  total: string | number
  amountPaid?: string | number
  dueDate?: string
  customerId?: string
  currency?: string
}
```

- [ ] **Step 4: Implement the gate**

```ts
// apps/customer-app/src/lib/authGate.ts
import type { CustomerUser } from '@/types/api'

/**
 * POST /crm/auth/login authenticates EVERY role — it is the same endpoint the
 * admin dashboard and technician app use. Without this gate a staff login
 * succeeds and lands in a customer UI with no customerId, so every screen
 * renders empty with no explanation. Reject at the door instead.
 */
export const STAFF_LOGIN_MESSAGE =
  'This app is for customers. Staff should use the HVACtor.ai Field app.'

export function assertCustomer(
  user: CustomerUser,
): { ok: true } | { ok: false; message: string } {
  const isCustomer = user?.role === 'customer' && Boolean(user?.customerId)
  return isCustomer ? { ok: true } : { ok: false, message: STAFF_LOGIN_MESSAGE }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter customer-app test -- authGate`
Expected: PASS — all 5 assertions green.

- [ ] **Step 6: Commit**

```bash
git add apps/customer-app/src/types apps/customer-app/src/lib/authGate.ts apps/customer-app/src/lib/authGate.spec.ts
git commit -m "feat(customer-app): add API types and login role gate"
```

---

### Task 6: AuthContext with biometric unlock

**Files:**
- Create: `apps/customer-app/src/contexts/AuthContext.tsx`

**Interfaces:**
- Consumes: `api`/`setAuthHeader` (Task 3), storage helpers (Task 3), `queryClient`/`clearPersistedQueryCache` (Task 4), `assertCustomer`/`STAFF_LOGIN_MESSAGE` (Task 5), `CustomerUser`/`LoginResponse` (Task 5).
- Produces: `AuthProvider` and `useAuth(): { user, token, isAuthenticated, isInitializing, isLoading, login(email, password), logout(), biometricEnabled, setBiometricEnabled(v) }`. Tasks 7, 9, 10, 11 consume it.

- [ ] **Step 1: Implement the context**

```tsx
// apps/customer-app/src/contexts/AuthContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as LocalAuthentication from 'expo-local-authentication'
import api, { setAuthHeader } from '@/lib/api'
import * as storage from '@/lib/storage'
import { assertCustomer } from '@/lib/authGate'
import { queryClient } from '@/lib/queryClient'
import { clearPersistedQueryCache } from '@/lib/queryPersistence'
import type { CustomerUser, LoginResponse } from '@/types/api'

interface AuthContextValue {
  user: CustomerUser | null
  token: string | null
  isAuthenticated: boolean
  isInitializing: boolean
  isLoading: boolean
  biometricEnabled: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setBiometricEnabled: (enabled: boolean) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * Prompts for Face ID / fingerprint before restoring a stored session.
 *
 * This is a local convenience over a token we already hold — never a
 * replacement for authentication. A device with no hardware or no enrolled
 * biometrics skips the prompt rather than locking the user out.
 */
async function unlockWithBiometrics(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync()
    const enrolled = await LocalAuthentication.isEnrolledAsync()
    if (!hasHardware || !enrolled) return true
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock HVACtor.ai',
      fallbackLabel: 'Use password',
    })
    return res.success
  } catch {
    // Never let a biometric failure hard-block access to a valid session.
    return true
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [biometricEnabled, setBiometricEnabledState] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const [savedToken, savedUser, bioPref] = await Promise.all([
          storage.getToken(),
          storage.getUser<CustomerUser>(),
          storage.getBiometricEnabled(),
        ])
        setBiometricEnabledState(bioPref)

        if (savedToken && savedUser) {
          const unlocked = bioPref ? await unlockWithBiometrics() : true
          if (unlocked) {
            setToken(savedToken)
            setUser(savedUser)
            setAuthHeader(savedToken)
          }
        }
      } finally {
        setIsInitializing(false)
      }
    })()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await api.post<LoginResponse>('/crm/auth/login', { email, password })
      const { access_token, user: u } = res.data

      const gate = assertCustomer(u)
      if (!gate.ok) {
        // Do not persist anything — a half-session would leave the app in a
        // signed-in-but-empty state on next launch.
        setAuthHeader(null)
        throw new Error(gate.message)
      }

      await Promise.all([storage.setToken(access_token), storage.setUser(u)])
      setAuthHeader(access_token)
      setToken(access_token)
      setUser(u)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    // Best-effort: stop this device receiving further pushes.
    try {
      await api.delete('/crm/users/me/push-token')
    } catch {
      // Signed-out cleanup is best-effort; the backend also drops dead tokens.
    }
    await storage.clearAll()
    setAuthHeader(null)
    setToken(null)
    setUser(null)
    // Clear cached data so the next account never sees the previous one's.
    queryClient.clear()
    clearPersistedQueryCache()
  }, [])

  const setBiometricEnabled = useCallback(async (enabled: boolean) => {
    await storage.setBiometricEnabled(enabled)
    setBiometricEnabledState(enabled)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        isInitializing,
        isLoading,
        biometricEnabled,
        login,
        logout,
        setBiometricEnabled,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm --filter customer-app type-check`
Expected: passes. If `authenticateAsync`'s options are rejected, check the installed `expo-local-authentication` version's `LocalAuthenticationOptions` type — `promptMessage` and `fallbackLabel` are the only two this code relies on.

- [ ] **Step 3: Commit**

```bash
git add apps/customer-app/src/contexts/AuthContext.tsx
git commit -m "feat(customer-app): add AuthContext with role gate and biometric unlock"
```

---

### Task 7: SocketContext consuming M1 events

**Files:**
- Create: `apps/customer-app/src/lib/realtimeEvents.ts`
- Create: `apps/customer-app/src/lib/realtimeEvents.spec.ts`
- Create: `apps/customer-app/src/contexts/SocketContext.tsx`

**Interfaces:**
- Consumes: `useAuth` (Task 6), `queryClient` (Task 4), `normalizeApiBaseUrl` idea from Task 3.
- Produces: `EVENT_TO_QUERY_KEYS`, `invalidateForEvent(client, eventName)`, `CUSTOMER_EVENTS: string[]`; and `SocketProvider` + `useSocket(): { isConnected: boolean }`. Task 9's layout mounts the provider; Task 10's Home reads `isConnected`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/customer-app/src/lib/realtimeEvents.spec.ts
import { EVENT_TO_QUERY_KEYS, CUSTOMER_EVENTS, invalidateForEvent } from './realtimeEvents'

describe('realtime event mapping', () => {
  it('maps every M1 customer event', () => {
    expect(CUSTOMER_EVENTS.sort()).toEqual(
      ['invoice_changed', 'job_changed', 'message_new', 'quote_changed'],
    )
  })

  it('invalidates jobs and dashboard for job_changed', () => {
    const invalidateQueries = jest.fn()
    invalidateForEvent({ invalidateQueries } as never, 'job_changed')
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['jobs'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['dashboard'] })
  })

  it('invalidates invoices and dashboard for invoice_changed', () => {
    const invalidateQueries = jest.fn()
    invalidateForEvent({ invalidateQueries } as never, 'invoice_changed')
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['invoices'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['dashboard'] })
  })

  it('invalidates threads and notifications for message_new', () => {
    const invalidateQueries = jest.fn()
    invalidateForEvent({ invalidateQueries } as never, 'message_new')
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['threads'] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['notifications'] })
  })

  it('ignores an unknown event rather than invalidating everything', () => {
    const invalidateQueries = jest.fn()
    invalidateForEvent({ invalidateQueries } as never, 'something_else')
    expect(invalidateQueries).not.toHaveBeenCalled()
  })

  it('every mapped event name appears in CUSTOMER_EVENTS', () => {
    expect(Object.keys(EVENT_TO_QUERY_KEYS).sort()).toEqual(CUSTOMER_EVENTS.sort())
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter customer-app test -- realtimeEvents`
Expected: FAIL — cannot find module `./realtimeEvents`.

- [ ] **Step 3: Implement the mapping**

```ts
// apps/customer-app/src/lib/realtimeEvents.ts
import type { QueryClient } from '@tanstack/react-query'

/**
 * Server events → query keys to invalidate.
 *
 * Names are exactly what comms-service emits to the customer's private room
 * (see M1's CustomerEventsSubscriber). Because those events only ever reach the
 * owning customer, an invalidation here is always about this user's own data.
 */
export const EVENT_TO_QUERY_KEYS: Record<string, string[][]> = {
  job_changed: [['jobs'], ['dashboard']],
  quote_changed: [['quotes'], ['dashboard']],
  invoice_changed: [['invoices'], ['dashboard']],
  message_new: [['threads'], ['notifications']],
}

export const CUSTOMER_EVENTS: string[] = Object.keys(EVENT_TO_QUERY_KEYS)

/** Invalidates the keys mapped to `eventName`; unknown events are ignored. */
export function invalidateForEvent(client: QueryClient, eventName: string): void {
  const keys = EVENT_TO_QUERY_KEYS[eventName]
  if (!keys) return
  for (const queryKey of keys) {
    client.invalidateQueries({ queryKey })
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter customer-app test -- realtimeEvents`
Expected: PASS — all 6 assertions green.

- [ ] **Step 5: Implement SocketContext**

```tsx
// apps/customer-app/src/contexts/SocketContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import Constants from 'expo-constants'
import { useAuth } from '@/contexts/AuthContext'
import { queryClient } from '@/lib/queryClient'
import { CUSTOMER_EVENTS, invalidateForEvent } from '@/lib/realtimeEvents'

const DEFAULT_WS_BASE_URL = 'https://nginx-gateway-536584181394.us-central1.run.app'

function getWsBaseUrl(): string {
  const explicit =
    Constants.expoConfig?.extra?.wsBaseUrl ?? process.env.EXPO_PUBLIC_WS_BASE_URL
  if (explicit) return String(explicit).replace(/\/$/, '')
  const apiBase =
    Constants.expoConfig?.extra?.apiBaseUrl ??
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    DEFAULT_WS_BASE_URL
  // Derive from the API base by stripping the /api suffix.
  return String(apiBase).replace(/\/api\/?$/, '')
}

interface SocketContextValue {
  isConnected: boolean
}

const SocketContext = createContext<SocketContextValue>({ isConnected: false })

/**
 * One Socket.IO connection per authenticated session.
 *
 * Handlers are attached to the socket instance itself, so socket.io-client's
 * own reconnect logic keeps them alive across drops — there is no
 * re-registration step after a reconnect.
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !token) {
      socketRef.current?.disconnect()
      socketRef.current = null
      setIsConnected(false)
      return
    }

    const socket = io(`${getWsBaseUrl()}/chat`, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    })

    socket.on('connect', () => setIsConnected(true))
    socket.on('disconnect', () => setIsConnected(false))
    socket.on('connect_error', () => setIsConnected(false))

    for (const eventName of CUSTOMER_EVENTS) {
      socket.on(eventName, () => invalidateForEvent(queryClient, eventName))
    }

    socketRef.current = socket

    return () => {
      socket.disconnect()
      socketRef.current = null
      setIsConnected(false)
    }
  }, [isAuthenticated, token])

  return (
    <SocketContext.Provider value={{ isConnected }}>{children}</SocketContext.Provider>
  )
}

export function useSocket(): SocketContextValue {
  return useContext(SocketContext)
}
```

- [ ] **Step 6: Type-check and commit**

Run: `pnpm --filter customer-app type-check`
Expected: passes.

```bash
git add apps/customer-app/src/lib/realtimeEvents.ts apps/customer-app/src/lib/realtimeEvents.spec.ts apps/customer-app/src/contexts/SocketContext.tsx
git commit -m "feat(customer-app): add socket context consuming M1 customer events"
```

---

### Task 8: Push notifications and EAS/OTA config

**Files:**
- Create: `apps/customer-app/src/hooks/usePushNotifications.ts`
- Create: `apps/customer-app/eas.json`
- Modify: `apps/customer-app/app.json` (adds `extra.eas.projectId` and `updates.url` via `eas init`)

**Interfaces:**
- Consumes: `useAuth` (Task 6), `api` (Task 3), `queryClient` (Task 4).
- Produces: `usePushNotifications(): void` and `unregisterPushToken(): Promise<void>`. Task 9's layout calls the hook.

- [ ] **Step 1: Implement the push hook**

```ts
// apps/customer-app/src/hooks/usePushNotifications.ts
/**
 * Registers this device for push and reacts to incoming notifications.
 *
 * The token is an Expo push token; comms-service's PushService routes
 * ExponentPushToken[...] through Expo's push API (and native tokens through
 * FCM), so no Firebase config is needed on the app side.
 */
import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { router } from 'expo-router'
import api from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { useAuth } from '@/contexts/AuthContext'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null
  const { status: existing } = await Notifications.getPermissionsAsync()
  let status = existing
  if (existing !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status
  }
  if (status !== 'granted') return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Service updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    })
  }

  const projectId =
    (Constants as any).easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId
  try {
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    )
    return token.data
  } catch {
    return null
  }
}

/** Push `data.type` → which cached queries are now stale. */
function invalidateForPush(data: Record<string, unknown> | undefined): void {
  switch (data?.type) {
    case 'job_status':
    case 'job_reminder':
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      break
    case 'quote':
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      break
    case 'invoice':
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      break
    default:
      break
  }
  queryClient.invalidateQueries({ queryKey: ['notifications'] })
}

/** Deep-links a tapped push to the screen it is about. */
function routeForPush(data: Record<string, unknown> | undefined): void {
  const jobId = data?.jobId
  if (typeof jobId === 'string' && jobId) {
    router.push(`/job/${jobId}` as never)
    return
  }
  router.push('/(tabs)' as never)
}

export function usePushNotifications(): void {
  const { isAuthenticated } = useAuth()
  const registeredRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated) {
      registeredRef.current = false
      return
    }
    if (registeredRef.current) return
    registeredRef.current = true

    let cancelled = false
    ;(async () => {
      const token = await getExpoPushToken()
      if (!token || cancelled) return
      try {
        await api.post('/crm/users/me/push-token', { token, platform: Platform.OS })
      } catch {
        registeredRef.current = false // retry on next auth change / app start
      }
    })()

    const received = Notifications.addNotificationReceivedListener((n) =>
      invalidateForPush(n.request.content.data as Record<string, unknown>),
    )
    const tapped = Notifications.addNotificationResponseReceivedListener((resp) => {
      const data = resp.notification.request.content.data as Record<string, unknown>
      invalidateForPush(data)
      routeForPush(data)
    })

    return () => {
      cancelled = true
      received.remove()
      tapped.remove()
    }
  }, [isAuthenticated])
}

/** Best-effort server-side token removal — called by logout. */
export async function unregisterPushToken(): Promise<void> {
  try {
    await api.delete('/crm/users/me/push-token')
  } catch {
    // Best-effort only.
  }
}
```

- [ ] **Step 2: Create eas.json**

```json
{
  "cli": {
    "version": ">= 16.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "npm_config_user_agent": "pnpm"
      }
    },
    "preview-apk": {
      "distribution": "internal",
      "channel": "preview",
      "android": { "buildType": "apk" },
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://nginx-gateway-536584181394.us-central1.run.app/api",
        "EXPO_PUBLIC_WS_BASE_URL": "https://nginx-gateway-536584181394.us-central1.run.app",
        "npm_config_user_agent": "pnpm"
      }
    },
    "production": {
      "autoIncrement": true,
      "channel": "production",
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://nginx-gateway-536584181394.us-central1.run.app/api",
        "EXPO_PUBLIC_WS_BASE_URL": "https://nginx-gateway-536584181394.us-central1.run.app",
        "npm_config_user_agent": "pnpm"
      }
    }
  },
  "submit": { "production": {} }
}
```

- [ ] **Step 3: Type-check and commit the code**

Run: `pnpm --filter customer-app type-check`
Expected: passes.

```bash
git add apps/customer-app/src/hooks/usePushNotifications.ts apps/customer-app/eas.json
git commit -m "feat(customer-app): add push registration and EAS build profiles"
```

- [ ] **Step 4: [MANUAL — product owner] Create the EAS project**

This requires an Expo account login and cannot be scripted from here. Ask the product owner to run:

```bash
cd apps/customer-app
npx eas login
npx eas init
npx eas update:configure
```

`eas init` writes `extra.eas.projectId` into `app.json`; `eas update:configure` adds the `updates.url` block that makes OTA work. **Stop here and wait** — Task 12's build steps cannot run without them.

Once they report it is done, verify and commit:

```bash
grep -A 3 '"eas"' apps/customer-app/app.json     # expect a projectId
grep -A 3 '"updates"' apps/customer-app/app.json # expect a url
git add apps/customer-app/app.json && git commit -m "chore(customer-app): add EAS project id and update url"
```

---

### Task 9: App shell — providers, routing, auth gate

**Files:**
- Create: `apps/customer-app/app/_layout.tsx`
- Create: `apps/customer-app/app/index.tsx`
- Create: `apps/customer-app/app/(tabs)/_layout.tsx`

**Interfaces:**
- Consumes: `queryClient` (Task 4), `AuthProvider`/`useAuth` (Task 6), `SocketProvider` (Task 7), `usePushNotifications` (Task 8), `Colors` (Task 2).
- Produces: the mounted provider tree and the `/(tabs)` route group that Tasks 10-11 add screens to.

- [ ] **Step 1: Create the root layout**

```tsx
// apps/customer-app/app/_layout.tsx
import React, { useEffect } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClientProvider, focusManager } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { AuthProvider } from '@/contexts/AuthContext'
import { SocketProvider } from '@/contexts/SocketContext'
import { usePushNotifications } from '@/hooks/usePushNotifications'

/**
 * React Query's focus tracking is a browser concept. On native we drive it from
 * AppState so returning to the foreground refetches stale data.
 */
function useAppStateRefetch() {
  useEffect(() => {
    const sub = AppState.addEventListener('change', (status: AppStateStatus) => {
      focusManager.setFocused(status === 'active')
    })
    return () => sub.remove()
  }, [])
}

function AppShell() {
  useAppStateRefetch()
  usePushNotifications()
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SocketProvider>
            <StatusBar style="dark" />
            <AppShell />
          </SocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
```

- [ ] **Step 2: Create the auth-gate entry route**

```tsx
// apps/customer-app/app/index.tsx
import React from 'react'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { Redirect } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { Colors } from '@/constants/theme'

export default function Index() {
  const { isAuthenticated, isInitializing } = useAuth()

  // isInitializing covers the secure-store read AND the biometric prompt, so
  // we must not redirect to /login while the user is still unlocking.
  if (isInitializing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/login'} />
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
})
```

- [ ] **Step 3: Create the tab layout**

```tsx
// apps/customer-app/app/(tabs)/_layout.tsx
import React from 'react'
import { Tabs } from 'expo-router'
import { Text } from 'react-native'
import { Colors } from '@/constants/theme'

/**
 * Emoji tab icons keep M2 dependency-free; M3 swaps in a proper icon set when
 * the remaining tabs (Jobs, Quotes, Invoices, Messages) arrive.
 */
function Icon({ glyph, color }: { glyph: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{glyph}</Text>
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: { backgroundColor: Colors.surface, borderTopColor: Colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <Icon glyph="🏠" color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color }) => <Icon glyph="👤" color={color} /> }}
      />
    </Tabs>
  )
}
```

- [ ] **Step 4: Type-check and commit**

Run: `pnpm --filter customer-app type-check`
Expected: passes.

```bash
git add apps/customer-app/app
git commit -m "feat(customer-app): add provider shell, auth gate and tab navigation"
```

---

### Task 10: Login screen

**Files:**
- Create: `apps/customer-app/app/login.tsx`

**Interfaces:**
- Consumes: `useAuth` (Task 6), `Colors`/`Spacing`/`Radius`/`FontSize` (Task 2).
- Produces: the `/login` route. Nothing later consumes it.

- [ ] **Step 1: Implement the screen**

```tsx
// apps/customer-app/app/login.tsx
import React, { useState } from 'react'
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme'

export default function Login() {
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const onSubmit = async () => {
    setError('')
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    try {
      await login(email.trim(), password)
      router.replace('/(tabs)')
    } catch (err: any) {
      // The role gate throws its own customer-facing copy; anything else is a
      // credential or network failure.
      setError(err?.message ?? 'Could not sign in. Please try again.')
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>HVACtor.ai</Text>
        <Text style={styles.subtitle}>Sign in to view your services</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={Colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!isLoading}
          onSubmitEditing={onSubmit}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={onSubmit}
          disabled={isLoading}
        >
          {isLoading
            ? <ActivityIndicator color={Colors.textInverse} />
            : <Text style={styles.buttonText}>Sign in</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', padding: Spacing.xl },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.border },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xs, marginBottom: Spacing.xl },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    fontSize: FontSize.base, color: Colors.textPrimary, marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
  },
  error: { color: Colors.danger, fontSize: FontSize.sm, marginBottom: Spacing.md },
  button: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: Spacing.base, alignItems: 'center', marginTop: Spacing.xs,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: Colors.textInverse, fontSize: FontSize.base, fontWeight: '600' },
})
```

- [ ] **Step 2: Type-check and commit**

Run: `pnpm --filter customer-app type-check`
Expected: passes.

```bash
git add apps/customer-app/app/login.tsx
git commit -m "feat(customer-app): add login screen with role-gate messaging"
```

---

### Task 11: Home and Profile screens

**Files:**
- Create: `apps/customer-app/src/hooks/useCustomerHome.ts`
- Create: `apps/customer-app/app/(tabs)/index.tsx`
- Create: `apps/customer-app/app/(tabs)/profile.tsx`

**Interfaces:**
- Consumes: `useAuth` (Task 6), `useSocket` (Task 7), `api`/`queryKeys` (Tasks 3-4), theme tokens (Task 2), types `Job`/`Invoice`/`PaginatedResponse` (Task 5).
- Produces: `useCustomerHome(): { upcomingJobs, openInvoices, isLoading, isError, refetch }` and the two tab routes.

- [ ] **Step 1: Implement the data hook**

Uses the same two endpoints the web portal's dashboard uses, so the numbers match what customers already see on the web.

```ts
// apps/customer-app/src/hooks/useCustomerHome.ts
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import type { Invoice, Job, PaginatedResponse } from '@/types/api'

const OPEN_INVOICE_STATUSES = ['SENT', 'PARTIALLY_PAID', 'OVERDUE']

export function useCustomerHome() {
  const { user } = useAuth()
  const customerId = user?.customerId

  const jobsQuery = useQuery<PaginatedResponse<Job>>({
    // 'dashboard' prefix so a job_changed socket event invalidates this too.
    queryKey: ['dashboard', 'jobs', customerId],
    queryFn: async () => {
      const { data } = await api.get(`/jobs/jobs?customerId=${customerId}&limit=50`)
      return data
    },
    enabled: Boolean(customerId),
  })

  const invoicesQuery = useQuery<PaginatedResponse<Invoice>>({
    queryKey: ['dashboard', 'invoices', customerId],
    queryFn: async () => {
      const { data } = await api.get(`/finance/invoices?customerId=${customerId}&limit=50`)
      return data
    },
    enabled: Boolean(customerId),
  })

  const jobs = jobsQuery.data?.data ?? []
  const invoices = invoicesQuery.data?.data ?? []
  const now = Date.now()

  return {
    upcomingJobs: jobs.filter(
      (j) => j.scheduledStart && new Date(j.scheduledStart).getTime() >= now,
    ).length,
    openInvoices: invoices.filter((i) => OPEN_INVOICE_STATUSES.includes(i.status)).length,
    isLoading: jobsQuery.isLoading || invoicesQuery.isLoading,
    isError: jobsQuery.isError || invoicesQuery.isError,
    refetch: () => {
      void jobsQuery.refetch()
      void invoicesQuery.refetch()
    },
  }
}
```

- [ ] **Step 2: Implement Home**

```tsx
// apps/customer-app/app/(tabs)/index.tsx
import React from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import { useCustomerHome } from '@/hooks/useCustomerHome'
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

export default function Home() {
  const { user } = useAuth()
  const { isConnected } = useSocket()
  const { upcomingJobs, openInvoices, isLoading, isError, refetch } = useCustomerHome()

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        <Text style={styles.greeting}>Hi {user?.name?.split(' ')[0] ?? 'there'}</Text>

        <View style={styles.liveRow}>
          <View style={[styles.dot, { backgroundColor: isConnected ? Colors.success : Colors.textMuted }]} />
          <Text style={styles.liveText}>{isConnected ? 'Live — updates arrive automatically' : 'Reconnecting…'}</Text>
        </View>

        {isError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>Could not load your latest information. Pull down to retry.</Text>
          </View>
        ) : null}

        <View style={styles.statRow}>
          <Stat label="Upcoming visits" value={upcomingJobs} />
          <Stat label="Open invoices" value={openInvoices} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  greeting: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.textPrimary },
  liveRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm, marginBottom: Spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.sm },
  liveText: { fontSize: FontSize.sm, color: Colors.textMuted },
  statRow: { flexDirection: 'row', gap: Spacing.md },
  stat: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg,
  },
  statValue: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.primary },
  statLabel: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.xs },
  errorCard: {
    backgroundColor: Colors.dangerLight, borderRadius: Radius.md,
    padding: Spacing.base, marginBottom: Spacing.lg,
  },
  errorText: { color: Colors.danger, fontSize: FontSize.sm },
})
```

- [ ] **Step 3: Implement Profile**

```tsx
// apps/customer-app/app/(tabs)/profile.tsx
import React from 'react'
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme'

export default function Profile() {
  const { user, logout, biometricEnabled, setBiometricEnabled } = useAuth()
  const { isConnected } = useSocket()

  const onLogout = async () => {
    await logout()
    router.replace('/login')
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.name}>{user?.name ?? '—'}</Text>
        <Text style={styles.email}>{user?.email ?? '—'}</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Unlock with biometrics</Text>
            <Switch
              value={biometricEnabled}
              onValueChange={(v) => { void setBiometricEnabled(v) }}
              trackColor={{ true: Colors.primary, false: Colors.disabled }}
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Live connection</Text>
            <Text style={[styles.rowValue, { color: isConnected ? Colors.success : Colors.textMuted }]}>
              {isConnected ? 'Connected' : 'Offline'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logout} onPress={onLogout}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  name: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  email: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.xs },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.border, marginTop: Spacing.xl, paddingHorizontal: Spacing.base,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.base,
  },
  rowLabel: { fontSize: FontSize.base, color: Colors.textPrimary },
  rowValue: { fontSize: FontSize.sm, fontWeight: '600' },
  logout: {
    marginTop: Spacing.xl, borderRadius: Radius.md, borderWidth: 1,
    borderColor: Colors.danger, paddingVertical: Spacing.base, alignItems: 'center',
  },
  logoutText: { color: Colors.danger, fontSize: FontSize.base, fontWeight: '600' },
})
```

- [ ] **Step 4: Type-check, full test run, commit**

Run: `pnpm --filter customer-app type-check`
Expected: passes.

Run: `pnpm --filter customer-app test`
Expected: PASS — all three spec files (api, authGate, realtimeEvents) green.

```bash
git add apps/customer-app/src/hooks/useCustomerHome.ts apps/customer-app/app/\(tabs\)
git commit -m "feat(customer-app): add Home stack-proof screen and Profile"
```

---

### Task 12: [MANUAL — product owner] Build and verify on a device

**Files:** none — verification only.

**Interfaces:**
- Consumes: everything above, plus the `projectId` from Task 8 Step 4.
- Produces: a confirmed-working installable build.

These steps need a device, an Expo account, and native tooling. **They cannot be run or claimed from this environment.** Give the product owner this checklist and report only what they confirm.

- [ ] **Step 1: Run in development**

```bash
cd apps/customer-app && npx expo start
```
Open in Expo Go or a dev client. Expected: the login screen renders.

- [ ] **Step 2: Verify the role gate**

Sign in with a **staff** account (e.g. a technician). Expected: the login is refused with exactly `This app is for customers. Staff should use the HVACtor.ai Field app.` and the app stays on the login screen. Force-quit and relaunch: still logged out, no half-session.

- [ ] **Step 3: Verify customer login and Home**

Sign in with a customer account that has jobs and invoices. Expected: Home shows a greeting, a green "Live" indicator, and non-zero counts matching the web portal for the same account.

- [ ] **Step 4: Verify realtime (the headline requirement)**

With Home open on the device, have someone change that customer's job status in the admin dashboard. Expected: the "Upcoming visits" count updates **without any pull-to-refresh**, within a second or two.

- [ ] **Step 5: Verify warm-cache cold start**

Force-quit the app, put the device in airplane mode, reopen it. Expected: Home paints the previous counts immediately (from the MMKV cache) rather than showing a spinner or zeros.

- [ ] **Step 6: Verify biometric unlock**

Force-quit and reopen with biometrics enrolled. Expected: a Face ID / fingerprint prompt appears before Home. Cancelling returns to login rather than showing data. Turning the Profile toggle off and relaunching skips the prompt.

- [ ] **Step 7: Build the installable APK**

```bash
cd apps/customer-app && npx eas build --profile preview-apk --platform android
```
Expected: EAS returns a download URL. Install the APK on an Android device and repeat steps 3-6 against it.

- [ ] **Step 8: Verify push**

Trigger a customer-facing event (e.g. mark that customer's job EN_ROUTE). Expected: a push arrives on the installed build; tapping it opens the app. Note that push requires the **built** app — Expo Go cannot receive them for a custom project.

- [ ] **Step 9: Verify OTA**

Change a visible string (e.g. Home's greeting), then:
```bash
cd apps/customer-app && npx eas update --branch preview --message "OTA smoke test"
```
Force-quit and reopen the installed APK twice. Expected: the new string appears without reinstalling.

- [ ] **Step 10: Record results**

Report which steps passed and which did not. Do not mark any step verified that the product owner has not confirmed.

---

## Self-Review Notes

- **Spec coverage:** scaffold/identity → Task 1; theme → Task 2; api/storage → Task 3; persisted cache → Task 4; role gate → Task 5; auth + biometric → Task 6; socket + event map → Task 7; push + EAS/OTA config → Task 8; shell/routing → Task 9; login → Task 10; Home/Profile → Task 11; manual device verification → Task 12. The spec's three unit-test targets (role gate, event map, base-URL normalisation) are Tasks 5, 7, 3 respectively.
- **Placeholder scan:** none — every code step carries literal code.
- **Type consistency:** `CustomerUser`/`LoginResponse` (Task 5) are what `AuthContext` (Task 6) consumes; `EVENT_TO_QUERY_KEYS`/`invalidateForEvent`/`CUSTOMER_EVENTS` (Task 7) are used verbatim by `SocketContext`; `queryKeys` and the `['dashboard', …]` prefix in `useCustomerHome` (Task 11) match the invalidation targets in Task 7's map.
- **Package versions are the main uncertainty.** The Expo SDK 54 versions for `expo-local-authentication` (`~17.0.7`) and `expo-updates` (`~29.0.12`) in Task 1 were chosen to match SDK 54's expected ranges but were not installed before writing this plan. If `pnpm install` or `npx expo-doctor` reports a mismatch, take the version Expo recommends for SDK 54 rather than forcing these — and correct `authenticateAsync`'s options shape against whatever version actually lands.
- **Hard dependency on a human step:** Task 8 Step 4 (`eas login` / `eas init`) blocks Task 12 entirely. Task 12 is also the only place the app is actually run — everything before it is verified by type-checks and unit tests only, which the plan states rather than implying broader verification.
