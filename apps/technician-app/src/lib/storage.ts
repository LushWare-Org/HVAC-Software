/**
 * Secure storage wrapper for React Native
 * Uses expo-secure-store for sensitive data (tokens)
 * Falls back to basic async approach for non-sensitive data
 */
import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = 'tech_token'
const USER_KEY = 'tech_user'
const TECH_PROFILE_KEY = 'tech_profile'

// ---- Token ----
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

// ---- User ----
export async function getUser<T>(): Promise<T | null> {
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY)
    return raw ? JSON.parse(raw) : null
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

// ---- Technician Profile (cache) ----
export async function getTechProfile<T>(): Promise<T | null> {
  try {
    const raw = await SecureStore.getItemAsync(TECH_PROFILE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export async function setTechProfile(profile: object): Promise<void> {
  await SecureStore.setItemAsync(TECH_PROFILE_KEY, JSON.stringify(profile))
}

// ---- Generic raw key/value (for arbitrary keys like pending state) ----
export async function getRaw(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key)
  } catch {
    return null
  }
}

export async function setRaw(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value)
}

export async function removeRaw(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key)
  } catch {}
}

// ---- Clear all ----
export async function clearAll(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
    SecureStore.deleteItemAsync(TECH_PROFILE_KEY),
  ])
}
