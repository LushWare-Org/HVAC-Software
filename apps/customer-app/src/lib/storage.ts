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
